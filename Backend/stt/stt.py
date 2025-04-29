#cleanup the audio after transcription from google cloud storage

import os
import sys
import wave
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='stt.log',
    filemode='a'
)
logger = logging.getLogger('stt')

# Try to import Google Cloud dependencies
GOOGLE_CLOUD_AVAILABLE = False
PYDUB_AVAILABLE = False

try:
    from google.cloud import speech, storage
    GOOGLE_CLOUD_AVAILABLE = True
    logger.info("Google Cloud Speech and Storage APIs are available")
except ImportError as e:
    logger.error(f"Google Cloud dependency missing: {str(e)}")

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
    logger.info("pydub module is available")
except ImportError as e:
    logger.error(f"pydub dependency missing: {str(e)}")

# Check for credentials in environment variables
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

# Set up credentials
if GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
    # Use credentials file path from environment
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS
    logger.info(f"Using Google Cloud credentials from environment: {GOOGLE_APPLICATION_CREDENTIALS}")
elif GOOGLE_API_KEY:
    # Use API key directly
    logger.info("Using Google API key from environment variables")
    # Note: When using API key, authentication works differently with Google Cloud
    # This is a fallback in case the key is available in this format
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
else:
    # Check for fallback credentials file
    CREDENTIALS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'keys', 'dialogon-stt-key.json')
    if os.path.exists(CREDENTIALS_PATH):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH
        logger.info(f"Using Google Cloud credentials from file: {CREDENTIALS_PATH}")
    else:
        logger.warning("No Google Cloud credentials found in environment or at default path")
        # Creating an empty directory structure to avoid errors
        os.makedirs(os.path.dirname(CREDENTIALS_PATH), exist_ok=True)

def check_google_cloud():
    """Check if Google Cloud dependencies are available"""
    if not GOOGLE_CLOUD_AVAILABLE:
        logger.error("Missing Google Cloud dependencies. Install with: pip install google-cloud-speech google-cloud-storage")
        return False
    
    if not (GOOGLE_API_KEY or 
            (GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(GOOGLE_APPLICATION_CREDENTIALS)) or 
            os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'keys', 'dialogon-stt-key.json'))):
        logger.error("No Google Cloud credentials available")
        return False
    
    return True

def check_dependencies():
    """Check if all required dependencies are available"""
    # For basic functionality, we only need Google Cloud
    if not check_google_cloud():
        return False
    
    # pydub is optional - we'll handle its absence in specific functions
    if not PYDUB_AVAILABLE:
        logger.warning("pydub module not available - some audio processing features will be limited")
        # But we still consider the main dependencies available
    
    return True

def upload_to_gcs(bucket_name, source_file, destination_blob_name):
    """Upload file to Google Cloud Storage"""
    if not check_google_cloud():
        logger.error("Cannot upload to GCS: Missing Google Cloud dependencies or credentials")
        return False
    
    try:
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(source_file)
        logger.info(f"Uploaded to gs://{bucket_name}/{destination_blob_name}")
        return True
    except Exception as e:
        logger.error(f"Error uploading to GCS: {str(e)}")
        return False

def analyze_and_prepare_audio(file_path):
    """Analyze audio file and convert to mono if needed"""
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return None, None
    
    try:
        # Get basic audio info
        with wave.open(file_path, "rb") as wf:
            channels = wf.getnchannels()
            sample_rate = wf.getframerate()
            
        logger.info(f"Channels: {channels}, sample rate: {sample_rate} Hz")
        
        # Convert to mono if needed and if pydub is available
        if channels != 1:
            if PYDUB_AVAILABLE:
                logger.info("Converting to mono")
                sound = AudioSegment.from_wav(file_path)
                sound = sound.set_channels(1)
                mono_path = file_path.replace(".wav", "_mono.wav")
                sound.export(mono_path, format="wav")
                return mono_path, sample_rate
            else:
                logger.warning("Multi-channel audio detected but pydub is not available for conversion to mono")
                logger.warning("Transcription may be less accurate with multi-channel audio")
                # Return the original file path, will use as-is
                return file_path, sample_rate
        else:
            # Already mono
            return file_path, sample_rate
    except Exception as e:
        logger.error(f"Error analyzing audio: {str(e)}")
        return None, None

def transcribe_audio(file_path: str):
    """Transcribe audio file using Google Cloud Speech-to-Text API"""
    if not check_google_cloud():
        logger.error("Cannot transcribe audio: Missing Google Cloud dependencies or credentials")
        return "Transcription failed: Missing Google Cloud dependencies or credentials"
    
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return "Transcription failed: Audio file not found"
    
    try:
        # Analyze and prepare the audio file (convert to mono if needed)
        file_path, sample_rate = analyze_and_prepare_audio(file_path)
        if not file_path or not sample_rate:
            return "Transcription failed: Error analyzing audio file"
        
        # Upload to Google Cloud Storage
        bucket_name = "dialogon-audio-bucket"
        destination_blob_name = os.path.basename(file_path)
        
        if not upload_to_gcs(bucket_name, file_path, destination_blob_name):
            return "Transcription failed: Error uploading to Google Cloud Storage"
        
        # Set up the URI for the audio file in GCS
        gcs_uri = f"gs://{bucket_name}/{destination_blob_name}"
        
        # Create a Speech client
        client = speech.SpeechClient()
        
        # Read the audio data for local processing (not used in this flow but kept for future)
        with open(file_path, "rb") as audio_file:
            content = audio_file.read()
            
        # Create the recognition audio object
        audio = speech.RecognitionAudio(uri=gcs_uri)
        
        # Configure the request
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=sample_rate,
            language_code="en-US"
        )
        
        # Start the long-running recognition operation
        logger.info("Transcription in progress...")
        operation = client.long_running_recognize(config=config, audio=audio)
        
        # Get the final result
        response = operation.result(timeout=300)

        # Combine the transcriptions
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + " "

        return transcript.strip()
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}")
        return f"Transcription failed: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python stt.py <audio_file.wav>")
    else:
        result = transcribe_audio(sys.argv[1])
        print(result)
        

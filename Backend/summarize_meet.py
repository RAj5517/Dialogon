import os
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='summarize_meet.log',
    filemode='a'
)
logger = logging.getLogger('summarize_meet')

# Try to import the STT module
try:
    from stt.stt import transcribe_audio
    STT_AVAILABLE = True
    logger.info("STT functionality is available")
except ImportError as e:
    STT_AVAILABLE = False
    logger.warning(f"STT functionality not available: {str(e)}")
    def transcribe_audio(file_path):
        logger.error("Cannot transcribe audio: STT module not available")
        return "Transcription failed: STT module not available"

# Try to import the summarization module
try:
    from summarise.summarise import summarize_transcript
    SUMMARIZE_AVAILABLE = True
    logger.info("Summarization functionality is available")
except ImportError as e:
    SUMMARIZE_AVAILABLE = False
    logger.warning(f"Summarization functionality not available: {str(e)}")
    def summarize_transcript(transcript):
        logger.warning("Summarization requested but functionality not available")
        return transcript  # Just return the transcript if summarization is not available

def summarize_meet(audio_file_path):
    """
    Transcribe the audio file and generate a summary
    """
    try:
        logger.info(f"Starting transcription of {audio_file_path}")
        
        # Check if the audio file exists
        if not os.path.exists(audio_file_path):
            logger.error(f"Audio file not found: {audio_file_path}")
            return "Summary unavailable: Audio file not found"
        
        # Check if STT functionality is available
        if not STT_AVAILABLE:
            logger.error("Cannot generate summary: STT functionality not available")
            return "Summary unavailable: Speech-to-text functionality not available"
        
        # Transcribe the audio
        transcript = transcribe_audio(audio_file_path)
        
        # Check if transcription was successful
        if transcript.startswith("Transcription failed"):
            logger.error(f"Transcription failed: {transcript}")
            return f"Summary unavailable: {transcript}"
        
        # Try to summarize the transcript if the functionality is available
        if SUMMARIZE_AVAILABLE:
            try:
                summary = summarize_transcript(transcript)
                logger.info("Summarization successful")
                return summary
            except Exception as e:
                logger.error(f"Error during summarization: {str(e)}")
                # Fall back to just returning the transcript
                return f"Summary unavailable (falling back to transcript): {transcript}"
        else:
            # Just return the transcript as the summary
            logger.info("Summarization not available, returning transcript")
            return transcript
    
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        return f"Summary unavailable: {str(e)}"

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python summarize_meet.py <audio_file.wav>")
    else:
        summary = summarize_meet(sys.argv[1])
        print(summary)
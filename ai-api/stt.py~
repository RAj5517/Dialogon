#cleanup the audio after transcription from google cloud storage

import os
import sys
import wave
from google.cloud import speech, storage
from pydub import AudioSegment

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./keys/dialogon-stt-key.json"   #path to the api key json file #setting the environment variable

#uploading a file to google cloud storage
def upload_to_gcs(bucket_name, source_file, destination_blob_name):
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(source_file)
    print(f" Uploaded to gs://{bucket_name}/{destination_blob_name}")


def analyze_and_prepare_audio(file_path):
    with wave.open(file_path, "rb") as wf:
        channels = wf.getnchannels()
        sample_rate = wf.getframerate()
        
    print(f" Channels: {channels}, sample rate: {sample_rate} Hz")
    
    if channels != 1:
        print("converting to mono")
        sound = AudioSegment.from_wav(file_path)
        sound = sound.set_channels(1)
        mono_path = file_path.replace(".wav", "_mono.wav")
        sound.export(mono_path, format="wav")
        return mono_path, sample_rate
    else:
        return file_path, sample_rate


def transcribe_audio(file_path: str):
    if not os.path.exists(file_path):
        print(f"file not found: {file_path}")
        return
    
    file_path, sample_rate = analyze_and_prepare_audio(file_path)
    
    bucket_name = "dialogon-audio-bucket"
    destination_blob_name = os.path.basename(file_path)
    
    upload_to_gcs(bucket_name, file_path, destination_blob_name)
    
    gcs_uri = f"gs://{bucket_name}/{destination_blob_name}"
    
    client = speech.SpeechClient()
    
    with open(file_path, "rb") as audio_file:
        content = audio_file.read()
        
    audio = speech.RecognitionAudio(uri = gcs_uri)
    
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=sample_rate,
        language_code="en-US"
    )
    
    operation = client.long_running_recognize(config=config, audio=audio)
    
    print("Transcription in progress...")
    response = operation.result(timeout=300)
    
    print("\n Transcription:")
    for result in response.results:
        print(result.alternatives[0].transcript)

        

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python stt.py <audio_file.wav>")
    else:
        transcribe_audio(sys.argv[1])
        

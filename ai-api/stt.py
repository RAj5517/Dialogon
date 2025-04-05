import os
from google.cloud import speech

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./keys/dialogon-stt-key.json"   #path to the api key json file

def transcribe_audio(file_path: str):
    client = speech.SpeechClient()

    with open(file_path, "rb") as audio_file:
        content = audio_file.read()

    audio = speech.RecognitionAudio(content=content)

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=44100,  #audio file is of 44100 hertz, generally wav files are of 44100 hertz
        language_code="en-US"
    )

    response = client.recognize(config=config, audio=audio)

    print("\n Transcription:")
    for result in response.results:
        print( " X ", result.alternatives[0].transcript)

# Run the function
if __name__ == "__main__":
    transcribe_audio("./audio.wav")

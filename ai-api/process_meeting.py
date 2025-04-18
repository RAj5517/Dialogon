import sys
from stt import transcribe_audio
from summarise import summarize_transcript

def process_meeting(audio_file):
    print("Starting Transcription...")
    transcript = transcribe_audio(audio_file)

    if not transcript:
        print("No transcript returned")
        return

    print("Starting summarization")
    summary = summarize_transcript(transcript)

    #saving summary to a text file
    output_path = audio_file.replace(".wav", "_summary.txt")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(summary)

    print(f"Summary saved to: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_meeting.py <audio_file.wav>")
    else:
        process_meeting(sys.argv[1])

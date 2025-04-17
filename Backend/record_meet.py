import soundcard as sc
import numpy as np
from scipy.io.wavfile import write
import datetime

# Configuration
samplerate = 44100
channels = 1
frames = []

# Get default speaker (for name), then fetch it as a microphone with loopback
default_speaker = sc.default_speaker()
loopback_mic = sc.get_microphone(default_speaker.name, include_loopback=True)

def save_recording(frames):
    audio_data = np.concatenate(frames, axis=0)
    filename = f"Recordings\system_audio_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
    write(filename, samplerate, audio_data)
    print(f"✅ Saved to: {filename}")

def record_meet():
    print(f"🎧 Loopback recording from: {default_speaker.name}")
    print("🔴 Press Ctrl+C to stop recording.\n")

    try:
        with loopback_mic.recorder(samplerate=samplerate, channels=channels) as recorder:
            while True:
                data = recorder.record(numframes=1024)
                frames.append(data)
    except KeyboardInterrupt:
        print("\n⏹️ Stopped. Saving file...")

        save_recording(frames)
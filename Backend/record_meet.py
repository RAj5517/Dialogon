import soundcard as sc
import numpy as np
import datetime
from threading import Thread
import time

def wait():
    time.sleep(300)
    raise KeyboardInterrupt

# Configuration
samplerate = 44100
channels = 1
frames = []

# Get default speaker (for name), then fetch it as a microphone with loopback
default_speaker = sc.default_speaker()
loopback_mic = sc.get_microphone(default_speaker.name, include_loopback=True)

def save_recording(frames):
    audio_data = np.concatenate(frames, axis=0)

    # 🔧 Convert float32 [-1, 1] to int16 [-32768, 32767]
    audio_int16 = np.int16(audio_data * 32767)

    filename = f"system_audio_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
    write(filename, samplerate, audio_int16)

    print(f"Saved to: {filename}")
    return filename


def record_meet():
    Thread(target=wait).start()
    print(f"Loopback recording from: {default_speaker.name}")
    print("Press Ctrl+C to stop recording.\n")
    try:
        # Create Recordings directory if it doesn't exist
        os.makedirs("Recordings", exist_ok=True)
        
        filename = rf"Recordings/system_audio_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
        
        # Get default speakers
        speakers = sc.default_speaker()
        if not speakers:
            raise Exception("No default speakers found")
        
        # Record audio
        with speakers.recorder(samplerate=48000) as mic:
            while True:
                data = recorder.record(numframes=1024)
                frames.append(data)
    except KeyboardInterrupt:
        print("\n[INFO] Stopped. Saving file...")

        return save_recording(frames)

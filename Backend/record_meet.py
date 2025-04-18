import soundcard as sc
import numpy as np
import datetime
import os
import wave
import threading
import time

    return filename

def record_meet():
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
                try:
                    data = mic.record(48000 * 300)  # 300 seconds = 5 minutes
                    
                    # Save the recording
                    with wave.open(filename, 'wb') as f:
                        f.setnchannels(2)
                        f.setsampwidth(2)
                        f.setframerate(48000)
                        f.writeframes(data.tobytes())
                    
                    # Create new filename for next recording
                    filename = rf"Recordings/system_audio_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
                except Exception as e:
                    print(f"Error during recording iteration: {str(e)}")
                    time.sleep(1)  # Wait before retrying
                    
    except Exception as e:
        print(f"Error in record_meet: {str(e)}")

def start_recording():
    """Start recording in a separate thread"""
    recording_thread = threading.Thread(target=record_meet)
    recording_thread.daemon = True  # Thread will exit when main program exits
    recording_thread.start()

if __name__ == "__main__":
    start_recording()
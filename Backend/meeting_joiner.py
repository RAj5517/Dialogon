from typing import Dict
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
import time
from datetime import datetime
import subprocess
import random
import argparse
import logging
import signal
from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='meeting_joiner.log',
    filemode='a'
)
logger = logging.getLogger('meeting_joiner')

# Flag to track availability of recording/transcription features
RECORDING_AVAILABLE = False
TRANSCRIPTION_AVAILABLE = False

# Try to import recording module
try:
    from record_meet import record_meet, start_recording
    RECORDING_AVAILABLE = True
    logger.info("Recording functionality is available")
except ImportError as e:
    logger.warning(f"Recording functionality not available: {str(e)}")
    def record_meet():
        logger.warning("Recording requested but functionality not available")
        return None
    def start_recording():
        logger.warning("Recording functionality not available")

# Try to import transcription module
try:
    from summarize_meet import summarize_meet
    TRANSCRIPTION_AVAILABLE = True
    logger.info("Transcription functionality is available")
except ImportError as e:
    logger.warning(f"Transcription functionality not available: {str(e)}")
    def summarize_meet(audio_file):
        logger.warning("Transcription requested but functionality not available")
        return "Transcription not available due to missing dependencies or credentials"

# MongoDB connection for updating event status
DB_URI = os.getenv('DB_URI')

def get_chrome_path():
    """Get the Chrome executable path"""
    # First try from environment variable
    chrome_path = os.getenv("CHROME_EXE")
    if chrome_path and os.path.exists(chrome_path):
        return chrome_path
        
    # Common Chrome locations
    possible_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
            
    return None

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Join a Google Meet meeting')
    parser.add_argument('--link', type=str, required=True, help='Meeting link')
    parser.add_argument('--name', type=str, default='Dialogon Assistant', help='Name to use in the meeting')
    parser.add_argument('--email', type=str, default=None, help='Email of the user who owns the event')
    parser.add_argument('--event_index', type=int, default=-1, help='Index of the event in the user events array')
    
    return parser.parse_args()

def update_event_status(email, event_index, status):
    """Update the event status in MongoDB"""
    if email and event_index >= 0:
        try:
            client = MongoClient(DB_URI)
            db = client.user
            users = db.users
            
            logger.info(f"Updating event status to '{status}' for user {email}, event index {event_index}")
            
            result = users.update_one(
                {"email": email},
                {"$set": {f"events.{event_index}.status": status}}
            )
            
            if result.modified_count > 0:
                logger.info(f"Successfully updated event status to '{status}'")
            else:
                logger.warning(f"Failed to update event status: no document modified")
                
        except Exception as e:
            logger.error(f"Error updating event status: {str(e)}")
        finally:
            if 'client' in locals():
                client.close()

def join_meeting(meet_link, user_name, user_email=None, event_index=-1):
    """Join a meeting with the provided details"""
    try:
        logger.info(f"Joining meeting: {meet_link} as {user_name}")
        
        # Get Chrome path
        chrome_path = get_chrome_path()
        if not chrome_path:
            logger.error("Chrome not found in any standard location")
            return False
            
        logger.info(f"Using Chrome at: {chrome_path}")
        
        # Make sure user data directory exists
        user_data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chrome_user_data')
        os.makedirs(user_data_dir, exist_ok=True)
        
        # Launch Chrome
        command = [chrome_path, '--remote-debugging-port=9222', f'--user-data-dir={user_data_dir}']
        subprocess.Popen(command)
        
        # Set up Chrome options
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        # Create WebDriver with ChromeDriverManager
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.get(meet_link)
        
        logger.info('Meeting link has been launched')
        
        # Continue without microphone and camera
        time.sleep(4)
        while True:
            try: 
                for button in driver.find_elements(By.TAG_NAME, 'button'):
                    if button.text == 'Continue without microphone and camera':
                        tmp = button
                        tmp.click()
                        break
                break
            except Exception as e:
                logger.error(f"Error finding continue button: {str(e)}")
                time.sleep(0.5)
        
        # Enter name
        while True:
            try: 
                tmp = driver.find_element(By.XPATH, "//input[@placeholder='Your name']")
                tmp.send_keys(user_name)
                break
            except Exception as e:
                logger.error(f"Error entering name: {str(e)}")
                time.sleep(0.5)
        
        time.sleep(1)
        
        # Join now
        while True:
            try: 
                for button in driver.find_elements(By.TAG_NAME, 'button'):
                    if button.text in ['Join now', 'Ask to join']:
                        tmp = button
                        tmp.click()
                        break
                break
            except Exception as e:
                logger.error(f"Error clicking join now: {str(e)}")
                time.sleep(0.5)
        
        logger.info("Successfully joined the meeting")
        
        # Update status to "joined" (in process)
        if user_email and event_index >= 0:
            update_event_status(user_email, event_index, "joined")

        # Only attempt recording if the functionality is available
        sound_file_path = None
        if RECORDING_AVAILABLE:
            try:
                sound_file_path = record_meet()
                logger.info(f"Recording saved to: {sound_file_path}")
            except Exception as e:
                logger.error(f"Error recording meeting: {str(e)}")
        else:
            logger.warning("Recording functionality not available, skipping recording")

        # Only attempt transcription if the functionality is available and recording succeeded
        if TRANSCRIPTION_AVAILABLE and sound_file_path:
            try:
                summary = summarize_meet(sound_file_path)
                with open("final_summ.txt", 'w+') as f:
                    f.write("Summary:\n" + summary)
                logger.info("Meeting summary saved to final_summ.txt")
            except Exception as e:
                logger.error(f"Error creating meeting summary: {str(e)}")
        else:
            logger.warning("Transcription functionality not available or recording failed, skipping transcription")
        
        # Keep the browser open
        meeting_ongoing = True
        while meeting_ongoing:
            time.sleep(60)  # Check every minute
            try:
                # Check if we're still in the meeting
                current_url = driver.current_url
                if "meet.google.com" not in current_url or "hangoutsmeet" not in current_url:
                    meeting_ongoing = False
                    logger.info("Meeting has ended or bot was removed from the meeting")
            except:
                meeting_ongoing = False
                logger.info("Browser was closed or connection was lost")
        
        # Update status to "completed" when the meeting ends
        if user_email and event_index >= 0:
            update_event_status(user_email, event_index, "completed")
            logger.info(f"Meeting completed. Updated status for user {user_email}, event index {event_index}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error joining meeting: {str(e)}")
        # Update status to "completed" if there was an error
        if user_email and event_index >= 0:
            update_event_status(user_email, event_index, "completed")
        return False

def main():
    """Main function"""
    args = parse_arguments()
    
    join_meeting(
        meet_link=args.link,
        user_name=args.name,
        user_email=args.email,
        event_index=args.event_index
    )

if __name__ == '__main__':
    main()
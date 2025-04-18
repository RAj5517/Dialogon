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
try:
    from record_meet import record_meet, start_recording
    RECORDING_AVAILABLE = True
except ImportError:
    RECORDING_AVAILABLE = False
    def start_recording():
        logger.warning("Recording functionality not available. Missing required modules.")
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
    
    return parser.parse_args()

def join_meeting(meet_link, user_name):
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

        # Try to start recording, but don't fail if it doesn't work
        if RECORDING_AVAILABLE:
            try:
                start_recording()
                logger.info("Started recording")
            except Exception as e:
                logger.error(f"Failed to start recording: {str(e)}")
        else:
            logger.warning("Recording is disabled due to missing dependencies")
        
        # Keep the browser open
        while True:
            time.sleep(60)  # Check every minute
            try:
                # Check if we're still in the meeting
                driver.current_url
            except:
                break
        
        return True
        
    except Exception as e:
        logger.error(f"Error joining meeting: {str(e)}")
        return False

def main():
    """Main function"""
    args = parse_arguments()
    
    join_meeting(
        meet_link=args.link,
        user_name=args.name
    )

if __name__ == '__main__':
    main()

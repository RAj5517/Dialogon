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
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='meeting_joiner.log',
    filemode='a'
)
logger = logging.getLogger('meeting_joiner')

# Default paths
chrome_path = r'C:\Users\sayan\AppData\Local\Google\Chrome\Application\chrome.exe'
user_data_dir = r'C:\Dialogon\users\\' + str(random.randint(10000, 99999))

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
        
        # Make sure user data directory exists
        os.makedirs(os.path.dirname(user_data_dir), exist_ok=True)
        
        # Launch Chrome
        command = [chrome_path, '--remote-debugging-port=9222', '--user-data-dir=' + user_data_dir]
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
                    if button.text == 'Join now':
                        tmp = button
                        tmp.click()
                        break
                break
            except Exception as e:
                logger.error(f"Error clicking join now: {str(e)}")
                time.sleep(0.5)
        
        logger.info("Successfully joined the meeting")
        
        # Keep the meeting open for a set duration (e.g., 1 hour)
        time.sleep(3600)
        
        driver.quit()
        logger.info("Meeting ended")
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

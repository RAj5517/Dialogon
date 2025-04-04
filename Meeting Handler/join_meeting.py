from typing import Dict
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
from datetime import datetime
import subprocess
import random
# import pyautogui as pg

chrome_path: str = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
user_data_dir = r'C:\Dialogon\users\\' + str(random.randint(10000, 99999))

USER_EMAIL = ''
USER_PASSWORD = ''
USER_GUEST_NAME = 'Rajesh'
MEET_LINK: str = 'https://meet.google.com/mat-yrrf-hhe'
MEET_START_TIME: Dict[str, int] = {
    'date': 19,
    'month': 3,
    'year': 2025,
    'hour-24': 6,
    'minute': 1,
}


def time_to_join() -> bool:
    while True:
        start_time: datetime = datetime(MEET_START_TIME['year'], MEET_START_TIME['month'], MEET_START_TIME['date'], MEET_START_TIME['hour-24'], MEET_START_TIME['minute'])
        curr_time: datetime = datetime.now()

        if curr_time.replace(second=0, microsecond=0) == start_time.replace(second=0, microsecond=0):
            return True
        else:
            time.sleep(59)

def main() -> None:

    # if time_to_join():
    if True:
        command = [chrome_path, '--remote-debugging-port=9222', '--user-data-dir=' + user_data_dir]
        subprocess.Popen(command)

        # Set up Chrome options to connect to the existing browser session
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")

        # Create a new WebDriver instance to connect to the existing Chrome instance
        driver = webdriver.Chrome(options=chrome_options)

        driver.get(MEET_LINK)

        print('Meeting link has been launched...')

        time.sleep(4)
        while True: # Continue without microphone and camera
            try: 
                for button in driver.find_elements(By.TAG_NAME, 'button'):
                    if button.text == 'Continue without microphone and camera':
                        tmp = button

            except: 
                time.sleep(0.5)
            else:
                tmp.click()
                break
        
        while True: # Your name
            try: 
                tmp = driver.find_element(By.XPATH, "//input[@placeholder='Your name']")
            except: 
                time.sleep(0.5)
            else:
                tmp.send_keys(USER_GUEST_NAME)
                break
        time.sleep(1)
        
        while True: # Join Now
            try: 
                for button in driver.find_elements(By.TAG_NAME, 'button'):
                    if button.text == 'Join now':
                        tmp = button

            except: 
                time.sleep(0.5)
            else:
                tmp.click()
                break

        # while True:
        #     # Find all buttons on the page
        #     buttons = driver.find_elements(By.TAG_NAME, 'button')

        #     # Loop through the buttons and print details
        #     for button in buttons:
        #         # Print button tag and any other attribute (like id, text, etc.)
        #         print("Button text:", button.text)
        #         print("Button ID:", button.get_attribute('id'))
        #     time.sleep(1)

        input("Press ENTER to exit...")
        driver.quit()

if __name__ == '__main__':
    main()

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import subprocess
import os
import sys
import logging
import time
from dotenv import load_dotenv
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='manual_join.log',
    filemode='a'
)
logger = logging.getLogger('manual_join')

# Load environment variables from the correct location
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BACKEND_DIR, '.env')
load_dotenv(ENV_PATH)

# Path to your meeting joiner script
MEETING_JOINER_PATH = os.path.join(BACKEND_DIR, 'meeting_joiner.py')

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

@api_view(['POST'])
def manual_join_meeting(request):
    """API endpoint to manually trigger meeting joining"""
    try:
        # Extract meeting details from request
        meeting_link = request.data.get('meeting_link')
        user_name = request.data.get('user_name', 'Dialogon Assistant')
        
        if not meeting_link:
            return Response({
                'message': 'Meeting link is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Manual join request for meeting: {meeting_link}")
        
        # Check if meeting_joiner.py exists
        if not os.path.exists(MEETING_JOINER_PATH):
            logger.error(f"meeting_joiner.py not found at: {MEETING_JOINER_PATH}")
            return Response({
                'message': f'Meeting joiner script not found at {MEETING_JOINER_PATH}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # Get Chrome path
        chrome_path = get_chrome_path()
        if not chrome_path:
            logger.error("Chrome not found in any standard location")
            return Response({
                'message': 'Chrome browser not found. Please install Google Chrome.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        logger.info(f"Found Chrome at: {chrome_path}")
            
        # Create user data directory if it doesn't exist
        user_data_dir = os.path.join(BACKEND_DIR, 'chrome_user_data')
        os.makedirs(user_data_dir, exist_ok=True)
        
        # Set environment variables for the subprocess
        env = os.environ.copy()
        env['CHROME_EXE'] = chrome_path
        
        logger.info(f"Using Python interpreter: {sys.executable}")
        logger.info(f"Using Chrome path: {chrome_path}")
        
        # Prepare command to run the meeting joiner script
        command = [
            sys.executable,
            MEETING_JOINER_PATH,
            '--link', meeting_link,
            '--name', user_name
        ]
        
        logger.info(f"Launching command: {' '.join(command)}")
        
        # Launch the meeting joiner in a separate process
        process = subprocess.Popen(
            command, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            env=env,
            cwd=BACKEND_DIR
        )
        
        # Wait a bit and check if process is still running
        time.sleep(2)
        if process.poll() is not None:
            stdout, stderr = process.communicate()
            logger.error(f"Process failed. stdout: {stdout.decode()}, stderr: {stderr.decode()}")
            return Response({
                'message': f'Meeting joiner failed to start: {stderr.decode()}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        logger.info(f"Meeting joiner launched successfully for {meeting_link}")
        
        return Response({
            'message': 'Meeting joiner launched successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error launching meeting joiner: {str(e)}")
        return Response({
            'message': f'Error launching meeting joiner: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

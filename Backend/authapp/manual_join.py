from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import subprocess
import os
import sys
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='manual_join.log',
    filemode='a'
)
logger = logging.getLogger('manual_join')

# Path to your meeting joiner script
MEETING_JOINER_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'meeting_joiner.py')

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
                'message': 'Meeting joiner script not found'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # Check if Chrome exists
        chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
        if not os.path.exists(chrome_path):
            logger.error(f"Chrome not found at: {chrome_path}")
            return Response({
                'message': 'Chrome browser not found'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # Create user data directory if it doesn't exist
        user_data_dir = r'C:\Dialogon\users'
        os.makedirs(user_data_dir, exist_ok=True)
        
        # Prepare command to run the meeting joiner script
        command = [
            sys.executable,  # Python interpreter
            MEETING_JOINER_PATH,
            '--link', meeting_link,
            '--name', user_name
        ]
        
        logger.info(f"Launching command: {' '.join(command)}")
        
        # Launch the meeting joiner in a separate process
        process = subprocess.Popen(command, 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        
        # Wait a bit and check if process is still running
        time.sleep(2)
        if process.poll() is not None:
            stdout, stderr = process.communicate()
            logger.error(f"Process failed. stdout: {stdout}, stderr: {stderr}")
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

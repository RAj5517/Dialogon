import time
import datetime
import logging
import os
from pymongo import MongoClient
import subprocess
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='meeting_scheduler.log',
    filemode='a'
)
logger = logging.getLogger('meeting_scheduler')

# MongoDB connection
DB_URI = os.getenv('DB_URI')
client = MongoClient(DB_URI)
db = client.user
users_collection = db.users

# Path to your meeting joiner script
MEETING_JOINER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'meeting_joiner.py')

def join_meeting(meeting_data):
    """Launch the meeting joiner script with the appropriate parameters"""
    try:
        # Extract meeting details
        meeting_link = meeting_data.get('meeting_link')
        meeting_title = meeting_data.get('title', 'Untitled Meeting')
        user_name = meeting_data.get('bot_name', 'Dialogon Assistant')
        
        logger.info(f"Launching meeting joiner for: {meeting_title} at {meeting_link}")
        
        # Prepare command to run the meeting joiner script
        command = [
            sys.executable,  # Python interpreter
            MEETING_JOINER_PATH,
            '--link', meeting_link,
            '--name', user_name
        ]
        
        # Launch the meeting joiner in a separate process
        subprocess.Popen(command)
        
        logger.info(f"Meeting joiner launched successfully for {meeting_title}")
        return True
        
    except Exception as e:
        logger.error(f"Error launching meeting joiner: {str(e)}")
        return False

def check_upcoming_meetings():
    """Check for meetings that are about to start"""
    try:
        current_time = datetime.datetime.now()
        logger.info(f"Checking for upcoming meetings at {current_time}")
        
        # Find all users
        users = users_collection.find({})
        
        for user in users:
            if 'events' not in user:
                continue
                
            for i, event in enumerate(user['events']):
                # Skip events without necessary details
                if not event.get('date') or not event.get('time') or not event.get('meeting_link'):
                    continue
                
                # Skip events that are already joined or completed
                if event.get('status') in ['joined', 'completed']:
                    continue
                
                try:
                    # Parse event date and time
                    event_date_str = event.get('date')
                    event_time_str = event.get('time')
                    
                    # Convert to datetime object
                    event_datetime_str = f"{event_date_str} {event_time_str}"
                    event_datetime = datetime.datetime.strptime(event_datetime_str, "%Y-%m-%d %H:%M")
                    
                    # Calculate time difference in minutes
                    time_diff_minutes = (event_datetime - current_time).total_seconds() / 60
                    
                    # If meeting is starting within the next 2 minutes
                    if 0 <= time_diff_minutes <= 2:
                        logger.info(f"Meeting about to start: {event.get('title')} for user {user['email']}")
                        
                        # Prepare meeting data
                        meeting_data = {
                            'title': event.get('title'),
                            'meeting_link': event.get('meeting_link'),
                            'bot_name': 'Dialogon Assistant'
                        }
                        
                        # Launch meeting joiner
                        success = join_meeting(meeting_data)
                        
                        if success:
                            # Update event status in database
                            users_collection.update_one(
                                {"email": user['email']},
                                {"$set": {f"events.{i}.status": "joined"}}
                            )
                            logger.info(f"Updated event status to 'joined' for {event.get('title')}")
                        
                except Exception as e:
                    logger.error(f"Error processing event: {str(e)}")
        
    except Exception as e:
        logger.error(f"Error checking upcoming meetings: {str(e)}")

def run_scheduler():
    """Run the scheduler continuously"""
    logger.info("Meeting scheduler started")
    
    while True:
        try:
            # Check for upcoming meetings
            check_upcoming_meetings()
            
            # Wait for 30 seconds before checking again
            time.sleep(30)
            
        except KeyboardInterrupt:
            logger.info("Meeting scheduler stopped by user")
            break
        except Exception as e:
            logger.error(f"Error in scheduler loop: {str(e)}")
            # Wait a bit before retrying
            time.sleep(10)

if __name__ == "__main__":
    run_scheduler()

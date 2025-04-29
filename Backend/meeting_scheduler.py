import signal
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
        user_email = meeting_data.get('user_email')
        event_index = meeting_data.get('event_index', -1)
        
        logger.info(f"Launching meeting joiner for: {meeting_title} at {meeting_link}")
        print(f"Launching meeting joiner for: {meeting_title} at {meeting_link}")
        
        # Prepare command to run the meeting joiner script
        command = [
            sys.executable,
            MEETING_JOINER_PATH,
            '--link', meeting_link,
            '--name', user_name
        ]
        
        # Add email and event index if available
        if user_email:
            command.extend(['--email', user_email])
        
        if event_index >= 0:
            command.extend(['--event_index', str(event_index)])
            
        logger.info(f"Command: {command}")
        print(f"Command: {command}")

        # Launch the meeting joiner in a separate process
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, err = process.communicate(timeout=10)
        logger.info(f"Meeting joiner output: {out.decode()}")
        logger.error(f"Meeting joiner error: {err.decode()}")
        print(f"Meeting joiner output: {out.decode()}")
        print(f"Meeting joiner error: {err.decode()}")
        
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
        print(f"Checking for upcoming meetings at {current_time}")

        # Find all users
        users = users_collection.find({})
        for user in users:
            print(f"Checking user: {user.get('email')}")
            if 'events' not in user:
                print("No events for this user.")
                continue

            for i, event in enumerate(user['events']):
                print(f"  Event: {event}")
                # Skip events without necessary details
                if not event.get('date') or not event.get('time') or not event.get('meeting_link'):
                    print("    Skipping: missing date/time/link")
                    continue

                # Skip events that are already joined or completed
                if event.get('status') in ['joined', 'completed']:
                    print(f"    Skipping: status is {event.get('status')}")
                    continue

                try:
                    # Parse event date and time
                    event_date_str = event.get('date')
                    event_time_str = event.get('time')
                    event_datetime_str = f"{event_date_str} {event_time_str}"
                    print(f"    Event datetime string: {event_datetime_str}")

                    # Convert to datetime object
                    event_datetime = datetime.datetime.strptime(event_datetime_str, "%Y-%m-%d %H:%M")
                    print(f"    Event datetime: {event_datetime}")

                    # Calculate time difference in minutes
                    time_diff_minutes = (event_datetime - current_time).total_seconds() / 60
                    print(f"    Time diff (minutes): {time_diff_minutes}")

                    # If meeting is starting within the next 2 minutes
                    if 0 <= time_diff_minutes <= 2:
                        print(f"    LAUNCHING MEETING: {event.get('title')}")
                        logger.info(f"Meeting about to start: {event.get('title')} for user {user['email']}")

                        # Prepare meeting data
                        meeting_data = {
                            'title': event.get('title'),
                            'meeting_link': event.get('meeting_link'),
                            'bot_name': 'Dialogon Assistant',
                            'user_email': user['email'],
                            'event_index': i
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
                        else:
                            print("    Failed to launch meeting joiner.")
                    else:
                        print("    Not time to launch yet.")

                except Exception as e:
                    logger.error(f"Error processing event: {str(e)}")
                    print(f"    Exception: {str(e)}")

    except Exception as e:
        logger.error(f"Error checking upcoming meetings: {str(e)}")
        print(f"Exception in check_upcoming_meetings: {str(e)}")

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

def setup_signal_handlers():
    """Setup proper signal handling for clean shutdown"""
    def signal_handler(sig, frame):
        logger.info(f"Received signal {sig}, shutting down...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)


if __name__ == "__main__":
    run_scheduler()

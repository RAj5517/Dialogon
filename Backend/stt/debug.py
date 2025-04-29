import os
import sys
import logging
from pathlib import Path

# Configure logging to console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger('debug')

# Print current directory and parent directory
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
logger.info(f"Current directory: {current_dir}")
logger.info(f"Parent directory: {parent_dir}")

# Check Python version
logger.info(f"Python version: {sys.version}")

# Check for dotenv
try:
    from dotenv import load_dotenv
    logger.info("dotenv module is available")
    
    # Try to load .env
    env_path = os.path.join(parent_dir, '.env')
    if os.path.exists(env_path):
        logger.info(f".env file found at {env_path}")
        load_dotenv(dotenv_path=env_path)
        
        # Check for environment variables
        google_api_key = os.getenv('GOOGLE_API_KEY')
        if google_api_key:
            logger.info("GOOGLE_API_KEY is set in environment")
        else:
            logger.info("GOOGLE_API_KEY is not set in environment")
    else:
        logger.info(f".env file not found at {env_path}")
except ImportError:
    logger.error("dotenv module is not available")

# Check for Google Cloud
try:
    from google.cloud import speech, storage
    logger.info("Google Cloud modules are available")
except ImportError as e:
    logger.error(f"Google Cloud modules are not available: {str(e)}")

# Check for credentials file
credentials_path = os.path.join(parent_dir, 'keys', 'dialogon-stt-key.json')
if os.path.exists(credentials_path):
    logger.info(f"Credentials file found at {credentials_path}")
    
    # Try to read file to see if it's valid JSON
    try:
        import json
        with open(credentials_path, 'r') as f:
            cred_data = json.load(f)
        logger.info("Credentials file is valid JSON")
        
        # Check for required fields
        if 'type' in cred_data and 'project_id' in cred_data:
            logger.info("Credentials file contains required fields")
        else:
            logger.error("Credentials file is missing required fields")
    except json.JSONDecodeError:
        logger.error("Credentials file is not valid JSON")
    except Exception as e:
        logger.error(f"Error reading credentials file: {str(e)}")
else:
    logger.error(f"Credentials file not found at {credentials_path}")

# Check for pydub
try:
    from pydub import AudioSegment
    logger.info("pydub module is available")
except ImportError:
    logger.error("pydub module is not available")

# Import our STT module and check dependencies
try:
    import stt
    logger.info("STT module imported successfully")
    
    # Check dependencies
    deps_check = stt.check_dependencies()
    logger.info(f"STT dependencies check: {deps_check}")
    
    # Print the check_dependencies function to inspect it
    import inspect
    logger.info(f"STT check_dependencies function:\n{inspect.getsource(stt.check_dependencies)}")
except Exception as e:
    logger.error(f"Error importing STT module: {str(e)}") 
import os
from dotenv import load_dotenv
import google.generativeai as genai

#Load the .env
load_dotenv()

#setting up the api key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
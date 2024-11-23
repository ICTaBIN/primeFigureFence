import os
from dotenv import load_dotenv
import json

load_dotenv()

def credentials_reader(CREDENTIALS_FILE_PATH):
    with open(CREDENTIALS_FILE_PATH) as credentials_file:
        data = json.load(credentials_file)
        data = data.get("web")
        return data
#__________________________________________CONSTANTS______________________________________________________

EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
CREDENTIALS_FILE_PATH = 'figure_fence_credentials.json'


data = credentials_reader(CREDENTIALS_FILE_PATH)
GOOGLE_CLIENT_ID = data.get("client_id")
GOOGEL_CLIENT_SECRET = data.get("client_secret")


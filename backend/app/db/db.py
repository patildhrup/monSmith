import os
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from dotenv import load_dotenv

load_dotenv()

# Database configuration
MONGO_URL = os.getenv("MONGO_URL")

# client with shorter timeouts for better error reporting
client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    tlsCAFile=certifi.where()
)

# Use the name from the MONGO_URL if available, otherwise default to monSmith
db = client.get_default_database()
if db is None:
    db = client["monSmith"]

def get_db():
    return db

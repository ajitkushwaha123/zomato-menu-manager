import certifi
from pymongo import MongoClient
from app.core.settings import settings

client = MongoClient(settings.MONGODB_URI, tlsCAFile=certifi.where())
db = client[settings.DATABASE_NAME]
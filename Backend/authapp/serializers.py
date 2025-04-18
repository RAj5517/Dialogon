from rest_framework import serializers
from pymongo import MongoClient
from django.conf import settings
import datetime
from django.contrib.auth.hashers import make_password, check_password
from firebase_admin import credentials, auth
import firebase_admin
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_JSON'))
    firebase_admin.initialize_app(cred)

class UserRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.client = MongoClient(settings.DB_URI)
        self.db = self.client.user
        self.users = self.db.users

    def validate(self, data):
        try:
            # Check if email exists in MongoDB
            if self.users.find_one({"email": data['email']}):
                raise serializers.ValidationError({
                    "message": "A user with this email already exists. Please login instead."
                })
            
            # Check if username exists in MongoDB
            if self.users.find_one({"username": data['username']}):
                raise serializers.ValidationError({
                    "message": "This username is already taken. Please choose another."
                })
            
            return data
        except Exception as e:
            print(f"Validation error: {str(e)}")
            raise serializers.ValidationError({
                "message": f"Validation error: {str(e)}"
            })

    def create(self, validated_data):
        try:
            # Hash the password
            hashed_password = make_password(validated_data['password'])
            
            # Create user document for MongoDB
            user_data = {
                "email": validated_data['email'],
                "username": validated_data['username'],
                "password": hashed_password,
                "auth_type": "email",
                "created_at": datetime.datetime.now(),
                "last_login": datetime.datetime.now(),
                "events": []
            }
            
            # Insert into MongoDB
            result = self.users.insert_one(user_data)
            print(f"User created with id: {result.inserted_id}")
            
            # Return the user data (without password)
            user_data.pop('password')
            return user_data
            
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            raise serializers.ValidationError({
                "message": f"Failed to create user: {str(e)}"
            })
        finally:
            if hasattr(self, 'client'):
                self.client.close()

class UserLoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.client = MongoClient(settings.DB_URI)
        self.db = self.client.user
        self.users = self.db.users

    def validate(self, data):
        try:
            login = data['login']
            password = data['password']
            
            # Try to find user by email or username in MongoDB
            user = self.users.find_one({"$or": [
                {"email": login},
                {"username": login}
            ]})
            
            if user is None:
                raise serializers.ValidationError({
                    "message": "No account found with this email/username. Please register first."
                })
                
            if not check_password(password, user['password']):
                raise serializers.ValidationError({
                    "message": "Invalid password."
                })
                
            # Remove password from user data
            user.pop('password', None)
            data['user'] = user
            return data
            
        except Exception as e:
            print(f"Login error: {str(e)}")
            raise serializers.ValidationError({
                "message": f"Login failed: {str(e)}"
            })
        finally:
            if hasattr(self, 'client'):
                self.client.close()

class GoogleAuthSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    
    def validate(self, data):
        try:
            decoded_token = auth.verify_id_token(data['token'])
            data['decoded_token'] = decoded_token
            return data
        except Exception as e:
            print("Token verification error:", str(e))
            raise serializers.ValidationError(f'Invalid token: {str(e)}')

class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    email = serializers.EmailField()
    username = serializers.CharField()
    auth_type = serializers.CharField()

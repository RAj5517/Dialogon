from rest_framework import serializers
from .models import User  # Import your mongoengine User model
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth

# Load environment variables from .env file
load_dotenv()

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_JSON'))
    firebase_admin.initialize_app(cred)

print(os.getenv('FIREBASE_CREDENTIALS_JSON'))  # Check if the path is correct

class UserRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).count() > 0:
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        user.save()
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = User.objects.filter(email=data['email']).first()
        if user is None or user.password != data['password']:
            raise serializers.ValidationError("Invalid email or password.")
        return data

class GoogleAuthSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    
    def validate_token(self, token):
        try:
            # Verify the token with Firebase
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            raise serializers.ValidationError('Invalid token: ' + str(e))

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

    def validate(self, data):
        # Check if email exists
        if User.objects.filter(email=data['email']).first():
            raise serializers.ValidationError({
                "message": "A user with this email already exists. Please login instead."
            })
        
        # Check if username exists
        if User.objects.filter(username=data['username']).first():
            raise serializers.ValidationError({
                "message": "This username is already taken. Please choose another."
            })
        
        return data

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']  # In production, use make_password here
        )
        user.save()
        return user

class UserLoginSerializer(serializers.Serializer):
    login = serializers.CharField(required=True)  # This will accept either email or username
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        login = data['login']
        password = data['password']
        
        # Try to find user by email or username
        user = User.objects.filter(email=login).first() or User.objects.filter(username=login).first()
        
        if user is None:
            raise serializers.ValidationError({
                "message": "No account found with this email/username. Please register first."
            })
            
        if user.password != password:  # In production, use check_password
            raise serializers.ValidationError({
                "message": "Invalid password."
            })
            
        data['user'] = user
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

from rest_framework import serializers
from .models import User  # Remove UserData from import
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth
from firebase_admin import auth as firebase_auth
import time
from django.contrib.auth.hashers import make_password, check_password

# Load environment variables from .env file
load_dotenv()

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_JSON'))
    firebase_admin.initialize_app(cred)

print(os.getenv('FIREBASE_CREDENTIALS_JSON'))  # Check if the path is correct

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

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
        try:
            user = User(
                username=validated_data['username'],
                email=validated_data['email']
            )
            # Use the set_password method we defined in the model
            user.set_password(validated_data['password'])
            user.save()
            return user
        except Exception as e:
            print(f"Registration error: {str(e)}")  # Add this for debugging
            raise serializers.ValidationError({
                "message": f"Registration failed: {str(e)}"
            })

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        login = data['email']
        password = data['password']
        
        # Try to find user by email or username
        user = User.objects.filter(email=login).first() or User.objects.filter(username=login).first()
        
        if user is None:
            raise serializers.ValidationError({
                "message": "No account found with this email/username. Please register first."
            })
            
        if not user.check_password(password):  # This is correct - using hashed password check
            raise serializers.ValidationError({
                "message": "Invalid password."
            })
            
        data['user'] = user
        return data

class GoogleAuthSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    
    def validate(self, data):
        try:
            decoded_token = firebase_auth.verify_id_token(data['token'])
            data['decoded_token'] = decoded_token
            return data
        except Exception as e:
            print("Token verification error:", str(e))
            raise serializers.ValidationError(f'Invalid token: {str(e)}')

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'auth_type']

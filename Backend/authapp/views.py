from rest_framework import generics, status
from rest_framework.response import Response
from .models import User
from .serializers import UserRegisterSerializer, UserLoginSerializer, GoogleAuthSerializer
from rest_framework.authtoken.models import Token
from firebase_admin import auth as firebase_auth
from rest_framework import serializers
from firebase_admin.auth import ExpiredIdTokenError, InvalidIdTokenError
from django.utils import timezone
from django.conf import settings
from pymongo import MongoClient
import datetime
from django.db import models

# Create your views here.  

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            return Response({
                "message": "Registration successful",
                "user": {
                    "username": user.username,
                    "email": user.email
                }
            }, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            # Get the error message
            error_message = e.detail.get('message', 'Registration failed')
            if isinstance(error_message, list):
                error_message = error_message[0]
                
            return Response({
                "message": error_message,
                "errors": e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "message": "An unexpected error occurred",
                "errors": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            return Response({
                "message": "Login successful!",
                "user": {
                    "email": user.email,
                    "username": user.username
                }
            }, status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return Response({
                "message": e.detail.get('message', 'Login failed'),
                "errors": e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "message": "An unexpected error occurred",
                "errors": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GoogleAuthView(generics.GenericAPIView):
    serializer_class = GoogleAuthSerializer

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.client = MongoClient(settings.DB_URI)
        self.db = self.client.user
        self.users = self.db.users

    def post(self, request):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            decoded_token = serializer.validated_data['decoded_token']
            email = decoded_token.get('email')
            
            if not email:
                return Response({
                    'message': 'Email not found in token'
                }, status=status.HTTP_400_BAD_REQUEST)

            username = email.split('@')[0]

            existing_user = self.users.find_one({"email": email})

            if existing_user:
                self.users.update_one(
                    {"email": email},
                    {
                        "$set": {
                            "last_login": datetime.datetime.now(),
                            "auth_type": "google",
                            "username": username
                        }
                    }
                )
                user_data = existing_user
            else:
                new_user = {
                    "email": email,
                    "username": username,
                    "auth_type": "google",
                    "created_at": datetime.datetime.now(),
                    "last_login": datetime.datetime.now()
                }
                result = self.users.insert_one(new_user)
                user_data = new_user
                print(f"New Google user created with id: {result.inserted_id}")

            return Response({
                'message': 'Google authentication successful',
                'user': {
                    'email': email,
                    'username': username,
                    'auth_type': 'google'
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Authentication error: {str(e)}")
            return Response({
                'message': 'Authentication failed',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def __del__(self):
        if hasattr(self, 'client'):
            self.client.close()

class UserData(models.Model):
    # Define your fields here
    field_name = models.CharField(max_length=100)


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
from rest_framework.decorators import api_view

# Create your views here.  

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer

    def create(self, request, *args, **kwargs):
        try:
            print(f"Registration attempt with data: {request.data}")  # Debug log
            
            # Initialize MongoDB connection
            client = MongoClient(settings.DB_URI)
            db = client.user
            users = db.users
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Create user using the serializer
            user_data = serializer.save()
            
            return Response({
                "message": "Registration successful",
                "user": {
                    "username": user_data['username'],
                    "email": user_data['email'],
                    "auth_type": user_data['auth_type']
                }
            }, status=status.HTTP_201_CREATED)
            
        except serializers.ValidationError as e:
            print(f"Validation error during registration: {e.detail}")  # Debug log
            error_message = e.detail.get('message', 'Registration failed')
            if isinstance(error_message, list):
                error_message = error_message[0]
            return Response({
                "message": error_message,
                "errors": e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Unexpected error during registration: {str(e)}")  # Debug log
            return Response({
                "message": "An unexpected error occurred",
                "errors": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if 'client' in locals():
                client.close()

class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        try:
            print(f"Login attempt with data: {request.data}")  # Debug log
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            
            # Generate a simple token (you might want to use JWT or another token system)
            token = user['_id'].__str__()
            
            return Response({
                "message": "Login successful!",
                "token": token,  # Add token to response
                "user": {
                    "email": user['email'],
                    "username": user['username'],
                    "auth_type": user.get('auth_type', 'email')
                }
            }, status=status.HTTP_200_OK)
            
        except serializers.ValidationError as e:
            print(f"Validation error during login: {e.detail}")  # Debug log
            return Response({
                "message": e.detail.get('message', 'Login failed'),
                "errors": e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Unexpected error during login: {str(e)}")  # Debug log
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

@api_view(['POST'])
def create_event(request):
    try:
        client = MongoClient(settings.DB_URI)
        db = client.user
        users = db.users

        email = request.data.get('user_email')
        event_data = {
            "title": request.data.get('title'),
            "date": request.data.get('date'),
            "time": request.data.get('time'),
            "meeting_link": request.data.get('meeting_link'),
            "status": "scheduled"  # Add status field
        }

        print(f"Creating event for user {email}: {event_data}")  # Debug log

        # Update user document by pushing new event to events array
        result = users.update_one(
            {"email": email},
            {"$push": {"events": event_data}}
        )

        if result.modified_count > 0:
            # Get updated user document
            user = users.find_one({"email": email})
            return Response({
                'message': 'Event created successfully',
                'events': user.get('events', [])
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        print(f"Error creating event: {str(e)}")  # Debug log
        return Response({
            'message': f'Error creating event: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    finally:
        client.close()

@api_view(['GET'])
def get_user_events(request, email):
    try:
        client = MongoClient(settings.DB_URI)
        db = client.user
        users = db.users

        print(f"Fetching events for user: {email}")  # Debug log

        user = users.find_one({"email": email})
        if user:
            events = user.get('events', [])
            print(f"Found {len(events)} events")  # Debug log
            return Response({
                'events': events
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        print(f"Error fetching events: {str(e)}")  # Debug log
        return Response({
            'message': f'Error fetching events: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    finally:
        client.close()

@api_view(['PUT', 'DELETE'])
def manage_event(request, email, event_index):
    try:
        client = MongoClient(settings.DB_URI)
        db = client.user
        users = db.users

        if request.method == 'PUT':
            # Get current event to preserve status if it exists
            user = users.find_one({"email": email})
            current_status = "scheduled"
            
            if user and 'events' in user and len(user['events']) > event_index:
                current_status = user['events'][event_index].get('status', 'scheduled')
            
            # Update event
            event_data = {
                "title": request.data.get('title'),
                "date": request.data.get('date'),
                "time": request.data.get('time'),
                "meeting_link": request.data.get('meeting_link'),
                "status": current_status  # Preserve existing status
            }

            print(f"Updating event for user {email} at index {event_index}")
            print(f"New event data: {event_data}")

            # Update the specific event in the array
            result = users.update_one(
                {"email": email},
                {"$set": {f"events.{event_index}": event_data}}
            )

        elif request.method == 'DELETE':
            # Delete event
            # First, get the user document
            user = users.find_one({"email": email})
            if not user or 'events' not in user:
                return Response({
                    'message': 'User or events not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Get current events array
            events = user.get('events', [])
            
            # Check if index is valid
            if event_index < 0 or event_index >= len(events):
                return Response({
                    'message': 'Invalid event index'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Remove the event at the specified index
            events.pop(event_index)

            # Update the user document with the new events array
            result = users.update_one(
                {"email": email},
                {"$set": {"events": events}}
            )

        if result.modified_count > 0:
            # Get updated user document
            user = users.find_one({"email": email})
            return Response({
                'message': 'Event updated successfully' if request.method == 'PUT' else 'Event deleted successfully',
                'events': user.get('events', [])
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'User or event not found'
            }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        print(f"Error managing event: {str(e)}")
        return Response({
            'message': f'Error managing event: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    finally:
        client.close()


from rest_framework import generics, status
from rest_framework.response import Response
from .models import User
from .serializers import UserRegisterSerializer, UserLoginSerializer, GoogleAuthSerializer
from rest_framework.authtoken.models import Token
from firebase_admin import auth
from rest_framework import serializers

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
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get user info from validated token
        user_data = serializer.validated_data
        
        # Check if user exists, if not create new user
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={'username': user_data.get('name', '')}
        )
        
        # Create or get token
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'email': user.email,
                'username': user.username
            }
        }, status=status.HTTP_200_OK)


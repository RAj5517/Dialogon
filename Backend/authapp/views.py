from rest_framework import generics, status
from rest_framework.response import Response
from .models import User
from .serializers import UserRegisterSerializer, UserLoginSerializer, GoogleAuthSerializer
from rest_framework.authtoken.models import Token
from firebase_admin import auth

# Create your views here.  

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": {
                "username": user.username,
                "email": user.email
            }
        }, status=status.HTTP_201_CREATED)

class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"message": "Login successful!"}, status=status.HTTP_200_OK)

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


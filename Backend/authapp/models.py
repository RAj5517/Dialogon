from mongoengine import Document, StringField, EmailField, BooleanField
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone
from bson import ObjectId
import datetime
from django.contrib.auth.hashers import make_password, check_password

# Create your models here.

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)

class CustomUser(Document):
    email = EmailField(unique=True)
    username = StringField(max_length=150, unique=True)
    password = StringField()  # Store hashed password
    is_active = BooleanField(default=True)
    is_staff = BooleanField(default=False)

    objects = CustomUserManager()

    def __str__(self):
        return self.email

class User:
    """
    A simple class to represent user data structure.
    This is not a Django model since we're using MongoDB.
    """
    def __init__(self, email, username, password=None, auth_type='email'):
        self.email = email
        self.username = username
        self.password = password
        self.auth_type = auth_type

    def set_password(self, raw_password):
        if raw_password:
            self.password = make_password(raw_password)
        
    def check_password(self, raw_password):
        if not raw_password or not self.password:
            return False
        return check_password(raw_password, self.password)

    def to_mongo_dict(self):
        return {
            "_id": ObjectId(),
            "email": self.email,
            "username": self.email.split('@')[0],  # Create username from email
            "auth_type": "google",
            "created_at": datetime.datetime.now(),
            "last_login": datetime.datetime.now()
        }

# Remove or comment out the UserData model if you're not using it
# class UserData(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_data')
#     last_login = models.DateTimeField(default=timezone.now)

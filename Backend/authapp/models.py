from mongoengine import Document, StringField, EmailField, BooleanField
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone
from bson import ObjectId
import datetime

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

class User(models.Model):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150)
    password = models.CharField(max_length=128, null=True, blank=True)
    auth_type = models.CharField(max_length=20, default='email')

    class Meta:
        db_table = 'users'
        app_label = 'authapp'  # Changed from 'user' to 'authapp'

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

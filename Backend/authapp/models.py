from mongoengine import Document, StringField, EmailField, BooleanField
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

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

class User(Document):
    username = StringField(max_length=150, unique=True)
    email = EmailField(unique=True)
    password = StringField()
    is_active = BooleanField(default=True)

    meta = {'collection': 'users'}

    def __str__(self):
        return self.email

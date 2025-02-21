from django.urls import path
from .views import RegisterView, LoginView, GoogleAuthView
from . import views

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('google-auth/', GoogleAuthView.as_view(), name='google-auth'),
    path('events/create/', views.create_event, name='create_event'),
    path('events/<str:email>/', views.get_user_events, name='get_user_events'),
    path('events/<str:email>/<int:event_index>/', views.manage_event, name='manage_event'),
]
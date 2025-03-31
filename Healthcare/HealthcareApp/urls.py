from django.urls import path
from . import views
from django.urls import path, include

urlpatterns = [
    path('', include('HealthcareApp.urls')),
    path('', views.index, name="index")
]
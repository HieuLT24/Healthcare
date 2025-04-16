from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import permission_classes

from HealthcareApp.models import User, Exercise, WorkoutSession, Diary, Reminder, Message, Conversation, NutritionGoal, \
    NutritionPlan, MuscleGroup, ReminderType, HealthGoals, Role, Meal, FoodItem
from HealthcareApp.serializers import UserSerializer, ExerciseSerializer, WorkoutSessionSerializer, DiarySerializer, \
    ReminderSerializer, MessageSerializer, ConversationSerializer, NutritionGoalSerializer, NutritionPlanSerializer, \
    MealSerializer, FoodItemSerializer
from django.http import HttpResponse

# Create your views here.

def index(request):
    return HttpResponse("Healthcare App")

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active = True)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.filter(is_active=True).all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

class WorkoutSessionViewSet(viewsets.ModelViewSet):
    queryset = WorkoutSession.objects.filter(is_active=True)
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

class DiaryViewSet(viewsets.ModelViewSet):
    queryset = Diary.objects.filter(is_active = True)
    serializer_class = DiarySerializer
    permission_classes = [permissions.IsAuthenticated]

class ReminderViewSet(viewsets.ModelViewSet):
    queryset = Reminder.objects.filter(is_active = True)
    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

class MessagesViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.filter(is_active = True)
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.filter(is_active = True)
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

class NutritionGoalViewSet(viewsets.ModelViewSet):
    queryset = NutritionGoal.objects.filter(is_active = True)
    serializer_class = NutritionGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

class NutritionPLanViewSet(viewsets.ModelViewSet):
    queryset = NutritionPlan.objects.filter(is_active = True)
    serializer_class = NutritionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

class MealViewSet(viewsets.ModelViewSet):
    queryset = Meal.objects.filter(is_active = True)
    serializer_class = MealSerializer
    permission_classes = [permissions.IsAuthenticated]

class FoodItemViewSet(viewsets.ModelViewSet):
    queryset = FoodItem.objects.filter(is_active = True)
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]
from django.urls import path
from . import views
from django.urls import path, include
from rest_framework import routers

router = routers.DefaultRouter()
router.register('users', views.UserViewSet,basename='users')
router.register('exercises', views.ExerciseViewSet,basename='exercises')
router.register('workout-sessions', views.WorkoutSessionViewSet,basename='workout-sessions')
router.register('diaries', views.DiaryViewSet,basename='diaries')
router.register('reminders', views.ReminderViewSet,basename='reminders')
router.register('messages', views.MessagesViewSet,basename='messages')
router.register('conversations', views.ConversationViewSet,basename='conversations')
router.register('nutrition-goals', views.NutritionGoalViewSet,basename='nutrition-goals')
router.register('nutrition-plans', views.NutritionPLanViewSet,basename='nutrition-plans')
router.register('meals', views.MealViewSet,basename='meals')
router.register('food-items', views.FoodItemViewSet,basename='food-items')

urlpatterns = [
    path('', include(router.urls)),
]
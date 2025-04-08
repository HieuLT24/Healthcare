from django.urls import path
from . import views
from django.urls import path, include
from rest_framework import routers

router = routers.DefaultRouter()
router.register('users', views.UserViewSet,basename='users')
router.register('excercises', views.ExerciseViewSet,basename='excercises')
router.register('workoutsessions', views.WorkoutSessionViewSet,basename='workoutsessions')
router.register('diarys', views.DiaryViewSet,basename='diarys')
router.register('reminders', views.ReminderViewSet,basename='reminders')
router.register('messages', views.MessagesViewSet,basename='messages')
router.register('conservations', views.ConversationViewSet,basename='conservations')
router.register('nutritiongoals', views.NutritionGoalViewSet,basename='nutritiongoals')
router.register('nutritionplans', views.NutritionPLanViewSet,basename='nutritionplans')

urlpatterns = [
    path('', include(router.urls)),
]
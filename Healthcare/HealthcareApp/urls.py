from . import views
from django.urls import path, include
from rest_framework import routers
from .views import RegisterView, LoginView, LogoutView, FacebookLoginView, GoogleLoginView
from drf_yasg import openapi
from drf_yasg.views import get_schema_view


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


schema_view = get_schema_view(
    openapi.Info(
        title="API Documentation",
        default_version='v1',
        description="Test description",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@myapi.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
)


urlpatterns = [
    path('', include(router.urls)),
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),

    # Custom API
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),

    # Social login
    path('api/auth/facebook/', FacebookLoginView.as_view(), name='facebook_login'),
    path('api/auth/google/', GoogleLoginView.as_view(), name='google_login'),

]
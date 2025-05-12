from datetime import timedelta

from allauth.headless.base.views import APIView
from django.db.models import Sum
from rest_framework import (mixins, viewsets,
                            permissions, generics, parsers,
                            status, request)
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.exceptions import MethodNotAllowed, PermissionDenied
from drf_yasg.utils import swagger_auto_schema
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from HealthcareApp import serializers
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter

from HealthcareApp.models import User, Exercise, WorkoutSession, Diary, Reminder, Message, Conversation, NutritionGoal, \
    NutritionPlan, MuscleGroup, ReminderType, HealthGoals, Role, Meal, FoodItem
from django.http import HttpResponse

from collections import defaultdict
from django.db.models.functions import TruncDate
from django.utils.timezone import now

# Create your views here.

def index(request):
    return HttpResponse("Healthcare App")


class FacebookLoginView(SocialLoginView):
    adapter_class = FacebookOAuth2Adapter
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        request_body=serializers.FacebookLoginSerializer,
        operation_description="Đăng nhập bằng Facebook access token"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        request_body=serializers.GoogleLoginSerializer,
        operation_description="Đăng nhập bằng Google access token hoặc id token"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class RegisterView(generics.CreateAPIView):
    serializer_class = serializers.RegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser]

class UserViewSet(viewsets.ViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

    @action(methods=['patch', 'get'], url_path="current-user",
            detail=False, permission_classes=[permissions.IsAuthenticated])
    def get_current_user(self, request):
        if request.method.__eq__("PATCH"):
            u = request.user

            for key in request.data:
                if key in ['first_name', 'last_name']:
                    setattr(u, key, request.data[key])
                elif key.__eq__('password'):
                    u.set_password(request.data[key])

            u.save()
            return Response(serializers.UserSerializer(u).data)
        else:
            return Response(serializers.UserSerializer(request.user).data)


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.filter(is_active=True).all()
    serializer_class = serializers.ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    queryset = WorkoutSession.objects.filter(is_active=True)
    serializer_class = serializers.WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]


class DiaryViewSet(viewsets.ModelViewSet):
    queryset = Diary.objects.filter(is_active=True)
    serializer_class = serializers.DiarySerializer
    permission_classes = [permissions.IsAuthenticated]


class ReminderViewSet(mixins.ListModelMixin,
                      mixins.CreateModelMixin,
                      mixins.RetrieveModelMixin,
                      mixins.DestroyModelMixin,
                      mixins.UpdateModelMixin,
                      viewsets.GenericViewSet):

    queryset = Reminder.objects.filter(is_active=True)
    serializer_class = serializers.ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reminder.objects.filter(user = self.request.user, is_active=True)

    def perform_update(self, serializer):
        # Đảm bảo chỉ user sở hữu mới được update
        instance = self.get_object()
        if instance.user != self.request.user:
            raise PermissionDenied("Bạn không có quyền sửa reminder này.")
        serializer.save()

    def perform_destroy(self, instance):
        # Đảm bảo chỉ user sở hữu mới được xóa
        if instance.user != self.request.user:
            raise PermissionDenied("Bạn không có quyền xóa reminder này.")
        instance.delete()



class MessagesViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.filter(is_active=True)
    serializer_class = serializers.MessageSerializer
    permission_classes = [permissions.IsAuthenticated]


class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.filter(is_active=True)
    serializer_class = serializers.ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]


class NutritionGoalViewSet(viewsets.ModelViewSet):
    queryset = NutritionGoal.objects.filter(is_active=True)
    serializer_class = serializers.NutritionGoalSerializer
    permission_classes = [permissions.IsAuthenticated]


class NutritionPLanViewSet(viewsets.ModelViewSet):
    queryset = NutritionPlan.objects.filter(is_active=True)
    serializer_class = serializers.NutritionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]


class MealViewSet(viewsets.ModelViewSet):
    queryset = Meal.objects.filter(is_active=True)
    serializer_class = serializers.MealSerializer
    permission_classes = [permissions.IsAuthenticated]


class FoodItemViewSet(viewsets.ModelViewSet):
    queryset = FoodItem.objects.filter(is_active=True)
    serializer_class = serializers.FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class PersonalStatisticView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.WorkoutSessionSerializer

    def get(self, request):
        period = request.query_params.get('period', 'weekly')
        today = now().date()

        if period == 'weekly':
            start_date = today - timedelta(days=today.weekday())
            date_range = [start_date + timedelta(days=i) for i in range(7)]
        elif period =='monthly':
            start_date = today.replace(day=1)
            last_day = (today.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
            date_range = [start_date + timedelta(days=i) for i in range((last_day - start_date).days + 1)]
        else:
            return Response({'error': 'Invalid period'}, status=400)

        end_date = today

        workout_sessions = WorkoutSession.objects.filter(
            user = request.user,
            updated_date__date__range=(start_date,end_date),
        )
        # Nhóm dữ liệu theo ngày
        daily_stats = workout_sessions.annotate(date=TruncDate('updated_date')).values('date') \
            .annotate(
            calories_burned_sum=Sum('calories_burned'),
            total_duration_sum=Sum('total_duration')
        )
        # Dữ liệu theo ngày
        calories_per_day = defaultdict(int)
        time_per_day = defaultdict(int)

        for entry in daily_stats:
            date = entry['date']
            calories_per_day[date] = entry['calories_burned_sum'] or 0
            time_per_day[date] = entry['total_duration_sum'] or 0

        # Tạo mảng kết quả theo đúng thứ tự ngày
        calories_array = [calories_per_day[d] for d in date_range]
        time_array = [time_per_day[d] for d in date_range]
        return Response({
            'start_date': start_date,
            'end_date': end_date,
            'total_calories_burned': calories_array,
            'total_time': time_array,
            'total_sessions': workout_sessions.count()
        })
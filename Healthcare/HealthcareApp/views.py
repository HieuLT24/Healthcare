from datetime import timedelta

from allauth.headless.base.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Sum, Q
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
    NutritionPlan, MuscleGroup, ReminderType, HealthGoals, Role, Meal, FoodItem, HealthStat
from django.http import HttpResponse


from django.utils.timezone import now

from HealthcareApp.serializers import HealthStatSerializer, WorkoutSessionWriteSerializer, WorkoutSessionReadSerializer, \
    ExerciseSerializer, UserInforSerializer


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

User = get_user_model()

class UserInforViewSet(viewsets.ModelViewSet):
    serializer_class = UserInforSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

    def get_object(self):
        return self.request.user

class HealthStatViewSet(viewsets.ModelViewSet):
    serializer_class = HealthStatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HealthStat.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.filter(is_active=True)
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        type_filter = self.request.query_params.get('type')
        if type_filter == 'personal':
            return Exercise.objects.filter(created_by=user, is_active=True)
        elif type_filter == 'suggested':
            return Exercise.objects.filter(created_by__isnull=True, is_active=True)
        return Exercise.objects.filter(
            Q(created_by=user) | Q(created_by__isnull=True),
            is_active=True
        )


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user, is_active=True)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WorkoutSessionWriteSerializer
        return WorkoutSessionReadSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DiaryViewSet(viewsets.ModelViewSet):
    queryset = Diary.objects.filter(is_active=True)
    serializer_class = serializers.DiarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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
    serializer_class = serializers.WorkoutSession
    def get(self, request):
        period = request.query_params.get('period', 'weekly')
        today = now().date()

        if period == 'weekly':
            start_date = today - timedelta(days=today.weekday())
        elif period =='monthly':
            start_date = today.replace(day=1)
        else:
            return Response({'error': 'Invalid period'}, status=400)

        end_date = today

        workout_sessions = WorkoutSession.objects.filter(
            user = request.user,
            updated_date__date__range=(start_date,end_date)
        )

        total_time = workout_sessions.aggregate(Sum('total_duration')) or 0
        total_time_value = total_time.get('total_duration__sum', 0)
        total_calories_burned = workout_sessions.aggregate(Sum('calories_burned')) or 0
        total_calories_value = total_calories_burned.get('calories_burned__sum', 0)
        total_sessions = workout_sessions.count()

        return Response({
            'start_date': start_date,
            'end_date': end_date,
            'total_calories_burned': total_calories_value,
            'total_time': total_time_value,
            'total_sessions': total_sessions
        })

    # @swagger_auto_schema(
    #     operation_description="Xem thống kê"
    # )
    # def get(self, request, *args, **kwargs):
    #     return super().get(request, *args, **kwargs)


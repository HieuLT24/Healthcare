

from rest_framework import (mixins, viewsets,
                            permissions, generics, parsers,
                            status, request)
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.exceptions import MethodNotAllowed, PermissionDenied
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from HealthcareApp import serializers
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter

from HealthcareApp.models import User, Exercise, WorkoutSession, Diary, Reminder, Message, Conversation, NutritionGoal, \
    NutritionPlan, MuscleGroup, ReminderType, HealthGoals, Role, Meal, FoodItem
from django.http import HttpResponse


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


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        request_body=serializers.LoginSerializer,
        responses={200: openapi.Response("Login successful")},
        operation_summary="Đăng nhập bằng username và password"
    )
    def post(self, request):
        serializer = serializers.LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        request_body=serializers.LogoutSerializer,
        operation_description="Logout user (JWT hoặc Token)",
        responses={200: openapi.Response('Đăng xuất thành công'),
                   400: openapi.Response('Yêu cầu không hợp lệ')}
    )
    def post(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token_type = auth_header.split(' ')[0].lower() if auth_header else ''

        # logout with JWT
        if token_type == 'bearer':
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'detail': "missing refresh token"},
                                status=status.HTTP_400_BAD_REQUEST)
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()  # đánh dấu token không hợp lệ
                return Response({'detail': 'Successfully logged out (JWT)'},
                                status=status.HTTP_200_OK)
            except TokenError:
                return Response({'detail': 'Invalid token (required JWT)'}, status=status.HTTP_400_BAD_REQUEST)

        # logout with TokenAuthentication
        elif token_type == 'token':
            user = request.user
            try:
                user.auth_token.delete()
            except:
                pass
            return Response({'detail': 'Successfully logged out (Token)'}, status=status.HTTP_200_OK)
            # Không xác định được loại token

        return Response({'detail': 'Invalid or missing token type (required Token)'}, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

    @action(methods=['patch'], url_path="current-user",
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

    @action(methods=['delete'], detail=False, url_path='current_user', permission_classes=[permissions.IsAuthenticated])
    def delete_current_user(self, request):
        if request.method.__eq__("DELETE"):
            u = request.user
            u.delete()
            return Response({'detail': 'User deleted'}, status=status.HTTP_200_OK)

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
    #
    # @action(methods=['get'], detail=True, url_path='my_reminders',
    #         permission_classes=[permissions.IsAuthenticated])
    #
    # def get(self, request, *args, **kwargs):
    #
    #     queryset = self.get_queryset()
    #     serializer = self.get_serializer(queryset, many=True)
    #     return Response(serializer.data)





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

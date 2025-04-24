from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from rest_framework.fields import CharField
from rest_framework.serializers import ModelSerializer
from HealthcareApp.models import User, WorkoutSession, Exercise, MuscleGroup, Diary, \
    Reminder, Conversation, Message, NutritionGoal, NutritionPlan, Meal, FoodItem
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers


User = get_user_model()

class FacebookLoginSerializer(serializers.Serializer):
    access_token = CharField(required=True, help_text="Facebook access token.")

class GoogleLoginSerializer(serializers.Serializer):
    access_token = CharField(required=False)
    id_token = CharField(required=False)

class RegisterSerializer(ModelSerializer):
    password = CharField(write_only=True, required=True, validators=[validate_password])
    password2 = CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2','first_name', 'last_name', 'date_of_birth', 'avatar']
        ref_name = "CustomRegisterSerializer"
    def validate(self, data):
        if data['password'] != data['password2']:
            raise ValidationError({"password": "Mật khẩu không khớp."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(ModelSerializer):
    username = CharField(write_only=True, required=True)
    password = CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password']
        ref_name = "CustomLoginSerializer"
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(request=self.context.get('request'),
                                username=username, password=password)

            if not user:
                raise ValidationError("Tên đăng nhập hoặc mật khẩu không đúng.", code='authorization')

            if not user.is_active:
                raise ValidationError("Tài khoản chưa được kích hoạt.", code='authorization')
        else:
            raise ValidationError("Vui lòng nhập tên đăng nhập và mật khẩu.", code='authorization')

        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        }

class LogoutSerializer(serializers.Serializer):
    refresh = CharField(required=True, help_text="JWT refresh token")


class UserSerializer(ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['avatar'] = instance.avatar.url if instance.avatar else ''
        return data

    class Meta:
        model = User
        fields = ['username', 'password', 'first_name', 'last_name', 'avatar']
        extra_kwargs = {
            'username': {
                "read_only": True
            },
            'password': {
                'write_only': True
            }
        }

    def create(self, validated_data):
        data = validated_data.copy()
        u = User(**data)
        u.set_password(u.password)
        u.save()

        return u
class UserInforSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['date_of_birth','height','weight','health_goals']
class ExerciseSerializer(ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id','is_active','name','description',
                  'difficulty_level','equipment',
                  'duration','repetition','sets','calories_burned',
                  'muscle_groups', 'rating']

class WorkoutSessionSerializer(ModelSerializer):
    exercise = ExerciseSerializer(many=True)
    class Meta:
        model = WorkoutSession
        fields =['id','schedule','exercise','is_active',
                 'name','goal','total_duration',
                 'bpm','steps','calories_burned']

class DiarySerializer(ModelSerializer):
    class Meta:
        model = Diary
        fields =['id','is_active','name','content',
                 'user','workout_session' ]

class ReminderSerializer(ModelSerializer):
    class Meta:
        model = Reminder
        fields =['id','is_active','name','description',
                 'time','repeat','reminder_type','user']

class ConversationSerializer(ModelSerializer):
    class Meta:
        model = Conversation
        fields ='__all__'

class MessageSerializer(ModelSerializer):
    class Meta:
        model = Message
        fields ='__all__'

class MuscleGroupSerializer(ModelSerializer):
    class Meta:
        model = MuscleGroup
        fields =['id','name']

class NutritionGoalSerializer(ModelSerializer):
    class Meta:
        model = NutritionGoal
        fields =['id','name','date','daily_calories',
                 'daily_proteins','daily_carbs','daily_fats','user']

class NutritionPlanSerializer(ModelSerializer):
    class Meta:
        model = NutritionPlan
        fields =['id','name','date','total_calories',
                 'total_proteins','total_carbs','total_fats',
                 'user','meals']

class MealSerializer(ModelSerializer):
    class Meta:
        model = Meal
        fields =['id','name']

class FoodItemSerializer(ModelSerializer):
    class Meta:
        model = FoodItem
        fields =['id','name','unit','calories',
                 'proteins','carbs','fats', 'quantities'
                 ]
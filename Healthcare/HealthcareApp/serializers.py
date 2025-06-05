from datetime import date, datetime
from django.utils import timezone


from django.contrib.auth.password_validation import validate_password
from rest_framework.fields import DateField, DateTimeField
from rest_framework.exceptions import ValidationError
from rest_framework.serializers import ModelSerializer, FloatField, CharField, DateField, DateTimeField
from HealthcareApp.models import User, WorkoutSession, Exercise, MuscleGroup, Diary, \
     NutritionGoal, NutritionPlan, Meal, FoodItem, HealthStat
from django.contrib.auth import get_user_model, authenticate
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
    avatar = serializers.ImageField(required=False, allow_null=True, allow_empty_file=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2','first_name', 'last_name', 'avatar']
        ref_name = "CustomRegisterSerializer"

    def validate(self, data):
        if data['password'] != data['password2']:
            raise ValidationError({"password": "Mật khẩu không khớp."})
        return data

    def create(self, validated_data):
        try:
            validated_data.pop('password2')
            avatar = validated_data.pop('avatar', None)

            user = User.objects.create_user(**validated_data)

            if avatar:
                user.avatar = avatar
                user.save()

            return user
        except Exception as e:
            raise ValidationError({"error": f"Lỗi khi tạo tài khoản: {str(e)}"})

# class LoginSerializer(ModelSerializer):
#     username = CharField(write_only=True, required=True)
#     password = CharField(write_only=True, required=True)
#
#     class Meta:
#         model = User
#         fields = ['username', 'password']
#         ref_name = "CustomLoginSerializer"
#     def validate(self, attrs):
#         username = attrs.get('username')
#         password = attrs.get('password')
#
#         if username and password:
#             user = authenticate(request=self.context.get('request'),
#                                 username=username, password=password)
#
#             if not user:
#                 raise ValidationError("Tên đăng nhập hoặc mật khẩu không đúng.", code='authorization')
#
#             if not user.is_active:
#                 raise ValidationError("Tài khoản chưa được kích hoạt.", code='authorization')
#         else:
#             raise ValidationError("Vui lòng nhập tên đăng nhập và mật khẩu.", code='authorization')
#
#         refresh = RefreshToken.for_user(user)
#
#         return {
#             'refresh': str(refresh),
#             'access': str(refresh.access_token),
#             'user': {
#                 'id': user.id,
#                 'username': user.username,
#                 'email': user.email,
#                 'first_name': user.first_name,
#                 'last_name': user.last_name
#             }
#         }

# class LogoutSerializer(serializers.Serializer):
#     refresh = CharField(required=True, help_text="JWT refresh token")


class UserSerializer(ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Xử lý avatar URL an toàn và trả về absolute URL
        avatar_url = ''
        if instance.avatar:
            try:
                if hasattr(instance.avatar, 'url'):
                    avatar_url = instance.avatar.url
                    # Nếu URL không phải absolute URL, thêm base URL
                    if avatar_url and not avatar_url.startswith('http'):
                        request = self.context.get('request')
                        if request:
                            avatar_url = request.build_absolute_uri(avatar_url)
                elif isinstance(instance.avatar, str):
                    avatar_url = instance.avatar
                    if not avatar_url.startswith('http'):
                        request = self.context.get('request')
                        if request:
                            avatar_url = request.build_absolute_uri(avatar_url)
            except Exception as e:
                print(f"Error getting avatar URL for user {instance.username}: {str(e)}")
                avatar_url = ''
        data['avatar'] = avatar_url
        return data

    class Meta:
        model = User
        fields = ['id','username', 'password', 'first_name', 'last_name', 'avatar', 'role']
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


class HieuUserInforSerializer(ModelSerializer):
    date_of_birth = serializers.SerializerMethodField()
    date_joined = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'avatar', 'date_of_birth', 'date_joined', 'role']

    def get_date_of_birth(self, obj):
        if obj.date_of_birth:
            return obj.date_of_birth.strftime('%Y-%m-%d')
        return None

    def get_date_joined(self, obj):
        if obj.date_joined:
            return obj.date_joined.strftime('%Y-%m-%d %H:%M:%S')
        return None

class UserInforSerializer(ModelSerializer):
    age = FloatField(required=False)  # Tuổi
    height = FloatField(required=False)  # Chiều cao (m)
    weight = FloatField(required=False)  # Cân nặng (kg)
    health_goals = CharField(required=False)  # Mục tiêu sức khỏe

    class Meta:
        model = User
        fields = ['age', 'height', 'weight', 'health_goals']

    def update(self, instance, validated_data):
        # Cập nhật thông tin cơ bản
        instance.health_goals = validated_data.get('health_goals', instance.health_goals)
        instance.height = validated_data.get('height', instance.height)
        instance.weight = validated_data.get('weight', instance.weight)

        # Cập nhật date_of_birth từ age
        if 'age' in validated_data:
            today = date.today()
            age = validated_data['age']
            year_of_birth = today.year - int(age)
            instance.date_of_birth = date(year_of_birth, today.month, today.day)

        # Lưu thông tin người dùng
        instance.save()
        return instance

class HealthStatSerializer(ModelSerializer):

    date = serializers.SerializerMethodField()

    class Meta:
        model = HealthStat
        fields = ['id', 'date', 'bmi', 'weight', 'height', 'water_intake', 'step_count', 'heart_rate']
        read_only_fields = ['date', 'bmi']

    def get_date(self, obj):
        if obj.date:
            return obj.date.strftime('%Y-%m-%d %H:%M:%S')
        return None

    def create(self, validated_data):
        user = self.context['request'].user
        health_stat = HealthStat.objects.create(user=user, **validated_data)
        return health_stat

class HealthStatisticSerializer(ModelSerializer):
    date = serializers.SerializerMethodField()

    class Meta:
        model = HealthStat
        fields = '__all__'
        extra_kwargs = {
            'bmi': {
                "read_only": True
            }
        }

    def get_date(self, obj):
        if obj.date:
            return obj.date.strftime('%Y-%m-%d %H:%M:%S')
        return None

class MuscleGroupSerializer(ModelSerializer):
    class Meta:
        model = MuscleGroup
        fields =['id','name']

class ExerciseSerializer(ModelSerializer):
    muscle_groups = MuscleGroupSerializer(many=True, read_only=True)  # Sử dụng serializer cho muscle_groups
    class Meta:
        model = Exercise
        fields = ['id','is_active','name','description',
                  'difficulty_level','equipment',
                  'duration','repetition','sets','calories_burned',
                  'muscle_groups', 'rating']

    def create(self, validated_data):
        # Gán người tạo nếu có request context
        user = self.context['request'].user
        validated_data['created_by'] = user
        return super().create(validated_data)

class WorkoutSessionReadSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(many=True)

    class Meta:
        model = WorkoutSession
        fields = '__all__'


class WorkoutSessionWriteSerializer(serializers.ModelSerializer):
    exercise = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Exercise.objects.filter(is_active=True)
    )

    class Meta:
        model = WorkoutSession
        exclude = ['user']

    def create(self, validated_data):
        exercises = validated_data.pop('exercise', [])
        instance = super().create(validated_data)
        instance.exercise.set(exercises)
        # Tính lại tổng calories và thời gian
        instance.total_duration = sum(ex.duration for ex in instance.exercise.all())
        instance.calories_burned = sum(ex.calories_burned for ex in instance.exercise.all())
        instance.save(update_fields=['total_duration', 'calories_burned'])
        return instance

    def update(self, instance, validated_data):
        exercises = validated_data.pop('exercise', None)
        instance = super().update(instance, validated_data)
        if exercises is not None:
            instance.exercise.set(exercises)
        instance.total_duration = sum(ex.duration for ex in instance.exercise.all())
        instance.calories_burned = sum(ex.calories_burned for ex in instance.exercise.all())
        instance.save(update_fields=['total_duration', 'calories_burned'])
        return instance

class DiarySerializer(ModelSerializer):
    class Meta:
        model = Diary
        fields =['id','is_active','name','content','workout_session' ]
        read_only_fields = ['user']


class NutritionGoalSerializer(ModelSerializer):
    class Meta:
        model = NutritionGoal
        fields =['id','name','date','daily_calories',
                 'daily_proteins','daily_carbs','daily_fats','user']

class NutritionPlanSerializer(ModelSerializer):
    date = serializers.SerializerMethodField()

    class Meta:
        model = NutritionPlan
        fields = ['id', 'name', 'date', 'total_calories',
                 'total_proteins', 'total_carbs', 'total_fats',
                 'user', 'meals']

    def get_date(self, obj):
        if obj.date:
            return obj.date.strftime('%Y-%m-%d')
        return None

class MealSerializer(ModelSerializer):
    class Meta:
        model = Meal
        fields =['id','name']

class FoodItemSerializer(ModelSerializer):
    class Meta:
        model = FoodItem
        fields =['id','name','unit','calories',
                 'proteins','carbs','fats','quantities']

class ExpertCoachSerializer(ModelSerializer):
    """Serializer cho danh sách chuyên gia và huấn luyện viên"""
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    date_of_birth = serializers.SerializerMethodField()
    date_joined = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name',
                 'email', 'role', 'avatar', 'avatar_url', 'date_of_birth',
                 'health_goals', 'date_joined']

    def get_full_name(self, obj):
        """Trả về tên đầy đủ"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username

    def get_avatar_url(self, obj):
        """Trả về URL của avatar"""
        if obj.avatar:
            return obj.avatar.url
        return None

    def get_date_of_birth(self, obj):
        """Trả về ngày sinh dưới dạng chuỗi YYYY-MM-DD"""
        if obj.date_of_birth:
            return obj.date_of_birth.strftime('%Y-%m-%d')
        return None

    def get_date_joined(self, obj):
        """Trả về ngày tham gia dưới dạng chuỗi YYYY-MM-DD HH:MM:SS"""
        if obj.date_joined:
            try:
                # Convert to local time if timezone-aware
                if timezone.is_aware(obj.date_joined):
                    date_joined = timezone.localtime(obj.date_joined)
                else:
                    date_joined = obj.date_joined
                return date_joined.strftime('%Y-%m-%d %H:%M:%S')
            except (AttributeError, ValueError, TypeError):
                # If any error occurs during conversion, return the raw value as string
                return str(obj.date_joined)
        return None
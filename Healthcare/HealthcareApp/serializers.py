from rest_framework.serializers import ModelSerializer
from HealthcareApp.models import User, WorkoutSession, Exercise, MuscleGroup, Diary, \
    Reminder, Conversation, Message, NutritionGoal, NutritionPlan, Meal, FoodItem


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name',
                  'email', 'date_of_birth', 'avatar',
                  'role', 'height', 'weight', 'health_goals']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def create(self, validated_data):
        data = validated_data.copy()
        user = User(**data)
        user.set_password(data['password'])
        user.save()

        return user


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
                 'daily_protein','daily_carbs','daily_fats','user']

class NutritionPlanSerializer(ModelSerializer):
    class Meta:
        model = NutritionPlan
        fields =['id','name','date','total_calories',
                 'total_protein','total_carbs','total_fats',
                 'user','meals']

class MealSerializer(ModelSerializer):
    class Meta:
        model = Meal
        fields =['id','name']

class FoodItemSerializer(ModelSerializer):
    class Meta:
        model = FoodItem
        fields =['id','name','unit','calories',
                 'protein','carbs','fats', 'quantity'
                 ]
from rest_framework.serializers import ModelSerializer
from HealthcareApp.models import User, WorkoutSession, Exercise, MuscleGroup, Diary, \
    Reminder, Conversation, Message, NutritionGoal, NutritionPlan


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
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
        fields = '__all__'

class WorkoutSessionSerializer(ModelSerializer):
    exercise = ExerciseSerializer(many=True)
    class Meta:
        model = WorkoutSession
        fields ='__all__'

class DiarySerializer(ModelSerializer):
    class Meta:
        model = Diary
        fields ='__all__'

class ReminderSerializer(ModelSerializer):
    class Meta:
        model = Reminder
        fields ='__all__'

class ConversationSerializer(ModelSerializer):
    class Meta:
        model = Conversation
        fields ='__all__'

class MessageSerializer(ModelSerializer):
    class Meta:
        model = Message
        fields ='__all__'

class NutritionGoalSerializer(ModelSerializer):
    class Meta:
        model = NutritionGoal
        fields ='__all__'

class NutritionPlanSerializer(ModelSerializer):
    class Meta:
        model = NutritionPlan
        fields ='__all__'
from django.db import models
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField
from enum import Enum


# Create your models here.

class Role(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    USER = 'user', 'User'
    EXPERT = 'expert', 'Expert'
    COACH = 'coach', 'Coach'

class HealthGoals(models.TextChoices):
    BUILD_MUSCLE = 'Build muscle', 'Build Muscle'
    LOSE_WEIGHT = 'Lose weight', 'Lose Weight'
    MAINTAIN_HEALTH = 'maintain health', 'Maintain Health'

class ReminderType(models.TextChoices):
    DRINKING_WATER = 'drinking water', 'Drinking Water'
    EXERCISING = 'exercising', 'Exercising'
    RESTING = 'resting', 'Resting'

class BaseModel(models.Model):
    is_active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class User(AbstractUser):
    avatar = CloudinaryField(null=True, blank=True,
                             folder='user_avatar',
                             )
    role = models.CharField(max_length=50, choices=[(role.name, role.value) for role in Role], default=Role.USER.value)
    date_of_birth= models.DateField(null=True)
    height = models.FloatField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    health_goals = models.CharField(max_length=50, choices=[(goal.name, goal.value) for goal in HealthGoals], default=HealthGoals.MAINTAIN_HEALTH.value)

class WorkoutSession(BaseModel):
    schedule = models.DateTimeField(default=None)
    name = models.CharField(max_length=200, default=None)
    goal = models.CharField(max_length=200,null=True, blank=True)
    total_duration = models.IntegerField(default=None)
    exercise = models.ManyToManyField('Exercise',
                                 related_name='workout_sessions')
    bpm =models.IntegerField(null=True, blank=True)
    steps = models.IntegerField(null=True, blank=True)
    calories_burned = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name

class Exercise(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(default=None)
    muscle_groups = models.ManyToManyField('MuscleGroup')
    difficulty_level = models.CharField(max_length=50)
    equipment = models.CharField(max_length=100, blank=True, null=True)
    duration = models.IntegerField(help_text="Duration in minutes")
    repetition = models.IntegerField(null=True, blank=True)
    sets = models.IntegerField(null=True, blank=True)
    calories_burned = models.FloatField(default=None)
    rating = models.FloatField(default=None)

    def __str__(self):
        return self.name

class MuscleGroup(BaseModel):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Diary(BaseModel):
    name = models.CharField(max_length=255, default=None)
    content = models.TextField(default=None)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='diaries'
    )
    workout_session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.SET_NULL,null=True, blank=True,
        related_name='diaries'
    )

    def __str__(self):
        return self.name

class Reminder(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True)
    time = models.DateTimeField(default=None)
    repeat = models.BooleanField(default=1)
    reminder_type = models.CharField(max_length=50, choices=[(rt.name, rt.value) for rt in ReminderType])
    user = models.ForeignKey(User,
                             on_delete=models.CASCADE,
                             related_name='reminders',
                             related_query_name='my_reminder')

    def __str__(self):
        return self.name

class Conversation(BaseModel):
    name = models.CharField(max_length=100,default=None)
    sender_1 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='conversations_sent_by_1'
    )
    sender_2 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='conversations_sent_by_2'
    )
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['sender_1', 'sender_2'], name='unique_conversation'
            ),
            models.CheckConstraint(
                check=models.Q(sender_1__lt=models.F('sender_2')),
                name='check_sender_order'
            )
        ]

    def __str__(self):
        return self.name

class Message(BaseModel):
    name = models.CharField(max_length=100, default='Message')
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    content = models.TextField(default=None)
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='messages_sent'
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='messages_received'
    )
    time_stamp = models.DateTimeField(null=True, auto_now_add=True)

    def __str__(self):
        return self.name

class NutritionGoal(BaseModel):
    name= models.CharField(max_length=100, default=None)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='nutrition_goals'
    )
    date = models.DateTimeField(null=True)
    daily_calories = models.FloatField(default=None)
    daily_proteins = models.FloatField(default=None)
    daily_carbs = models.FloatField(default=None)
    daily_fats = models.FloatField(default=None)

    def __str__(self):
        return self.name

class NutritionPlan(BaseModel):
    name= models.CharField(max_length=100, default=None)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name= 'nutrition_plans'
    )
    date = models.DateField(null=True)
    total_calories = models.FloatField(default=None)
    total_proteins = models.FloatField(default=None)
    total_carbs = models.FloatField(default=None)
    total_fats = models.FloatField(default=None)
    meals = models.ManyToManyField(
        'Meal',
        related_name='nutrition_plans'
    )
    def __str__(self):
        return self.name

class Meal(BaseModel):
    name = models.CharField(max_length=100)
    food_items = models.ManyToManyField(
        'FoodItem',
        related_name='meals'
    )

    def __str__(self):
        return self.name

class FoodItem(BaseModel):
    name = models.CharField(max_length=100)
    calories = models.FloatField(default=None)
    proteins = models.FloatField(default=None)
    carbs = models.FloatField(default=None)
    fats = models.FloatField(default=None)
    quantities = models.IntegerField(default=None)
    unit = models.CharField(max_length=40)
    def __str__(self):
        return self.name





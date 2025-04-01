from django.contrib import admin
from .models import (Conversation, Diary, Exercise,
                     FoodItem, Meal, Message,
                     MuscleGroup, NutritionGoal,
                     NutritionPlan, Reminder, WorkoutSession)
# Register your models here.

class BaseAdmin(admin.ModelAdmin):
    list_display = ['id','name','created_date']
    list_filter = ['created_date']
    search_fields = ['name']

class ExerciseAdmin(BaseAdmin):
    pass

admin.site.register(Conversation)
admin.site.register(Diary)
admin.site.register(Exercise, ExerciseAdmin)
admin.site.register(FoodItem)
admin.site.register(Meal)
admin.site.register(Message)
admin.site.register(MuscleGroup)
admin.site.register(NutritionGoal)
admin.site.register(NutritionPlan)
admin.site.register(Reminder)
admin.site.register(WorkoutSession)

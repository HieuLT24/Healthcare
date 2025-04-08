from django.contrib import admin
from .models import (Conversation, Diary, Exercise,
                     FoodItem, Meal, Message,
                     MuscleGroup, NutritionGoal,
                     NutritionPlan, Reminder, WorkoutSession,User)

class CourseAppAdminSite(admin.AdminSite):
    site_header = 'Hệ thống kiểm tra sức khỏe'
admin_site = CourseAppAdminSite(name='myadmin')

# Register your models here.

class BaseAdmin(admin.ModelAdmin):
    list_display = ['id','name','created_date']
    list_filter = ['created_date']
    search_fields = ['name']

class ExerciseAdmin(BaseAdmin):
    pass

class UserAdmin(BaseAdmin):
    pass

admin_site.register(Conversation)
admin_site.register(Diary)
admin_site.register(Exercise, ExerciseAdmin)
admin_site.register(FoodItem)
admin_site.register(Meal)
admin_site.register(Message)
admin_site.register(MuscleGroup)
admin_site.register(NutritionGoal)
admin_site.register(NutritionPlan)
admin_site.register(Reminder)
admin_site.register(WorkoutSession)
admin_site.register(User)

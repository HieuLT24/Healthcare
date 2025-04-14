from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .forms import CustomUserCreationForm
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

class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'date_of_birth', 'first_name', 'last_name', 'avatar','is_staff', 'is_superuser'),
        }),
    )

    fieldsets = (
    (None, {'fields': ('username', 'password')}),
    ('Thông tin cá nhân', {'fields': ('date_of_birth', 'first_name', 'last_name', 'avatar')}),
    ('Phân quyền', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )

    list_display = ['id', 'username', 'first_name', 'last_name', 'email']
    list_filter = ['date_joined']

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
admin_site.register(User, UserAdmin)

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .utils import summarize_nutrition
from .forms import CustomUserCreationForm
from .models import (Diary, Exercise,
                     FoodItem, Meal,
                     MuscleGroup, NutritionGoal,
                     NutritionPlan, WorkoutSession, User)
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
class CourseAppAdminSite(admin.AdminSite):
    site_header = 'Hệ thống kiểm tra sức khỏe'
    site_title = 'Trang Quản Trị'


admin_site = CourseAppAdminSite(name='myadmin')


class BaseAdmin(admin.ModelAdmin):
    search_fields = ['name']


class ExerciseAdmin(BaseAdmin):
    list_display = ['id', 'name', 'difficulty_level', 'rating']
    list_filter = ['difficulty_level']


class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    model = User

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'date_of_birth', 'first_name', 'last_name', 'avatar',
                'is_staff', 'is_superuser'
            ),
        }),
    )

    fieldsets = (
        ('Thông tin tài khoản', {'fields': ('username', 'email', 'password')}),
        ('Thông tin cá nhân', {'fields': ('first_name', 'last_name', 'date_of_birth', 'avatar')}),
        ('Phân quyền', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Các mốc thời gian', {'fields': ('last_login', 'date_joined')}),
    )

    list_display = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)


class FoodItemAdmin(BaseAdmin):
    pass


class ConversationAdmin(BaseAdmin):
    pass


class DiaryAdmin(BaseAdmin):
    pass


class MealAdmin(BaseAdmin):
    readonly_fields = ('nutritional_summary',)

    def nutritional_summary(self, obj):
        summary = summarize_nutrition(obj.food_items.all())

        return format_html(
            "<ul>"
            "<li><strong>Total Calories:</strong> {} kcal</li>"
            "<li><strong>Total Carbs:</strong> {} g</li>"
            "<li><strong>Total Proteins:</strong> {} g</li>"
            "<li><strong>Total Fats:</strong> {} g</li>"
            "<li><strong>Total Quantities:</strong> {} g</li>"
            "</ul>",
            summary['calories'],
            summary['carbs'],
            summary['proteins'],
            summary['fats'],
            summary['quantities']
        )

    fieldsets = (
        ('Food items', {'fields': ('name','food_items',)}),
        ('Total Nutrition', {'fields': ('nutritional_summary',)})
    )


class NutritionPlanAdmin(BaseAdmin):
    readonly_fields = ('total_calories', 'total_carbs', 'total_proteins', 'total_fats')

class MessageAdmin(BaseAdmin):
    pass


class MuscleGroupAdmin(BaseAdmin):
    pass


class NutritionGoalAdmin(BaseAdmin):
    pass


class ReminderAdmin(BaseAdmin):
    pass


class WorkoutSessionAdmin(BaseAdmin):
    pass

admin_site.register(SocialApp)
admin_site.register(Site)
admin_site.register(Diary, DiaryAdmin)
admin_site.register(Exercise, ExerciseAdmin)
admin_site.register(FoodItem, FoodItemAdmin)
admin_site.register(Meal, MealAdmin)
admin_site.register(MuscleGroup, MuscleGroupAdmin)
admin_site.register(NutritionGoal, NutritionGoalAdmin)
admin_site.register(NutritionPlan, NutritionPlanAdmin)
admin_site.register(WorkoutSession, WorkoutSessionAdmin)
admin_site.register(User, UserAdmin)

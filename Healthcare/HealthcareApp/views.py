from datetime import timedelta, datetime, date

from allauth.headless.base.views import APIView
from django.db.models import Sum, Q, Avg, Max, Min
from rest_framework import (mixins, viewsets,
                            permissions, generics, parsers,
                            status, request)
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.exceptions import MethodNotAllowed, PermissionDenied
from drf_yasg.utils import swagger_auto_schema
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from HealthcareApp import serializers
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter

from HealthcareApp.models import User, Exercise, WorkoutSession, Diary, Reminder, Message, Conversation, NutritionGoal, \
    NutritionPlan, MuscleGroup, ReminderType, HealthGoals, Role, Meal, FoodItem, HealthStat
from django.http import HttpResponse

from collections import defaultdict
import calendar
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.utils.timezone import now

from HealthcareApp.serializers import HealthStatSerializer, WorkoutSessionWriteSerializer, WorkoutSessionReadSerializer, \
    ExerciseSerializer, NutritionGoalSerializer


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

class UserViewSet(viewsets.ViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

    @action(methods=['patch', 'get'], url_path="current-user",
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

class UserInforViewSet(viewsets.ViewSet,generics.UpdateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserInforSerializer



class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.filter(is_active=True)
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        type_filter = self.request.query_params.get('type')
        if type_filter == 'personal':
            return Exercise.objects.filter(created_by=user, is_active=True)
        elif type_filter == 'suggested':
            return Exercise.objects.filter(created_by__isnull=True, is_active=True)
        return Exercise.objects.filter(
            Q(created_by=user) | Q(created_by__isnull=True),
            is_active=True
        )


class WorkoutSessionReadViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user, is_active=True)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WorkoutSessionWriteSerializer
        return WorkoutSessionReadSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DiaryViewSet(viewsets.ModelViewSet):
    queryset = Diary.objects.filter(is_active=True)
    serializer_class = serializers.DiarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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

class PersonalStatisticView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.WorkoutSessionReadSerializer

    def get(self, request):
        period = request.query_params.get('period', 'weekly')
        today = now().date()
        
        if period == 'weekly':
            week_param = request.query_params.get('week')
            
            if week_param:
                try:
                    # Format should be YYYY-Wnn
                    year_str, week_str = week_param.split('-W')
                    year = int(year_str)
                    week = int(week_str)
                    
                    # Tính ngày đầu tiên của tuần (thứ 2)
                    first_day = datetime(year, 1, 1).date()
                    
                    # Ngày đầu tiên của tuần đầu tiên của năm (ngày thứ 2 đầu tiên)
                    if first_day.weekday() > 0:  # Không phải thứ 2
                        first_day = first_day - timedelta(days=first_day.weekday())
                        first_day = first_day + timedelta(days=7)  # Đến thứ 2 tuần sau
                    
                    # Tính ngày đầu tiên của tuần được chọn
                    start_date = first_day + timedelta(weeks=week-1)
                    end_date = start_date + timedelta(days=6)  # 7 ngày từ ngày bắt đầu
                    
                except (ValueError, TypeError):
                    return Response({'error': 'Invalid week format. Use YYYY-Wnn'}, status=400)
            else:
                # Default to current week if no week specified
                start_date = today - timedelta(days=today.weekday())  # Thứ 2 của tuần hiện tại
                end_date = min(start_date + timedelta(days=6), today)  # Chủ nhật hoặc hôm nay, tùy cái nào sớm hơn
                
            date_range = [start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)]
            
        elif period == 'monthly':
            month_param = request.query_params.get('month')
            
            if month_param:
                try:
                    year, month = map(int, month_param.split('-'))
                    start_date = datetime(year, month, 1).date()
                    
                    _, last_day = calendar.monthrange(year, month)
                    end_date = datetime(year, month, last_day).date()
                    
                    # Nếu là tháng hiện tại, end_date là hôm nay
                    if year == today.year and month == today.month:
                        end_date = min(end_date, today)
                except (ValueError, TypeError):
                    return Response({'error': 'Invalid month format. Use YYYY-MM'}, status=400)
            else:
                # Tháng hiện tại
                start_date = today.replace(day=1)  # Ngày đầu tiên của tháng
                _, last_day = calendar.monthrange(today.year, today.month)
                end_date = min(today.replace(day=last_day), today)  # Ngày cuối cùng của tháng hoặc hôm nay
                
            date_range = [start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)]
            
        elif period == 'yearly':
            year_param = request.query_params.get('year')
            
            if year_param:
                try:
                    year = int(year_param)
                    start_date = datetime(year, 1, 1).date()
                    
                    if year == today.year:
                        # Nếu là năm hiện tại, end_date là hôm nay
                        end_date = today
                    else:
                        end_date = datetime(year, 12, 31).date()
                except (ValueError, TypeError):
                    return Response({'error': 'Invalid year format. Use YYYY'}, status=400)
            else:
                # Năm hiện tại
                start_date = datetime(today.year, 1, 1).date()
                end_date = today
                
            # For yearly, we'll return monthly statistics
            date_range = []
            year = start_date.year
            for month in range(1, 13):
                # Chỉ tính đến tháng hiện tại nếu đang trong năm hiện tại
                if year == today.year and month > today.month:
                    break
                date_range.append(datetime(year, month, 1).date())
        else:
            return Response({'error': 'Invalid period. Use weekly, monthly, or yearly'}, status=400)

        # Lấy dữ liệu tập luyện
        workout_sessions = WorkoutSession.objects.filter(
            user=request.user,
            updated_date__date__range=(start_date, end_date),
        )
        
        # Lấy dữ liệu sức khỏe
        health_stats = HealthStat.objects.filter(
            user=request.user,
            date__range=(start_date, end_date),
        ).order_by('date')
        
        # Tính toán dữ liệu workout
        if period == 'yearly':
            # Nhóm dữ liệu theo tháng
            monthly_stats = workout_sessions.annotate(
                month=TruncMonth('updated_date')
            ).values('month').annotate(
                calories_burned_sum=Sum('calories_burned'),
                total_duration_sum=Sum('total_duration')
            )
            
            # Dữ liệu theo tháng
            calories_per_month = defaultdict(int)
            time_per_month = defaultdict(int)
            
            for entry in monthly_stats:
                month = entry['month'].date().replace(day=1)
                calories_per_month[month] = entry['calories_burned_sum'] or 0
                time_per_month[month] = entry['total_duration_sum'] or 0
                
            # Tạo mảng kết quả theo đúng thứ tự tháng
            calories_array = [calories_per_month[d] for d in date_range]
            time_array = [time_per_month[d] for d in date_range]
            
            # Tính toán chỉ số sức khỏe theo tháng
            monthly_health = {}
            for month in range(1, 13):
                month_start = datetime(year, month, 1).date()
                _, last_day = calendar.monthrange(year, month)
                month_end = datetime(year, month, last_day).date()
                
                month_stats = health_stats.filter(date__range=(month_start, month_end))
                if month_stats.exists():
                    monthly_health[month] = {
                        'avg_weight': month_stats.aggregate(Avg('weight'))['weight__avg'],
                        'avg_bmi': month_stats.aggregate(Avg('bmi'))['bmi__avg'],
                        'avg_water_intake': month_stats.aggregate(Avg('water_intake'))['water_intake__avg'],
                        'avg_step_count': month_stats.aggregate(Avg('step_count'))['step_count__avg'],
                        'avg_heart_rate': month_stats.aggregate(Avg('heart_rate'))['heart_rate__avg'],
                    }
                else:
                    monthly_health[month] = {
                        'avg_weight': None,
                        'avg_bmi': None,
                        'avg_water_intake': None,
                        'avg_step_count': None,
                        'avg_heart_rate': None,
                    }
            
            # Chuyển đổi thành mảng cho từng chỉ số
            weight_array = [monthly_health[month]['avg_weight'] for month in range(1, 13)]
            bmi_array = [monthly_health[month]['avg_bmi'] for month in range(1, 13)]
            water_array = [monthly_health[month]['avg_water_intake'] for month in range(1, 13)]
            steps_array = [monthly_health[month]['avg_step_count'] for month in range(1, 13)]
            heart_rate_array = [monthly_health[month]['avg_heart_rate'] for month in range(1, 13)]
        else:
            # Nhóm dữ liệu theo ngày
            daily_stats = workout_sessions.annotate(
                date=TruncDate('updated_date')
            ).values('date').annotate(
                calories_burned_sum=Sum('calories_burned'),
                total_duration_sum=Sum('total_duration')
            )
            
            # Dữ liệu theo ngày
            calories_per_day = defaultdict(int)
            time_per_day = defaultdict(int)
            
            for entry in daily_stats:
                date = entry['date']
                calories_per_day[date] = entry['calories_burned_sum'] or 0
                time_per_day[date] = entry['total_duration_sum'] or 0
            
            # Tạo mảng kết quả theo đúng thứ tự ngày
            calories_array = [calories_per_day[d] for d in date_range]
            time_array = [time_per_day[d] for d in date_range]
            
            # Tính toán chỉ số sức khỏe theo ngày
            daily_health = {}
            for date in date_range:
                day_stats = health_stats.filter(date=date)
                if day_stats.exists():
                    latest_stat = day_stats.latest('id')
                    daily_health[date] = {
                        'weight': latest_stat.weight,
                        'bmi': latest_stat.bmi,
                        'water_intake': latest_stat.water_intake,
                        'step_count': latest_stat.step_count,
                        'heart_rate': latest_stat.heart_rate,
                    }
                else:
                    daily_health[date] = {
                        'weight': None,
                        'bmi': None,
                        'water_intake': None,
                        'step_count': None,
                        'heart_rate': None,
                    }
            
            # Chuyển đổi thành mảng cho từng chỉ số
            weight_array = [daily_health[d]['weight'] for d in date_range]
            bmi_array = [daily_health[d]['bmi'] for d in date_range]
            water_array = [daily_health[d]['water_intake'] for d in date_range]
            steps_array = [daily_health[d]['step_count'] for d in date_range]
            heart_rate_array = [daily_health[d]['heart_rate'] for d in date_range]
            
        # Tính các giá trị tổng hợp
        health_summary = {
            'avg_weight': health_stats.aggregate(Avg('weight'))['weight__avg'],
            'avg_bmi': health_stats.aggregate(Avg('bmi'))['bmi__avg'],
            'avg_water_intake': health_stats.aggregate(Avg('water_intake'))['water_intake__avg'],
            'avg_step_count': health_stats.aggregate(Avg('step_count'))['step_count__avg'],
            'avg_heart_rate': health_stats.aggregate(Avg('heart_rate'))['heart_rate__avg'],
        }
        
        # Tính sự thay đổi cân nặng trong kỳ
        weight_change = None
        if health_stats.exists() and health_stats.count() > 1:
            earliest = health_stats.earliest('date')
            latest = health_stats.latest('date')
            if earliest.weight and latest.weight:
                weight_change = latest.weight - earliest.weight
        
        return Response({
            'start_date': start_date,
            'end_date': end_date,
            'period': period,
            # Dữ liệu tập luyện
            'total_calories_burned': calories_array,
            'total_time': time_array,
            'total_sessions': workout_sessions.count(),
            # Dữ liệu sức khỏe
            'weight_data': weight_array,
            'bmi_data': bmi_array,
            'water_intake_data': water_array,
            'step_count_data': steps_array,
            'heart_rate_data': heart_rate_array,
            # Thống kê tổng hợp
            'health_summary': health_summary,
            'weight_change': weight_change
        })

class HealthStatViewSet(viewsets.ModelViewSet):
    serializer_class = HealthStatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HealthStat.objects.filter(user=self.request.user).order_by('-date')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Tính trung bìinhf giá trị
        user_stats = HealthStat.objects.filter(user=self.request.user).order_by('-date').first()
        
        # Nếu có bản ghi
        if user_stats:
            avg_water_intake = round(user_stats.water_intake, 2)
            avg_step_count = int(user_stats.step_count)
            avg_heart_rate = user_stats.heart_rate
        else:
            avg_water_intake = 0
            avg_step_count = 0
            avg_heart_rate = None
        
        # Serialize the data
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        for item in data:
            item['water_intake'] = avg_water_intake
            item['step_count'] = avg_step_count
            item['heart_rate'] = avg_heart_rate
        
        return Response(data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Thay vì cập nhật vào bản ghi hiện tại, tạo bản ghi mới
        new_data = {
            'user': request.user.id,
            'water_intake': request.data.get('water_intake', instance.water_intake),
            'step_count': request.data.get('step_count', instance.step_count),
            'heart_rate': request.data.get('heart_rate', instance.heart_rate),
            'weight': request.data.get('weight', instance.weight),
            'height': request.data.get('height', instance.height),
        }
        
        serializer = self.get_serializer(data=new_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    @action(detail=False, methods=['get'], url_path='track-changes')
    def track_changes(self, request):
        """
        Theo dõi sự thay đổi cân nặng, chiều cao theo thời gian (tuần, tháng, năm)
        """
        period = request.query_params.get('period', 'weekly')
        today = now().date()
        
        # Xác định khoảng thời gian dựa trên period
        try:
            period_data = self._get_period_dates(period, request, today)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
            
        start_date = period_data['start_date']
        end_date = period_data['end_date']
        
        # Lấy dữ liệu và tính toán thay đổi
        result = self._calculate_changes_from_records(request.user, start_date, end_date)
        
        # Tạo dữ liệu trả về
        data = {
            'period': period,
            'start_date': start_date,
            'end_date': end_date,
            'first_record': result['first_record'],
            'last_record': result['last_record'],
            'changes': result['changes']
        }
        
        # Thêm trường year cho period yearly
        if period == 'yearly' and 'year' in period_data:
            data['year'] = period_data['year']
        
        return Response(data)
    
    def _get_period_dates(self, period, request, today):
        """
        Xác định ngày bắt đầu và kết thúc dựa trên period và tham số
        """
        if period == 'weekly':
            week_param = request.query_params.get('week')
            if week_param:
                try:
                    # Format: YYYY-Wnn
                    year_str, week_str = week_param.split('-W')
                    year = int(year_str)
                    week = int(week_str)
                    
                    # Sử dụng thư viện ISO calendar để tính chính xác tuần
                    # Tìm ngày đầu tiên (thứ Hai) của tuần
                    # Đầu tiên, lấy một ngày bất kỳ trong tuần cần tìm
                    jan4 = date(year, 1, 4)  # Ngày 4/1 luôn nằm trong tuần đầu tiên của năm theo ISO
                    jan4_week = jan4.isocalendar()[1]  # Lấy số tuần của ngày 4/1
                    
                    # Tính số ngày cần thêm/bớt để đến tuần cần tìm
                    days_delta = (week - jan4_week) * 7
                    
                    # Tìm một ngày trong tuần cần tìm
                    sample_day = jan4 + timedelta(days=days_delta)
                    
                    # Tìm thứ Hai của tuần đó
                    start_date = sample_day - timedelta(days=sample_day.weekday())
                    end_date = start_date + timedelta(days=6)
                    
                    # Nếu là tuần hiện tại, end_date là hôm nay
                    if start_date <= today <= end_date:
                        end_date = today
                except (ValueError, TypeError):
                    raise ValueError('Invalid week format. Use YYYY-Wnn')
            else:
                # Default to current week if no week specified
                start_date = today - timedelta(days=today.weekday())  # Thứ 2 của tuần hiện tại
                end_date = min(start_date + timedelta(days=6), today)  # Chủ nhật hoặc hôm nay, tùy cái nào sớm hơn
            
            return {
                'start_date': start_date,
                'end_date': end_date
            }
            
        elif period == 'monthly':
            month_param = request.query_params.get('month')
            if month_param:
                try:
                    year, month = map(int, month_param.split('-'))
                    start_date = datetime(year, month, 1).date()
                    
                    _, last_day = calendar.monthrange(year, month)
                    end_date = datetime(year, month, last_day).date()
                    
                    # Nếu là tháng hiện tại, end_date là hôm nay
                    if year == today.year and month == today.month:
                        end_date = min(end_date, today)
                except (ValueError, TypeError):
                    raise ValueError('Invalid month format. Use YYYY-MM')
            else:
                # Tháng hiện tại
                start_date = today.replace(day=1)  # Ngày đầu tiên của tháng
                _, last_day = calendar.monthrange(today.year, today.month)
                end_date = min(today.replace(day=last_day), today)  # Ngày cuối cùng của tháng hoặc hôm nay
                
            return {
                'start_date': start_date,
                'end_date': end_date
            }
            
        elif period == 'yearly':
            year_param = request.query_params.get('year')
            if year_param:
                try:
                    year = int(year_param)
                    start_date = datetime(year, 1, 1).date()
                    
                    if year == today.year:
                        # Nếu là năm hiện tại, end_date là hôm nay
                        end_date = today
                    else:
                        end_date = datetime(year, 12, 31).date()
                except (ValueError, TypeError):
                    raise ValueError('Invalid year format. Use YYYY')
            else:
                # Năm hiện tại
                year = today.year
                start_date = datetime(year, 1, 1).date()
                end_date = today
                
            return {
                'start_date': start_date,
                'end_date': end_date,
                'year': year
            }
        else:
            raise ValueError('Invalid period. Use weekly, monthly, or yearly')
    
    def _calculate_changes_from_records(self, user, start_date, end_date):
        """
        Lấy bản ghi đầu tiên và cuối cùng, tính toán thay đổi
        """
        # Lấy bản ghi đầu tiên - sắp xếp theo ngày tăng dần, lấy bản ghi sớm nhất
        first_records = HealthStat.objects.filter(
            user=user,
            date__range=(start_date, end_date)
        ).order_by('date')
        
        first_record = None
        if first_records.exists():
            # Lấy ngày đầu tiên có bản ghi
            first_date = first_records.first().date
            # Lấy bản ghi đầu tiên của ngày đầu tiên
            first_record = HealthStat.objects.filter(
                user=user,
                date=first_date
            ).order_by('id').first()
        
        # Lấy bản ghi cuối cùng - sắp xếp theo ngày giảm dần và ID giảm dần
        # Để lấy bản ghi mới nhất (ID lớn nhất) của ngày mới nhất
        last_record = HealthStat.objects.filter(
            user=user,
            date__range=(start_date, end_date)
        ).order_by('-date', '-id').first()
        
        # Tính sự thay đổi nếu có cả hai bản ghi
        changes = {
            'weight_change': None,
            'height_change': None
        }
        
        if first_record and last_record and first_record.id != last_record.id:
            if first_record.weight is not None and last_record.weight is not None:
                changes['weight_change'] = round(last_record.weight - first_record.weight, 2)
            
            if first_record.height is not None and last_record.height is not None:
                changes['height_change'] = round(last_record.height - first_record.height, 2)
        
        return {
            'first_record': {
                'date': first_record.date if first_record else None,
                'weight': first_record.weight if first_record else None,
                'height': first_record.height if first_record else None
            } if first_record else None,
            'last_record': {
                'date': last_record.date if last_record else None,
                'weight': last_record.weight if last_record else None,
                'height': last_record.height if last_record else None,
                'id': last_record.id if last_record else None  # Thêm ID để dễ debug
            } if last_record else None,
            'changes': changes
        }
from datetime import timedelta, datetime, date
from django.utils import timezone

from allauth.headless.base.views import APIView
from django.contrib.auth import get_user_model
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
from rest_framework.decorators import action
from rest_framework.response import Response
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter

from HealthcareApp.models import User, Exercise, WorkoutSession, Diary, NutritionGoal, \
    NutritionPlan, Role, Meal, FoodItem, HealthStat, MuscleGroup
from django.http import HttpResponse

from collections import defaultdict
import calendar
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.utils.timezone import now

from HealthcareApp.serializers import HealthStatSerializer, WorkoutSessionWriteSerializer, WorkoutSessionReadSerializer, \
    ExerciseSerializer, NutritionGoalSerializer, UserInforSerializer, MuscleGroupSerializer

from django.db import models
from drf_yasg import openapi


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

class UserInforViewSet(viewsets.ViewSet, generics.UpdateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserInforSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Chỉ cho phép người dùng hiện tại
        return self.queryset.filter(id=self.request.user.id)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class HealthStatViewSet(viewsets.ModelViewSet):
    serializer_class = HealthStatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HealthStat.objects.filter(user=self.request.user).order_by('-date', '-id')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class HieuUserInforViewSet(viewsets.ViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.HieuUserInforSerializer
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Lấy danh sách người dùng",
        manual_parameters=[
            openapi.Parameter(
                'search',
                openapi.IN_QUERY,
                description="Tìm kiếm theo tên (first_name, last_name, username)",
                type=openapi.TYPE_STRING
            )
        ]
    )
    def list(self, request):
        """
        Lấy danh sách tất cả người dùng có role là user
        """
        queryset = self.queryset

        # Tìm kiếm theo tên
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(username__icontains=search)
            )

        # Sắp xếp theo ngày tham gia
        queryset = queryset.order_by('-date_joined')

        serializer = self.serializer_class(queryset, many=True, context={'request': request})
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })

    @swagger_auto_schema(
        operation_description="Lấy thông tin chi tiết của một người dùng"
    )
    def retrieve(self, request, pk=None):
        """
        Lấy thông tin chi tiết của một người dùng
        """
        try:
            user = User.objects.get(pk=pk, is_active=True)
            serializer = self.serializer_class(user, context={'request': request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy người dùng hoặc người dùng không'},
                status=status.HTTP_404_NOT_FOUND
            )


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.filter(is_active=True)
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]

    # Giới hạn các phương thức được hỗ trợ
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

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

class MuscleGroupViewSet(viewsets.ReadOnlyModelViewSet):  # chỉ GET
    queryset = MuscleGroup.objects.filter(is_active=True)
    serializer_class = MuscleGroupSerializer

class WorkoutSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user, is_active=True)

    def get_serializer_class(self):
        if self.action == 'create':
            return WorkoutSessionWriteSerializer
        return WorkoutSessionReadSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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

    @swagger_auto_schema(
        operation_description="Lấy thống kê cá nhân hoặc của khách hàng (cho chuyên gia/huấn luyện viên)",
        manual_parameters=[
            openapi.Parameter(
                'user_id',
                openapi.IN_QUERY,
                description="ID của người dùng cần xem thống kê (chỉ dành cho chuyên gia/huấn luyện viên)",
                type=openapi.TYPE_INTEGER,
                required=False
            ),
            openapi.Parameter(
                'period',
                openapi.IN_QUERY,
                description="Khoảng thời gian thống kê",
                type=openapi.TYPE_STRING,
                enum=['weekly', 'monthly', 'yearly'],
                default='weekly'
            ),
            openapi.Parameter(
                'week',
                openapi.IN_QUERY,
                description="Tuần cụ thể (format: YYYY-Wnn, ví dụ: 2024-W01)",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                'month',
                openapi.IN_QUERY,
                description="Tháng cụ thể (format: YYYY-MM, ví dụ: 2024-01)",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                'year',
                openapi.IN_QUERY,
                description="Năm cụ thể (format: YYYY, ví dụ: 2024)",
                type=openapi.TYPE_STRING,
                required=False
            )
        ]
    )
    def get(self, request):
        # Lấy user_id từ query params (optional)
        user_id = request.query_params.get('user_id')

        # Xác định target_user
        if user_id:
            # Kiểm tra quyền: chỉ EXPERT hoặc COACH mới được xem thống kê của user khác
            if request.user.role not in [Role.EXPERT.value, Role.COACH.value]:
                return Response(
                    {'error': 'Bạn không có quyền xem thống kê của người dùng khác'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Kiểm tra user_id có tồn tại không
            try:
                target_user = User.objects.get(id=user_id, is_active=True)
            except User.DoesNotExist:
                return Response(
                    {'error': 'Không tìm thấy người dùng'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Nếu không có user_id, xem thống kê của chính mình
            target_user = request.user

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

        # Lấy dữ liệu tập luyện - sử dụng target_user thay vì request.user
        workout_sessions = WorkoutSession.objects.filter(
            user=target_user,
            updated_date__date__range=(start_date, end_date),
        )
        
        # Lấy dữ liệu sức khỏe - sử dụng target_user thay vì request.user
        health_stats = HealthStat.objects.filter(
            user=target_user,
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
            'target_user': {
                'id': target_user.id,
                'username': target_user.username,
                'full_name': f"{target_user.first_name} {target_user.last_name}".strip(),
                'role': target_user.role
            },
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

class HealthStatisticViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.HealthStatisticSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_target_user(self, request):
        """Xác định target user dựa trên user_id parameter"""
        user_id = request.query_params.get('user_id')

        if user_id:
            # Kiểm tra quyền: chỉ EXPERT hoặc COACH mới được xem dữ liệu của user khác
            if request.user.role not in [Role.EXPERT.value, Role.COACH.value]:
                return None, Response(
                    {'error': 'Bạn không có quyền xem dữ liệu của người dùng khác'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Kiểm tra user_id có tồn tại không
            try:
                target_user = User.objects.get(id=user_id, is_active=True)
                return target_user, None
            except User.DoesNotExist:
                return None, Response(
                    {'error': 'Không tìm thấy người dùng'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Nếu không có user_id, xem dữ liệu của chính mình
            return request.user, None

    def get_queryset(self):
        target_user, error_response = self.get_target_user(self.request)
        if error_response:
            return HealthStat.objects.none()
        return HealthStat.objects.filter(user=target_user).order_by('-date')

    @swagger_auto_schema(
        operation_description="Lấy danh sách dữ liệu sức khỏe của bản thân hoặc khách hàng (cho chuyên gia/huấn luyện viên)",
        manual_parameters=[
            openapi.Parameter(
                'user_id',
                openapi.IN_QUERY,
                description="ID của người dùng cần xem dữ liệu (chỉ dành cho chuyên gia/huấn luyện viên)",
                type=openapi.TYPE_INTEGER,
                required=False
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        try:
            target_user, error_response = self.get_target_user(request)
            if error_response:
                return error_response

            # Lấy dữ liệu và sắp xếp theo ngày giảm dần
            queryset = HealthStat.objects.filter(user=target_user).order_by('-date')

            # Lấy bản ghi mới nhất cho các giá trị trung bình
            latest_record = queryset.first()

            # Khởi tạo giá trị mặc định
            avg_water_intake = 0
            avg_step_count = 0
            avg_heart_rate = None

            # Nếu có bản ghi mới nhất, lấy các giá trị từ đó
            if latest_record:
                avg_water_intake = round(latest_record.water_intake, 2) if latest_record.water_intake is not None else 0
                avg_step_count = int(latest_record.step_count) if latest_record.step_count is not None else 0
                avg_heart_rate = latest_record.heart_rate

            # Serialize dữ liệu
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data

            # Thêm các giá trị trung bình vào mỗi item
            for item in data:
                item['water_intake'] = avg_water_intake
                item['step_count'] = avg_step_count
                item['heart_rate'] = avg_heart_rate

            # Tạo response data với thông tin người dùng
            response_data = {
                'target_user': {
                    'id': target_user.id,
                    'username': target_user.username,
                    'full_name': f"{target_user.first_name} {target_user.last_name}".strip(),
                    'role': target_user.role
                },
                'results': data
            }

            return Response(response_data)
        except Exception as e:
            # Log lỗi để debug
            print(f"Error in HealthStatisticViewSet.list: {str(e)}")
            return Response(
                {'error': 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        try:
            target_user, error_response = self.get_target_user(request)
            if error_response:
                return error_response

            # Chỉ cho phép chỉnh sửa dữ liệu của chính mình
            if target_user != request.user:
                return Response(
                    {'error': 'Bạn không có quyền chỉnh sửa dữ liệu của người dùng khác'},
                    status=status.HTTP_403_FORBIDDEN
                )

            instance = self.get_object()

            # Lấy weight và height từ request hoặc instance
            weight = request.data.get('weight', instance.weight)
            height = request.data.get('height', instance.height)

            # Tính BMI nếu có cả weight và height
            bmi = None
            if weight is not None and height is not None and height > 0:
                bmi = round(weight / (height * height), 2)

            # Tạo bản ghi mới với dữ liệu cập nhật
            current_date = timezone.now().date()
            new_data = {
                'user': request.user.id,
                'date': current_date,
                'water_intake': request.data.get('water_intake', instance.water_intake),
                'step_count': request.data.get('step_count', instance.step_count),
                'heart_rate': request.data.get('heart_rate', instance.heart_rate),
                'weight': weight,
                'height': height,
                'bmi': bmi
            }

            serializer = self.get_serializer(data=new_data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error in HealthStatisticViewSet.update: {str(e)}")
            return Response(
                {'error': 'Đã xảy ra lỗi khi cập nhật dữ liệu'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='track-changes')
    def track_changes(self, request):
        """
        Theo dõi sự thay đổi cân nặng, chiều cao theo thời gian (tuần, tháng, năm)
        """
        try:
            target_user, error_response = self.get_target_user(request)
            if error_response:
                return error_response

            period = request.query_params.get('period', 'weekly')
            today = timezone.now().date()

            # Xác định khoảng thời gian dựa trên period
            try:
                period_data = self._get_period_dates(period, request, today)
            except ValueError as e:
                return Response({'error': str(e)}, status=400)

            start_date = period_data['start_date']
            end_date = period_data['end_date']

            # Lấy dữ liệu và tính toán thay đổi
            result = self._calculate_changes_from_records(target_user, start_date, end_date)

            # Tạo dữ liệu trả về
            data = {
                'target_user': {
                    'id': target_user.id,
                    'username': target_user.username,
                    'full_name': f"{target_user.first_name} {target_user.last_name}".strip(),
                    'role': target_user.role
                },
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
        except Exception as e:
            print(f"Error in track_changes: {str(e)}")
            return Response(
                {'error': 'Đã xảy ra lỗi khi theo dõi thay đổi'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

class ExpertCoachListView(generics.ListAPIView):
    """API lấy danh sách chuyên gia và huấn luyện viên"""
    serializer_class = serializers.ExpertCoachSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Lấy danh sách user có role là EXPERT hoặc COACH
        Có thể filter theo role thông qua query parameter
        """
        queryset = User.objects.filter(
            is_active=True,
            role__in=[Role.EXPERT.value, Role.COACH.value]
        ).order_by('-date_joined')

        # Filter theo role cụ thể nếu có
        role_filter = self.request.query_params.get('role', None)
        if role_filter and role_filter in [Role.EXPERT.value, Role.COACH.value]:
            queryset = queryset.filter(role=role_filter)

        # Tìm kiếm theo tên
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(username__icontains=search)
            )

        return queryset

    @swagger_auto_schema(
        operation_description="Lấy danh sách chuyên gia và huấn luyện viên",
        manual_parameters=[
            openapi.Parameter(
                'role',
                openapi.IN_QUERY,
                description="Lọc theo role (expert hoặc coach)",
                type=openapi.TYPE_STRING,
                enum=[Role.EXPERT.value, Role.COACH.value]
            ),
            openapi.Parameter(
                'search',
                openapi.IN_QUERY,
                description="Tìm kiếm theo tên (first_name, last_name, username)",
                type=openapi.TYPE_STRING
            )
        ],
        responses={
            200: openapi.Response(
                description="Danh sách chuyên gia/huấn luyện viên",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'count': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'next': openapi.Schema(type=openapi.TYPE_STRING, nullable=True),
                        'previous': openapi.Schema(type=openapi.TYPE_STRING, nullable=True),
                        'results': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                    'username': openapi.Schema(type=openapi.TYPE_STRING),
                                    'first_name': openapi.Schema(type=openapi.TYPE_STRING),
                                    'last_name': openapi.Schema(type=openapi.TYPE_STRING),
                                    'full_name': openapi.Schema(type=openapi.TYPE_STRING),
                                    'email': openapi.Schema(type=openapi.TYPE_STRING),
                                    'role': openapi.Schema(type=openapi.TYPE_STRING),
                                    'avatar': openapi.Schema(type=openapi.TYPE_STRING),
                                    'avatar_url': openapi.Schema(type=openapi.TYPE_STRING),
                                    'date_of_birth': openapi.Schema(type=openapi.TYPE_STRING, format='date'),
                                    'health_goals': openapi.Schema(type=openapi.TYPE_STRING),
                                    'date_joined': openapi.Schema(type=openapi.TYPE_STRING, format='date-time'),
                                }
                            )
                        )
                    }
                )
            )
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
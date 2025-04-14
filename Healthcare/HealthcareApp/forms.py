from django.contrib.auth.forms import UserCreationForm
from .models import User


# tạo form thêm mới user với các trường mong muốn
class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('username', 'password1', 'password2', 'date_of_birth', 'first_name', 'last_name', 'avatar')
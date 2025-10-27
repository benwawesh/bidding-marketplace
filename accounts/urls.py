from django.urls import path, include
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Authentication
    path('signup/', views.SignUpView.as_view(), name='signup'),
    path('login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='home', http_method_names=['get', 'post']), name='logout'),

    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),

    # REST API endpoints (for React frontend)
    path('api/', include('accounts.api')),
]
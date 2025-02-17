from django.urls import path
from . import views

urlpatterns = [
    path('', views.login, name='login'),  # Home page redirects to login
    path('dashboard/', views.dashboard, name='dashboard'),
    path('map/', views.map_page, name='map'),
]
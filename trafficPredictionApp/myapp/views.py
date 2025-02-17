from django.shortcuts import render

# Create your views here.
def dashboard(request):
    return render(request, 'dashboard.html')

def map_page(request):
    return render(request, 'MapPage.html')

def login(request):
    return render(request, 'login.html')
from django.urls import path
from . import views

urlpatterns = [


    # path('', views.pci_requirements_list, name='pci_requirements_list'),
    path('test/', views.home, name='test_home'),
    path("panel/<str:rid>/", views.panel, name="panel"),
    # path('about/', views.about, name='about'),
    
    # API endpoints
    # path('api/requirements/', views.api_requirements, name='api_requirements'),
    # path('api/requirements/<str:requirement_id>/', views.api_requirement_detail, name='api_requirement_detail'),
]
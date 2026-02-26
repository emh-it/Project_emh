from django.urls import include, path
from . import views
from django.conf import settings
from django.conf.urls.static import static
from ms_identity_web.django.msal_views_and_urls import MsalViews

msal_urlpatterns = MsalViews(settings.MS_IDENTITY_WEB).url_patterns()
urlpatterns = [


    path('', views.index, name='index'),
    # path('', include('core.urls')),  # Include core app URLs
    path('test/', views.test, name='test'),
    path("panel/<str:rid>/", views.panel, name="panel"),
    path("procedure/save/<int:pid>/", views.save_procedure, name="save_procedure"),
    path("procedure/delete-file/<int:pid>/<str:field>/", views.delete_file, name="delete_file"),
    path('microsoft/', include('microsoft_auth.urls'), name='microsoft'),
    path(f'{settings.AAD_CONFIG.django.auth_endpoints.prefix}/', include(msal_urlpatterns)),
    # path("procedure/save/<int:pid>/", views.save_selected_procedure, name="save_selected_procedure"),

    # path('about/', views.about, name='about'),
    
    # API endpoints
    # path('api/requirements/', views.api_requirements, name='api_requirements'),
    # path('api/requirements/<str:requirement_id>/', views.api_requirement_detail, name='api_requirement_detail'),
]  + static (settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
"""
URL configuration for sms_project.
Serves Django REST API and static frontend assets seamlessly.
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # REST API endpoints
    path('api/', include('students.urls')),
    
    # Direct frontend file routing
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('style.css', serve, {'document_root': settings.BASE_DIR, 'path': 'style.css'}),
    path('script.js', serve, {'document_root': settings.BASE_DIR, 'path': 'script.js'}),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])

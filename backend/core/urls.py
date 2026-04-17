from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    PasswordChangeView,
    DashboardStatsView,
    LeaveRequestViewSet,
    AdminLeaveReviewView,
    QueueBookingViewSet,
    QueueSlotAvailabilityView,
    ClassScheduleViewSet,
    RescheduleRequestViewSet,
    LostFoundItemViewSet,
    NotificationViewSet,
    AttendanceViewSet,
    StudentMarkViewSet,
    UserListView,
    AdminUserViewSet,
    AuditLogViewSet,
)

router = DefaultRouter()
router.register(r'leaves', LeaveRequestViewSet, basename='leave')
router.register(r'queue', QueueBookingViewSet, basename='queue')
router.register(r'schedule', ClassScheduleViewSet, basename='schedule')
router.register(r'reschedule', RescheduleRequestViewSet, basename='reschedule')
router.register(r'lost-found', LostFoundItemViewSet, basename='lost-found')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'marks', StudentMarkViewSet, basename='marks')
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')
router.register(r'admin/audit-logs', AuditLogViewSet, basename='admin-audit-logs')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/change-password/', PasswordChangeView.as_view(), name='change-password'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('leaves/<int:pk>/review/', AdminLeaveReviewView.as_view(), name='leave-review'),
    path('queue/slots/', QueueSlotAvailabilityView.as_view(), name='queue-slots'),
    path('', include(router.urls)),
]

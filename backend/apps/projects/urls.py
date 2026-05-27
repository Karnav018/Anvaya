from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.projects.views import (
    BlueprintByProjectView,
    GenerateQuotaView,
    GenerateView,
    ProjectViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register(r"projects", ProjectViewSet, basename="project")

org_scoped = [
    path("", include(router.urls)),
    path("blueprints/<uuid:project_id>", BlueprintByProjectView.as_view()),
    path("generate/quota", GenerateQuotaView.as_view()),
    path("generate/<uuid:project_id>", GenerateView.as_view()),
]

urlpatterns = [
    path("o/<slug:org_slug>/", include(org_scoped)),
]

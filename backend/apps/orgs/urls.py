from django.urls import path

from apps.orgs.views import (
    AcceptInvitationView,
    InvitationDeleteView,
    InvitationListCreateView,
    MemberDetailView,
    MemberListView,
    OrgDetailView,
    OrgListCreateView,
)

# Org-nested resources are exposed under BOTH /orgs/<slug>/... (spec-named)
# AND /o/<slug>/... (matches the project-scope prefix used elsewhere and the
# Week 2 smoke contract). This keeps a single consistent prefix for clients
# that want to namespace everything under /o/<slug>.
urlpatterns = [
    # Top-level org collection
    path("orgs", OrgListCreateView.as_view()),
    # Single-org detail by slug (both prefixes)
    path("orgs/<slug:org_slug>", OrgDetailView.as_view()),
    path("o/<slug:org_slug>", OrgDetailView.as_view()),
    # Members
    path("orgs/<slug:org_slug>/members", MemberListView.as_view()),
    path("o/<slug:org_slug>/members", MemberListView.as_view()),
    path("orgs/<slug:org_slug>/members/<uuid:user_id>", MemberDetailView.as_view()),
    path("o/<slug:org_slug>/members/<uuid:user_id>", MemberDetailView.as_view()),
    # Invitations
    path("orgs/<slug:org_slug>/invitations", InvitationListCreateView.as_view()),
    path("o/<slug:org_slug>/invitations", InvitationListCreateView.as_view()),
    path("orgs/<slug:org_slug>/invitations/<uuid:invitation_id>", InvitationDeleteView.as_view()),
    path("o/<slug:org_slug>/invitations/<uuid:invitation_id>", InvitationDeleteView.as_view()),
    # Accept invitation (top-level, requires authenticated user)
    path("invitations/accept", AcceptInvitationView.as_view()),
]

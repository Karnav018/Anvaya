import hashlib
import secrets
import uuid
from datetime import timedelta

import structlog
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.email import send_email
from apps.common.permissions import HasOrgRole, IsOrgMember
from apps.orgs.models import Invitation, Membership, Organization
from apps.orgs.serializers import (
    InvitationAcceptSerializer,
    InvitationCreateSerializer,
    InvitationResponseSerializer,
    MembershipRoleUpdateSerializer,
    MembershipSerializer,
    OrganizationCreateSerializer,
    OrganizationUpdateSerializer,
)

logger = structlog.get_logger("orgs")


def _unique_slug(base: str) -> str:
    candidate = base or "workspace"
    if len(candidate) > 51:
        candidate = candidate[:51]
    if not Organization.objects.filter(slug=candidate).exists():
        return candidate
    while True:
        suffix = uuid.uuid4().hex[:12]
        attempt = f"{candidate}-{suffix}"
        if not Organization.objects.filter(slug=attempt).exists():
            return attempt


class OrgListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = (
            Membership.objects.select_related("organization")
            .filter(user=request.user)
            .order_by("-organization__created_at")
        )
        payload = [
            {
                "slug": m.organization.slug,
                "name": m.organization.name,
                "role": m.role,
                "plan": m.organization.plan,
            }
            for m in memberships
        ]
        return Response(payload)

    def post(self, request):
        serializer = OrganizationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        name = serializer.validated_data["name"]
        requested_slug = serializer.validated_data.get("slug")
        if requested_slug:
            if Organization.objects.filter(slug=requested_slug).exists():
                return Response(
                    {"detail": "slug_taken"},
                    status=status.HTTP_409_CONFLICT,
                )
            final_slug = requested_slug
        else:
            base = slugify(name) or "workspace"
            final_slug = _unique_slug(base)

        with transaction.atomic():
            org = Organization.objects.create(name=name, slug=final_slug)
            Membership.objects.create(organization=org, user=request.user, role="owner")

        return Response(
            {"id": str(org.id), "slug": org.slug, "name": org.name, "plan": org.plan, "role": "owner"},
            status=status.HTTP_201_CREATED,
        )


class OrgDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOrgMember]

    def get(self, request, org_slug):
        org = get_object_or_404(Organization, slug=org_slug)
        member_count = org.memberships.count()
        return Response(
            {
                "id": str(org.id),
                "slug": org.slug,
                "name": org.name,
                "plan": org.plan,
                "my_role": request.membership.role,
                "member_count": member_count,
                "created_at": org.created_at.isoformat(),
            }
        )

    def patch(self, request, org_slug):
        if request.membership.role != "owner":
            return Response({"detail": "owner_required"}, status=status.HTTP_403_FORBIDDEN)
        org = get_object_or_404(Organization, slug=org_slug)
        serializer = OrganizationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if "slug" in data and data["slug"] != org.slug:
            if Organization.objects.filter(slug=data["slug"]).exists():
                return Response({"detail": "slug_taken"}, status=status.HTTP_409_CONFLICT)
            org.slug = data["slug"]
        if "name" in data:
            org.name = data["name"]
        org.save()
        return Response(
            {
                "id": str(org.id),
                "slug": org.slug,
                "name": org.name,
                "plan": org.plan,
            }
        )

    def delete(self, request, org_slug):
        if request.membership.role != "owner":
            return Response({"detail": "owner_required"}, status=status.HTTP_403_FORBIDDEN)
        org = get_object_or_404(Organization, slug=org_slug)
        org.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MemberListView(APIView):
    permission_classes = [IsAuthenticated, IsOrgMember]

    def get(self, request, org_slug):
        memberships = (
            Membership.objects.select_related("user")
            .filter(organization__slug=org_slug)
            .order_by("created_at")
        )
        return Response(MembershipSerializer(memberships, many=True).data)


class MemberDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOrgMember]

    def _owner_required(self, request):
        return request.membership.role == "owner"

    def _is_only_owner(self, org, user_id):
        return (
            Membership.objects.filter(organization=org, role="owner")
            .exclude(user_id=user_id)
            .count()
            == 0
        )

    def patch(self, request, org_slug, user_id):
        if not self._owner_required(request):
            return Response({"detail": "owner_required"}, status=status.HTTP_403_FORBIDDEN)
        org = get_object_or_404(Organization, slug=org_slug)
        membership = get_object_or_404(Membership, organization=org, user_id=user_id)
        serializer = MembershipRoleUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_role = serializer.validated_data["role"]

        # Guard: can't demote yourself if you're the only owner.
        if (
            membership.user_id == request.user.id
            and membership.role == "owner"
            and new_role != "owner"
            and self._is_only_owner(org, request.user.id)
        ):
            return Response(
                {"detail": "cannot_demote_only_owner"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership.role = new_role
        membership.save(update_fields=["role"])
        return Response(MembershipSerializer(membership).data)

    def delete(self, request, org_slug, user_id):
        org = get_object_or_404(Organization, slug=org_slug)
        membership = get_object_or_404(Membership, organization=org, user_id=user_id)

        # Allow owner OR self-removal
        if not self._owner_required(request) and membership.user_id != request.user.id:
            return Response({"detail": "forbidden"}, status=status.HTTP_403_FORBIDDEN)

        # Guard: can't remove yourself if you're the only owner.
        if (
            membership.user_id == request.user.id
            and membership.role == "owner"
            and self._is_only_owner(org, request.user.id)
        ):
            return Response(
                {"detail": "cannot_remove_only_owner"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InvitationListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsOrgMember]

    def post(self, request, org_slug):
        if request.membership.role != "owner":
            return Response({"detail": "owner_required"}, status=status.HTTP_403_FORBIDDEN)
        serializer = InvitationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        role = serializer.validated_data["role"]
        org = get_object_or_404(Organization, slug=org_slug)

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = timezone.now() + timedelta(days=7)

        invitation = Invitation.objects.create(
            organization=org,
            email=email,
            role=role,
            token_hash=token_hash,
            expires_at=expires_at,
            invited_by=request.user,
        )

        invite_url = f"{settings.FRONTEND_URL}/accept-invite?token={raw_token}"
        context = {
            "inviter_name": request.user.name or request.user.email,
            "org_name": org.name,
            "role": role,
            "invite_url": invite_url,
        }
        try:
            html = render_to_string("email/invitation.html", context)
            text = render_to_string("email/invitation.txt", context)
            send_email(
                to=email,
                subject=f"You're invited to join {org.name} on Anvaya",
                html=html,
                text=text,
            )
            logger.info(
                "invitation_email_sent",
                invitation_id=str(invitation.id),
                org_slug=org.slug,
                email=email,
                role=role,
            )
        except Exception as exc:  # noqa: BLE001 — never let email failure break invite creation
            logger.error(
                "invitation_email_failed",
                invitation_id=str(invitation.id),
                error=str(exc),
            )

        return Response(
            InvitationResponseSerializer(invitation).data,
            status=status.HTTP_201_CREATED,
        )


class InvitationDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsOrgMember]

    def delete(self, request, org_slug, invitation_id):
        if request.membership.role != "owner":
            return Response({"detail": "owner_required"}, status=status.HTTP_403_FORBIDDEN)
        org = get_object_or_404(Organization, slug=org_slug)
        invitation = get_object_or_404(Invitation, id=invitation_id, organization=org)
        invitation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AcceptInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InvitationAcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        raw_token = serializer.validated_data["token"]
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        try:
            invitation = Invitation.objects.select_related("organization").get(
                token_hash=token_hash
            )
        except Invitation.DoesNotExist:
            return Response(
                {"detail": "invalid_or_expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.accepted_at is not None:
            return Response(
                {"detail": "already_accepted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.expires_at < timezone.now():
            return Response(
                {"detail": "invalid_or_expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.email.lower() != request.user.email.lower():
            logger.warning(
                "invitation_email_mismatch",
                invitation_id=str(invitation.id),
                invitation_email=invitation.email,
                acceptor_email=request.user.email,
            )

        with transaction.atomic():
            Membership.objects.update_or_create(
                organization=invitation.organization,
                user=request.user,
                defaults={"role": invitation.role},
            )
            invitation.accepted_at = timezone.now()
            invitation.save(update_fields=["accepted_at"])

        logger.info(
            "invitation_accepted",
            invitation_id=str(invitation.id),
            user_id=str(request.user.id),
            org_slug=invitation.organization.slug,
        )

        return Response(
            {
                "organization": {
                    "slug": invitation.organization.slug,
                    "name": invitation.organization.name,
                },
                "role": invitation.role,
            }
        )

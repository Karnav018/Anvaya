from rest_framework import serializers

from apps.orgs.models import Invitation, Membership, Organization


class OrganizationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=64, required=False)


class OrganizationUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    slug = serializers.SlugField(max_length=64, required=False)


class OrganizationListItemSerializer(serializers.Serializer):
    slug = serializers.CharField()
    name = serializers.CharField()
    role = serializers.CharField()
    plan = serializers.CharField()


class OrganizationDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    slug = serializers.CharField()
    name = serializers.CharField()
    plan = serializers.CharField()
    my_role = serializers.CharField()
    member_count = serializers.IntegerField()
    created_at = serializers.DateTimeField()


class MembershipSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source="user.id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = Membership
        fields = ("id", "user_id", "email", "name", "role", "created_at")
        read_only_fields = fields


class MembershipRoleUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=("owner", "editor", "viewer"))


class InvitationCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=("owner", "editor", "viewer"))


class InvitationResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ("id", "email", "role", "expires_at", "created_at")
        read_only_fields = fields


class InvitationAcceptSerializer(serializers.Serializer):
    token = serializers.CharField()

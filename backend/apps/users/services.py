from django.db import transaction
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken


def issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def revoke_all_tokens(user):
    """Blacklist every outstanding refresh token of the user."""
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)


@transaction.atomic
def change_password(user, new_password):
    """Set a new password, invalidate every old session, and return fresh tokens."""
    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])
    revoke_all_tokens(user)
    return issue_tokens(user)


@transaction.atomic
def delete_account(user):
    """Delete the user's profile picture file, then the user (cascades to related data)."""
    revoke_all_tokens(user)
    if user.profile_picture:
        user.profile_picture.delete(save=False)
    user.delete()

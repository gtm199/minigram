from django.db import transaction
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Post


@receiver(post_delete, sender=Post)
def delete_image_file(sender, instance, **kwargs):
    """Remove the file from disk when a post is deleted, including cascades from user deletion."""
    if instance.image:
        transaction.on_commit(lambda: instance.image.delete(save=False))

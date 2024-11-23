

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Company, CustomUser
from allauth.socialaccount.models import SocialAccount

@receiver(post_save,sender=CustomUser)
def create_profile(sender,instance,created,**kwargs):
    # profile for superuser is not required
    if created and not instance.is_superuser:
        Company.objects.create(email=instance)


@receiver(post_save, sender=SocialAccount)
def activate_social_user(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        if not user.is_active:
            user.is_active = True
            user.save()

from django.apps import AppConfig


class FenceappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'FenceApp'

    def ready(self):
        import FenceApp.signals

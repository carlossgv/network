from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Post(models.Model):
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="poster")
    body = models.CharField(max_length=280)
    createDate = models.DateTimeField(auto_now_add=True)
    editDate = models.DateTimeField(auto_now=True)
    likes = models.IntegerField(default=0)

    def serialize(self):
        return {
            'id': self.id,
            'poster': self.poster.username,
            'body': self.body,
            'createDate': self.createDate.strftime('%Y/%m/%d, %H:%M:%S'),
            'editDate': self.editDate.strftime('%Y/%m/%d, %H:%M:%S'),
            'likes': self.likes
        }

    def __str__(self):
        return f'{self.poster} posted: {self.body}.'
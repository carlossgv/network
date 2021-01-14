from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Post(models.Model):
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="poster")
    body = models.CharField(max_length=280)
    create_date = models.DateTimeField(auto_now_add=True)
    edit_date = models.DateTimeField(auto_now=True)
    likes = models.IntegerField(default=0)
    is_liked = models.BooleanField(default=False)

    def serialize(self):
        return {
            "id": self.id,
            "poster": self.poster.username,
            "body": self.body,
            "create_date": self.create_date.strftime("%Y/%m/%d, %H:%M:%S"),
            "edit_date": self.edit_date.strftime("%Y/%m/%d, %H:%M:%S"),
            "likes": self.likes,
            "is_liked": self.is_liked,
        }

    def __str__(self):
        return f"ID: {self.id} | {self.poster} posted: {self.body}."


class Like(models.Model):
    liker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liker")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="post")

    def __str__(self):
        return f'"Liker": {self.liker}, "Post": {self.post}'


class Follow(models.Model):
    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="follower"
    )
    following = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following"
    )

    def __str__(self):
        return f"{self.follower} follows {self.following}"

    def serialize(self):
        return {
            "id": self.id,
            "follower": self.follower.username,
            "following": self.following.username,
        }

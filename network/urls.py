from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("posts/", views.post_pagination, name="post_pagination"),
    path("profile/<str:username>", views.user_site, name="user_site"),
    path("posts/<int:page_number>", views.post_pagination, name="post_pagination"),
    path("create_post/", views.create_post, name="create_post"),
    path("likes/<int:post_id>", views.post_likes, name="post_likes"),
    path("follow/", views.follow_func, name="follow"),
    path("following/", views.following_posts, name="following_posts"),
]


from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("posts/", views.load_posts, name="load_posts"),
    
    path("posts/<int:post_id>", views.post_details, name="post-details"),
    path('likes/<str:username>', views.post_likes, name='post_likes'),
    path('posts/<str:username>', views.user_site, name='user_site')
]

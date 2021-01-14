import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse, HttpResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from .models import User, Post, Like, Follow


def index(request):

    return render(request, "network/index.html")


def user_site(request, username):
    profile_info = User.objects.get(username=username)
    posts = Post.objects.filter(poster=profile_info).all()
    user = request.user
    user_info = User.objects.get(username=user.username)
    is_profile = True

    if user.is_authenticated:
        is_logged = True
        user = user.username
    else:
        is_logged = False
        user = "Anonymous"

    followers = Follow.objects.filter(following=profile_info).count()
    following = Follow.objects.filter(follower=profile_info).count()

    if Follow.objects.filter(follower=user_info, following=profile_info).exists():
        if_followed = True
    else:
        if_followed = False

    return JsonResponse(
        {
            "posts": [post.serialize() for post in posts],
            "isLogged": is_logged,
            "user": user,
            "isProfile": is_profile,
            "following": following,
            "followers": followers,
            "isFollowed": if_followed,
        },
        safe=False,
    )


def follow_func(request):
    data = json.loads(request.body)

    to_follow = data["toFollow"]
    follower = User.objects.get(username=data["currentUser"])
    following = User.objects.get(username=data["username"])

    if to_follow == True:
        follow = Follow(follower=follower, following=following)
        follow.save()
    else:
        follow = Follow.objects.get(follower=follower, following=following)
        follow.delete()

    return JsonResponse({"message": "Following updated"}, status=201)


def following_posts(request):
    current_user = User.objects.get(username=request.user)
    user = request.user
    followed_users = Follow.objects.filter(follower=current_user)
    followed_list = []

    for followed in followed_users:
        followed_list.append(followed.following.pk)

    followedPosts = Post.objects.filter(poster__in=followed_list).order_by(
        "-createDate"
    )

    return JsonResponse(
        {
            "posts": [post.serialize() for post in followedPosts],
            "isLogged": True,
            "isProfile": False,
        },
        safe=False,
    )


@login_required
def create_post(request):
    if request.method == "POST":
        data = json.loads(request.body)

        poster = request.user
        body = data.get("body", "")
        new_post = Post(poster=poster, body=body)
        new_post.save()

        return JsonResponse({"message": "Post sent successfully."}, status=201)

    elif request.method == "PUT":
        data = json.loads(request.body)

        poster = request.user
        post_id = data["post_id"]
        body = data["body"]

        post_to_edit = Post.objects.filter(pk=post_id)

        post_to_edit.update(body=body)

        return JsonResponse({"message": "Post successfully updated."}, status=201)


def post_pagination(request, page_number=1):
    # if request.method == "PUT":
    #     data = json.loads(request.body)
    #     page_number = int(data["currentPage"])

    user = request.user
    user_id = User.objects.get(username=user)

    if user.is_authenticated:
        is_logged = True
        user = user.username
    else:
        is_logged = False
        user = "Anonymous"

    posts_query = Post.objects.all().order_by("-create_date")
    posts_query = Paginator(posts_query, 10)

    posts = posts_query.page(page_number)

    for post in posts:
        update_post = Post.objects.filter(pk=post.id)
        likes = Like.objects.filter(post=post.id).count()
        update_post.update(likes=likes)

    for post in posts:
        update_post = Post.objects.filter(pk=post.id)
        if Like.objects.filter(liker=user_id, post=post.id).exists():
            update_post.update(is_liked=True)
        else:
            update_post.update(is_liked=False)

    current_page_pagination = posts_query.page(page_number)

    has_next = current_page_pagination.has_next()

    has_previous = current_page_pagination.has_previous()

    total_pages = posts_query.num_pages

    is_profile = False

    return JsonResponse(
        {
            "isLogged": is_logged,
            "currentUser": user,
            "isProfile": is_profile,
            "posts": [post.serialize() for post in posts],
            "totalPages": total_pages,
            "hasNext": has_next,
            "hasPrevious": has_previous,
        },
        safe=False,
    )


def post_details(request, post_id):
    post = Post.objects.get(pk=post_id)
    # Update number of likes in Post
    if request.method == "PUT":
        user = request.user
        data = json.loads(request.body)

        # Update likes for each post
        if data["likes"] == "like":
            liked_post = Like(liker=user, post=post)
            liked_post.save()

        elif data["likes"] == "unlike":
            liked_post = Like.objects.get(liker=user, post=post)
            liked_post.delete()

        post.likes = Like.objects.filter(post=post).count()
        post.save()

        return HttpResponse(status=204)

    return JsonResponse({"post": post.serialize()}, safe=False)
    # return JsonResponse({'post': post}, safe=False)


def post_likes(request, post_id):
    liker = request.user

    if request.method == "PUT":
        data = json.loads(request.body)

        is_like = data["is_like"]

        post = Post.objects.get(pk=post_id)

        if is_like:
            like = Like(liker=liker, post=post)
            like.save()
        else:
            like = Like.objects.filter(liker=liker, post=post)
            like.delete()

    likes = Like.objects.filter(post=post_id).count()

    if Like.objects.filter(liker=liker, post=post_id).exists():
        user_liked = True
    else:
        user_liked = False

    print(f"{post_id} / {user_liked} / {likes}")

    return JsonResponse({"likes": likes, "user_liked": user_liked}, safe=False)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(
                request,
                "network/login.html",
                {"message": "Invalid username and/or password."},
            )
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(
                request, "network/register.html", {"message": "Passwords must match."}
            )

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(
                request, "network/register.html", {"message": "Username already taken."}
            )
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

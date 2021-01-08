import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse, HttpResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from .models import User, Post, Like, Follow


def index(request):
    if request.method == "POST":
        print("I ENTER TO CREATE POST")

    return render(request, "network/index.html")


def user_site(request, username):
    profileInfo = User.objects.get(username=username)
    posts = Post.objects.filter(poster=profileInfo).all()
    user = request.user
    isProfile = True

    if user.is_authenticated:
        isLogged = True
        user = user.username
    else:
        isLogged = False
        user = "Anonymous"

    followers = Follow.objects.filter(following=profileInfo).count()
    following = Follow.objects.filter(follower=profileInfo).count()

    return JsonResponse(
        {
            "posts": [post.serialize() for post in posts],
            "isLogged": isLogged,
            "user": user,
            "isProfile": isProfile,
            'following': following,
            'followers': followers
        },
        safe=False,
    )


@login_required
def create_post(request):
    print("I ENTER TO CREATE POST")
    data = json.loads(request.body)

    poster = request.user
    body = data.get("body", "")
    new_post = Post(poster=poster, body=body)
    new_post.save()

    return JsonResponse({"message": "Post sent successfully."}, status=201)


def load_posts(request):

    if request.method == "POST":
        create_post(request)

    user = request.user

    if user.is_authenticated:
        isLogged = True
        user = user.username
    else:
        isLogged = False
        user = "Anonymous"

    posts = Post.objects.all().order_by("-createDate")

    isProfile = False

    return JsonResponse(
        {
            "isLogged": isLogged,
            "currentUser": user,
            "isProfile": isProfile,
            "posts": [post.serialize() for post in posts]

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
            print("created like")
            liked_post = Like(liker=user, post=post)
            liked_post.save()

        elif data["likes"] == "unlike":
            print("deleted like")
            liked_post = Like.objects.get(liker=user, post=post)
            liked_post.delete()

        post.likes = Like.objects.filter(post=post).count()
        post.save()

        return HttpResponse(status=204)

    return JsonResponse({"post": post.serialize()}, safe=False)
    # return JsonResponse({'post': post}, safe=False)


def post_likes(username):
    user = request.user

    likes = Like.objects.filter(liker=user)

    return JsonResponse({"likes": likes.serialize()}, safe=False)


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

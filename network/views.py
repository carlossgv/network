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
    profileInfo = User.objects.get(username=username)
    posts = Post.objects.filter(poster=profileInfo).all()
    user = request.user
    userInfo = User.objects.get(username=user.username)
    isProfile = True

    if user.is_authenticated:
        isLogged = True
        user = user.username
    else:
        isLogged = False
        user = "Anonymous"

    followers = Follow.objects.filter(following=profileInfo).count()
    following = Follow.objects.filter(follower=profileInfo).count()

    if Follow.objects.filter(follower=userInfo, following=profileInfo).exists():
        isFollowed = True
    else:
        isFollowed = False

    return JsonResponse(
        {
            "posts": [post.serialize() for post in posts],
            "isLogged": isLogged,
            "user": user,
            "isProfile": isProfile,
            "following": following,
            "followers": followers,
            "isFollowed": isFollowed,
        },
        safe=False,
    )


def follow_func(request):
    data = json.loads(request.body)

    toFollow = data["toFollow"]
    follower = User.objects.get(username=data["currentUser"])
    following = User.objects.get(username=data["username"])

    if toFollow == True:
        follow = Follow(follower=follower, following=following)
        follow.save()
    else:
        follow = Follow.objects.get(follower=follower, following=following)
        follow.delete()

    return JsonResponse({"message": "Following updated"}, status=201)


def following_posts(request):
    currentUser = User.objects.get(username=request.user)
    user = request.user
    followedUsers = Follow.objects.filter(follower=currentUser)
    followedList = []

    for followed in followedUsers:
        followedList.append(followed.following.pk)

    followedPosts = Post.objects.filter(poster__in=followedList).order_by("-createDate")

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


def post_pagination(request, page_number=1):
    if request.method == "PUT":
        data = json.loads(request.body)
        page_number = int(data["currentPage"])
        print(f"page #after put {page_number}")

    user = request.user

    if user.is_authenticated:
        isLogged = True
        user = user.username
    else:
        isLogged = False
        user = "Anonymous"

    postsQuery = Post.objects.all().order_by("-createDate")
    postsQuery = Paginator(postsQuery, 10)

    posts = postsQuery.page(page_number).object_list
    print(posts)

    currentPagePagination = postsQuery.page(page_number)

    hasNext = currentPagePagination.has_next()

    hasPrevious = currentPagePagination.has_previous()

    totalPages = postsQuery.num_pages

    isProfile = False

    return JsonResponse(
        {
            "isLogged": isLogged,
            "currentUser": user,
            "isProfile": isProfile,
            "posts": [post.serialize() for post in posts],
            "totalPages": totalPages,
            "hasNext": hasNext,
            "hasPrevious": hasPrevious,
        },
        safe=False,
    )


# def load_posts(request):

#     currentPage = 1

#     user = request.user

#     if user.is_authenticated:
#         isLogged = True
#         user = user.username
#     else:
#         isLogged = False
#         user = "Anonymous"

#     postsQuery = Post.objects.all().order_by("-createDate")
#     postsQuery = Paginator(postsQuery, 10)

#     print(f"current page here {currentPage}")
#     posts = postsQuery.page(currentPage).object_list
#     print(posts)

#     currentPagePagination = postsQuery.page(currentPage)

#     hasNext = currentPagePagination.has_next()

#     hasPrevious = currentPagePagination.has_previous()

#     totalPages = postsQuery.num_pages

#     isProfile = False

#     return JsonResponse(
#         {
#             "isLogged": isLogged,
#             "currentUser": user,
#             "isProfile": isProfile,
#             "posts": [post.serialize() for post in posts],
#             "totalPages": totalPages,
#             "hasNext": hasNext,
#             "hasPrevious": hasPrevious,
#         },
#         safe=False,
#     )


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

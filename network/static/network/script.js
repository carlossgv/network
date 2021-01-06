document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector("form") !== null) {
    document.querySelector("form").onsubmit = create_post;
  }

  // if (document.querySelector("#likeButton") !== null) {
  //   document.querySelectorAll("#likeButton").onclick = like_post();
  // }

  load_posts();

  // END OF DOMCONTENTLOADED
});

function like_post(id) {
  let csrftoken = getCookie("csrftoken");

  // fetch(`/posts/${id}`)
  //   .then((response) => response.json())
  //   .then((post) => () => {
  //     let likes = post.post.likes; });

  let button = document.querySelector(`#likeButton${id}`);

  if (button.innerHTML === "Like") {
    fetch(`/posts/${id}`, {
      method: "PUT",
      headers: {
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({
        likes: 1,
      }),
    });

    button.innerHTML = "Unlike";
  } else {
    fetch(`/posts/${id}`, {
      method: "PUT",
      headers: {
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({
        likes: -1,
      }),
    });

    button.innerHTML = "Like";
  }
}

function create_post() {
  let body = document.querySelector("#postBody").value;

  if (body === "") {
    alert("Can't send empty post");
    return false;
  }

  let csrftoken = getCookie("csrftoken");

  fetch("/posts", {
    method: "POST",
    headers: {
      "X-CSRFToken": csrftoken,
    },
    body: JSON.stringify({
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      load_posts();
    });

  return false;
}

function load_posts() {
  if (document.querySelector("#postBody") !== null) {
    document.querySelector("#postBody").value = "";
  }
  if (document.querySelector("#posts") !== null) {
    document.querySelector("#posts").innerHTML = "";
  }

  fetch("/posts")
    .then((response) => response.json())
    .then((posts) => {
      console.log(posts.posts);
      posts.posts.forEach((element) =>
        create_post_div(element, posts.isLogged, posts.user)
      );
    });
}

function create_post_div(element, isLogged, user) {
  // Create postDiv
  postDiv = document.createElement("div");
  postDiv.classList.add("postDiv");

  // Create user and date div
  posterDateDiv = document.createElement("div");
  posterDateDiv.classList.add("userDateDiv");
  postDiv.appendChild(posterDateDiv);

  poster = document.createElement("h5");
  poster.innerHTML = element.poster;
  posterDateDiv.appendChild(poster);

  date = document.createElement("h6");
  date.innerHTML = element.editDate;
  posterDateDiv.appendChild(date);

  // Create body div
  body = document.createElement("p");
  body.innerHTML = element.body;
  postDiv.appendChild(body);

  // Create like and edit div
  if (isLogged === true) {
    likeEditDiv = document.createElement("div");
    likeEditDiv.classList.add("likeEditDiv");
    likeEditDiv.innerHTML = "";
    postDiv.appendChild(likeEditDiv);

    like = document.createElement("button");
    like.classList.add("btn");
    like.classList.add("btn-outline-danger");
    like.classList.add("likeButton");
    like.id = `likeButton${element.id}`;
    like.innerHTML = "Like";
    likeEditDiv.appendChild(like);

    like.onclick = () => like_post(element.id);

    if (element.poster === user) {
      edit = document.createElement("button");
      edit.classList.add("btn");
      edit.classList.add("btn-primary");
      edit.innerHTML = "Edit";
      likeEditDiv.appendChild(edit);
    }
  }

  document.querySelector("#posts").append(postDiv);
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

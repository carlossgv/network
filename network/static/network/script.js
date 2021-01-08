document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector('form') !== null) {
    document.querySelector('form').onsubmit = create_post;
  }

  if (document.querySelector('#likeButton') !== null) {
    document.querySelectorAll('#likeButton').onclick = like_post();
  }

  if (document.querySelector('#userProfile') !== null) {
    document.querySelector('#userProfile').style.display = 'none';
  }

  load_posts();

  // END OF DOMCONTENTLOADED
});

function like_post(id) {
  let csrftoken = getCookie('csrftoken');

  let button = document.querySelector(`#likeButton${id}`);

  if (button.innerHTML != 'Unlike') {
    fetch(`/posts/${id}`, {
      method: 'PUT',
      headers: {
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify({
        likes: 'like',
      }),
    });

    button.innerHTML = 'Unlike';
  } else {
    fetch(`/posts/${id}`, {
      method: 'PUT',
      headers: {
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify({
        likes: 'unlike',
      }),
    });

    button.innerHTML = 'Like (0)';
  }
}

function create_post() {
  let body = document.querySelector('#postBody').value;

  if (body === '') {
    alert("Can't send empty post");
    return false;
  }

  let csrftoken = getCookie('csrftoken');

  fetch('/posts', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrftoken,
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

function load_posts(username = '') {
  if (document.querySelector('#postBody') !== null) {
    document.querySelector('#postBody').value = '';
  }
  if (document.querySelector('#posts') !== null) {
    document.querySelector('#posts').innerHTML = '';
  }

  fetch(`/posts/${username}`)
    .then((response) => response.json())
    .then((element) => {
      let isLogged = element.isLogged;
      let currentUser = element.currentUser;
      let isProfile = element.isProfile;
      console.log(element);
      element.posts.forEach((element) =>
        create_post_div(element, isLogged, currentUser, isProfile)
      );
    });
}

function followUser(username, currentUser) {}

// username is the profile visited
function show_profile(username, currentUser) {
  fetch(`/posts/${username}`)
    .then((response) => response.json())
    .then((profile) => {
      let profileFollowers = profile.followers;
      let profileFollowing = profile.following;

      fetch(`/posts/${currentUser}`)
        .then((response) => response.json())
        .then((element) => {
          console.log(element.isLogged, element.user, element.isProfile);
          // Hide new post form
          if (element.isLogged === true) {
            document.querySelector('#newPostDiv').style.display = 'none';
            document.querySelector('#follow_button').style.display = 'none';
            if (element.isProfile === true && username != element.user) {
              followButton = document.querySelector('#follow_button');
              followButton.style.display = 'block';

              followButton.onclick = () => followUser(username, currentUser);
            }
          }
          // Show profile block
          document.querySelector('#userProfile').style.display = 'block';

          userDOM = document.querySelector('#profile_username');
          userDOM.innerHTML = username;
          userDOM.onclick = () => show_profile(username, currentUser);

          following = document.querySelector('#profile_following');
          following.innerHTML = `Following: ${profileFollowing}`;
          following.onclick = 'nothing yet';

          followers = document.querySelector('#profile_followers');
          followers.innerHTML = `Followers: ${profileFollowers}`;
          followers.onclick = 'nothing yet';
        });
    });

  load_posts(username);
}

function create_post_div(element, isLogged, currentUser, isProfile) {
  // Create postDiv
  postDiv = document.createElement('div');
  postDiv.classList.add('postDiv');

  // Create user and date div
  posterDateDiv = document.createElement('div');
  posterDateDiv.classList.add('userDateDiv');
  postDiv.appendChild(posterDateDiv);

  poster = document.createElement('h5');
  poster.classList.add('poster');
  poster.innerHTML = element.poster;
  poster.onclick = () => show_profile(element.poster, currentUser);
  posterDateDiv.appendChild(poster);

  date = document.createElement('h6');
  date.innerHTML = element.editDate;
  posterDateDiv.appendChild(date);

  // Create body div
  body = document.createElement('p');
  body.innerHTML = element.body;
  postDiv.appendChild(body);

  // Create like and edit div
  if (isLogged === true && isProfile === false) {
    likeEditDiv = document.createElement('div');
    likeEditDiv.classList.add('likeEditDiv');
    likeEditDiv.innerHTML = '';
    postDiv.appendChild(likeEditDiv);

    like = document.createElement('button');
    like.classList.add('btn');
    like.classList.add('btn-outline-danger');
    like.classList.add('likeButton');
    like.id = `likeButton${element.id}`;
    like.innerHTML = 'Like (0)';
    likeEditDiv.appendChild(like);

    like.onclick = () => like_post(element.id);

    if (element.poster === currentUser) {
      edit = document.createElement('button');
      edit.classList.add('btn');
      edit.classList.add('btn-primary');
      edit.innerHTML = 'Edit';
      likeEditDiv.appendChild(edit);
    }
  }

  document.querySelector('#posts').append(postDiv);
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('form') != null) {
    document.querySelector('form').onsubmit = create_post;
  }

  if (document.querySelector('#likeButton') != null) {
    document.querySelectorAll('#likeButton').onclick = like_post();
  }

  if (document.querySelector('#userProfile') != null) {
    document.querySelector('#userProfile').style.display = 'none';
  }

  if (document.querySelector('#following_nav_link') != null) {
    document.querySelector('#following_nav_link').onclick = () =>
      load_posts('', true);
  }

  if (document.querySelector('#hasPrevious') != null) {
    document.querySelector('#hasPrevious').style.display = 'none';
  }

  if (document.querySelector('#hasNext') != null) {
    document.querySelector('#hasNext').style.display = 'none';
  }

  load_posts();

  // END OF DOMCONTENTLOADED
});

function like_post(id) {
  let csrftoken = getCookie('csrftoken');

  let button = document.querySelector(`#likeButton${id}`);

  if (button.innerHTML.includes('Unlike')) {
    fetch(`/likes/${id}`, {
      method: 'PUT',
      headers: {
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify({
        is_like: false,
      }),
    });
  } else {
    fetch(`/likes/${id}`, {
      method: 'PUT',
      headers: {
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify({
        is_like: true,
      }),
    });
  }

  sync_likes(id);
}

function sync_likes(id) {
  fetch(`/likes/${id}`)
    .then((response) => response.json())
    .then((element) => {
      console.log(`this post has ${element.likes} likes`);

      let button = document.querySelector(`#likeButton${id}`);
      let button_text = button.innerHTML;
      console.log(button_text);
      button_text = parseInt(button_text.slice(-2, -1));
      console.log(button_text);

      if (element.user_liked) {
        button.innerHTML = `Unlike (${button_text + 1})`;
      } else {
        button.innerHTML = `Like (${button_text - 1})`;
      }
    });
}

function create_post() {
  let body = document.querySelector('#postBody').value;

  if (body === '') {
    alert("Can't send empty post");
    return false;
  }

  let csrftoken = getCookie('csrftoken');

  fetch('/create_post/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrftoken,
    },
    body: JSON.stringify({
      body: body,
    }),
  })
    .then((response) => response.json())
    .then(() => {
      load_posts();
    });

  return false;
}

function edit_post(post_id) {
  let postDiv = document.querySelector(`#postDiv${post_id}`);
  let formDiv = document.createElement('form');
  formDiv.innerHTML = postDiv.innerHTML;

  postDiv.parentNode.replaceChild(formDiv, postDiv);

  let body = document.querySelector(`#body${post_id}`);
  let textarea = document.createElement('textarea');

  textarea.innerHTML = body.innerHTML;
  textarea.classList.add('form-control');
  textarea.id = 'editArea';
  body.parentNode.replaceChild(textarea, body);

  let editButton = document.querySelector(`#post${post_id}`);
  editButton.innerHTML = 'Update post';

  editButton.onclick = () => {
    newBody = document.querySelector('#editArea').value;

    let csrftoken = getCookie('csrftoken');
    fetch(`/create_post/`, {
      method: 'PUT',
      headers: {
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify({
        post_id: post_id,
        body: newBody,
      }),
    });

    load_posts();
  };
}

function create_pagination(totalPages, hasNext, hasPrevious, currentPage) {
  console.log(`This is the current page ${currentPage}`);
  if (document.querySelector('.page-number') != null) {
    document.querySelectorAll('.page-number').forEach((e) => e.remove());
  }

  for (let i = 1; i < totalPages + 1; i++) {
    let previousDiv = document.querySelector('#hasPrevious');
    let nextDiv = document.querySelector('#hasNext');
    let parentDiv = document.querySelector('#pagination');

    previousDiv.style.display = 'none';
    nextDiv.style.display = 'none';

    if (hasPrevious) {
      previousDiv.style.display = 'block';
      previousDiv.onclick = () =>
        load_posts(undefined, undefined, currentPage - 1);
    }
    if (hasNext) {
      nextDiv.style.display = 'block';
      nextDiv.onclick = () => load_posts(undefined, undefined, currentPage + 1);
    }

    pageItemDiv = document.createElement('li');
    pageItemDiv.classList.add('page-item');
    if (i === currentPage) {
      pageItemDiv.style.backgroundColor = 'lightcyan';
    }
    pageItemDiv.classList.add('page-link');
    pageItemDiv.classList.add('page-number');

    pageItemNumber = document.createElement('a');
    pageItemNumber.id = `${i}`;
    pageItemNumber.innerHTML = `${i}`;
    pageItemNumber.onclick = () => load_posts(undefined, undefined, i);

    pageItemDiv.appendChild(pageItemNumber);

    parentDiv.insertBefore(pageItemDiv, nextDiv);
  }
}

function load_posts(username = '', following = false, currentPage = 1) {
  if (document.querySelector('#postBody') !== null) {
    document.querySelector('#postBody').value = '';
  }
  if (document.querySelector('#posts') !== null) {
    document.querySelector('#posts').innerHTML = '';
  }

  let fetchAddress;

  if (following) {
    fetchAddress = 'following/';
  } else if (username === '') {
    fetchAddress = `posts/${currentPage}`;
  } else {
    fetchAddress = `profile/${username}`;
  }

  fetch(fetchAddress)
    .then((response) => response.json())
    .then((element) => {
      let isLogged = element.isLogged;
      let currentUser = element.currentUser;
      let isProfile = element.isProfile;
      let hasNext = element.hasNext;
      let hasPrevious = element.hasPrevious;
      let totalPages = element.totalPages;
      console.log(element);
      create_pagination(totalPages, hasNext, hasPrevious, currentPage);
      element.posts.forEach((element) =>
        create_post_div(element, isLogged, currentUser, isProfile)
      );
    });
}

function followUser(username, currentUser) {
  let csrftoken = getCookie('csrftoken');
  let followButton = document.querySelector('#follow_button');

  let toFollow;

  if (followButton.innerHTML === 'Follow') {
    toFollow = true;
    followButton.innerHTML = 'Unfollow';
  } else {
    toFollow = false;
    followButton.innerHTML = 'Follow';
  }

  fetch('/follow/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrftoken,
    },
    body: JSON.stringify({
      username: username,
      currentUser: currentUser,
      toFollow: toFollow,
    }),
  })
    .then((response) => response.json())
    .then(() => show_profile(username, currentUser));
}

// username is the profile visited
function show_profile(username, currentUser) {
  fetch(`/profile/${username}`)
    .then((response) => response.json())
    .then((profile) => {
      let profileFollowers = profile.followers;
      let profileFollowing = profile.following;
      let isFollowed = profile.isFollowed;

      fetch(`/profile/${currentUser}`)
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

          if (isFollowed === true) {
            followButton.innerHTML = 'Unfollow';
          }
        });
    });

  load_posts(username);
}

function create_post_div(element, isLogged, currentUser, isProfile) {
  // Create postDiv
  postDiv = document.createElement('div');
  postDiv.classList.add('postDiv');
  postDiv.id = `postDiv${element.id}`;

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
  date.innerHTML = element.edit_date;
  posterDateDiv.appendChild(date);

  // Create body div
  body = document.createElement('p');
  body.innerHTML = element.body;
  body.id = `body${element.id}`;
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

    if (element.is_liked) {
      like.innerHTML = `Unlike (${element.likes})`;
    } else {
      like.innerHTML = `Like (${element.likes})`;
    }

    likeEditDiv.appendChild(like);

    like.onclick = () => like_post(element.id);

    if (element.poster === currentUser) {
      edit = document.createElement('button');
      edit.classList.add('btn');
      edit.classList.add('btn-primary');
      edit.innerHTML = 'Edit';
      edit.id = `post${element.id}`;

      edit.onclick = () => edit_post(element.id);

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

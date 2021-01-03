document.addEventListener('DOMContentLoaded', function() {

    if (document.querySelector('form') !== null) {
        document.querySelector('form').onsubmit = create_post;
    }

    load_posts();

    // END OF DOMCONTENTLOADED
})

function create_post() {
    let body = document.querySelector('#postBody').value;

    if (body === '') {
        alert("Can't send empty post");
        return false
    }

    let csrftoken = getCookie('csrftoken');
    console.log(csrftoken)

    fetch('/posts', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
          body: body,
        })
    })
  
    .then(response => response.json())
    .then(result => {
        load_posts();
    })

    return false
}

function load_posts() {

    if (document.querySelector('#postBody') !== null) {
        document.querySelector('#postBody').value = "";
    }
    if (document.querySelector('#posts') !== null) {
        document.querySelector('#posts').innerHTML = "";
    }

    fetch('/posts')
        .then(response => response.json())
        .then(posts => {console.log(posts)
            posts.forEach(element => create_post_div(element));
        });

};

function create_post_div(element) {
    // Create postDiv
    postDiv = document.createElement('div');
    postDiv.classList.add('postDiv');
    
    // Create user and date div
    posterDateDiv = document.createElement('div');
    posterDateDiv.classList.add('userDateDiv');
    postDiv.appendChild(posterDateDiv);

    poster = document.createElement("h5");
    poster.innerHTML = element.poster;
    posterDateDiv.appendChild(poster);

    date = document.createElement("h6");
    date.innerHTML = element.editDate;
    posterDateDiv.appendChild(date);

    // Create body div
    body = document.createElement('p');
    body.innerHTML = element.body;
    postDiv.appendChild(body);

    // Create like and edit div
    likeEditDiv = document.createElement('div');
    likeEditDiv.classList.add('likeEditDiv');
    likeEditDiv.innerHTML = ''
    postDiv.appendChild(likeEditDiv);

    like = document.createElement('button');
    like.classList.add('btn');
    like.classList.add('btn-outline-danger');
    like.id = 'likeButton';
    like.innerHTML = 'Like';
    likeEditDiv.appendChild(like);

    // if (document.querySelector('#likeButtonDiv') !== null) {
    //     console.log('Like div exists')
    //     document.querySelector('#likeButtonDiv').append(like);
    // }

    // edit = document.createElement('button');
    // edit.classList.add('btn');
    // edit.classList.add('btn-primary');
    // edit.innerHTML = 'Edit';
    // if (document.querySelector('#editButtonDiv') !== null) {
    //     document.querySelector('#editButtonDiv').append(edit);
    // }

    document.querySelector('#posts').append(postDiv);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}




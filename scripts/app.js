
(function() {
  'use strict';

  // Insert injected weather forecast here
  var initialBlogPost = {
    key: 'initial',
    label: 'Initial Post',
    description: 'This is a description',
    icon: 'icon'
  };

  var app = {
    isLoading: true,
    hasRequestPending: false,
    visibleCards: {},
    selectedPosts: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  document.getElementById('butRefresh').addEventListener('click', function() {
    // Refresh all of the forecasts
    app.updatePosts();
  });

  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  app.updatePostCard = function(data) {
    var card = app.visibleCards[data.key];
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove('cardTemplate');
      card.querySelector('.location').textContent = data.label;
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.key] = card;
    }
    card.querySelector('.description').textContent = data.description;
    // card.querySelector('.current .icon').classList.add(data.icon);

    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };


  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  // Gets a specific post and update the card with the data
  app.getPost = function(key, label) {
    var url = 'https://pwa.datkinson.me/';
    url += key + '.json';
    if ('caches' in window) {
      caches.match(url).then(function(response) {
        if (response) {
          response.json().then(function(json) {
            // Only update if the XHR is still pending, otherwise the XHR
            // has already returned and provided the latest data.
            if (app.hasRequestPending) {
              console.log('[App] Post Updated From Cache');
              json.key = key;
              json.label = label;
              app.updatePostCard(json);
            }
          });
        }
      });
    }
    app.hasRequestPending = true;
    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          response.key = key;
          response.label = label;
          app.hasRequestPending = false;
          console.log('[App] Post Updated From Network');
          app.updatePostCard(response);
        }
      }
    };
    request.open('GET', url);
    request.send();
  };

  // Iterate all of the posts and attempt to get the latest post data
  app.updatePosts = function() {
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function(key) {
      app.getPost(key);
    });
  };

  // Save list of cities to localStorage, see note below about localStorage.
  app.saveSelectedPosts = function() {
    var selectedPosts = JSON.stringify(app.selectedPosts);
    // IMPORTANT: See notes about use of localStorage.
    localStorage.selectedPosts = selectedPosts;
  };

  app.selectedPosts = localStorage.selectedPosts;
  if (app.selectedPosts) {
    app.selectedPosts = JSON.parse(app.selectedPosts);
    app.selectedPosts.forEach(function(post) {
      app.getPost(post.key, post.label);
    });
  } else {
    app.updatePostCard(initialBlogPost);
    app.selectedPosts = [
      {key: initialBlogPost.key, label: initialBlogPost.label}
    ];
    app.saveSelectedPosts();
  }

  // Add feature check for Service Workers here
  if('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('/service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }

})();

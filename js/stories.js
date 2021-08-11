"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showTrash = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        ${showTrash ? getTrashHTML(story) : ""}
        ${showStar ? getStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function getStarHTML(story, user) {
  const starType = user.isFavorite(story) ? "fas" : "far";
  return `
        <span class="star"> 
          <i class="${starType} fa-star"></i>
        </span>`;
}

function getTrashHTML(story) {
  return `
        <span class="trash"> 
          <i class="fas fa-trash-alt"></i>
        </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/* Get user favorite stories and put on favorite page */

function putFavoriteStoriesOnPage() {
  console.debug("putStoriesOnFavoritePage");

  $favoriteStoriesList.empty();

  if (currentUser.favorites.length === 0) {
    $favoriteStoriesList.append("<h5>No favorites added!</h5>");
  } else {
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoriteStoriesList.append($story);
    }
  }
  $favoriteStoriesList.show();
}

/* Get user stories and put on my stories page */

function putMyStoriesOnPage() {
  console.debug("putMyStoriesOnPage");

  $myStoriesList.empty();

  if (currentUser.ownStories.length === 0) {
    $myStoriesList.append("<h5>No stories added by user yet!</h5>");
  } else {
    for (let story of currentUser.ownStories) {
      const $story = generateStoryMarkup(story, true);
      $myStoriesList.append($story);
    }
  }
  $myStoriesList.show();
}

/** Submit story data to api and create new story */

async function createStory(evt) {
  evt.preventDefault();
  const author = $("#author").val();
  const title = $("#title").val();
  const url = $("#url").val();
  const storyData = { author, title, url };
  const story = await storyList.addStory(currentUser, storyData);
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);
  $storyForm.hide();
  $storyForm.trigger("reset");
}

$storyForm.on("submit", createStory);

async function toggleFavorite(evt) {
  const storyId = evt.target.closest("li").id;
  const story = await storyList.getStory(storyId);

  if ($(evt.target).hasClass("far")) {
    await currentUser.addFavorite(story);
    $(evt.target).removeClass("far");
    $(evt.target).addClass("fas");
  } else {
    await currentUser.removeFavorite(story);
    $(evt.target).removeClass("fas");
    $(evt.target).addClass("far");
  }

  putFavoriteStoriesOnPage();
}

$storiesLists.on("click", ".star", toggleFavorite);

async function deleteStory(evt) {
  const storyId = evt.target.closest("li").id;
  const story = await storyList.getStory(storyId);
  console.debug(storyId);
  await storyList.removeStory(currentUser, story);
  putMyStoriesOnPage();
  console.debug("deleteStory");
}
$myStoriesList.on("click", ".trash", deleteStory);

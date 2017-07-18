// --------------------------------------------------
// APP.JS
// --------------------------------------------------

//
// Initialize Foundation
// --------------------------------------------------

$(document).foundation();
console.log("hi from app.js");
console.log(Foundation.MediaQuery.current);
console.log(Foundation.version);

// Custom JS
$(function() {
  hljs.initHighlightingOnLoad();
});

var toggleMenuButton = function toggleMenuButton(){
  $("#menu-button").toggleClass("is-active");
  $("#menu-button-close").toggleClass("is-active");
  $('body').toggleClass("no-scroll");
};

$("#menu-button").click(function(){
  $(".overlay-menu").fadeIn();
  toggleMenuButton();
});

$("#menu-button-close").click(function(){
  $(".overlay-menu").fadeOut();
  toggleMenuButton();
});

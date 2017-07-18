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

$("#menu-button").click(function(){
  $(".overlay-menu").toggle();
  $("#menu-button").toggleClass("is-active");
});

$("#menu-button-close").click(function(){
  $(".overlay-menu").toggle();
  $("#menu-button").toggleClass("is-active");
});

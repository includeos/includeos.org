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
  
  $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });
});

var toggleMenuButton = function toggleMenuButton(){
  $("#menu-button").toggleClass("is-active");
  $("#menu-button-close").toggleClass("is-active");
  $('.container').toggleClass("no-scroll");
};

$("#menu-button").click(function(){
  $(".overlay-menu").fadeIn();
  toggleMenuButton();
});

$("#menu-button-close").click(function(){
  $(".overlay-menu").fadeOut();
  toggleMenuButton();
});

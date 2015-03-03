/**
 * @fileoverview Poems HTML5 app. Main entry.
 */

goog.provide('poems');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');


poems.container = null;


poems.canvas = null;


poems.onResize = function() {
  var viewportSize = goog.dom.getViewportSize();
  goog.style.setSize(container, viewportSize);
  goog.style.setSize(canvas, viewportSize);
  canvas.setAttribute('height', viewportSize.height);
  canvas.setAttribute('width', viewportSize.width);
  poems.update();
};


poems.update = function() {
  var viewportSize = goog.dom.getViewportSize();
  poems.context.font = "40px sans-serif";
  poems.context.fillText("Hello",
			 viewportSize.width / 2,
			 viewportSize.height / 2);
};


poems.init = function() {
  poems.container = document.getElementById('container');
  poems.canvas = document.getElementById('canvas');
  poems.context = canvas.getContext('2d');
  goog.events.listen(window, 'resize', poems.onResize);
  goog.events.listen(window, 'deviceorientation', poems.onResize);
  poems.onResize();
};


goog.exportSymbol('poems.init', poems.init);

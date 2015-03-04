/**
 * @fileoverview Poems HTML5 app. Main entry.
 */

goog.provide('poems');

goog.require('poems.Viewport');


poems.CONTAINER_ID_ = 'a';
poems.CANVAS_ID_ = 'c';
poems.BUFFER_CANVAS_ID_ = 'b';


poems.init = function() {
  var container = document.getElementById(poems.CONTAINER_ID_);
  var canvas = document.getElementById(poems.CANVAS_ID_);
  var bufferCanvas = document.getElementById(poems.BUFFER_CANVAS_ID_);
  var context = canvas.getContext('2d');
  var bufferContext = bufferCanvas.getContext('2d');
  new poems.Viewport(container, canvas, bufferCanvas, context, bufferContext);
};


goog.exportSymbol('poems.init', poems.init);

/**
 * @fileoverview The class to manipulate the main viewport of the app.
 */

goog.provide('poems.Viewport');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.style');



/**
 * @constructor
 */
poems.Viewport = function(container,
			  canvas,
			  bufferCanvas,
			  context,
			  bufferContext) {
  this.container_ = container;
  this.canvas_ = canvas;
  this.bufferCanvas_ = bufferCanvas;
  this.context_ = context;
  this.bufferContext_ = bufferContext;
  this.viewportSize_ = null;

  this.init_();
};


/**
 * @private
 */
poems.Viewport.prototype.init_ = function() {
  var self = this;
  goog.events.listen(window, goog.events.EventType.RESIZE,
		     function() {
		       self.onResize_();
		     });
  goog.events.listen(window, goog.events.EventType.ORIENTATIONCHANGE,
		     function() {
		       self.onResize_();
		     });
  this.onResize_();
};


/**
 * @private
 */
poems.Viewport.prototype.onResize_ = function() {
  this.viewportSize_ = goog.dom.getViewportSize();
  goog.style.setSize(this.container_, this.viewportSize_);

  goog.style.setWidth(this.canvas_, this.viewportSize_.width * 2);
  this.canvas_.setAttribute('width', this.viewportSize_.width * 2);
  goog.style.setHeight(this.canvas_, this.viewportSize_.height);
  this.canvas_.setAttribute('height', this.viewportSize_.height);
  goog.style.setPosition(this.canvas_, 0, 0);
  goog.style.setPosition(this.bufferCanvas_, 0, 0);
  goog.style.showElement(this.canvas_, true);
  goog.style.showElement(this.bufferCanvas_, false);
  this.update_();
};


/**
 * @private
 */
poems.Viewport.prototype.update_ = function() {
  this.context_.font = '40px sans-serif';
  this.context_.fillStyle = '#ccc';
  this.context_.fillRect(0, 0,
			 this.viewportSize_.width * 2,
			 this.viewportSize_.height);
  this.context_.fillStyle = '#333';
  this.context_.fillText('Hello',
			 this.viewportSize_.width,
			 this.viewportSize_.height / 2);

  this.container_.scrollLeft = this.viewportSize_.width;
};

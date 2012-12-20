/**
 * @fileoverview Transitions the current page to a lucky destination.
 */

goog.provide('ppz.lucky');

goog.require('goog.style');
goog.require('ppz.util');

/**
 * The lucky URL.
 * @type {string}
 * @const
 * @private
 */
ppz.lucky.LUCKY_URL_ = 'http://www.google.com/logos/2010/pacman10-hp.html';

/**
 * The steps of fade-out animation.
 * @type {number}
 * @const
 * @private
 */
ppz.lucky.ANIMATION_STEPS_ = 300;

/**
 * The boxes.
 * @type {Element}
 * @private
 */
ppz.lucky.boxElems_ = [];

/**
 * The root element.
 * @type {Element}
 * @private
 */
ppz.lucky.rootElem_ = null;

/**
 * The canvas element.
 * @type {Element}
 * @private
 */
ppz.lucky.canvasElem_ = null;

/**
 * The current step number.
 * @type {number}
 * @private
 */
ppz.lucky.currentStep_ = 0;

/**
 * Shows the final lucky effect when the animation ends.
 * @private
 */
ppz.lucky.onEnded_ = function() {
  ppz.lucky.canvasElem_ = document.createElement('center');
  ppz.lucky.canvasElem_.style.cssText =
      'margin-top:100px;text-align:center;overflow:hidden;';
  var text = document.createElement('p');
  text.innerHTML =
      '<a href="" onclick="ppz.lucky.restore();return false;">' +
      '&lt;&lt;&lt;= B = A = C = K =&lt;&lt;&lt;</a>';
  var iframe = document.createElement('iframe');
  iframe.style.cssText =
      'margin:0;padding:0;border:0;width:700px;height:400px;overflow:hidden;';
  iframe.src = ppz.lucky.LUCKY_URL_;
  ppz.lucky.canvasElem_.appendChild(text);
  ppz.lucky.canvasElem_.appendChild(iframe);
  document.body.appendChild(ppz.lucky.canvasElem_);
};

/**
 * Animation frame update function.
 * @private
 */
ppz.lucky.onFrame_ = function() {
  var percent = ppz.lucky.currentStep_ / ppz.lucky.ANIMATION_STEPS_;
  for (var i = 0, elem; elem = ppz.lucky.boxElems_[i++];) {
    ppz.util.setElementTransform(elem, 0, 0, 2 * Math.PI * percent);
  }
  goog.style.setOpacity(ppz.lucky.rootElem_, 1 - percent);
  ppz.lucky.currentStep_++;
  if (ppz.lucky.currentStep_ < ppz.lucky.ANIMATION_STEPS_) {
    ppz.util.requestAnimationFrame(ppz.lucky.onFrame_);
  } else {
    ppz.lucky.currentStep_ = 0;
    for (var i = 0, elem; elem = ppz.lucky.boxElems_[i++];) {
      ppz.util.setElementTransform(elem, 0, 0, 0);
    }
    goog.style.showElement(ppz.lucky.rootElem_, false);
    ppz.lucky.onEnded_();
  }
};

/**
 * Restores to the original homepage.
 */
ppz.lucky.restore = function() {
  document.body.removeChild(ppz.lucky.canvasElem_);
  goog.style.showElement(ppz.lucky.rootElem_, true);
  goog.style.setOpacity(ppz.lucky.rootElem_, 1);
};

/**
 * Starts the lucky effects.
 */
ppz.lucky.start = function() {
  var boxes = ['box1', 'box2', 'box3', 'box4'];
  for (var i = 0, box; box = boxes[i++];) {
    ppz.lucky.boxElems_.push(document.getElementById(box));
  }
  ppz.lucky.rootElem_ = document.getElementById('root');

  ppz.util.requestAnimationFrame(ppz.lucky.onFrame_);
};

goog.exportSymbol('ppz.lucky.start', ppz.lucky.start);
goog.exportSymbol('ppz.lucky.restore', ppz.lucky.restore);

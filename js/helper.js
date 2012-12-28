/**
 * @fileoverview The poem rhyme helper.
 */

goog.provide('ppz.helper');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('ppz.util');

/**
 * The canvas container.
 * @type {Element}
 * @private
 */
ppz.helper.canvas_ = null;

/**
 * AJAX request to fetch back JSON data.
 * @type {goog.net.XhrIo}
 * @private
 */
ppz.helper.request_ = null;

/**
 * The URL of the rhymes data.
 * @type {string}
 * @const
 * @private
 */
ppz.helper.DATA_URL_ = 'rhymes.json';

/**
 * The loading text.
 * @type {string}
 * @const
 * @private
 */
ppz.helper.LOADING_ = 'LOADING...';

/**
 * If in data loading state.
 * @type {boolean}
 * @private
 */
ppz.helper.loading_ = false;

/**
 * The current step of the loading effect.
 * @type {number}
 * @private
 */
ppz.helper.loadingStep_ = 0;

/**
 * Animation frame count.
 * @type {number}
 * @private
 */
ppz.helper.frameCount_ = 0;

/**
 * The rhymes data.
 * @type {Object}
 * @private
 */
ppz.helper.data_ = null;

/**
 * The main loop to show loading effect.
 * @private
 */
ppz.helper.loadingLoop_ = function() {
  if (!ppz.helper.loading_) {
    return;
  }
  if (ppz.helper.frameCount_ % 5 == 0) {
    var msg = ppz.helper.LOADING_;
    msg = msg.substring(0, ppz.helper.loadingStep_ + 1);
    ppz.helper.canvas_.innerText = msg;
    ppz.helper.loadingStep_++;
    ppz.helper.loadingStep_ %= ppz.helper.LOADING_.length;
  }
  ppz.helper.frameCount_++;
  ppz.util.requestAnimationFrame(ppz.helper.loadingLoop_);
};

/**
 * Reports error to users.
 * @param {string} msg The error message.
 * @private
 */
ppz.helper.error_ = function(msg) {
  goog.dom.removeChildren(ppz.helper.canvas_);
  ppz.helper.loading_ = false;
  ppz.helper.canvas_.innerText = msg;
};

/**
 * Callback when JSON data arrives.
 * @private
 */
ppz.helper.onData_ = function() {
  ppz.helper.loading_ = false;
  if (ppz.helper.request_.isSuccess() &&
      (ppz.helper.data_ = ppz.helper.request_.getResponseJson())) {
    goog.dom.removeChildren(ppz.helper.canvas_);
    ppz.helper.initCanvas_();
  } else {
    ppz.helper.error_('Failed to load the data.');
  }
};

/**
 * Inits the canvas for rhyme query.
 * @private
 */
ppz.helper.initCanvas_ = function() {
  for (i in ppz.helper.data_) {
    window.console.log(i);
  }

};

/**
 * Inits the helper and loads rhymes data.
 */
ppz.helper.init = function() {
  ppz.helper.canvas_ = document.getElementById('canvas');

  ppz.helper.request_ = new goog.net.XhrIo();
  goog.events.listen(ppz.helper.request_, 'complete', ppz.helper.onData_);

  ppz.helper.request_.send(ppz.helper.DATA_URL_);

  ppz.helper.frameCount_ = 0;
  ppz.helper.loading_ = true;
  ppz.helper.loadingLoop_();
};

goog.exportSymbol('ppz.helper.init', ppz.helper.init);

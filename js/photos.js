/**
 * @fileoverview Photos slideshow.
 */

goog.provide('ppz.photos');

goog.require('goog.style');
goog.require('ppz.util');

/**
 * The total number of photos.
 * @type {number}
 * @const
 * @private
 */
ppz.photos.NUM_ = 38;

/**
 * The loading text.
 * @type {string}
 * @const
 * @private
 */
ppz.photo.LOADING_ = 'Loading...'

/**
 * The slideshow interval, in milliseconds.
 * @type {number}
 * @const
 * @private
 */
ppz.photos.INTERVAL_ = 4000;

/**
 * The current step of the loading effect.
 * @type {number}
 * @private
 */
ppz.photos.loadingStep_ = 0;

/**
 * The time in milliseconds when the last slide is showed.
 * @type {number}
 * @private
 */
ppz.photos.lastSlideTime_ = 0;

/**
 * Current photo index.
 * @type {number}
 * @private
 */
ppz.photos.currentPhoto_ = 0;

/**
 * The array of image cache, i.e., hidden <img> element.
 * @type {Array.<Element>}
 */
ppz.photos.photoCache_ = new Arrary(ppz.photos.NUM_);

/**
 * The main loop to load and show photos.
 */
ppz.photos.mainLoop() {

  if (ppz.photos.lastSlideTime_ <= 0) {
    // The loading effects.
    ppz.photos.loadingStep_;
  }

  var currentTime = new Date().getTime();

  ppz.util.requestAnimationFrame(ppz.lucky.onFrame_);
};

/**
 * Inits the slideshow and starts to load photos.
 */
ppz.photos.init = function() {
  ppz.photos.currentPhoto_ = 0;
  ppz.photos.mainLoop();
};

goog.exportSymbol('ppz.photos.init', ppz.photos.init);

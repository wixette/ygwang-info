/**
 * @fileoverview Photos slideshow.
 */

goog.provide('ppz.photos');

goog.require('goog.events');
goog.require('goog.string.format');
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
ppz.photos.LOADING_ = 'LOADING...';

/**
 * Max opacity of the loading character.
 * @type {number}
 * @private
 */
ppz.photos.LOADING_MAX_OPACITY_ = 0.75;

/**
 * Min opacity of the loading character.
 * @type {number}
 * @private
 */
ppz.photos.LOADING_MIN_OPACITY_ = 0.25;

/**
 * The slideshow interval, in milliseconds.
 * @type {number}
 * @const
 * @private
 */
ppz.photos.INTERVAL_ = 4000;

/**
 * If the photo is being loaded.
 * @type {boolean}
 * @private
 */
ppz.photos.loading_ = false;

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
ppz.photos.currentPhotoIndex_ = 0;

/**
 * The order of photos.
 * @type {Array.<number>}
 * @private
 */
ppz.photos.playlist_ = new Array(ppz.photos.NUM_);

/**
 * The array of image cache, i.e., hidden <img> element.
 * @type {Array.<Element>}
 * @private
 */
ppz.photos.photoCache_ = new Array(ppz.photos.NUM_);

/**
 * The canvas element.
 * @type {Element}
 * @private
 */
ppz.photos.canvasElem_ = null;

/**
 * Elements for loading effect.
 * @type {Array.<Element>}
 * @private
 */
ppz.photos.loadingElems_ = null;

/**
 * Animation frame count.
 * @type {number}
 * @private
 */
ppz.photos.frameCount_ = 0;

/**
 * Updates the loading effect.
 * @private
 */
ppz.photos.updateLoading_ = function() {
  for (var i = 0; i < ppz.photos.LOADING_.length; i++) {
    var opacity = ppz.photos.LOADING_MIN_OPACITY_;
    if (i == ppz.photos.loadingStep_) {
      opacity = ppz.photos.LOADING_MAX_OPACITY_;
    }
    goog.style.showElement(ppz.photos.loadingElems_[i], true);
    goog.style.setOpacity(ppz.photos.loadingElems_[i], opacity);
  }
};

/**
 * The main loop to show loading effect.
 * @private
 */
ppz.photos.loadingLoop_ = function() {
  if (!ppz.photos.loading_) {
    return;
  }
  if (ppz.photos.frameCount_ % 5 == 0) {
    ppz.photos.updateLoading_();
    ppz.photos.loadingStep_++;
    ppz.photos.loadingStep_ %= ppz.photos.LOADING_.length;
  }
  ppz.photos.frameCount_++;
  ppz.util.requestAnimationFrame(ppz.photos.loadingLoop_);
};

/**
 * Gets the URL of the current photo.
 * @return {string} The URL of the photo.
 * @private
 */
ppz.photos.getUrl_ = function() {
  var index = ppz.photos.playlist_[ppz.photos.currentPhotoIndex_];
  var number = goog.string.format('%03d', index);
  var url = 'photos/' + number + '.JPG';
  return url;
};

/**
 * Shows the current photo.
 * @private
 */
ppz.photos.show_ = function() {
  var url = ppz.photos.getUrl_();
  window.console.log(url);
  goog.style.setTransparentBackgroundImage(ppz.photos.canvasElem_, url);
};

/**
 * Starts the loading effect.
 * @private
 */
ppz.photos.startLoading_ = function() {
  if (!ppz.photos.loading_) {
    ppz.photos.loading_ = true;
    ppz.photos.frameCount_ = 0;
    ppz.photos.loadingLoop_();
  }
};

/**
 * Stops the loading effect.
 * @private
 */
ppz.photos.stopLoading_ = function() {
  if (ppz.photos.loading_) {
    for (var i = 0; i < ppz.photos.LOADING_.length; i++) {
      goog.style.showElement(ppz.photos.loadingElems_[i], false);
    }
    ppz.photos.loading_ = false;
  }
};

/**
 * Loads the current photo.
 * @private
 */
ppz.photos.load_ = function() {
  var index = ppz.photos.playlist_[ppz.photos.currentPhotoIndex_];
  if (ppz.photos.photoCache_[index]) {
    // If the cached image already exists, simply set the background of the
    // canvas.
    ppz.photos.show_();
  } else {
    // Otherwise, loads the image in a hidden img element while showing the
    // loading effect.
    ppz.photos.startLoading_();
    var elem = document.createElement('img');
    goog.events.listen(elem, 'load',
                       function() {
                         window.console.log('loaded');
                         ppz.photos.stopLoading_();
                         ppz.photos.show_();
                       });
    elem.src = ppz.photos.getUrl_();
    ppz.photos.photoCache_[index] = elem;
  }
};

/**
 * Suffles the photo list.
 * @private
 */
ppz.photos.shuffle_ = function() {
  for (var i = 0; i < ppz.photos.NUM_; i++) {
    ppz.photos.playlist_[i] = i;
  }
  for (var i = 1; i < ppz.photos.NUM_; i++) {
    var j = Math.floor(Math.random() * (i + 1));
    if (j != i) {
      var tmp = ppz.photos.playlist_[i];
      ppz.photos.playlist_[i] = ppz.photos.playlist_[j];
      ppz.photos.playlist_[j] = tmp;
    }
  }
  window.console.log(ppz.photos.playlist_);
};

/**
 * Inits the slideshow and starts to load photos.
 */
ppz.photos.init = function() {
  ppz.photos.canvasElem_ = document.getElementById('canvas');
  ppz.photos.loadingElems_ = new Array(ppz.photos.LOADING_.length);
  for (var i = 0; i < ppz.photos.LOADING_.length; i++) {
    var elem = document.createElement('div');
    var ch = ppz.photos.LOADING_[i];
    elem.style.position = 'absolute';
    elem.style.top = '230px';
    if (ch == 'I' || ch == '.') {
      elem.style.left = (275 + i * 17 + 5) + 'px';
    } else {
      elem.style.left = (275 + i * 17) + 'px';
    }
    elem.style.fontFamily = 'verdana,helvetica,arial,sans-serif';
    elem.style.fontSize = '30px';
    elem.style.fontWeight = 'bold';
    elem.style.color = 'white';
    elem.innerText = ch;
    goog.style.showElement(elem, false);
    ppz.photos.canvasElem_.appendChild(elem);
    ppz.photos.loadingElems_[i] = elem;
  }
  ppz.photos.currentPhotoIndex_ = 0;
  ppz.photos.shuffle_();
  ppz.photos.load_();
};

goog.exportSymbol('ppz.photos.init', ppz.photos.init);

/**
 * @fileoverview The util functions used by the site.
 */

goog.provide('ppz.util');

/**
 * Array of browser-specific prefix strings for CSS property names.
 * @type {Array.<string>}
 * @const
 */
ppz.util.CSS_BROWSER_PREFIX = [
  'Moz',
  'ms',
  'O',
  'webkit'
];

/**
 * Sets the transform translation and rotation angle of an element.
 * @param {Element} element The element to rotate.
 * @param {number} x The x-axis translation in pixels.
 * @param {number} y The y-axis translation in pixels.
 * @param {number} angle The rotation angle in radians.
 */
ppz.util.setElementTransform = function(element, x, y, angle) {
  var value = '';
  if (x || y) {
    value += 'translate(' + x + 'px,' + y + 'px)';
  }
  if (angle) {
    value += ' rotate(' + angle + 'rad)';
  }
  for (var i = 0, prefix; prefix = ppz.util.CSS_BROWSER_PREFIX[i++];) {
    element.style[prefix + 'Transform'] = value;
  }
};

/**
 * Find the browser's version of window.requestAnimationFrame.
 * @return {function(function())} The browser's version of
 *     window.requestAnimationFrame (or a setTimeout-based fallback).
 * @private
 */
ppz.util.requestAnimationFrameVariant_ = function() {
  var versions = ['requestAnimationFrame',
                  'mozRequestAnimationFrame',
                  'msRequestAnimationFrame',
                  'oRequestAnimationFrame',
                  'webkitRequestAnimationFrame'];

  for (var i = 0; i < versions.length; i++) {
    var requestAnimationFrame = window[versions[i]];

    // This is bound to window to keep Chrome happy, otherwise it throws
    // "TypeError: Illegal invocation."
    if (requestAnimationFrame)
      return goog.bind(requestAnimationFrame, window);
  }

  // Must be on an old browser, fall back to setTimeout at 60 FPS.
  return function(callback) {
    window.setTimeout(callback, 17);
  };
};

/**
 * Cross-browser access to requestAnimationFrame. Don't rely on the time being
 * passed to your callback, as that part of the spec is in flux (Date.now() vs.
 * performance.now()) and the simple fallback below doesn't pass a time at all.
 * @param {!Function} callback The callback to pass to requestAnimationFrame.
 * @return {number} A long integer value that uniquely identifies the entry in
 *     the callback list.
 */
ppz.util.requestAnimationFrame = function(callback) {
  ppz.util.requestAnimationFrame =
      ppz.util.requestAnimationFrameVariant_();

  return ppz.util.requestAnimationFrame(callback);
};

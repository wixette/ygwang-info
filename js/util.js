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

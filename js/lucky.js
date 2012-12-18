/**
 * @fileoverview Transitions the current page to a lucky destination.
 */

goog.provide('ppz.lucky')

goog.require('ppz.util')

ppz.lucky.LUCKY_URL_ = 'http://www.google.com/logos/2010/pacman10-hp.html'

/**
 * Starts the lucky effects.
 */
ppz.lucky.start = function() {
  var elem = document.getElementById('box1');
  ppz.util.setElementTransform(elem, 0, 0, 0.3);
};

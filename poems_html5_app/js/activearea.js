/**
 * @fileoverview The classes representing a rectangle active area in a page.
 */

goog.provide('poems.Action');
goog.provide('poems.ActiveArea');

goog.require('goog.math.Rect');



/**
 * The action type when an active area is clicked/touched.
 * @enum {number}
 */
poems.Action = {
  HOME: 0,  // Go to home page.
  TOC: 1,   // Go to TOC page.
  PREV: 2,  // Go to the previous poem.
  NEXT: 3,  // Go to the next poem.
  GOTO: 4   // Go to a particular poem per its index number.
};



/**
 * @constructor
 */
poems.ActiveArea = function(x, y, w, h, action, opt_poemIndex) {
  /** @type {goog.math.Rect} The rectangle of the area. */
  this.rect = new goog.math.Rect(x, y, w, h);

  /** @type {poems.Action} The rectangle of the area. */
  this.action = action;

  /** @type {number} The poem index when action is poems.Action.GOTO. */
  this.poemIndex = opt_poemIndex || 0;
};

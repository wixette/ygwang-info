/**
 * @fileoverview The classes representing various page types.
 */

goog.provide('poems.Page');
goog.provide('poems.HomePage');
goog.provide('poems.PoemPage');
goog.provide('poems.TocPage');

goog.require('poems.ActiveArea');



/**
 * @constructor
 */
poems.Page = function() {
  /**
   * The extended length of the page. Depending on the text direction of the
   *     page, the length is eitehr the width (for vertical text) or the height
   *     (for horizontal text) of the page canvas. <=0 values indicate that the
   *     page shares the main viewport's width/height.
   * @type {number}
   */
  this.length = 0;

  /**
   * If the text direction of the page is vertical or horizontal.
   * @type {boolean}
   */
  this.isVertical = true;

  /**
   * All clickable/touchable active areas in the page.
   * @type {Array.<poems.ActiveArea>}
   */
  this.activeAreas = [];
};


/**
 * Re-layouts the page. Once re-layout is done, the properties like length,
 *    isVertical,
 * @param {goog.math.Size} viewportSize The size of the main viewport.
 * @private
 */
poems.Page.prototype.layout_ = goog.abstractMethod;


/**
 * Renders the page.
 * @param {goog.math.Size} viewportSize The size of the main viewport.
 * @param {CanvasRenderingContext2D} context The graphics context.
 * @param {number} frameCount The frame count of the main animation loop.
 */
poems.Page.prototype.render = goog.abstractMethod;



/**
 * @constructor
 * @extends {poems.Page}
 */
poems.HomePage = function() {
};
goog.inherits(poems.HomePage, poems.Page);



/**
 * @constructor
 * @extends {poems.Page}
 */
poems.PoemPage = function() {
};
goog.inherits(poems.PoemPage, poems.Page);



/**
 * @constructor
 * @extends {poems.Page}
 */
poems.TocPage = function() {
};
goog.inherits(poems.TocPage, poems.Page);

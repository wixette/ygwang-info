/**
 * @fileoverview The poem rhyme helper.
 */

goog.provide('ppz.helper');

goog.require('goog.History');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.history.EventType');
goog.require('goog.json');
goog.require('goog.labs.net.xhr');
goog.require('goog.net.XhrIo');
goog.require('goog.result');
goog.require('goog.structs.Set');
goog.require('goog.style');
goog.require('ppz.util');


/**
 * The result container.
 * @private {Element}
 */
ppz.helper.result_ = null;


/**
 * The query element.
 * @private {Element}
 */
ppz.helper.query_ = null;


/**
 * The history instance.
 * @private {goog.History}
 */
ppz.helper.history_ = new goog.History();


/**
 * The URL parameters.
 * @private {Object}
 */
ppz.helper.urlParameters_ = {};


/**
 * The valid URL parameter names.
 * @private {Array.<string>}
 * @const
 */
ppz.helper.URL_PARAMETER_NAMES_ = ['q', 'r', 'g'];


/**
 * The JSON path of the rhyme index.
 * @private {string}
 * @const
 */
ppz.helper.JSON_RHYMES_ = 'psy_index_json/rhymes.json';


/**
 * The JSON path of the glyph index.
 * @private {string}
 * @const
 */
ppz.helper.JSON_GLYPHS_ = 'psy_index_json/glyphs.json';


/**
 * The JSON path prefix of the glyph to ref index (per rhyme).
 * @private {string}
 * @const
 */
ppz.helper.JSON_REF_PREFIX_ = 'psy_index_json/ref_';


/**
 * The JSON path suffix of the glyph to ref index (per rhyme).
 * @private {string}
 * @const
 */
ppz.helper.JSON_REF_SUFFIX_ = '.json';


/**
 * The loaded rhymes object.
 * @private {Object}
 */
ppz.helper.psyRhymes_ = null;


/**
 * The loaded glyphs object.
 * @private {Object}
 */
ppz.helper.psyGlyphs_ = null;


/**
 * The cached ref objects (per rhyme).
 * @private {Object}
 */
ppz.helper.psyRefCache_ = {};


/**
 * All rhymes list innerHTML cache.
 * @private {string}
 */
ppz.helper.psyRhymeListCache_ = null;


/**
 * Inits the helper and loads rhymes data.
 */
ppz.helper.init = function() {
  ppz.helper.result_ = document.getElementById('result');
  ppz.helper.query_ = document.getElementById('q');

  // Loads rhymes.json and glyphs.json.
  ppz.helper.query_.disabled = true;
  var resultRhymes = goog.labs.net.xhr.getJson(ppz.helper.JSON_RHYMES_);
  var resultGlyphs = goog.labs.net.xhr.getJson(ppz.helper.JSON_GLYPHS_);
  var combinedResult = goog.result.combine(resultRhymes, resultGlyphs);
  goog.result.waitOnSuccess(combinedResult, function() {
    ppz.helper.psyRhymes_ = resultRhymes.getValue();
    ppz.helper.psyGlyphs_ = resultGlyphs.getValue();
    ppz.helper.query_.disabled = false;
    ppz.helper.query_.focus();
    // Listens to history events and enables the history instance.
    goog.events.listen(ppz.helper.history_, goog.history.EventType.NAVIGATE,
                       ppz.helper.navCallback_);
    // Do this at the end of init, otherwise, navCallback will be called before
    // the rest code linese are executed.
    ppz.helper.history_.setEnabled(true);
 });
};


/**
 * Callback when window history is changed. Do query if necessary.
 * @private
 */
ppz.helper.navCallback_ = function() {
  ppz.helper.loadUrlParameters_();

  var query = ppz.helper.urlParameters_['q'];
  var rhymeId = ppz.helper.urlParameters_['r'];
  var glyph = ppz.helper.urlParameters_['g'];

  if (query) {
    ppz.helper.doQuery_(query);
  } else if (rhymeId) {
    ppz.helper.showRhyme_(rhymeId);
  } else if (glyph) {
    ppz.helper.showGlyphRef_(glyph);
  }

  if (query || rhymeId || glyph) {
    window.scroll(0, 0);
    ppz.helper.query_.focus();
  }
};


/**
 * Handler when the query form is submit.
 */
ppz.helper.onSubmit = function() {
  var q = ppz.helper.query_.value;
  ppz.helper.updateUrlParameters_(q, null, null);
};


/**
 * Loads URL parameters from window.location, then stores the parameters into
 * ppz.helper.urlParameters_.
 * @private
 */
ppz.helper.loadUrlParameters_ = function() {
  var token = ppz.helper.history_.getToken();
  var uri = new goog.Uri();
  // getQuery in updateUrlParameters_ gets encoded query string. Here the
  // encoded parameter must be set to true ot decode the query string correctly.
  uri.setQuery(token, true /* encoded */);
  goog.array.forEach(ppz.helper.URL_PARAMETER_NAMES_, function(name) {
    ppz.helper.urlParameters_[name] = uri.getParameterValue(name);
  });
};


/**
 * Updates Url parameters as well as the browser history.
 * @param {string} query
 * @param {string} rhymeId
 * @param {string} glyph
 * @private
 */
ppz.helper.updateUrlParameters_ = function(query, rhymeId, glyph) {
  ppz.helper.urlParameters_['q'] = query;
  ppz.helper.urlParameters_['r'] = rhymeId;
  ppz.helper.urlParameters_['g'] = glyph;
  var uri = new goog.Uri();
  goog.array.forEach(ppz.helper.URL_PARAMETER_NAMES_, function(name) {
    if (ppz.helper.urlParameters_[name]) {
      uri.setParameterValue(name, ppz.helper.urlParameters_[name]);
    }
  });
  var token = uri.getQuery();
  ppz.helper.history_.setToken(token);
};


/**
 * Does query and shows results.
 * @param {string} query
 * @private
 */
ppz.helper.doQuery_ = function(query) {
  var len = query.length;
  var rhymeIndex = ppz.helper.psyRhymes_.id_to_name;
  var glyphIndex = ppz.helper.psyGlyphs_;
  var sb = [];
  for (var i = 0; i < len; i++) {
    var c = query[i];
    if (glyphIndex[c] && glyphIndex[c][0]) {
      sb.push('<h3>' + c + '</h3>');
      sb.push('<p>');
      goog.array.forEach(glyphIndex[c], function(rhymeId) {
        sb.push('<span class="common">');
        sb.push('<a href="#r=' + rhymeId + '">');
        sb.push(rhymeIndex[rhymeId]);
        sb.push('</a></span> ');
      });
      sb.push('<span class="arrow">');
      sb.push('<a href="#g=' + c + '">&gt;&gt;&gt;');
      sb.push('</a></span></p>');
    }
  }
  var result = sb.join('');
  ppz.helper.result_.innerHTML = result;
};


/**
 * Shows a rhyme or all rhymes.
 * @param {string} rhymeId
 * @private
 */
ppz.helper.showRhyme_ = function(rhymeId) {
  var rhymeList = ppz.helper.psyRhymes_.id_list;
  var rhymeIndex = ppz.helper.psyRhymes_.id_to_name;
  var rhymeGlyphs = ppz.helper.psyRhymes_.id_to_glyphs;

  var sb = [];
  var showAllRhymes = true;
  if (rhymeIndex[rhymeId]) {
    showAllRhymes = false;
    rhymeList = [rhymeId];
  }

  if (ppz.helper.psyRhymeListCache_ && showAllRhymes) {
    ppz.helper.result_.innerHTML = ppz.helper.psyRhymeListCache_;
  } else {
    goog.array.forEach(rhymeList, function(rhymeId) {
      var rhymeName = rhymeIndex[rhymeId];
      sb.push('<h3>' + rhymeName + '</h3>');
      var glyphList = rhymeGlyphs[rhymeId];
      sb.push('<p>');
      goog.array.forEach(glyphList, function(item) {
        var glyph = item[0];
        var isCommon = (item[1] != 0);
        var className = isCommon ? 'common' : 'uncommon';
        sb.push('<span class="' + className + '">');
        sb.push('<a href="#g=' + glyph + '">');
        sb.push(glyph);
        sb.push('</a></span> ');
      });
      sb.push('</p>');
    });
    var result = sb.join('');
    ppz.helper.result_.innerHTML = result;
    if (showAllRhymes) {
      ppz.helper.psyRhymeListCache_ = result;
    }
  }
};


/**
 * Shows ref info for a glyph.
 * @param {string} glyph
 * @private
 */
ppz.helper.showGlyphRef_ = function(glyph) {
  var glyphIndex = ppz.helper.psyGlyphs_;
  if (!glyphIndex[glyph] || !glyphIndex[glyph][0]) {
    return;
  }
  // For showing ref info, only glyph matters. Any rhymeId results in the same
  // ref list.
  var rhymeId = glyphIndex[glyph][0];
  if (!ppz.helper.psyRefCache_[rhymeId]) {
    var uri = ppz.helper.JSON_REF_PREFIX_ + rhymeId +
        ppz.helper.JSON_REF_SUFFIX_;
    var resultRefs = goog.labs.net.xhr.getJson(uri);
    goog.result.waitOnSuccess(resultRefs, function() {
      ppz.helper.psyRefCache_[rhymeId] = resultRefs.getValue();
      ppz.helper.showGlyphRefInternal_(glyph);
    });
  } else {
    ppz.helper.showGlyphRefInternal_(glyph);
  }
};


/**
 * Shows ref info for a glyph after corresponding ref data is loaded.
 * @param {string} glyph
 * @private
 */
ppz.helper.showGlyphRefInternal_ = function(glyph) {
  var rhymeIndex = ppz.helper.psyRhymes_.id_to_name;
  var glyphIndex = ppz.helper.psyGlyphs_;
  var rhymeId = glyphIndex[glyph][0];
  var sb = [];
  sb.push('<h3>' + glyph + '</h3>');
  sb.push('<p>');
  goog.array.forEach(glyphIndex[glyph], function(rhymeId) {
    sb.push('<span class="common">');
    sb.push('<a href="#r=' + rhymeId + '">');
    sb.push(rhymeIndex[rhymeId]);
    sb.push('</a></span> ');
  });
  sb.push('</p>');
  var refs = ppz.helper.psyRefCache_[rhymeId][glyph];
  if (!refs) {
    sb.push('<p>N/A</p>');
  } else {
    sb.push('<p>');
    goog.array.forEach(refs, function(ref) {
      sb.push('<span class="common">' + ref + '</span>');
    });
    sb.push('</p>');
  }
  var result = sb.join('');
  ppz.helper.result_.innerHTML = result;
};


goog.exportSymbol('ppz.helper.init', ppz.helper.init);
goog.exportSymbol('ppz.helper.onSubmit', ppz.helper.onSubmit);

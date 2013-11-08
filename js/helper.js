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
 * The loaded ref objects (per rhyme).
 * @private {Object}
 */
ppz.helper.psyRefs_ = {};


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
      sb.push('</p>');
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
  if (rhymeIndex[rhymeId]) {
    rhymeList = [rhymeId];
  }

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
      sb.push('<a href="#q=' + glyph + '">');
      sb.push(glyph);
      sb.push('</a></span> ');
    });
    sb.push('</p>');
  });
  var result = sb.join('');
  ppz.helper.result_.innerHTML = result;
};


/**
 * Shows ref info for a glyph.
 * @param {string} glyph
 * @private
 */
ppz.helper.showGlyphRef_ = function(glyph) {
  ppz.helper.result_.innerHTML = 'show glyph for ' + glyph;
};


// /**
//  * The main loop to show loading effect.
//  * @private
//  */
// ppz.helper.loadingLoop_ = function() {
//   if (!ppz.helper.loading_) {
//     return;
//   }
//   if (ppz.helper.frameCount_ % 5 == 0) {
//     var msg = ppz.helper.LOADING_;
//     msg = msg.substring(0, ppz.helper.loadingStep_ + 1);
//     ppz.helper.msg_.innerText = msg;
//     ppz.helper.loadingStep_++;
//     ppz.helper.loadingStep_ %= ppz.helper.LOADING_.length;
//   }
//   ppz.helper.frameCount_++;
//   ppz.util.requestAnimationFrame(ppz.helper.loadingLoop_);
// };

// /**
//  * Shows canvas or not.
//  * @param {boolean} visible Shows canvas or not.
//  * @private
//  */
// ppz.helper.showCanvas_ = function(visible) {
//   goog.style.showElement(ppz.helper.canvas_, visible);
//   goog.dom.removeChildren(ppz.helper.msg_);
//   goog.style.showElement(ppz.helper.msg_, !visible);
//   if (visible) {
//     ppz.helper.query_.focus();
//   }
// };

// /**
//  * Reports error to users.
//  * @param {string} msg The error message.
//  * @private
//  */
// ppz.helper.error_ = function(msg) {
//   ppz.helper.showCanvas_(false);
//   ppz.helper.loading_ = false;
//   ppz.helper.msg_.innerText = msg;
// };

// /**
//  * Callback when JSON data arrives.
//  * @private
//  */
// ppz.helper.onData_ = function() {
//   ppz.helper.loading_ = false;
//   var jsonText = null;
//   if (ppz.helper.request_.isSuccess() &&
//       (jsonText = ppz.helper.request_.getResponseText()) &&
//       (ppz.helper.data_ = goog.json.parse(jsonText))) {
//     ppz.util.setLocalStorageValue(ppz.helper.DATA_URL_, jsonText);
//     ppz.helper.showCanvas_(true);
//   } else {
//     ppz.helper.error_('Failed to load the data.');
//   }
// };


//   // var localData = ppz.util.getLocalStorageString(ppz.helper.DATA_URL_);
//   // if (localData && (ppz.helper.data_ = goog.json.parse(localData))) {
//   //   ppz.helper.showCanvas_(true);
//   // } else {
//   //   ppz.helper.showCanvas_(false);
//   //   ppz.helper.request_ = new goog.net.XhrIo();
//   //   goog.events.listen(ppz.helper.request_, 'complete',
//          ppz.helper.onData_);
//   //   ppz.helper.request_.send(ppz.helper.DATA_URL_);
//   //   ppz.helper.frameCount_ = 0;
//   //   ppz.helper.loading_ = true;
//   //   ppz.helper.loadingLoop_();
//   // }


// /**
//  * Searches on the input.
//  * @param {string} q The query.
//  */
// ppz.helper.query = function(q) {
//   var len = q.length;
//   var charTable = ppz.helper.data_['POETRY_INDEX'];
//   var rhymeMapping = ppz.helper.data_['RHYMES_NAME_MAPPING'];
//   var validChars = new goog.structs.Set();
//   var result = [];
//   for (var i = 0; i < len; i++) {
//     var c = q[i];
//     if (charTable[c] && charTable[c][0] && !validChars.contains(c)) {
//       validChars.add(c);
//       var rhymes = charTable[c][0].split(',');
//       var phrases = charTable[c][1];
//       result.push('<h3>' + c + '</h3>');
//       result.push('<p>韵部：');
//       for (var j = 0; j < rhymes.length; j++) {
//         var rhyme = rhymes[j];
//         if (j > 0) {
//           result.push('，');
//         }
//         ids = rhymeMapping[rhyme];
//         result.push('<a href="#" onclick="ppz.helper.showRhyme(' + ids[0] +
//             ',' + ids[1] + ');return false;">');
//         result.push(rhyme);
//         result.push('</a>');
//       }
//       result.push('</p>');
//       if (phrases) {
//         result.push('<p>' + phrases.replace(/,/g, ', ') + '</p>');
//       }
//     }
//   }
//   if (!validChars.isEmpty()) {
//     ppz.helper.result_.innerHTML = result.join('');
//   }
// };

// /**
//  * Lists all rhymes.
//  */
// ppz.helper.showAllRhymes = function() {
//   var rhymeList = ppz.helper.data_['RHYMES_LIST'];
//   var rhymeMapping = ppz.helper.data_['RHYMES_NAME_MAPPING'];
//   var result = [];
//   var len = rhymeList.length;
//   for (var i = 0; i < len; i++) {
//     ids = rhymeMapping[rhymeList[i]];
//     result.push(ppz.helper.getRhymeHtml_(ids[0], ids[1]));
//   }
//   ppz.helper.result_.innerHTML = result.join('');
// };

// /**
//  * Shows a specified rhyme.
//  * @param {number} category Category id.
//  * @param {number} rhyme Rhyme id.
//  */
// ppz.helper.showRhyme = function(category, rhyme) {
//   ppz.helper.result_.innerHTML = ppz.helper.getRhymeHtml_(category, rhyme);
// };

// /**
//  * Gets HTML content for a specified rhyme.
//  * @param {number} category Category id.
//  * @param {number} rhyme Rhyme id.
//  * @return {string} The HTML string.
//  * @private
//  */
// ppz.helper.getRhymeHtml_ = function(category, rhyme) {
//   var rhymeIdMapping = ppz.helper.data_['RHYMES_ID_MAPPING'];
//   var rhymeTable = ppz.helper.data_['RHYMES_TABLE'];
//   var key = category + '_' + rhyme;
//   var rhyme = rhymeIdMapping[key];
//   var content = rhymeTable[rhyme];
//   content = content.replace(/#(.)=/g,
//       '<a href="#" onclick="ppz.helper.query(\'$1\');return false;">$1</a>');
//   content = content.replace(/,/g, ', ');
//   return '<h3>' + rhyme + '</h3><p>' + content + '</p>';
// };

goog.exportSymbol('ppz.helper.init', ppz.helper.init);
goog.exportSymbol('ppz.helper.query', ppz.helper.query);
goog.exportSymbol('ppz.helper.showRhyme', ppz.helper.showRhyme);
goog.exportSymbol('ppz.helper.showAllRhymes', ppz.helper.showAllRhymes);
goog.exportSymbol('ppz.helper.onSubmit', ppz.helper.onSubmit);

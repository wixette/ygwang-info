/**
 * @fileoverview The poem rhyme helper.
 */

goog.provide('ppz.helper');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.structs.Set');
goog.require('goog.style');
goog.require('ppz.util');

/**
 * The msg container.
 * @type {Element}
 * @private
 */
ppz.helper.msg_ = null;

/**
 * The canvas container.
 * @type {Element}
 * @private
 */
ppz.helper.canvas_ = null;

/**
 * The result container.
 * @type {Element}
 * @private
 */
ppz.helper.result_ = null;

/**
 * The query element.
 * @type {Element}
 * @private
 */
ppz.helper.query_ = null;

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
    ppz.helper.msg_.innerText = msg;
    ppz.helper.loadingStep_++;
    ppz.helper.loadingStep_ %= ppz.helper.LOADING_.length;
  }
  ppz.helper.frameCount_++;
  ppz.util.requestAnimationFrame(ppz.helper.loadingLoop_);
};

/**
 * Shows canvas or not.
 * @param {boolean} visible Shows canvas or not.
 * @private
 */
ppz.helper.showCanvas_ = function(visible) {
  goog.style.showElement(ppz.helper.canvas_, visible);
  goog.dom.removeChildren(ppz.helper.msg_);
  goog.style.showElement(ppz.helper.msg_, !visible);
  ppz.helper.query_.focus();
};

/**
 * Reports error to users.
 * @param {string} msg The error message.
 * @private
 */
ppz.helper.error_ = function(msg) {
  ppz.helper.showCanvas_(false);
  ppz.helper.loading_ = false;
  ppz.helper.msg_.innerText = msg;
};

/**
 * Callback when JSON data arrives.
 * @private
 */
ppz.helper.onData_ = function() {
  ppz.helper.loading_ = false;
  if (ppz.helper.request_.isSuccess() &&
      (ppz.helper.data_ = ppz.helper.request_.getResponseJson())) {
    ppz.helper.showCanvas_(true);
  } else {
    ppz.helper.error_('Failed to load the data.');
  }
};

/**
 * Inits the helper and loads rhymes data.
 */
ppz.helper.init = function() {
  ppz.helper.msg_ = document.getElementById('msg');
  ppz.helper.canvas_ = document.getElementById('canvas');
  ppz.helper.result_ = document.getElementById('result');
  ppz.helper.query_ = document.getElementById('q');
  ppz.helper.showCanvas_(false);

  ppz.helper.request_ = new goog.net.XhrIo();
  goog.events.listen(ppz.helper.request_, 'complete', ppz.helper.onData_);

  ppz.helper.request_.send(ppz.helper.DATA_URL_);

  ppz.helper.frameCount_ = 0;
  ppz.helper.loading_ = true;
  ppz.helper.loadingLoop_();
};

/**
 * Handler when the query form is submit.
 */
ppz.helper.onSubmit = function() {
  var q = ppz.helper.query_.value;
  ppz.helper.query(q);
};

/**
 * Searches on the input.
 * @param {string} q The query.
 */
ppz.helper.query = function(q) {
  var len = q.length;
  var charTable = ppz.helper.data_['POETRY_INDEX'];
  var rhymeMapping = ppz.helper.data_['RHYMES_NAME_MAPPING'];
  var validChars = new goog.structs.Set();
  var result = '';
  for (var i = 0; i < len; i++) {
    var c = q[i];
    if (charTable[c] && charTable[c][0] && !validChars.contains(c)) {
      validChars.add(c);
      var rhymes = charTable[c][0].split(',');
      var phrases = charTable[c][1];
      result += '<h3>' + c + '</h3>';
      result += '<p>韵部：';
      for (var j = 0; j < rhymes.length; j++) {
        var rhyme = rhymes[j];
        if (j > 0) {
          result += '，';
        }
        ids = rhymeMapping[rhyme];
        result += '<a href="#" onclick="ppz.helper.showRhyme(' + ids[0] + ',' +
            ids[1] + ');return false;">';
        result += rhyme;
        result += '</a>';
      }
      result += '</p>';
      if (phrases) {
        result += '<p>' + phrases.replace(/,/g, ', ') + '</p>';
      }
    }
  }
  if (!validChars.isEmpty()) {
    ppz.helper.result_.innerHTML = result;
    ppz.helper.query_.focus();
  }
};

/**
 * Lists all rhymes.
 */
ppz.helper.showAllRhymes = function() {
  var rhymeList = ppz.helper.data_['RHYMES_LIST'];
  var rhymeMapping = ppz.helper.data_['RHYMES_NAME_MAPPING'];
  var result = '';
  var len = rhymeList.length;
  for (var i = 0; i < len; i++) {
    ids = rhymeMapping[rhymeList[i]];
    result += ppz.helper.getRhymeHtml_(ids[0], ids[1]);
  }
  ppz.helper.result_.innerHTML = result;
  ppz.helper.query_.focus();
};

/**
 * Shows a specified rhyme.
 * @param {number} category Category id.
 * @param {number} rhyme Rhyme id.
 */
ppz.helper.showRhyme = function(category, rhyme) {
  ppz.helper.result_.innerHTML = ppz.helper.getRhymeHtml_(category, rhyme);
  ppz.helper.query_.focus();
};

/**
 * Gets HTML content for a specified rhyme.
 * @param {number} category Category id.
 * @param {number} rhyme Rhyme id.
 * @return {string} The HTML string.
 * @private
 */
ppz.helper.getRhymeHtml_ = function(category, rhyme) {
  var rhymeIdMapping = ppz.helper.data_['RHYMES_ID_MAPPING'];
  var rhymeTable = ppz.helper.data_['RHYMES_TABLE'];
  var key = category + '_' + rhyme;
  var rhyme = rhymeIdMapping[key];
  var content = rhymeTable[rhyme];
  content = content.replace(/#(.)=/g,
      '<a href="#" onclick="ppz.helper.query(\'$1\');return false;">$1</a>');
  content = content.replace(/,/g, ', ');
  return '<h3>' + rhyme + '</h3><p>' + content + '</p>';
};

goog.exportSymbol('ppz.helper.init', ppz.helper.init);
goog.exportSymbol('ppz.helper.query', ppz.helper.query);
goog.exportSymbol('ppz.helper.showRhyme', ppz.helper.showRhyme);
goog.exportSymbol('ppz.helper.showAllRhymes', ppz.helper.showAllRhymes);
goog.exportSymbol('ppz.helper.onSubmit', ppz.helper.onSubmit);

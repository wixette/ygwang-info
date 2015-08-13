/**
 * @fileoverview Accepts plain text format, converts it to HTML block which can
 * be put into a &lt;div&gt; container.
 *
 * Expected input format:
 *
 * Title
 * Author/Date
 * (optional) [Notes/Comments]
 * Content
 *
 * Sample output:
 *
 * &lt;p class="poem-title"&gt;Title
 * &lt;p class="poem-info"&gt;Author/Date
 * &lt;p class="poem-notes"&gt;Notes/Comments
 * &lt;p class="poem-content"&gt;Content
 * &lt;p class="poem-content"&gt;...
 */


var poemFormatter = poemFormatter || {};


/**
 * Normalizes spaces in a plain-text line.
 *
 * 1) Trims all trailing spaces.
 * 2) Replaces each ASCII space pair '\u0020\u0020' with one CJK space '\u3000'.
 * 3) Replaces single ASCII space '\u0020' with one NBSP '\u00A0'.
 */
poemFormatter.normalizeSpaces_ = function(line) {
  line = line.replace(/\s+$/, '');
  line = line.replace(/\u0020\u0020/g, '\u3000');
  line = line.replace(/\u0020/, '\u00A0');
  return line;
};


/**
 * Splits the text into lines.
 */
poemFormatter.getLines_ = function(text) {
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  var lines = text.split('\n');
  var size = lines.length;
  for (var i = 0; i < size; i++) {
    lines[i] = poemFormatter.normalizeSpaces_(lines[i]);
  }
  return lines;
};


/**
 * Counts the number of non-punctuation CJK characters for each line.
 */
poemFormatter.countCjkChars_ = function(lines) {
  var CJK_REGEX_ = /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/;
  var counts = [];
  var size = lines.length;
  for (var i = 0; i < size; i++) {
    var line = lines[i];
    var len = line.length;
    var count = 0;
    for (var j = 0; j < len; j++) {
      if (line[j].match(CJK_REGEX_)) {
        count++;
      }
    }
    counts.push(count);
  }
  return counts;
};


/**
 * Calculates the maximum number of CJK characters that can be put in a single
 * line.
 */
poemFormatter.calcMaxCjkCharsPerLine_ = function(width,
                                                 fontSize,
                                                 letterSpacing) {
  return Math.floor(width / (fontSize + letterSpacing));
};


/**
 * Formats the given plain text into HTML string. All units are in pixel.
 */
poemFormatter.format = function(text,
                                width,
                                fontSize,
                                lineHeight,
                                letterSpacing) {
  var maxCjkCharsPerLine = poemFormatter.calcMaxCjkCharsPerLine_(width,
                                                                 fontSize,
                                                                 letterSpacing);
  var lines = poemFormatter.getLines_(text);
  var cjkCounts = poemFormatter.countCjkChars_(lines);

  window.console.log([maxCjkCharsPerLine, cjkCounts]);

  return '<p>' + lines.join('<p>');
};

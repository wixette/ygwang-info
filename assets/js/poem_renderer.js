const _SPACES_AND_PUNCTUATIONS_PAT = /[\s,.:;'"?!\-<>\[\]\{\}，。：；‘’“”？！—…《》【】（）「」]+/

class PoemRenderer {
  render() {
    let poemElements = document.getElementsByClassName('poem');
    if (poemElements.length !== 0) {
      for (let poemElement of poemElements) {
        const codeElement = poemElement.children[0].children[0];
        const poemText = codeElement.innerText;
        if (this.isTraditionalPoem(poemText)) {
          this.renderTraditionalPoem(poemElement, poemText);
        }
      }
    }
  }

  parseSentences(poemText) {
    const lines = poemText.split(_SPACES_AND_PUNCTUATIONS_PAT);
    const sentences = lines.map(line => line.trim()).filter(line => line.length > 0);
    return sentences;
  }

  isTraditionalPoem(poemText) {
    const lengthHistogram = new Map();
    const sentences = this.parseSentences(poemText);
    for (let sentence of sentences) {
      if (lengthHistogram.has(sentence.length)) {
        lengthHistogram.set(sentence.length, lengthHistogram.get(sentence.length) + 1);
      } else {
        lengthHistogram.set(sentence.length, 1);
      }
    }
    let highestRankedLength = -1;
    let highestRankedCount = -1;
    for (let [length, count] of lengthHistogram) {
      if (count > highestRankedCount) {
        highestRankedCount = count;
        highestRankedLength = length;
      }
    }
    return [4, 5, 6, 7].includes(highestRankedLength) && highestRankedCount / sentences.length >= 0.8;
  }

  renderTraditionalPoem(poemElement, poemText) {
    const codeElement = poemElement.children[0].children[0];
    const buf = [];
    [...poemText].forEach(c => {
      if (c === '\n') {
        buf.push('<br>');
      } else if (c.match(_SPACES_AND_PUNCTUATIONS_PAT)) {
        buf.push('<span>');
        buf.push(c);
        buf.push('</span>');
      } else {
        buf.push('<span class="letter">');
        buf.push(c);
        buf.push('</span>');
      }
    });
    codeElement.innerHTML = buf.join('');
  }
}

new PoemRenderer().render();

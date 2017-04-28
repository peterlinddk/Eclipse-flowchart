// Some browsers don't accept .getTotalLength on lines, so add
// a new method to the prototype ...
if( ! SVGLineElement.prototype.getTotalLength ) {
    SVGLineElement.prototype.getTotalLength = function() {
        var x1 = this.x1.baseVal.value;
        var x2 = this.x2.baseVal.value;
        var y1 = this.y1.baseVal.value;
        var y2 = this.y2.baseVal.value;

        var dist = Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1) );

        return dist;
    }
}

// I want to be able to foreach over a document.selectorAll
if( ! NodeList.prototype.forEach ) {
    // Probably highly dangerous - but works in Edge
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// DOM childnode ReplaceWith
// from: https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/replaceWith()/replaceWith().md
(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('replaceWith')) {
      return;
    }
    Object.defineProperty(item, 'replaceWith', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function replaceWith() {
        var argArr = Array.prototype.slice.call(arguments),
          docFrag = document.createDocumentFragment();

        argArr.forEach(function (argItem) {
          var isNode = argItem instanceof Node;
          docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
        });

        this.parentNode.replaceChild(docFrag, this);
      }
    });
  });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

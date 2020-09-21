const factory = require('marko-scoped-css/factory.js');

const isDebug = require('marko/env').isDebug;
let compiler, HtmlElement;
if (isDebug) {
  compiler = require('marko/src/compiler');
  HtmlElement = require('marko/src/compiler/ast/HtmlElement');
} else {
  compiler = require('marko/dist/compiler');
  HtmlElement = require('marko/dist/compiler/ast/HtmlElement');
}

module.exports = factory({ compiler, HtmlElement });

# marko-scoped-css

Scoped css for [marko](https://www.npmjs.com/package/marko) like a [vue.js](https://www.npmjs.com/package/vue) and [svelte](https://www.npmjs.com/package/svelte). It uses two methods: ':global' and ':scoped'. It also supports 'scss', 'sass', 'less' and 'stylus'.

> 'marko-scoped-css' only works if the styles were written in a '.marko' file.
> If you wrote them in a separate file ('style.css' or 'style.less'), nothing will happen.
> Why is this? Because these files are compiled after the component tree has been created. And I do not know how to do otherwise. If you know , I will be happy to help.

## How it work:

By default, all styles have a type ':scoped'. The method ':global {...}' or ':global(.class)' will not be prefixed. Inside the method ':global', you can use the method ':scoped' to re-add prefixes.

> button.marko

```marko
style.less {
  button.button-red {
    color: red;

    :global(span) {
      color: green;
    }
  }

  :global {
    button.button-green {
      color: green;

      :scoped(span) {
        color: red;
      }
    }
  }
}

button
  -- Button
  span -- Span

```

It will turn into this:

```marko
style {
  button.button-red[data-180anlz] {
    color: red;
  }

  button.button-red[data-180anlz] span {
    color: green;
  }

  button.button-green {
    color: green;
  }

  button.button-green span[data-180anlz] {
    color: red;
  }
}

button data-180anlz=true
  -- Button
  span data-180anlz=true -- Span
```

## Installation:

```bash
yarn add marko-scoped-css ## npm i marko-scoped-css

yarn add sass ## if you use 'sass' or 'scss'
yarn add less ## if you use 'less'
yarn add stylus ## if you use 'stylus'
```

# How to use:

Add this to the root directory of your project or to the components directory where you want to use 'scoped styles'.

> ./marko.json

```json
{
  "transformer": ["marko-scoped-css"]
}
```

## Node:

If you are using different versions of the 'marko', for example, you are using a [lerna](https://www.npmjs.com/package/lerna), and the transformer doesn't work, do this:

#### Copy the file 'transformer-scoped-css.js' from 'marko-scoped-css'

> ./src/transformers/transformer-scoped-css.js

```javascript
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

module.exports = factory({
  prefix: 'css-', // Default: 'data-'
  compiler,
  HtmlElement,
  sass: require('sass'), // If sass or scss doesn't work
  less: require('less'), // If less doesn't work
  stylus: require('stylus') // If stylus doesn't work
});
```

> ./marko.json

```json
{
  "transformer": ["./src/transformers/transformer-scoped-css.js"]
}
```

## Lisence

MIT

// https://github.com/sveltejs/svelte/blob/master/src/compiler/compile/utils/hash.ts
function hash(str) {
  str = str.replace(/\r/g, '');
  let hash = 5381;
  let i = str.length;
  while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

module.exports = function factory({
  prefix = 'data-',
  hasher = hash,
  compiler,
  HtmlElement,
  sass,
  less,
  stylus
} = {}) {
  if (!compiler || !HtmlElement) {
    throw new Error('"compiler" and "HtmlElement" is required!');
  }

  const cssTree = require('css');

  function compileStyle(data, type) {
    let compiler,
      code = data;

    if (type === 'sass' || type === 'scss') {
      compiler = sass || require('sass');
      code = compiler.renderSync({ data }).css.toString();
    } else if (type === 'less') {
      compiler = less || require('less');
      compiler.render(data, { sync: true }, (err, res) => (code = res.css));
    } else if (type === 'styl' || type === 'stylus') {
      compiler = stylus || require('stylus');
      code = compiler(data).render();
    }

    return code;
  }

  function transformer(node, context) {
    const hashID = prefix + hasher(context.filename);
    // console.log('marko-scoped-css', context.filename);

    let walker;
    let is_scoped = false;

    walker = compiler.createWalker({
      enter: (node, parent) => {
        if (node.tagName === 'style' && node.tagString !== 'style') {
          // console.log('enter', node.tagName, node);

          const co = node.tagString.trim();
          const data = co.slice(co.indexOf('{') + 1, co.lastIndexOf('}'));
          const type = co.slice(6, co.indexOf('{')).trim();
          const code = compileStyle(data, type);

          // console.log('compiled-css:\n\n' + code);

          const modifyCss = node => {
            if (Array.isArray(node.rules)) {
              node.rules.forEach(v => modifyCss(v));
            }

            if (node.type === 'rule' && node.selectors) {
              node.selectors.forEach((className, k, a) => {
                let is_global = false;

                const classes = className.split(/\s+/g);
                classes.forEach((v, k, a) => {
                  if (!v[0].match(/\w|\.|\:|\#/)) return;

                  if (v === ':global' || v === ':scoped') {
                    is_global = v === ':global';
                    a.splice(k, 1, '');
                    return true;
                  }

                  if (
                    v.indexOf(':global(') === 0 ||
                    v.indexOf(':scoped(') === 0
                  ) {
                    if (v[v.length - 1] !== ')') {
                      v += ')';
                      const t = v.slice(0, 8);
                      a.some((v2, k2) => {
                        if (k2 <= k) return false;
                        a.splice(k2, 1, t + v);
                        if (v2[v2.length - 1] === ')') return true;
                      });
                    }

                    if (v.indexOf(':global(') === 0) {
                      a.splice(k, 1, v.slice(8, -1));
                    } else {
                      is_scoped = true;
                      a.splice(k, 1, v.slice(8, -1) + `[${hashID}]`);
                    }

                    return false;
                  }

                  if (!is_global) {
                    is_scoped = true;
                    a.splice(k, 1, v + `[${hashID}]`);
                  }
                });

                a.splice(k, 1, classes.filter(v => v).join(' '));
              });
            }
          };

          const cssAst = cssTree.parse(code);
          modifyCss(cssAst.stylesheet);

          const cssNew = cssTree.stringify(cssAst);
          // console.log('scoped-css:\n\n' + cssNew);
          node.tagString = `style {\n${cssNew}\n}`;
          const cssOld = co
            .slice(co.indexOf('{'), co.lastIndexOf('}') + 1)
            .trim();
          let index = -1;
          node.attributes.forEach((attr, k) => {
            if (attr.name === 'class') index = k;
            if (typeof attr.name === 'string' && attr.name.trim() === cssOld) {
              attr.name = `{\n${cssNew}\n}`;
            }
          });
          if (index >= 0) node.attributes.splice(index, 1);
        }
      }
    });
    walker.walk(node);

    if (!is_scoped) return;

    walker = compiler.createWalker({
      enter: node => {
        if (node instanceof HtmlElement && node.tagName !== 'style') {
          node.setAttributeValue(hashID, 'true');
        }
      }
    });
    walker.walk(node);
  }

  return transformer;
};

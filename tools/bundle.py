#!/usr/bin/env python3
import os
import re

BASE = 'src/js'
ENTRY = './main.js'

def gather_files(base):
    files = []
    for root, dirs, filenames in os.walk(base):
        for f in filenames:
            if f.endswith('.js'):
                rel = os.path.join(root, f)
                relp = './' + os.path.relpath(rel, base).replace('\\', '/')
                files.append(relp)
    return sorted(files)

def transform_source(src):
    exports = []

    def replace_func(m):
        name = m.group(1)
        exports.append(name)
        return 'function %s(' % name

    src = re.sub(r'export\s+function\s+(\w+)\s*\(', replace_func, src)
    # capture exported variables (const/let/var) so we can add them to exports
    def replace_var(m):
        kind = m.group(1)
        name = m.group(2)
        exports.append(name)
        return f"{kind} {name} "
    src = re.sub(r'export\s+(const|let|var)\s+(\w+)\s*', replace_var, src)

    def replace_named(m):
        names = [n.strip() for n in m.group(1).split(',')]
        for n in names:
            exports.append(n)
        return ''

    src = re.sub(r'export\s*\{([^}]+)\}\s*;?', replace_named, src)
    src = re.sub(r'export\s+default\s+', '/* export default removed */ ', src)

    def repl_import(m):
        names = m.group(1).strip()
        path = m.group(2)
        return 'const { %s } = require("%s");' % (names, path)

    src = re.sub(r'import\s*\{([^}]+)\}\s*from\s*["\']([^"\']+)["\'];?', repl_import, src)
    src = re.sub(r'import\s+(\w+)\s+from\s+["\']([^"\']+)["\'];?', lambda m: 'const %s = require("%s");' % (m.group(1), m.group(2)), src)

    if exports:
        src += '\n\n// Exports\n'
        for name in exports:
            src += 'exports.%s = %s;\n' % (name, name)

    return src

def build_bundle():
    files = gather_files(BASE)
    modules = {}
    for relp in files:
        path = os.path.join(BASE, relp[2:])
        with open(path, 'r', encoding='utf-8') as fh:
            src = fh.read()
        modules[relp] = transform_source(src)

    out = []
    out.append('(function(){')
    out.append('var __modules = {};')
    out.append('var __cache = {};')
    out.append('function __require(name){')
    out.append('  if(__cache[name]) return __cache[name].exports;')
    out.append('  var module = {exports:{}};')
    out.append('  __cache[name]=module;')
    out.append('  __modules[name](__require,module,module.exports);')
    out.append('  return module.exports;')
    out.append('}')

    for k, src in modules.items():
        out.append("__modules['%s'] = function(require,module,exports){\n%s\n};" % (k, src))

    out.append("__require('%s');" % ENTRY)
    out.append('})();')

    bundle = '\n'.join(out)
    outpath = 'static/script.js'
    with open(outpath, 'w', encoding='utf-8') as fh:
        fh.write(bundle)
    print('WROTE', outpath, 'size=', os.path.getsize(outpath))

if __name__ == '__main__':
    build_bundle()

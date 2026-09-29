import path from 'node:path';
const allowed = {
  domain: ['domain'],
  application: ['application', 'domain'],
  infrastructure: ['infrastructure', 'application', 'domain'],
  presentation: ['presentation', 'application', 'domain'],
  demo: ['demo'],
  bootstrap: ['bootstrap', 'demo', 'infrastructure', 'presentation', 'application', 'domain'],
};
export default {
  meta: {
    type: 'problem',
    schema: [],
    messages: { boundary: 'Disallowed dependency from {{from}} to {{target}}.' },
  },
  create(context) {
    const filename = context.filename;
    const root = path.resolve('src');
    const from = path.relative(root, filename).split(path.sep)[0];
    if (!allowed[from]) return {};
    function inspect(node) {
      const source = node.source?.value;
      if (typeof source !== 'string') return;
      const resolved = source.startsWith('.')
        ? path.resolve(path.dirname(filename), source)
        : source.startsWith('@/')
          ? path.join(root, source.slice(2))
          : null;
      const target = resolved ? path.relative(root, resolved).split(path.sep)[0] : 'external';
      if (allowed[from].includes(target)) return;
      if (target === 'external' && !['domain', 'application', 'demo'].includes(from)) return;
      context.report({ node, messageId: 'boundary', data: { from, target: source } });
    }
    return {
      ImportDeclaration: inspect,
      ExportNamedDeclaration: inspect,
      ExportAllDeclaration: inspect,
      ImportExpression: inspect,
    };
  },
};

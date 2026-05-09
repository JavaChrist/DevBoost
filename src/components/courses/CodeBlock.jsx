// Bloc de code inline avec coloration légère (pas de dep externe).
// Supporte js/jsx/html/css. Suffisant pour des snippets pédagogiques courts.

const ESC = (s) => s.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);

const KW_JS = new Set([
  'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'typeof',
  'import', 'export', 'from', 'default', 'class', 'extends', 'try', 'catch',
  'throw', 'await', 'async', 'true', 'false', 'null', 'undefined',
]);

function highlight(code, lang) {
  // Tokens simples : on traite strings, comments, numbers, keywords, props, balises HTML/CSS.
  // Approche : on remplace par des spans HTML directement (entrée déjà escape).
  let src = ESC(code);

  if (lang === 'html' || lang === 'jsx') {
    src = src.replace(
      /(&lt;\/?)([\w-]+)/g,
      '$1<span class="t-tag">$2</span>',
    );
    src = src.replace(/([\w-]+)=(&quot;|")([^"]*?)(&quot;|")/g,
      '<span class="t-attr">$1</span>=<span class="t-str">$2$3$4</span>');
  }

  if (lang === 'css') {
    src = src.replace(/([.#]?[\w-]+)\s*\{/g,
      '<span class="t-tag">$1</span> {');
    src = src.replace(/([\w-]+)\s*:/g,
      '<span class="t-attr">$1</span>:');
  }

  if (lang === 'js' || lang === 'jsx') {
    // Strings (basique, pas de gestion des escapes complexes)
    src = src.replace(/('([^']*)'|`([^`]*)`)/g, '<span class="t-str">$1</span>');
    // Numbers
    src = src.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="t-num">$1</span>');
    // Comments (lignes)
    src = src.replace(/(\/\/[^\n]*)/g, '<span class="t-com">$1</span>');
    // Mots-clés
    src = src.replace(/\b(\w+)\b/g, (m) =>
      KW_JS.has(m) ? `<span class="t-kw">${m}</span>` : m,
    );
  }

  return src;
}

export default function CodeBlock({ code, lang = 'js' }) {
  const html = highlight(code, lang);
  return (
    <pre
      className="overflow-x-auto rounded-lg bg-slate-950/80 p-3 text-[12px] leading-relaxed ring-1 ring-slate-800"
      aria-label={`Bloc de code ${lang}`}
    >
      <code
        className="font-mono text-slate-200"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
}

// Utilitários para a descrição rica dos cards.
// A descrição agora é armazenada como HTML (gerado pelo editor WYSIWYG).
// Cards antigos foram salvos em markdown simples (**negrito**, "- ", "1. "),
// então convertemos markdown -> HTML na hora de exibir/editar.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Converte **negrito** dentro de um trecho já escapado.
function inlineBold(escaped: string): string {
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// Converte o markdown simples que a antiga barra de ferramentas gerava em HTML.
export function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) { out.push(`</${listType}>`); listType = null; }
  };

  for (const raw of lines) {
    const bullet = raw.match(/^\s*-\s+(.*)$/);
    const ordered = raw.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet) {
      if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
      out.push(`<li>${inlineBold(escapeHtml(bullet[1]))}</li>`);
    } else if (ordered) {
      if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
      out.push(`<li>${inlineBold(escapeHtml(ordered[1]))}</li>`);
    } else {
      closeList();
      out.push(`<div>${raw ? inlineBold(escapeHtml(raw)) : '<br>'}</div>`);
    }
  }
  closeList();
  return out.join('');
}

// Detecta se a string já é HTML (do editor novo) ou markdown/plano (dados antigos).
function looksLikeHtml(s: string): boolean {
  return /<(strong|b|em|i|u|ul|ol|li|div|p|br)\b/i.test(s);
}

// Garante HTML pronto para exibir, venha de onde vier.
export function toHtml(desc: string): string {
  if (!desc) return '';
  if (looksLikeHtml(desc)) return desc;
  return markdownToHtml(desc);
}

/**
 * Utilitário para sanitizar HTML e prevenir XSS
 * Remove scripts, eventos e tags perigosas
 */

// Tags permitidas (whitelist)
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'ul', 'ol', 'li', 'a', 'span', 'div', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

// Atributos permitidos por tag
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target', 'rel'],
  'span': ['style'],
  'div': ['style'],
  'p': ['style'],
  'td': ['style', 'colspan', 'rowspan'],
  'th': ['style', 'colspan', 'rowspan'],
};

// Protocolos permitidos em links
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Remove tags e atributos não permitidos
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Cria elemento temporário para parsing
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Função recursiva para limpar elementos
  function cleanElement(element: Element): void {
    const tagName = element.tagName.toLowerCase();

    // Remove tags não permitidas
    if (!ALLOWED_TAGS.includes(tagName)) {
      element.remove();
      return;
    }

    // Remove atributos não permitidos
    const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || [];
    Array.from(element.attributes).forEach((attr) => {
      const attrName = attr.name.toLowerCase();

      // Remove atributos de eventos (onclick, onerror, etc)
      if (attrName.startsWith('on')) {
        element.removeAttribute(attr.name);
        return;
      }

      // Remove atributos não permitidos
      if (!allowedAttrs.includes(attrName)) {
        element.removeAttribute(attr.name);
        return;
      }

      // Validação especial para href
      if (attrName === 'href') {
        const href = attr.value.trim().toLowerCase();

        // Remove javascript: e data: URIs
        if (href.startsWith('javascript:') || href.startsWith('data:')) {
          element.removeAttribute('href');
          return;
        }

        // Verifica protocolo permitido
        try {
          const url = new URL(href, window.location.origin);
          if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
            element.removeAttribute('href');
          }
        } catch {
          // URL inválida, remove
          element.removeAttribute('href');
        }
      }

      // Validação para style (remove expressões perigosas)
      if (attrName === 'style') {
        const style = attr.value.toLowerCase();
        if (
          style.includes('expression') ||
          style.includes('javascript:') ||
          style.includes('import') ||
          style.includes('behavior')
        ) {
          element.removeAttribute('style');
        }
      }
    });

    // Processa filhos recursivamente
    Array.from(element.children).forEach((child) => {
      cleanElement(child);
    });
  }

  // Limpa todos os elementos
  Array.from(temp.children).forEach((child) => {
    cleanElement(child);
  });

  return temp.innerHTML;
}

/**
 * Sanitiza e converte texto simples em HTML seguro
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  // Escapa HTML
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Converte quebras de linha
  return escaped.replace(/\n/g, '<br>');
}

/**
 * Remove completamente todas as tags HTML
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

/**
 * Trunca HTML mantendo tags válidas
 */
export function truncateHtml(html: string, maxLength: number): string {
  const text = stripHtml(html);

  if (text.length <= maxLength) {
    return html;
  }

  const truncated = text.substring(0, maxLength) + '...';
  return sanitizeText(truncated);
}

/**
 * Valida se HTML é seguro (retorna true se seguro)
 */
export function isHtmlSafe(html: string): boolean {
  if (!html) return true;

  const dangerous = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onload, onclick, etc
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /data:text\/html/i,
  ];

  return !dangerous.some((pattern) => pattern.test(html));
}

/**
 * Sanitiza URL para uso seguro
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  try {
    const parsed = new URL(url, window.location.origin);

    if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    // URL inválida
  }

  return '';
}

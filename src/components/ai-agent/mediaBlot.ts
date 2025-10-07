import { Quill } from 'react-quill';

const BlockEmbed = Quill.import('blots/block/embed');

class MediaBlot extends BlockEmbed {
  static create(value: any) {
    const node = super.create();
    node.setAttribute('contenteditable', 'false');
    
    if (typeof value === 'object' && value.url) {
      node.setAttribute('data-url', value.url);
      node.setAttribute('data-type', value.type);
      if (value.name) node.setAttribute('data-name', value.name);
      
      if (value.type.startsWith('image/')) {
        node.innerHTML = `<img src="${value.url}" alt="${value.name || ''}" style="max-width:300px;border-radius:8px;" />`;
      } else if (value.type.startsWith('video/')) {
        node.innerHTML = `<video src="${value.url}" controls style="max-width:200px;border-radius:8px;"></video>`;
      } else if (value.type.startsWith('audio/')) {
        node.innerHTML = `<audio src="${value.url}" controls style="width:300px;"></audio>`;
      } else if (value.type === 'application/pdf') {
        node.innerHTML = `
          <div style="display:flex;align-items:center;background:#eff6ff;padding:12px;border-radius:8px;max-width:80%;margin:0 auto;">
            <div style="width:40px;height:40px;background:#dc2626;display:flex;justify-content:center;align-items:center;border-radius:8px;color:white;font-size:20px;">📄</div>
            <a href="${value.url}" target="_blank" style="margin-left:12px;color:#2563eb;font-weight:500;text-decoration:none;">${value.name || 'Abrir PDF'}</a>
          </div>`;
      }
      return node;
    }
    
    // Para conteúdo já formatado (do banco de dados)
    if (typeof value === 'string') {
      // Extrai os atributos data-* do HTML existente
      const temp = document.createElement('div');
      temp.innerHTML = value;
      const div = temp.querySelector('div[data-url]');
      
      if (div) {
        node.setAttribute('data-url', div.getAttribute('data-url') || '');
        node.setAttribute('data-type', div.getAttribute('data-type') || '');
        node.setAttribute('data-name', div.getAttribute('data-name') || '');
        node.innerHTML = div.innerHTML;
        return node;
      }
    }
    
    // Fallback para conteúdo não reconhecido
    node.innerHTML = value || '';
    return node;
  }

  static value(node: HTMLElement) {
    return node.outerHTML; // Retorna o HTML completo para armazenamento
  }
}

MediaBlot.blotName = 'media';
MediaBlot.tagName = 'div';
MediaBlot.className = 'ql-media';

// Registra globalmente uma única vez
let isRegistered = false;
export function registerMediaBlot() {
  if (typeof window !== 'undefined' && !isRegistered) {
    Quill.register(MediaBlot);
    isRegistered = true;
  }
}
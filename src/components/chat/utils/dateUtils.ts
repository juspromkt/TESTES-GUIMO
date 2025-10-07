export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Hoje - mostrar apenas hora
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays === 1) {
    // Ontem
    return 'Ontem';
  } else if (diffDays < 7) {
    // Esta semana - mostrar dia da semana
    return date.toLocaleDateString('pt-BR', { weekday: 'short' });
  } else {
    // Mais de uma semana - mostrar data
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }
};

export const formatMessageTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// No arquivo dateUtils.js, adicione uma função auxiliar para detectar templates:

// Função auxiliar para detectar se um texto é um template
function isTemplateText(text: string): boolean {
  return /^▶️.*◀️$/.test(text);
}

// Função auxiliar para extrair nome do template
function extractTemplateName(text: string): string {
  const match = text.match(/^▶️(.*)◀️$/);
  if (match) {
    return match[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return text;
}

// Atualize a função getMessageTypeDisplay para incluir detecção de templates:
export function getMessageTypeDisplay(messageType: string, messageContent?: any): string {
  // Se for conversation, verificar se é template
  if (messageType === 'conversation' && messageContent?.conversation) {
    if (isTemplateText(messageContent.conversation)) {
      const templateName = extractTemplateName(messageContent.conversation);
      return `📝 Template: ${templateName}`;
    }
  }

  switch (messageType) {
    case 'conversation':
      return 'Mensagem de texto';
    case 'imageMessage':
      return '📷 Imagem';
    case 'videoMessage':
      return '🎥 Vídeo';
    case 'audioMessage':
      return '🎵 Áudio';
    case 'documentMessage':
      return '📄 Documento';
    case 'stickerMessage':
      return '😀 Sticker';
    case 'buttonMessage':
      return '🔘 Resposta de botão';
    case 'templateButtonReplyMessage':
      return '✅ Resposta a template';
    case 'templateMessage':
      return '📝 Template WhatsApp';
    case 'locationMessage':
      return '📍 Localização';
    case 'contactMessage':
      return '👤 Contato';
    case 'listMessage':
      return '📋 Lista';
    case 'interactiveMessage':
      return '⚡ Interativa';
    case 'reactionMessage':
      return '👍 Reação';
    case 'protocolMessage':
      return '🔄 Protocolo';
    case 'editedMessage':
      return '✏️ Editada';
    default:
      return 'Mensagem';
  }

};
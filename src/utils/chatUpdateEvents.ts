/**
 * Sistema Centralizado de Eventos para Atualização em Tempo Real da Lista de Chats
 *
 * Eventos suportados:
 * - chat:update - Atualização geral do chat
 * - chat:tags_changed - Mudança nas etiquetas
 * - chat:ia_status_changed - Mudança no status do agente de IA
 * - chat:stage_changed - Mudança no status/etapa do funil
 * - chat:name_changed - Mudança no nome do contato
 * - chat:responsible_changed - Mudança no responsável
 * - chat:refresh_all - Recarregar toda a lista
 */

export type ChatUpdateEventType =
  | 'chat:update'
  | 'chat:tags_changed'
  | 'chat:ia_status_changed'
  | 'chat:stage_changed'
  | 'chat:name_changed'
  | 'chat:responsible_changed'
  | 'chat:refresh_all';

export interface ChatUpdateEventData {
  remoteJid?: string;
  contactId?: number;
  tags?: number[];
  iaStatus?: boolean;
  stage?: string;
  name?: string;
  responsibleId?: number;
  [key: string]: any;
}

/**
 * Dispara um evento de atualização de chat
 */
export function dispatchChatUpdate(
  eventType: ChatUpdateEventType,
  data: ChatUpdateEventData = {}
) {
  const event = new CustomEvent(eventType, {
    detail: data,
    bubbles: true,
  });

  window.dispatchEvent(event);

  console.log(`🔔 Chat Update Event: ${eventType}`, data);
}

/**
 * Hook para escutar eventos de atualização de chat
 */
export function onChatUpdate(
  eventType: ChatUpdateEventType,
  callback: (data: ChatUpdateEventData) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ChatUpdateEventData>;
    callback(customEvent.detail);
  };

  window.addEventListener(eventType, handler);

  // Retorna função de cleanup
  return () => {
    window.removeEventListener(eventType, handler);
  };
}

/**
 * Atualiza etiquetas de um chat
 */
export function updateChatTags(remoteJid: string, tags: number[]) {
  dispatchChatUpdate('chat:tags_changed', { remoteJid, tags });
  dispatchChatUpdate('chat:update', { remoteJid, tags });
}

/**
 * Atualiza status do agente de IA
 */
export function updateChatIAStatus(remoteJid: string, iaStatus: boolean) {
  dispatchChatUpdate('chat:ia_status_changed', { remoteJid, iaStatus });
  dispatchChatUpdate('chat:update', { remoteJid, iaStatus });
}

/**
 * Atualiza etapa/status do funil
 */
export function updateChatStage(remoteJid: string, stage: string) {
  dispatchChatUpdate('chat:stage_changed', { remoteJid, stage });
  dispatchChatUpdate('chat:update', { remoteJid, stage });
}

/**
 * Atualiza nome do contato
 */
export function updateChatName(remoteJid: string, name: string) {
  dispatchChatUpdate('chat:name_changed', { remoteJid, name });
  dispatchChatUpdate('chat:update', { remoteJid, name });
}

/**
 * Atualiza responsável do chat
 */
export function updateChatResponsible(remoteJid: string, responsibleId: number) {
  dispatchChatUpdate('chat:responsible_changed', { remoteJid, responsibleId });
  dispatchChatUpdate('chat:update', { remoteJid, responsibleId });
}

/**
 * Força refresh completo da lista
 */
export function refreshAllChats() {
  dispatchChatUpdate('chat:refresh_all', {});
}

/**
 * Utilitário para atualizar múltiplos campos de uma vez
 */
export function updateChat(remoteJid: string, updates: Partial<ChatUpdateEventData>) {
  dispatchChatUpdate('chat:update', { remoteJid, ...updates });

  // Disparar eventos específicos para cada campo alterado
  if (updates.tags !== undefined) {
    dispatchChatUpdate('chat:tags_changed', { remoteJid, tags: updates.tags });
  }
  if (updates.iaStatus !== undefined) {
    dispatchChatUpdate('chat:ia_status_changed', { remoteJid, iaStatus: updates.iaStatus });
  }
  if (updates.stage !== undefined) {
    dispatchChatUpdate('chat:stage_changed', { remoteJid, stage: updates.stage });
  }
  if (updates.name !== undefined) {
    dispatchChatUpdate('chat:name_changed', { remoteJid, name: updates.name });
  }
  if (updates.responsibleId !== undefined) {
    dispatchChatUpdate('chat:responsible_changed', { remoteJid, responsibleId: updates.responsibleId });
  }
}

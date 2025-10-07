import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { prependMessageToCache, type Message } from '../components/chat/utils/api';

interface MessageEventPayload {
  id: string | null;
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  senderLid?: string;
  pushName?: string;
  messageType: string;
  message: {
    conversation?: string;
    mediaUrl?: string;
  };
  messageTimestamp: number;
  resposta?: {
    idMensagem: string;
    mensagem: string;
    audioMessage?: boolean;
  };
}

type WSCallback = (msg: MessageEventPayload) => void;

const MessageEventsContext = createContext<{
  subscribe: (cb: WSCallback) => () => void;
  isConnected: boolean;
} | null>(null);

export function MessageEventsProvider({ children }: { children: React.ReactNode }) {
  const subscribersRef = useRef<Set<WSCallback>>(new Set());
  const socketRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const handleIncomingMessage = useCallback((data: MessageEventPayload) => {
    try {
      if (!data?.key?.remoteJid) return;
      const msg: Message = {
        id: data.key.id || data.id || '',
        key: {
          id: data.key.id,
          fromMe: data.key.fromMe,
          remoteJid: data.key.remoteJid,
        },
        pushName: data.pushName,
        messageType: data.messageType,
        message: data.message,
        messageTimestamp: data.messageTimestamp,
        resposta: data.resposta,
      };
      prependMessageToCache(data.key.remoteJid, msg);
    } catch (err) {
      void err;
    }
  }, []);

  const openSSE = useCallback((token: string) => {
    const baseUrl = 'https://ws.lumendigital.com.br/events';
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${token}`;

    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onopen = () => {
      isConnectedRef.current = true;
    };

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleIncomingMessage(data);
        subscribersRef.current.forEach((callback) => {
          try {
            callback(data);
          } catch (err) {
            void err;
          }
        });
      } catch (err) {
        void err;
      }
    };

    eventSourceRef.current.onerror = () => {
      isConnectedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        openSSE(token);
      }, 3000);
    };
  }, []);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    isConnectedRef.current = false;
  }, []);

  const connect = useCallback(() => {
    const user = localStorage.getItem('user');
    const token = user ? JSON.parse(user).token : null;

    if (!token) {
      return;
    }

    if (socketRef.current?.readyState === WebSocket.CONNECTING ||
        socketRef.current?.readyState === WebSocket.OPEN ||
        eventSourceRef.current) {
      return;
    }

    cleanup();

    if (!('WebSocket' in window)) {
      openSSE(token);
      return;
    }

    try {
      const baseUrl = 'wss://ws.lumendigital.com.br';
      const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${token}`;
      
      socketRef.current = new WebSocket(url);

      socketRef.current.addEventListener('open', () => {
        isConnectedRef.current = true;

        fetch('https://n8n.lumendigital.com.br/webhook/ws-online', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).catch();

        pingIntervalRef.current = setInterval(() => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            fetch('https://n8n.lumendigital.com.br/webhook/ws-ping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            }).catch();
          }
        }, 30000);
      });

      socketRef.current.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          handleIncomingMessage(data);
          subscribersRef.current.forEach((callback) => {
            try {
              callback(data);
            } catch (err) {
              void err;
            }
          });
        } catch (err) {
          void err;
        }
      });

      socketRef.current.addEventListener('close', (event) => {
        isConnectedRef.current = false;

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        fetch('https://n8n.lumendigital.com.br/webhook/ws-offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).catch();

        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            openSSE(token);
          }, 3000);
        }
      });

      socketRef.current.addEventListener('error', () => {
        isConnectedRef.current = false;
        openSSE(token);
      });

    } catch {
      openSSE(token);
    }
  }, [cleanup, openSSE]);

  useEffect(() => {
    connect();

    return () => {
      cleanup();
      const user = localStorage.getItem('user');
      const token = user ? JSON.parse(user).token : null;
      if (token) {
        fetch('https://n8n.lumendigital.com.br/webhook/ws-offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).catch();
      }
    };
  }, []);

  const subscribe = useCallback((callback: WSCallback): (() => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  const contextValue = {
    subscribe,
    isConnected: isConnectedRef.current
  };

  return (
    <MessageEventsContext.Provider value={contextValue}>
      {children}
    </MessageEventsContext.Provider>
  );
}

export function useMessageEvents(callback: WSCallback) {
  const ctx = useContext(MessageEventsContext);

  useEffect(() => {
    if (!ctx) {
      return;
    }

    const unsubscribe = ctx.subscribe(callback);
    return unsubscribe;
  }, [ctx, callback]);
}
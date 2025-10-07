import { useEffect, useState, useRef } from 'react';
import { MessageCircle, X, Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMessageEvents } from '../pages/MessageEventsContext';
import { updateCacheFromMessage, isChatListLoaded } from '../utils/chatCache';
import { resolveJid } from '../utils/jidMapping';

interface Notification {
  id: string;
  remoteJid: string;
  pushName: string;
  message: string;
  timestamp: number;
}

export function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const [buttonPosition, setButtonPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number; transform: string }>({ 
    top: 0, 
    left: 0, 
    transform: 'translateY(0)' 
  });

  // Função para tocar som de notificação melhorado
  const playNotificationSound = () => {
    try {
      // Som de notificação mais suave e agradável
      const audio = new Audio('data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YQAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==');
      audio.volume = 0.2;
      audio.play().catch(() => {
        // Silenciar erros de som se o browser não permitir
      });
      } catch {
        // Silenciar erros de som
      }
  };

  // Usar Set para rastrear IDs únicos de mensagens processadas
  const processedMessagesRef = useRef<Set<string>>(new Set());

  const handleNewMessage = (msg: any) => {
    
    if (msg.messageType === "editedMessage") return;
    
    // Criar ID único mais robusto para evitar duplicações
    const originalRemote = msg.key.remoteJid;
    const resolved = resolveJid(originalRemote);
    const messageId = `${resolved}_${msg.key.id}_${msg.messageTimestamp}`;
    
    // Verificar se já processamos esta mensagem
    if (processedMessagesRef.current.has(messageId)) {
      return;
    }

    // Adicionar ao conjunto de mensagens processadas
    processedMessagesRef.current.add(messageId);

    if (isChatListLoaded()) {
      updateCacheFromMessage(msg);
    }
    

    const newNotification: Notification = {
      id: messageId,
      remoteJid: resolved,
      pushName: msg.pushName || 'Contato',
      message: msg.message.conversation || getMessageTypeDisplay(msg.messageType),
      timestamp: msg.messageTimestamp
    };

    setNotifications(prev => {
      // Verificar se já existe uma notificação com o mesmo ID
      const exists = prev.some(n => n.id === messageId);
      if (exists) {
        return prev;
      }
            return [newNotification, ...prev].slice(0, 5);
    });
    
    // Incrementar contador apenas uma vez
    setUnreadCount(prev => {
      const newCount = prev + 1;
      return newCount;
    });

    // Trigger animação visual e sonora
    setIsAnimating(true);
    playNotificationSound();
    
    setTimeout(() => setIsAnimating(false), 1000);

    if (!window.location.pathname.includes('/conversas')) {
      toast(`Nova mensagem de ${newNotification.pushName}`, {
        description: newNotification.message,
        action: {
          label: 'Ver',
          onClick: () => navigate('/conversas')
        },
      });
    }

  };

  useMessageEvents(handleNewMessage);

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    processedMessagesRef.current.clear(); // Limpar também o conjunto de mensagens processadas
  };

  const handleNotificationClick = (remoteJid: string) => {
    navigate(`/conversas`);
    setIsOpen(false);
    setUnreadCount(0);
  };

  const wasDragging = useRef(false);

  // MouseMove → Marca como dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !buttonRef.current) return;

      wasDragging.current = true;

      const newX = Math.min(
        Math.max(e.clientX - offsetRef.current.x, 10),
        window.innerWidth - 70
      );
      const newY = Math.min(
        Math.max(e.clientY - offsetRef.current.y, 10),
        window.innerHeight - 70
      );

      setButtonPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Posicionamento inteligente do popup
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupHeight = 320; // altura estimada do popup
      const popupWidth = 288; // largura do popup (w-72 = 288px)
      
      let top = rect.bottom + 8;
      let left = rect.left;
      let transform = 'translateY(0)';
      
      // Se o popup vai sair da tela na parte inferior
      if (top + popupHeight > window.innerHeight) {
        top = rect.top - popupHeight - 8;
        transform = 'translateY(0)';
      }
      
      // Se o popup vai sair da tela na lateral direita
      if (left + popupWidth > window.innerWidth) {
        left = window.innerWidth - popupWidth - 16;
      }
      
      // Se o popup vai sair da tela na lateral esquerda
      if (left < 16) {
        left = 16;
      }
      
      setPopupPosition({ top, left, transform });
    }
  }, [isOpen, buttonPosition]);

  return (<></>
  );
}

function getMessageTypeDisplay(messageType: string): string {
  switch(messageType) {
    case 'imageMessage': return '📸 Imagem';
    case 'videoMessage': return '🎥 Vídeo';
    case 'audioMessage': return '🎵 Áudio';
    case 'documentMessage': return '📄 Documento';
    default: return '💬 Nova mensagem';
  }
}
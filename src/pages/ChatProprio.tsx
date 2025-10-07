import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatList } from '../components/chat/ChatList';
import { MessageView } from '../components/chat/MessageView';
import { Chat as ChatType } from '../components/chat/utils/api';
import { MessageCircle } from 'lucide-react';
import { setChatListLoaded } from '../utils/chatCache';

const ChatProprio = () => {
  const location = useLocation();
  const preselect = location.state as { remoteJid?: string; name?: string } | null;
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [whatsappType, setWhatsappType] = useState<string | null>(null);

  useEffect(() => {
    setChatListLoaded(false);
  }, []);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = user ? JSON.parse(user).token : null;
    if (!token) return;
    fetch('https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/get/tipo', {
      headers: { token }
    })
      .then(r => r.json())
      .then(data => {
        const info = Array.isArray(data) ? data[0] : data;
        setWhatsappType(info?.tipo || null);
      })
      .catch(err => {
        console.error('Erro ao buscar tipo do WhatsApp:', err);
      });
  }, []);

  useEffect(() => {
    if (preselect?.remoteJid) {
      setSelectedChat({
        id: preselect.remoteJid,
        remoteJid: preselect.remoteJid,
        pushName: preselect.name || '',
        lastMessage: {
          messageType: 'conversation',
          fromMe: false,
          conversation: '',
          messageTimestamp: Date.now(),
        },
      });
      setShowMobileChat(true);
    }
  }, [preselect]);
  
  const handleChatSelect = (chat: ChatType) => {
    setSelectedChat(chat);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedChat(null);
  };

  return (
<div className="h-screen flex w-full bg-background overflow-hidden">
        {/* Main area */}
        <div className="flex-1 flex min-w-0">
          {/* Chat list - hidden on mobile when chat is selected */}
          <div className={`w-full md:w-80 border-r bg-background ${showMobileChat ? 'hidden md:block' : 'block'} flex-shrink-0`}>
            {activeTab === 'chat' && (
              <ChatList
                onChatSelect={handleChatSelect}
                selectedChatId={selectedChat?.id}
                whatsappType={whatsappType || undefined}
              />
            )}
          </div>

          {/* Message area */}
          <div className={`flex-1 min-w-0 ${!showMobileChat && !selectedChat ? 'hidden md:flex' : 'flex'}`}>
            {selectedChat ? (
              <div className="w-full">
                <MessageView
                  selectedChat={selectedChat}
                  onBack={handleBackToList}
                  whatsappType={whatsappType || undefined}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-muted/10 w-full">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <MessageCircle className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Selecione uma conversa
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Escolha uma conversa da lista para começar a visualizar e enviar mensagens
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default ChatProprio;
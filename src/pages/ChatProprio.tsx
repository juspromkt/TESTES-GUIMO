import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatList } from '../components/chat/ChatList';
import { MessageView } from '../components/chat/MessageView';
import { AdvancedFilterModal } from '../components/chat/AdvancedFilterModal';
import { useConversation } from '../context/ConversationContext';
import { MultiSelectDropdown } from '../components/chat/MultiSelectDropdown';
import { NewChatModal } from '../components/chat/NewChatModal';
import { Chat as ChatType } from '../components/chat/utils/api';
import { MessageCircle, Search, Filter, Plus, Users, GitBranch, Tag as TagIcon, Calendar, X } from 'lucide-react';
import { setChatListLoaded } from '../utils/chatCache';
import type { Tag } from '../types/tag';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import { fetchWithCache, CacheTTL, CacheKeys } from '../utils/cacheManager';

registerLocale('pt-BR', ptBR);

const ChatProprio = () => {
  const location = useLocation();
  const { setIsInConversation } = useConversation();
  const preselect = location.state as { remoteJid?: string; name?: string } | null;
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [whatsappType, setWhatsappType] = useState<string | null>(null);

  // Estados para a barra superior
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  // Multiple selection states
  const [selectedResponsibleIds, setSelectedResponsibleIds] = useState<number[]>([]);
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<number | null>(null);

  // Data
  const [usuariosPorContato, setUsuariosPorContato] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableFunnels, setAvailableFunnels] = useState<any[]>([]);
  const [availableStages, setAvailableStages] = useState<{ id: string; nome: string; cor?: string }[]>([]);

  // Date range
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Estados de filtros
  const [iaStatusFilter, setIaStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [chatListActiveTab, setChatListActiveTab] = useState<'all' | 'ia' | 'transfers' | 'unread' | 'unanswered'>('all');
  const [filteredChatCount, setFilteredChatCount] = useState(0);

  // Contadores separados para cada filtro
  const [iaCount, setIaCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [transfersCount, setTransfersCount] = useState(0);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    setChatListLoaded(false);
  }, []);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = user ? JSON.parse(user).token : null;
    if (!token) return;

    // Usar cache de 24h para tipo do WhatsApp (dado fixo)
    fetchWithCache(
      CacheKeys.WHATSAPP_TYPE,
      async () => {
        const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/get/tipo', {
          headers: { token }
        });
        const data = await response.json();
        const info = Array.isArray(data) ? data[0] : data;
        return info?.tipo || null;
      },
      CacheTTL.VERY_LONG // 24h - tipo do WhatsApp raramente muda
    )
      .then(tipo => setWhatsappType(tipo))
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
      setIsInConversation(true); // Notifica o Context que está em conversa
    }
  }, [preselect, setIsInConversation]);

  // Carregar usuários para o dropdown de responsável
  useEffect(() => {
    if (!token) return;

    const loadUsuarios = async () => {
      try {
        // Usar cache de 24h para usuários (dado fixo)
        const usuarios = await fetchWithCache(
          CacheKeys.USERS,
          async () => {
            const apiUrl = 'https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get';
            const response = await fetch(apiUrl, { headers: { token } });

            let data = null;
            try {
              const text = await response.text();
              data = text ? JSON.parse(text) : null;
            } catch (err) {
              console.warn('⚠️ Resposta vazia ou inválida:', apiUrl, err);
              data = null;
            }

            return Array.isArray(data) ? data : [];
          },
          CacheTTL.VERY_LONG // 24h - lista de usuários muda raramente
        );

        setUsuariosPorContato(usuarios);
      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
      }
    };

    loadUsuarios();
  }, [token]);

  // Carregar tags para o filtro
  useEffect(() => {
    if (!token) return;

    const loadTags = async () => {
      try {
        // Usar cache de 24h para tags (dado fixo)
        const tags = await fetchWithCache(
          CacheKeys.TAGS,
          async () => {
            const apiUrl = 'https://n8n.lumendigital.com.br/webhook/prospecta/tag/list';
            const response = await fetch(apiUrl, { headers: { token } });

            let data = null;
            try {
              const text = await response.text();
              data = text ? JSON.parse(text) : null;
            } catch (err) {
              console.warn('⚠️ Resposta vazia ou inválida:', apiUrl, err);
              data = null;
            }

            return Array.isArray(data) ? data : [];
          },
          CacheTTL.VERY_LONG // 24h - lista de tags muda raramente
        );

        setAvailableTags(tags);
      } catch (err) {
        console.error('Erro ao carregar tags:', err);
      }
    };

    loadTags();
  }, [token]);

  // Carregar todos os funis disponíveis
  useEffect(() => {
    if (!token) return;

    const loadFunnels = async () => {
      try {
        // Usar cache de 24h para funis (dado fixo)
        const funnels = await fetchWithCache(
          CacheKeys.FUNNELS,
          async () => {
            const apiUrl = 'https://n8n.lumendigital.com.br/webhook/prospecta/funil/get';
            const response = await fetch(apiUrl, { headers: { token } });

            let data = null;
            try {
              const text = await response.text();
              data = text ? JSON.parse(text) : null;
            } catch (err) {
              console.warn('⚠️ Resposta vazia ou inválida:', apiUrl, err);
              data = null;
            }

            return Array.isArray(data) ? data : [];
          },
          CacheTTL.VERY_LONG // 24h - lista de funis muda raramente
        );

        setAvailableFunnels(funnels);

        // Selecionar automaticamente o funil padrão
        const funilPadrao = funnels.find((f: any) => f.isFunilPadrao);
        if (funilPadrao) {
          setSelectedFunnelId(funilPadrao.id);
        }
      } catch (err) {
        console.error('❌ Erro ao carregar funis:', err);
      }
    };

    loadFunnels();
  }, [token]);

  // Atualizar etapas quando o funil selecionado mudar
  useEffect(() => {
    if (!selectedFunnelId || availableFunnels.length === 0) {
      setAvailableStages([]);
      setSelectedStageIds([]); // Limpar seleção de etapas
      return;
    }

    // Cache de 10 min para etapas (dado estável)
    // Como as etapas vêm junto com o funil, não precisamos fazer fetch separado
    // Mas podemos cachear a transformação dos dados
    const selectedFunnel = availableFunnels.find((f: any) => f.id === selectedFunnelId);
    if (selectedFunnel && selectedFunnel.estagios) {
      const stages = selectedFunnel.estagios.map((e: any) => ({
        id: String(e.Id),
        nome: e.nome,
        cor: e.cor,
      }));
      setAvailableStages(stages);
    } else {
      setAvailableStages([]);
    }

    // Limpar seleção de etapas quando trocar de funil
    setSelectedStageIds([]);
  }, [selectedFunnelId, availableFunnels]);

  const handleChatSelect = (chat: ChatType) => {
    setSelectedChat(chat);
    setShowMobileChat(true);
    setIsInConversation(true); // Notifica o Context que está em conversa
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedChat(null);
    setIsInConversation(false); // Notifica o Context que saiu da conversa
  };

  const handleTabChange = useCallback((tab: 'all' | 'ia' | 'transfers' | 'unread' | 'unanswered') => {
    setChatListActiveTab(tab);
    switch (tab) {
      case 'ia':
        setIaStatusFilter('active');
        setShowOnlyUnread(false);
        setShowUnanswered(false);
        break;
      case 'transfers':
        setIaStatusFilter('all');
        setShowOnlyUnread(false);
        setShowUnanswered(false);
        break;
      case 'unread':
        setIaStatusFilter('all');
        setShowOnlyUnread(true);
        setShowUnanswered(false);
        break;
      case 'unanswered':
        setIaStatusFilter('all');
        setShowOnlyUnread(false);
        setShowUnanswered(true);
        break;
      default:
        setIaStatusFilter('all');
        setShowOnlyUnread(false);
        setShowUnanswered(false);
    }
  }, []);

  const handleNewChatSuccess = async (remoteJid: string, name: string) => {
    const user = localStorage.getItem('user');
    const token = user ? JSON.parse(user).token : null;

    if (!token) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const telefone = remoteJid.replace(/\D/g, '');

      // 1️⃣ Cria o contato no backend
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/contato/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', token },
          body: JSON.stringify({ nome: name, telefone }),
        }
      );

      if (!response.ok) throw new Error('Erro ao criar contato');

      const data = await response.json();
      const contactId = data?.Id || data?.id || data?.contactId || data?.[0]?.Id || null;

      // 2️⃣ Cria registro local no cache (para ChatList reconhecer)
      const newContact = {
        id: remoteJid,
        remoteJid,
        contactId,
        pushName: name,
        telefone,
        profilePicUrl: null,
      };

      const existingCache = localStorage.getItem('contacts_cache');
      const parsedCache = existingCache ? JSON.parse(existingCache) : {};
      parsedCache[remoteJid] = newContact;
      localStorage.setItem('contacts_cache', JSON.stringify(parsedCache));

      // 3️⃣ Notifica o ChatList para recarregar os contatos
      window.dispatchEvent(new Event('contacts_updated'));

      // 4️⃣ Abre o chat imediatamente
      const newChat: ChatType = {
        id: remoteJid,
        remoteJid,
        contactId,
        pushName: name,
        lastMessage: {
          messageType: 'conversation',
          fromMe: false,
          conversation: '',
          messageTimestamp: Math.floor(Date.now() / 1000),
        },
      };

      setSelectedChat(newChat);
      setShowMobileChat(true);
      setIsInConversation(true); // Notifica o Context que está em conversa

      console.log('✅ Contato criado e sincronizado com ChatList:', newContact);
    } catch (err) {
      console.error('❌ Erro ao criar nova conversa:', err);
      alert('Erro ao criar contato. Verifique o número e tente novamente.');
    }
  };



  // Filtros rápidos de data
  const setToday = () => {
    const t = new Date();
    setStartDate(t);
    setEndDate(t);
  };
  const setLast7 = () => {
    const e = new Date();
    const s = new Date();
    s.setDate(s.getDate() - 7);
    setStartDate(s);
    setEndDate(e);
  };
  const setLast30 = () => {
    const e = new Date();
    const s = new Date();
    s.setDate(s.getDate() - 30);
    setStartDate(s);
    setEndDate(e);
  };
  const setThisMonth = () => {
    const n = new Date();
    const s = new Date(n.getFullYear(), n.getMonth(), 1);
    const e = new Date(n.getFullYear(), n.getMonth() + 1, 0);
    setStartDate(s);
    setEndDate(e);
  };
  const setLastMonth = () => {
    const n = new Date();
    const s = new Date(n.getFullYear(), n.getMonth() - 1, 1);
    const e = new Date(n.getFullYear(), n.getMonth(), 0);
    setStartDate(s);
    setEndDate(e);
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedResponsibleIds.length > 0 ||
    selectedStageIds.length > 0 ||
    selectedTagIds.length > 0 ||
    startDate !== null ||
    endDate !== null ||
    iaStatusFilter !== 'all' ||
    showOnlyUnread ||
    showUnanswered ||
    chatListActiveTab !== 'all';

  return (
    <div className="h-screen flex flex-col w-full bg-background overflow-hidden md:pt-0">
      {/* Barra superior fixa - ocupa toda a largura da tela */}
      {activeTab === 'chat' && (
        <div className="fixed top-[80px] md:relative md:top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
          <div className="px-2 md:px-4 py-2 flex items-center gap-1.5 md:gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {/* Campo de busca */}
            <div className="relative flex-1 min-w-[200px] max-w-lg">
              <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none flex-shrink-0" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 md:pl-9 pr-3 py-2 md:py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-manipulation"
              />
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {/* Responsáveis (multi-select) */}
              <MultiSelectDropdown
                options={usuariosPorContato.map(u => ({ id: u.Id, label: u.nome }))}
                selectedIds={selectedResponsibleIds}
                onChange={setSelectedResponsibleIds}
                placeholder="Responsável"
                icon={<Users className="w-4 h-4" />}
              />

              {/* Seletor de Funil - REMOVIDO TEMPORARIAMENTE (para implementação futura) */}
              {/* <select
                value={selectedFunnelId || ''}
                onChange={(e) => setSelectedFunnelId(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:bg-gray-50"
              >
                <option value="">Todos os funis</option>
                {availableFunnels.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select> */}

              {/* Status/Etapas (multi-select) - REMOVIDO TEMPORARIAMENTE (para implementação futura) */}
              {/* <MultiSelectDropdown
                options={availableStages.map(s => ({ id: s.id, label: s.nome, color: s.cor }))}
                selectedIds={selectedStageIds}
                onChange={setSelectedStageIds}
                placeholder={selectedFunnelId ? "Status" : "Selecione um funil"}
                icon={<GitBranch className="w-4 h-4" />}
                disabled={!selectedFunnelId || availableStages.length === 0}
              /> */}

              {/* Etiquetas (multi-select) */}
              <MultiSelectDropdown
                options={availableTags.map(t => ({ id: t.Id, label: t.nome, color: t.cor }))}
                selectedIds={selectedTagIds}
                onChange={setSelectedTagIds}
                placeholder="Etiquetas"
                icon={<TagIcon className="w-4 h-4" />}
              />

              {/* Filtro de Data */}
              <button
                onClick={() => setShowDateModal(true)}
                className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-2 md:py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap touch-manipulation active:scale-95 ${
                  startDate || endDate
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:from-blue-600 hover:to-indigo-700 active:from-blue-700 active:to-indigo-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Período</span>
                {(startDate || endDate) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />
                )}
              </button>

            </div>

            {/* Botão Nova Conversa */}
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="flex items-center gap-1 md:gap-1.5 px-2 md:px-4 py-2 md:py-1.5 rounded-lg text-xs md:text-sm font-medium bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 active:from-emerald-700 active:to-green-800 transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap touch-manipulation flex-shrink-0"
              title="Nova conversa"
              aria-label="Nova conversa"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Nova conversa</span>
            </button>
          </div>
        </div>
      )}

      {/* Main area - chat list e message view lado a lado */}
      <div className="flex-1 flex min-w-0 overflow-x-hidden flex-row pt-[60px] md:pt-0">
        {/* Chat list - hidden on mobile when chat is selected */}
        <div className={`w-full md:w-96 border-r bg-gray-50 ${showMobileChat ? 'hidden md:block' : 'block'} flex-shrink-0 flex flex-col overflow-y-auto overflow-x-hidden`} style={{ WebkitOverflowScrolling: 'touch' }}>
          {activeTab === 'chat' && (           
            <>


              {/* Área de lista com header fixo e conteúdo rolável */}
              <div className="flex-1 flex flex-col">
                {/* 🔹 Cabeçalho fixo com os botões IA / NÃO RESP / TRANSF */}
                <div className="px-2 md:px-3 py-2 md:py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0 sticky top-0 z-10">
                  <div className="flex gap-1 md:gap-1.5">
                    {/* IA */}
                    <button
                      onClick={() => handleTabChange(chatListActiveTab === 'ia' ? 'all' : 'ia')}
                      className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 py-2 px-2 md:px-3 rounded-md transition-all duration-200 relative touch-manipulation active:scale-95 ${chatListActiveTab === 'ia'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      <span className="text-[11px] md:text-xs font-semibold tracking-wide">IA</span>
                      {iaCount > 0 && (
                        <span className={`text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 ${chatListActiveTab === 'ia' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'
                          }`}>
                          {iaCount > 99 ? '99+' : iaCount}
                        </span>
                      )}
                    </button>

                    {/* NÃO RESPONDIDOS */}
                    <button
                      onClick={() => handleTabChange(chatListActiveTab === 'unanswered' ? 'all' : 'unanswered')}
                      className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 py-2 px-1 md:px-3 rounded-md transition-all duration-200 relative touch-manipulation active:scale-95 ${chatListActiveTab === 'unanswered'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      <span className="text-[11px] md:text-xs font-semibold tracking-wide truncate">NÃO RESP.</span>
                      {unansweredCount > 0 && (
                        <span className={`text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 flex-shrink-0 ${chatListActiveTab === 'unanswered' ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'
                          }`}>
                          {unansweredCount > 99 ? '99+' : unansweredCount}
                        </span>
                      )}
                    </button>

                    {/* TRANSFERÊNCIAS */}
                    <button
                      onClick={() => handleTabChange(chatListActiveTab === 'transfers' ? 'all' : 'transfers')}
                      className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 py-2 px-1 md:px-3 rounded-md transition-all duration-200 relative touch-manipulation active:scale-95 ${chatListActiveTab === 'transfers'
                          ? 'bg-yellow-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      <span className="text-[11px] md:text-xs font-semibold tracking-wide truncate">TRANSF.</span>
                      {transfersCount > 0 && (
                        <span className={`text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 flex-shrink-0 ${chatListActiveTab === 'transfers' ? 'bg-white text-yellow-600' : 'bg-yellow-600 text-white'
                          }`}>
                          {transfersCount > 99 ? '99+' : transfersCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 🔹 Wrapper fixo com scroll isolado */}
                <div
                  className="flex-1 overflow-y-auto overflow-x-hidden"
                  style={{
                    maxHeight: 'calc(100vh - 120px)',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#bdbdbd transparent',
                  }}
                >
                  <ChatList
                    onChatSelect={handleChatSelect}
                    selectedChatId={selectedChat?.id}
                    whatsappType={whatsappType || undefined}
                    externalSearchTerm={searchTerm}
                    externalUsuarioFiltroIds={selectedResponsibleIds}
                    externalTagFiltroIds={selectedTagIds}
                    externalFunilId={selectedFunnelId}
                    externalStageFiltroIds={selectedStageIds}
                    externalStartDate={startDate}
                    externalEndDate={endDate}
                    externalIaStatusFilter={iaStatusFilter}
                    externalShowOnlyUnread={showOnlyUnread}
                    externalShowUnanswered={showUnanswered}
                    externalActiveTab={chatListActiveTab}
                    externalHandleTabChange={handleTabChange}
                    onFilteredCountChange={setFilteredChatCount}
                    onCategoryCountsChange={(counts) => {
                      setIaCount(counts.ia);
                      setUnreadCount(counts.unread);
                      setUnansweredCount(counts.unanswered);
                      setTransfersCount(counts.transfers);
                    }}
                  />
                </div>
              </div>
            </>
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

      {/* Modals */}
      <AdvancedFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        availableTags={availableTags}
        selectedTagIds={selectedTagIds}
        setSelectedTagIds={setSelectedTagIds}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        iaStatusFilter={iaStatusFilter}
        setIaStatusFilter={setIaStatusFilter}
        showOnlyUnread={showOnlyUnread}
        setShowOnlyUnread={setShowOnlyUnread}
        showUnanswered={showUnanswered}
        setShowUnanswered={setShowUnanswered}
        activeTab={chatListActiveTab}
        handleTabChange={handleTabChange}
        filteredCount={filteredChatCount}
      />

      <NewChatModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        onSuccess={handleNewChatSuccess}
      />

      {/* Modal de Período */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-300 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-700 flex-shrink-0" />
                <h3 className="text-base md:text-lg font-semibold text-gray-800 truncate">
                  Selecionar Período
                </h3>
              </div>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation flex-shrink-0"
                onClick={() => setShowDateModal(false)}
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-6 bg-gray-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* Coluna de filtros rápidos */}
              <div className="flex flex-col gap-2">
                <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">Filtro rápido</p>
                <button
                  onClick={() => {
                    setToday();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 bg-white hover:bg-blue-50 active:bg-blue-100 hover:border-blue-200 active:scale-95 transition-all touch-manipulation"
                >
                  Hoje
                </button>
                <button
                  onClick={() => {
                    setLast7();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 bg-white hover:bg-blue-50 active:bg-blue-100 hover:border-blue-200 active:scale-95 transition-all touch-manipulation"
                >
                  Últimos 7 dias
                </button>
                <button
                  onClick={() => {
                    setLast30();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 bg-white hover:bg-blue-50 active:bg-blue-100 hover:border-blue-200 active:scale-95 transition-all touch-manipulation"
                >
                  Últimos 30 dias
                </button>
                <button
                  onClick={() => {
                    setThisMonth();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 bg-white hover:bg-blue-50 active:bg-blue-100 hover:border-blue-200 active:scale-95 transition-all touch-manipulation"
                >
                  Este mês
                </button>
                <button
                  onClick={() => {
                    setLastMonth();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 bg-white hover:bg-blue-50 active:bg-blue-100 hover:border-blue-200 active:scale-95 transition-all touch-manipulation"
                >
                  Mês passado
                </button>
              </div>

              {/* Coluna de seleção manual */}
              <div className="md:col-span-2 bg-white rounded-xl p-4 md:p-5 border border-gray-300 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                      Data inicial
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date: Date | null) => setStartDate(date)}
                      dateFormat="dd/MM/yyyy"
                      locale="pt-BR"
                      className="w-full px-3 py-2.5 text-sm md:text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                      placeholderText="Selecione a data inicial"
                      dropdownMode="select"
                      popperClassName="z-[9999]"
                      popperPlacement="bottom-start"
                      portalId="root"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                      Data final
                    </label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date: Date | null) => setEndDate(date)}
                      dateFormat="dd/MM/yyyy"
                      locale="pt-BR"
                      className="w-full px-3 py-2.5 text-sm md:text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                      placeholderText="Selecione a data final"
                      dropdownMode="select"
                      popperClassName="z-[9999]"
                      popperPlacement="bottom-start"
                      portalId="root"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row justify-end gap-2">
                  <button
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                      setShowDateModal(false);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 active:scale-95 transition-all shadow-sm touch-manipulation"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={() => setShowDateModal(false)}
                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all shadow-sm touch-manipulation"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatProprio;

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatList } from '../components/chat/ChatList';
import { MessageView } from '../components/chat/MessageView';
import { AdvancedFilterModal } from '../components/chat/AdvancedFilterModal';
import { useConversation } from '../context/ConversationContext';
import { useChat } from '../context/ChatContext';
import { MultiSelectDropdown } from '../components/chat/MultiSelectDropdown';
import { NewChatModal } from '../components/chat/NewChatModal';
import { Chat as ChatType } from '../components/chat/utils/api';
import { MessageCircle, Search, Filter, Plus, Users, GitBranch, Tag as TagIcon, Calendar, X, Volume2, VolumeX } from 'lucide-react';
import { setChatListLoaded } from '../utils/chatCache';
import type { Tag } from '../types/tag';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import { fetchWithCache, CacheTTL, CacheKeys } from '../utils/cacheManager';
import { useDebounce } from 'use-debounce';

registerLocale('pt-BR', ptBR);

const ChatProprio = () => {
  const location = useLocation();
  const { setIsInConversation } = useConversation();
  const { selectedChat, setSelectedChat, availableTags, users, funnels } = useChat();
  const preselect = location.state as { remoteJid?: string; name?: string } | null;
  const [activeTab, setActiveTab] = useState('chat');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [whatsappType, setWhatsappType] = useState<string | null>(null);

  // Estados para a barra superior
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  // Multiple selection states
  const [selectedResponsibleIds, setSelectedResponsibleIds] = useState<number[]>([]);
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<number | null>(null);

  // Data (agora vêm do contexto)
  const usuariosPorContato = users;
  const availableFunnels = funnels;
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
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);

  // Contadores separados para cada filtro
  const [iaCount, setIaCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [transfersCount, setTransfersCount] = useState(0);

  // Estado para som de notificação
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('chat_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  // Função para tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      try {
        // Criar contexto de áudio
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Criar oscilador para tom
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configurar som de notificação (tom duplo agradável)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);

        // Configurar volume com fade out
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        // Tocar som
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (err) {
        console.log('Erro ao tocar som:', err);
      }
    }
  }, [soundEnabled]);

  // Função para alternar som e salvar no localStorage
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('chat_sound_enabled', JSON.stringify(newValue));
  };

  // Carregar agentes disponíveis
  useEffect(() => {
    if (!token) return;

    const loadAgents = async () => {
      try {
        const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', {
          headers: { token }
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableAgents(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Erro ao carregar agentes:', error);
        setAvailableAgents([]);
      }
    };

    loadAgents();
  }, [token]);

  // Força reload sempre que entrar na página - executado no mount
  useEffect(() => {
    console.log('[ChatProprio] Montado - pathname:', location.pathname);

    // Limpa o cache e força reload
    setChatListLoaded(false);

    // Limpa chat selecionado ao entrar
    setSelectedChat(null);
    setShowMobileChat(false);
    setIsInConversation(false);

    // Dispara evento para forçar reload do ChatList
    const timer = setTimeout(() => {
      console.log('[ChatProprio] Disparando chat_list_force_reload');
      window.dispatchEvent(new Event('chat_list_force_reload'));
    }, 150);

    return () => {
      clearTimeout(timer);
      console.log('[ChatProprio] Desmontado');
    };
  }, []); // Dependências vazias - executa só no mount/unmount

  // Monitora mudanças de rota para recarregar quando voltar
  useEffect(() => {
    if (location.pathname === '/conversas') {
      console.log('[ChatProprio] Rota /conversas detectada - recarregando');
      setChatListLoaded(false);
      setTimeout(() => {
        window.dispatchEvent(new Event('chat_list_force_reload'));
      }, 100);
    }
  }, [location.pathname]);

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

  // Selecionar funil padrão quando os funis forem carregados
  useEffect(() => {
    if (availableFunnels.length > 0 && !selectedFunnelId) {
      const funilPadrao = availableFunnels.find((f: any) => f.isFunilPadrao);
      if (funilPadrao) {
        setSelectedFunnelId(funilPadrao.id);
      }
    }
  }, [availableFunnels, selectedFunnelId]);

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

    // ✅ REMOVIDO force_reload - MessageView agora mantém mensagens em cache
    // Troca de chat é instantânea, sem reload desnecessário
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

  const handleCategoryCountsChange = useCallback((counts: { ia: number; unread: number; unanswered: number; transfers: number }) => {
    setIaCount(counts.ia);
    setUnreadCount(counts.unread);
    setUnansweredCount(counts.unanswered);
    setTransfersCount(counts.transfers);
  }, []);

  const handleFilteredCountChange = useCallback((count: number) => {
    setFilteredChatCount(count);
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
          body: JSON.stringify({
            nome: name,
            telefone,
            createdAt: new Date().toISOString(),
          }),
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
    <div className="h-screen flex flex-col w-full bg-background dark:bg-gray-900 overflow-hidden md:pt-0 transition-colors duration-200">
      {/* Barra superior fixa - ocupa toda a largura da tela */}
      {activeTab === 'chat' && (
        <div className="hidden md:block md:relative md:top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="px-4 py-2 flex items-center justify-between gap-2">

            {/* Grupo Esquerdo: Campo de busca + Filtros */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Campo de busca */}
              <div className="relative flex-1 min-w-[200px] max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Responsáveis (multi-select) */}
                <MultiSelectDropdown
                  options={usuariosPorContato.map(u => ({ id: u.Id, label: u.nome }))}
                  selectedIds={selectedResponsibleIds}
                  onChange={setSelectedResponsibleIds}
                  placeholder="Responsável"
                  icon={<Users className="w-4 h-4" />}
                />

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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    startDate || endDate
                      ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Período</span>
                </button>
              </div>
            </div>

            {/* Botão de Som de Notificação */}
            <button
              onClick={toggleSound}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                soundEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={soundEnabled ? 'Som de notificação ativado' : 'Som de notificação desativado'}
              aria-label={soundEnabled ? 'Desativar som de notificação' : 'Ativar som de notificação'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Botão Nova Conversa - Canto Direito */}
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors whitespace-nowrap"
              title="Nova conversa"
              aria-label="Nova conversa"
            >
              <Plus className="w-4 h-4" />
              <span>Nova conversa</span>
            </button>
          </div>
        </div>
      )}

      {/* Main area - chat list e message view lado a lado */}
      <div className="flex-1 flex min-w-0 overflow-x-hidden flex-row pt-[60px] md:pt-0">
        {/* Chat list - hidden on mobile when chat is selected */}
        <div className={`w-full md:w-96 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 ${showMobileChat ? 'hidden md:block' : 'block'} flex-shrink-0 flex flex-col ${selectedChat ? 'overflow-hidden' : 'overflow-y-auto'} overflow-x-hidden transition-colors duration-200`} style={{ WebkitOverflowScrolling: 'touch' }}>
          {activeTab === 'chat' && (           
            <>


              {/* Área de lista com header fixo e conteúdo rolável */}
              <div className="flex-1 flex flex-col">
                {/* 🔹 Cabeçalho fixo com os botões TUDO / IA / NÃO LIDAS / TRANSFERIDAS */}
                <div className="px-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 sticky top-0 z-10">
                  <div className="flex items-center justify-around gap-1">
                    {/* TUDO */}
                    <button
                      onClick={() => handleTabChange('all')}
                      className={`flex items-center justify-center gap-1.5 py-3 px-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                        chatListActiveTab === 'all'
                          ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 scale-105'
                          : chatListActiveTab === 'ia'
                          ? 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 -translate-x-2'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Tudo
                    </button>

                    {/* IA */}
                    <button
                      onClick={() => handleTabChange('ia')}
                      className={`flex items-center justify-center gap-1.5 py-3 px-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                        chatListActiveTab === 'ia'
                          ? 'border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 scale-105'
                          : chatListActiveTab === 'all'
                          ? 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 translate-x-2'
                          : chatListActiveTab === 'unanswered'
                          ? 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 -translate-x-2'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      IA ativa
                      {iaCount > 0 && (
                        <span className={`text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 ${
                          chatListActiveTab === 'ia'
                            ? 'bg-purple-600 dark:bg-purple-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {iaCount > 99 ? '99+' : iaCount}
                        </span>
                      )}
                    </button>

                    {/* NÃO LIDAS */}
                    <button
                      onClick={() => handleTabChange('unanswered')}
                      className={`flex items-center justify-center gap-1.5 py-3 px-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                        chatListActiveTab === 'unanswered'
                          ? 'border-orange-600 dark:border-orange-500 text-orange-600 dark:text-orange-400 scale-105'
                          : chatListActiveTab === 'ia'
                          ? 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 translate-x-2'
                          : chatListActiveTab === 'transfers'
                          ? 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 -translate-x-2'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Não lidas
                      {unansweredCount > 0 && (
                        <span className={`text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 ${
                          chatListActiveTab === 'unanswered'
                            ? 'bg-orange-600 dark:bg-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {unansweredCount > 99 ? '99+' : unansweredCount}
                        </span>
                      )}
                    </button>

                    {/* TRANSFERIDAS */}
                    <button
                      onClick={() => handleTabChange('transfers')}
                      className={`flex items-center justify-center gap-1.5 py-3 px-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                        chatListActiveTab === 'transfers'
                          ? 'border-yellow-600 dark:border-yellow-500 text-yellow-600 dark:text-yellow-400 scale-105'
                          : chatListActiveTab === 'unanswered'
                          ? 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 translate-x-2'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Transferidas
                      {transfersCount > 0 && (
                        <span className={`text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 ${
                          chatListActiveTab === 'transfers'
                            ? 'bg-yellow-600 dark:bg-yellow-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {transfersCount > 99 ? '99+' : transfersCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 🔹 Wrapper fixo com scroll isolado */}
                <div
                  className="flex-1 overflow-x-hidden"
                  style={{
                    maxHeight: 'calc(100vh - 120px)',
                  }}
                >
                  <ChatList
                    onChatSelect={handleChatSelect}
                    selectedChatId={selectedChat?.id}
                    whatsappType={whatsappType || undefined}
                    externalSearchTerm={debouncedSearchTerm}
                    externalUsuarioFiltroIds={selectedResponsibleIds}
                    externalAgenteFiltroIds={selectedAgentIds}
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
                    onFilteredCountChange={handleFilteredCountChange}
                    onCategoryCountsChange={handleCategoryCountsChange}
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
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 w-full transition-colors duration-200">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    Selecione uma conversa
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
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
        availableAgents={availableAgents}
        selectedTagIds={selectedTagIds}
        setSelectedTagIds={setSelectedTagIds}
        selectedAgentIds={selectedAgentIds}
        setSelectedAgentIds={setSelectedAgentIds}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Selecionar Período
                </h3>
              </div>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setShowDateModal(false)}
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-4 bg-white dark:bg-gray-900 overflow-y-auto">
              {/* Coluna de filtros rápidos */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtro rápido</p>
                <button
                  onClick={() => {
                    setToday();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={() => {
                    setLast7();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Últimos 7 dias
                </button>
                <button
                  onClick={() => {
                    setLast30();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Últimos 30 dias
                </button>
                <button
                  onClick={() => {
                    setThisMonth();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Este mês
                </button>
                <button
                  onClick={() => {
                    setLastMonth();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Mês passado
                </button>
              </div>

              {/* Coluna de seleção manual */}
              <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5 block">
                      Data inicial
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date: Date | null) => setStartDate(date)}
                      dateFormat="dd/MM/yyyy"
                      locale="pt-BR"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                      placeholderText="Selecione a data inicial"
                      dropdownMode="select"
                      popperClassName="z-[9999]"
                      popperPlacement="bottom-start"
                      portalId="root"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5 block">
                      Data final
                    </label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date: Date | null) => setEndDate(date)}
                      dateFormat="dd/MM/yyyy"
                      locale="pt-BR"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                      placeholderText="Selecione a data final"
                      dropdownMode="select"
                      popperClassName="z-[9999]"
                      popperPlacement="bottom-start"
                      portalId="root"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                      setShowDateModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={() => setShowDateModal(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
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

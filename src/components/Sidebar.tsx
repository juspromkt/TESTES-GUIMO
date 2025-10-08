import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Link, 
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Key,
  Bot,
  ContactIcon as ContactsIcon,
  GitBranch,
  Search,
  Loader2,
  Check,
  CalendarDays,
  MessageSquare,
  Sun,
  Moon,
  Users,
  BookOpen
} from 'lucide-react';
import { DomainConfig } from '../utils/DomainConfig';
import Modal from './Modal';
import { fetchUserPermissions, hasPermission, clearUserPermissions } from '../utils/permissions';
import { ThemeContext } from '../context/ThemeContext';
import { clearChatCache } from '../utils/chatCache';
import type { LoginResponse } from '../types/auth';

interface LinkedAccount {
  id_cliente?: number;
  nome_cliente?: string;
  cliente_ativo?: boolean;
  id_usuario?: number;
  nome_usuario?: string;
  usuario_ativo?: boolean;
}

interface MenuItemProps {
  path: string;
  text: string;
  icon: React.ElementType;
  isActive: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  domainConfig: DomainConfig;
  isBeta?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ path, text, icon: Icon, isActive, isCollapsed, isMobile, domainConfig, isBeta }) => {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(path)}
      className={`group relative flex items-center gap-1 px-2 py-0 mx-2 my-0 rounded-lg transition-all duration-200 ${
        isActive
          ? `${domainConfig.getActiveBg()} ${domainConfig.getActiveColor()} shadow-lg transform scale-[1.02] before:absolute before:inset-0 before:bg-white/10 before:rounded-xl`
          : `${domainConfig.getDefaultColor()} ${domainConfig.getHoverBg()} hover:transform hover:scale-[1.02] hover:shadow-md`
      } ${isCollapsed || isMobile ? 'justify-center px-3' : ''}`}
      title={isCollapsed || isMobile ? text : undefined}
    >
      {/* Glow effect for active item */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-50"></div>
      )}
      
      {/* Icon container */}
      <div className={`relative z-10 p-2 rounded-lg transition-all duration-300 ${
        isActive 
          ? 'bg-white/20 shadow-md transform rotate-3' 
          : 'group-hover:bg-white/10 group-hover:scale-110'
      }`}>
        <Icon className="w-6 h-6 transition-transform duration-300" />
      </div>
      
      {!isCollapsed && !isMobile && (
        <div className="relative z-10 flex items-center gap-2 flex-1">
          <span className="text-base font-semibold tracking-wide">
            {text}
          </span>
          {isBeta && (
            <span className="text-[11px] text-emerald-600 bg-emerald-100/90 px-2 py-1 rounded-full uppercase tracking-wider font-bold backdrop-blur-sm border border-emerald-200/50">
              BETA
            </span>
          )}
        </div>
      )}
      
      {/* Active indicator */}
      {isActive && !isCollapsed && !isMobile && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-10 bg-white/50 rounded-full"></div>
      )}
    </button>
  );
};

const Sidebar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Sempre inicia reduzida
  const [isHovered, setIsHovered] = useState(false); // Novo estado para hover
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [linkedAccountsLoading, setLinkedAccountsLoading] = useState(false);
  const [linkedAccountsError, setLinkedAccountsError] = useState('');
  const [workspaceSwitchError, setWorkspaceSwitchError] = useState('');
  const [switchingAccountKey, setSwitchingAccountKey] = useState<string | null>(null);
  const [isLinkedAccountsOpen, setIsLinkedAccountsOpen] = useState(false);
  const [linkedAccountsSearch, setLinkedAccountsSearch] = useState('');

  const linkedAccountsRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const domainConfig = DomainConfig.getInstance();
  const logos = domainConfig.getLogos();
  const currentPath = window.location.pathname;
  
  const storedUserRaw = localStorage.getItem('user');
  type StoredUser = LoginResponse & { id_cliente?: number };
  let storedUser: StoredUser | null = null;

  try {
    storedUser = storedUserRaw ? (JSON.parse(storedUserRaw) as StoredUser) : null;
  } catch {
    storedUser = null;
  }

  const token = storedUser?.token ?? null;
  const userName = storedUser?.nome_usuario ?? 'Usuário';
  const currentUserId = storedUser?.id_usuario;
  const currentClientId = storedUser?.id_cliente;

  const isMobile = window.innerWidth < 768;

  // Determina se a sidebar deve aparecer expandida (hover ou não colapsada)
  const isExpanded = !isCollapsed || isHovered;

  const filteredLinkedAccounts = useMemo(() => {
    const term = linkedAccountsSearch.trim().toLowerCase();

    if (!term) {
      return linkedAccounts;
    }

    return linkedAccounts.filter((account) => {
      const searchTargets = [
        account.nome_cliente ?? '',
        account.nome_usuario ?? '',
        account.id_cliente !== undefined ? String(account.id_cliente) : '',
        account.id_usuario !== undefined ? String(account.id_usuario) : '',
      ];

      return searchTargets.some((target) => target.toLowerCase().includes(term));
    });
  }, [linkedAccounts, linkedAccountsSearch]);

  const linkedAccountsPanelPositionClasses = useMemo(() => {
    if (isMobile) {
      return 'left-1/2 top-full transform -translate-x-1/2 w-[min(18rem,90vw)]';
    }

    if (isCollapsed && !isHovered) {
      return 'left-full top-0 ml-4 w-72';
    }

    return 'left-0 top-full w-full';
  }, [isMobile, isCollapsed, isHovered]);

  const hasLinkedAccountSearch = linkedAccountsSearch.trim().length > 0;

  useEffect(() => {
    // Sempre manter colapsada no mobile
    setIsCollapsed(true);
  }, [isMobile]);

  useEffect(() => {
    if (isCollapsed && !isHovered) {
      setIsLinkedAccountsOpen(false);
    }
  }, [isCollapsed, isHovered]);

  useEffect(() => {
    if (!isLinkedAccountsOpen) {
      setLinkedAccountsSearch('');
      setWorkspaceSwitchError('');
    }
  }, [isLinkedAccountsOpen]);

  useEffect(() => {
    if (!isLinkedAccountsOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (linkedAccountsRef.current && !linkedAccountsRef.current.contains(event.target as Node)) {
        setIsLinkedAccountsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLinkedAccountsOpen]);

  useEffect(() => {
    const loadPermissions = async () => {
      if (token) {
        await fetchUserPermissions(token);
        setPermissionsLoaded(true);
      } else {
        setPermissionsLoaded(true);
      }
    };

    loadPermissions();
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLinkedAccounts([]);
      setLinkedAccountsLoading(false);
      setLinkedAccountsError('');
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const loadLinkedAccounts = async () => {
      setLinkedAccountsLoading(true);
      setLinkedAccountsError('');

      try {
        const response = await fetch('https://n8n.lumendigital.com.br/webhook/contas/vinculadas/get', {
          headers: { token },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar Workspaces');
        }

        const data = await response.json();

        if (!isMounted) return;

        if (Array.isArray(data)) {
          const sanitized = data.filter((item): item is LinkedAccount => {
            if (!item || typeof item !== 'object') return false;
            return Object.keys(item).length > 0;
          });

          setLinkedAccounts(sanitized);
        } else {
          setLinkedAccounts([]);
        }
      } catch (fetchError) {
        if (!isMounted) return;
        if ((fetchError as Error).name === 'AbortError') {
          return;
        }
        console.error('Erro ao carregar Workspaces:', fetchError);
        setLinkedAccountsError('Erro ao carregar Workspaces.');
        setLinkedAccounts([]);
      } finally {
        if (isMounted) {
          setLinkedAccountsLoading(false);
        }
      }
    };

    loadLinkedAccounts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [token]);

  // Update favicon and title
  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = logos.favicon;
    }
    document.title = domainConfig.getTitle();
  }, []);

  // Update sidebar container data attribute when collapsed state changes
  useEffect(() => {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
      sidebarContainer.dataset.collapsed = (!isExpanded).toString();
    }
  }, [isExpanded]);

  // Handlers para mouse enter/leave
  const handleMouseEnter = () => {
    if (isCollapsed && !isMobile) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed && !isMobile) {
      setIsHovered(false);
      setIsLinkedAccountsOpen(false);
      setIsProfileMenuOpen(false);
    }
  };

  // Handler para clique no botão de Workspaces quando colapsada
  const handleLinkedAccountsClick = () => {
    if (isCollapsed && !isHovered) {
      // Se está colapsada e não em hover, expande primeiro
      setIsHovered(true);
      // Pequeno delay para a animação da sidebar, depois abre o dropdown
      setTimeout(() => {
        setIsLinkedAccountsOpen(true);
        setIsProfileMenuOpen(false);
      }, 200);
    } else {
      // Comportamento normal
      setIsLinkedAccountsOpen((prev) => !prev);
      setIsProfileMenuOpen(false);
    }
  };

  const clearApplicationData = async () => {
    clearChatCache();
    clearUserPermissions();

    try {
      localStorage.clear();
    } catch {
      // ignore storage errors
    }

    try {
      sessionStorage.clear();
    } catch {
      // ignore storage errors
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
      } catch (cacheError) {
        console.error('Erro ao limpar caches da aplicação:', cacheError);
      }
    }
  };

  const handleLogout = async () => {
    await clearApplicationData();
    navigate('/');
  };

  const handleWorkspaceSwitch = async (account: LinkedAccount, key?: string) => {
    if (account.id_cliente === undefined || account.id_usuario === undefined) {
      setWorkspaceSwitchError('Conta selecionada não possui informações completas para troca.');
      return;
    }

    if (account.cliente_ativo === false || account.usuario_ativo === false) {
      setWorkspaceSwitchError('Esta conta está inativa e não pode ser acessada.');
      return;
    }

    const accountKey = key ?? `${account.id_cliente}-${account.id_usuario}`;
    setWorkspaceSwitchError('');
    setSwitchingAccountKey(accountKey);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.token = token;
    }

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/contas/vinculadas/get', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id_cliente: account.id_cliente,
          id_usuario: account.id_usuario,
        }),
      });

      let data: LoginResponse | (LoginResponse & Record<string, unknown>) | null = null;

      try {
        data = (await response.json()) as LoginResponse | (LoginResponse & Record<string, unknown>);
      } catch {
        data = null;
      }

      if (response.ok && data && (data as LoginResponse).status === 'sucess') {
        await clearApplicationData();

        try {
          localStorage.setItem('user', JSON.stringify(data));
        } catch {
          // ignore localStorage errors
        }

        try {
          await fetchUserPermissions((data as LoginResponse).token);
        } catch (permissionsError) {
          console.error('Erro ao carregar permissões após troca de conta:', permissionsError);
        }

        setIsProfileMenuOpen(false);
        setIsLinkedAccountsOpen(false);
        window.location.href = '/dashboard';
        return;
      }

      const errorMessage = data && typeof (data as { status?: unknown }).status === 'string'
        ? ((data as { status?: string }).status ?? 'Erro ao trocar de conta')
        : 'Erro ao trocar de conta';
      setWorkspaceSwitchError(errorMessage);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error('Erro ao trocar de conta:', error);
      setWorkspaceSwitchError('Erro ao trocar de conta. Tente novamente.');
    } finally {
      setSwitchingAccountKey(null);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('As novas senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/user/mudar-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          senhaAtual: passwordForm.currentPassword,
          novaSenha: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'sucess') {
        setSuccess('Senha alterada com sucesso! Você será redirecionado para fazer login novamente.');
        setTimeout(() => {
          localStorage.clear();
          navigate('/');
        }, 2000);
      } else {
        setError(data.status || 'Erro ao alterar senha');
      }
    } catch {
      setError('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getMenuItems = () => {
    if (!permissionsLoaded) return [];
    
    const menuItems = [
  { path: '/dashboard', text: 'Dashboard', icon: LayoutDashboard, permission: true },
  { path: '/conversas', text: 'Conversas', icon: MessageSquare, permission: hasPermission('can_view_menu_chat')},
  { path: '/ai-agent', text: 'Agente de IA', icon: Bot, permission: hasPermission('can_view_menu_agent') },
  { path: '/crm', text: 'CRM', icon: GitBranch, permission: hasPermission('can_view_menu_crm') },
  { path: '/agendamentos', text: 'Agendamentos', icon: CalendarDays, permission: hasPermission('can_view_menu_schedule') },
  { path: '/contatos', text: 'Contatos', icon: ContactsIcon, permission: hasPermission('can_view_menu_contacts') },
  { path: '/conexao', text: 'Conexão', icon: Link, permission: hasPermission('can_view_menu_connection') },
  { path: '/configuracoes', text: 'Configurações', icon: Settings, permission: hasPermission('can_view_menu_settings') },
  {
    text: 'Tutoriais',
    icon: BookOpen, // você pode importar do lucide-react
    external: true,
    path: 'https://tutorial.guimoo.com.br/',
    permission: true,
  },
];

    
    return menuItems.filter(item => item.permission);
  };

  if (!permissionsLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/80 to-gray-900/60 backdrop-blur-sm z-50">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <div className="absolute inset-0 w-8 h-8 animate-ping text-blue-600/30">
              <Loader2 className="w-8 h-8" />
            </div>
          </div>
          <p className="text-gray-700 font-medium">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={sidebarRef}
        id="sidebar-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative transition-all duration-500 ease-in-out ${domainConfig.getSidebarColor()} ${
          isMobile
            ? 'fixed top-0 left-0 h-20 w-full flex flex-row items-center justify-between px-6 z-50 backdrop-blur-sm border-b border-white/10'
            : `fixed top-0 left-0 bottom-0 flex flex-col z-50 backdrop-blur-md border-r border-white/10 ${isExpanded ? 'w-56' : 'w-16'}`
        }`}
        style={{ 
          height: isMobile ? '80px' : '100%',
          minHeight: isMobile ? '80px' : '100vh'
        }}
      >
        {/* Background overlay */}
        {!isMobile && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-white/2 backdrop-blur-sm"></div>
        )}

        {!isMobile && (
          <div className={`relative z-10 flex items-center px-4 pt-3 mb-2 ${isExpanded ? '' : 'justify-center'}`}>
            <div className="relative group">
              <img 
                src={isExpanded ? logos.full : logos.reduced}
                alt="Logo" 
                className={`transition-all duration-300 ${
                  isExpanded 
                    ? 'w-[180px] h-[60px] object-contain group-hover:scale-105' 
                    : 'w-12 h-10 object-contain group-hover:scale-110'
                } filter drop-shadow-lg`}
              />
              {/* Glow effect */}
              <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </div>
          </div>
        )}

        <nav
          className={`relative z-10 flex flex-1 ${
            isMobile 
              ? 'flex-row items-center justify-between w-full h-full px-2' 
              : 'flex-col overflow-y-auto px-2'
          }`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
          }}
        >
          {/* Mobile Logo */}
          {isMobile && (
            <div className="flex items-center">
              <img 
                src={logos.reduced}
                alt="Logo" 
                className="w-10 h-10 object-contain filter drop-shadow-md"
              />
            </div>
          )}

          {/* Menu Items */}
          <div className={`${isMobile ? 'flex flex-row items-center gap-2' : 'flex flex-col space-y-1'}`}>
            <div
              ref={linkedAccountsRef}
              className={`${isMobile ? 'relative flex-shrink-0' : 'relative w-full'}`}
            >
              <button
                onClick={handleLinkedAccountsClick}
                className={`group relative w-full flex items-center gap-3 px-3 py-3 mx-1 my-0.5 rounded-xl transition-all duration-300 ${
                  isLinkedAccountsOpen
                    ? `${domainConfig.getActiveBg()} ${domainConfig.getActiveColor()} shadow-lg transform scale-[1.02]`
                    : `${domainConfig.getDefaultColor()} ${domainConfig.getHoverBg()} hover:transform hover:scale-[1.02] hover:shadow-md`
                } ${isExpanded ? '' : 'justify-center px-3'}`}
                title={isExpanded ? undefined : 'Workspacess'}
              >
                {isLinkedAccountsOpen && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-80"></div>
                )}
                <div
                  className={`relative z-10 p-2 rounded-lg transition-all duration-300 ${
                    isLinkedAccountsOpen
                      ? 'bg-white/20 shadow-md transform rotate-3'
                      : 'group-hover:bg-white/10 group-hover:scale-110'
                  }`}
                >
                  <Users className="w-6 h-6 transition-transform duration-300" />
                </div>
                {isExpanded && (
                  <div className="relative z-10 flex items-center justify-between gap-2 flex-1">
                    <span className="text-sm font-semibold tracking-wide">
                      Workspaces
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${
                        isLinkedAccountsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                )}
              </button>

              {isLinkedAccountsOpen && (
                <div
                  className={`${linkedAccountsPanelPositionClasses} absolute z-50 mt-2 rounded-xl border border-gray-200/60 shadow-2xl bg-white/95 backdrop-blur-xl p-4`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                      Workspaces
                    </p>
                    <span className="text-[11px] font-medium text-gray-400">
                      {linkedAccounts.length}
                    </span>
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={linkedAccountsSearch}
                      onChange={(event) => setLinkedAccountsSearch(event.target.value)}
                      placeholder="Buscar Workspace..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    />
                  </div>
                  {linkedAccountsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Carregando contas...</span>
                    </div>
                  ) : linkedAccountsError ? (
                    <p className="text-xs text-rose-500">{linkedAccountsError}</p>
                  ) : linkedAccounts.length === 0 ? (
                    <p className="text-xs text-gray-500">Nenhuma conta vinculada disponível.</p>
                  ) : filteredLinkedAccounts.length === 0 && hasLinkedAccountSearch ? (
                    <p className="text-xs text-gray-500">Nenhuma conta corresponde à pesquisa.</p>
                  ) : (
                    <div
                      className="space-y-2 max-h-56 overflow-y-auto pr-1"
                      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(148, 163, 184, 0.6) transparent' }}
                    >
                      {filteredLinkedAccounts.map((account, index) => {
  const accountKey = `${account.id_cliente ?? 'n'}-${account.id_usuario ?? 'n'}-${index}`;
  const hasIdentifiers = account.id_cliente !== undefined && account.id_usuario !== undefined;
  const isCurrentAccount =
    hasIdentifiers &&
    account.id_cliente === currentClientId &&
    account.id_usuario === currentUserId;
  const isSwitching = switchingAccountKey === accountKey;

  const buttonStateClasses = isCurrentAccount
    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm'
    : 'bg-white border border-gray-200 text-gray-800 hover:bg-emerald-50/60 hover:border-emerald-400 hover:shadow-sm';

  return (
    <button
      key={accountKey}
      onClick={() => handleWorkspaceSwitch(account, accountKey)}
      disabled={isSwitching || isCurrentAccount}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${buttonStateClasses}`}
    >
      <div className="flex items-center justify-between">
        <span className="truncate">{account.nome_cliente ?? 'Sem nome'}</span>

        {isSwitching && (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
        )}

        {isCurrentAccount && (
          <span className="text-[10px] text-emerald-600 font-bold uppercase ml-2">
            Atual
          </span>
        )}
      </div>
    </button>
  );
})}

                    </div>
                  )}
                  {workspaceSwitchError && (
                    <p className="mt-3 text-[11px] font-medium text-rose-500">{workspaceSwitchError}</p>
                  )}
                </div>
              )}
            </div>

{getMenuItems().map((item) =>
  item.text === 'Tutoriais' ? (
    <>
      {/* Divisor antes do Tutoriais */}
      <hr className="mx-3 my-2 border-t border-gray-200/40" />

      {/* Botão Tutoriais */}
      <a
        key={item.text}
        href="https://tutorial.guimoo.com.br/"
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative flex items-center gap-3 px-2 py-1.5 mx-2 my-[2px] rounded-lg transition-all duration-200 ${
          domainConfig.getDefaultColor()
        } ${domainConfig.getHoverBg()} hover:transform hover:scale-[1.02] hover:shadow-md ${
          !isExpanded ? 'justify-center px-2' : ''
        }`}
        title={!isExpanded ? item.text : undefined}
      >
        <div className="relative z-10 p-2 rounded-lg group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300">
          <item.icon className="w-6 h-6 transition-transform duration-300" />
        </div>

        {isExpanded && !isMobile && (
          <div className="relative z-10 flex items-center gap-2 flex-1">
            <span className="text-sm font-semibold tracking-wide">
              {item.text}
            </span>
          </div>
        )}
      </a>

      {/* Botão de Suporte via WhatsApp */}
      <a
        href="https://wa.me/553892590370"
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative flex items-center gap-3 px-2 py-1.5 mx-2 my-[2px] rounded-lg transition-all duration-200
          text-emerald-700 hover:text-white hover:bg-emerald-500 hover:shadow-md
          ${!isExpanded ? 'justify-center px-2' : ''}
        `}
        title={!isExpanded ? 'Suporte' : undefined}
      >
        <div className="relative z-10 p-2 rounded-lg bg-emerald-50 group-hover:bg-emerald-600/90 group-hover:text-white transition-all duration-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-5 h-5"
          >
            <path d="M16.61 14.18c-.27-.14-1.62-.8-1.87-.9-.25-.09-.43-.14-.61.14-.18.27-.7.9-.85 1.09-.16.18-.31.2-.58.07-.27-.14-1.15-.43-2.19-1.37-.81-.72-1.36-1.61-1.52-1.88-.16-.27-.02-.42.12-.56.13-.13.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.53-.45-.45-.61-.45-.16 0-.34-.02-.52-.02s-.48.07-.73.34c-.25.27-.96.93-.96 2.27s.98 2.64 1.12 2.82c.13.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.58.65.21 1.24.18 1.71.11.52-.08 1.62-.66 1.85-1.3.23-.65.23-1.2.16-1.32-.06-.12-.25-.2-.52-.34z" />
            <path d="M12.04 2C6.51 2 2 6.5 2 12c0 2.06.68 3.97 1.83 5.52L2 22l4.61-1.77A9.93 9.93 0 0 0 12.04 22c5.53 0 10.04-4.5 10.04-10S17.57 2 12.04 2zm0 18.09a8.1 8.1 0 0 1-4.13-1.15l-.3-.18-2.73 1.05.73-2.64-.18-.27A8.07 8.07 0 1 1 12.04 20.1z" />
          </svg>
        </div>

        {isExpanded && !isMobile && (
          <span className="text-sm font-semibold tracking-wide relative z-10">
            Suporte
          </span>
        )}
      </a>
    </>
  ) : (
    <MenuItem
      key={item.path}
      path={item.path}
      text={item.text}
      icon={item.icon}
      isActive={currentPath.startsWith(item.path)}
      isCollapsed={!isExpanded}
      isMobile={isMobile}
      domainConfig={domainConfig}
      isBeta={item.isBeta}
    />
  )
)}



</div>
</nav>


        {!isMobile && (
          <div className="relative z-10 p-3 border-t border-white/10 backdrop-blur-sm">
            {isExpanded && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`group w-full flex items-center gap-3 p-3 rounded-xl ${domainConfig.getDefaultColor()} ${domainConfig.getHoverBg()} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden`}
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className={`relative z-10 w-10 h-10 rounded-xl ${domainConfig.getProfileBg()} flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {initials}
                  </div>
                  <div className="relative z-10 flex-1 text-left">
                    <p className="text-sm font-semibold truncate">{userName}</p>
                    <p className="text-xs opacity-70">Minha conta</p>
                  </div>
                  <ChevronDown className={`relative z-10 w-5 h-5 transition-all duration-300 ${isProfileMenuOpen ? 'rotate-180 text-white/80' : 'group-hover:scale-110'}`} />
                </button>

                {isProfileMenuOpen && (
                  <div className={`mt-3 p-2 ${domainConfig.getActiveBg()} rounded-xl backdrop-blur-sm border border-white/10 shadow-xl space-y-2`}>
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      className={`group w-full flex items-center gap-3 px-3 py-2 text-sm ${domainConfig.getActiveColor()} ${domainConfig.getHoverBg()} rounded-lg transition-all duration-300 hover:scale-[1.02]`}
                    >
                      <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors duration-300">
                        <Key className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Trocar senha</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleLogout}
              className={`group w-full flex items-center gap-3 px-3 py-3 mt-3 rounded-xl transition-all duration-300 ${domainConfig.getDefaultColor()} ${domainConfig.getHoverBg()} hover:scale-[1.02] hover:shadow-lg relative overflow-hidden ${isExpanded ? '' : 'justify-center px-3'}`}
              title={isExpanded ? undefined : 'Sair'}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 p-1.5 rounded-lg bg-white/10 group-hover:bg-red-500/20 transition-all duration-300 group-hover:scale-110">
                <LogOut className="w-5 h-5 group-hover:text-red-300 transition-colors duration-300" />
              </div>
              {isExpanded && (
                <span className="relative z-10 text-sm font-semibold">Sair</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button - Removido pois agora é sempre hover */}

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setError('');
          setSuccess('');
        }}
        title="Alterar Senha"
        maxWidth="md"
      >
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200/50 p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Senha Atual
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/80 backdrop-blur-sm transition-all duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/80 backdrop-blur-sm transition-all duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirme a Nova Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/80 backdrop-blur-sm transition-all duration-200"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-medium text-sm">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-medium text-sm">{success}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200/50">
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setError('');
                  setSuccess('');
                }}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Alterando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Alterar Senha</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>    
    </> 
  );
};

export default Sidebar;
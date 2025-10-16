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
  Rocket,
  Loader2,
  Check,
  CalendarDays,
  MessageSquare,
  Sun,
  Moon,
  Users,
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { DomainConfig } from '../utils/DomainConfig';
import Modal from './Modal';
import { fetchUserPermissions, hasPermission, clearUserPermissions } from '../utils/permissions';
import { ThemeContext } from '../context/ThemeContext';
import { clearChatCache } from '../utils/chatCache';
import type { LoginResponse } from '../types/auth';
import { Send, FileText, Sliders } from "lucide-react";
import { ThemeToggleButton } from './ThemeToggleButton';


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
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isProspectarOpen, setIsProspectarOpen] = useState(false);
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

  const currentWorkspaceName =
  storedUser?.nome_cliente ??
  'Desconhecido';

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Determina se a sidebar deve aparecer expandida (hover ou não colapsada)
  const isExpanded = !isCollapsed || isHovered;

  // Detecta mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handlers para gestos de swipe no mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;

    if (isLeftSwipe && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

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

    return 'left-0 top-full w-[22rem]';
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
      { path: '/conversas', text: 'Conversas', icon: MessageSquare, permission: hasPermission('can_view_menu_chat') },
      { path: '/ai-agent', text: 'Agente de IA', icon: Bot, permission: hasPermission('can_view_menu_agent') },
      { path: '/crm', text: 'CRM', icon: GitBranch, permission: hasPermission('can_view_menu_crm') },
      { path: '/prospectar', text: 'Envios em Massa', icon: Rocket, permission: hasPermission('can_view_menu_prospect') },

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
      {/* Mobile Top Navigation - Todas as páginas */}
      {isMobile && (
        <>
          {/* Overlay quando menu está aberto */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Drawer lateral para mobile */}
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] z-[9999] ${domainConfig.getSidebarColor()} border-r border-gray-300 dark:border-neutral-700 backdrop-blur-md shadow-2xl transform transition-transform duration-300 ease-out transition-theme ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Header do drawer */}
            <div className="flex items-center justify-between p-4 border-b border-gray-300/50 dark:border-neutral-700" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
              <img
                src={theme === 'dark' ? logos.fullDark : logos.full}
                alt="Logo"
                className="h-12 object-contain"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-neutral-700 active:bg-white/20 dark:active:bg-neutral-600 transition-colors touch-manipulation"
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6 text-gray-700 dark:text-neutral-300" />
              </button>
            </div>

            {/* Conteúdo do drawer */}
            <nav className="flex flex-col h-[calc(100%-80px)] overflow-y-auto p-4 space-y-2 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* Workspace Button */}
              <button
                onClick={() => {
                  setIsWorkspaceModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/60 dark:bg-neutral-700/60 backdrop-blur-sm border border-gray-300/70 dark:border-neutral-600 hover:bg-white dark:hover:bg-neutral-600 active:bg-white/90 dark:active:bg-neutral-500 hover:shadow-md active:scale-[0.98] transition-all duration-200 text-gray-800 dark:text-neutral-100 touch-manipulation"
                aria-label="Selecionar Workspace"
              >
                <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-600 text-gray-600 dark:text-neutral-200">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[13px] font-semibold tracking-tight">
                    Workspace
                  </span>
                  <span className="text-xs text-gray-500 dark:text-neutral-400 truncate mt-[2px]">
                    {currentWorkspaceName ?? 'Desconhecido'}
                  </span>
                </div>
              </button>

              {/* Menu Items */}
              <div className="flex flex-col space-y-1 pt-4">
                {getMenuItems().map((item) =>
                  item.text === 'Tutoriais' ? (
                    <div key="tutorial-section">
                      <hr className="mx-2 my-3 border-t border-gray-300/40" />
                      <a
                        href="https://tutorial.guimoo.com.br/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation ${domainConfig.getDefaultColor()} ${domainConfig.getHoverBg()} hover:shadow-md active:shadow-lg`}
                      >
                        <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all">
                          <item.icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold">{item.text}</span>
                      </a>

                      <a
                        href="https://wa.me/553892590370"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation text-emerald-700 hover:text-white hover:bg-emerald-500 active:bg-emerald-600 hover:shadow-md active:shadow-lg mt-1"
                      >
                        <div className="p-2 rounded-lg bg-emerald-50 group-hover:bg-emerald-600/90 group-hover:text-white transition-all">
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
                        <span className="text-sm font-semibold">Suporte</span>
                      </a>
                    </div>
                  ) : (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation ${
                        currentPath.startsWith(item.path)
                          ? `${domainConfig.getActiveBg()} ${domainConfig.getActiveColor()} shadow-lg scale-[1.02]`
                          : `${domainConfig.getDefaultColor()} ${domainConfig.getHoverBg()} hover:shadow-md active:shadow-lg`
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-all ${
                        currentPath.startsWith(item.path)
                          ? 'bg-white/20'
                          : 'bg-white/10 group-hover:bg-white/20'
                      }`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-semibold">{item.text}</span>
                      {item.isBeta && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-100/90 px-2 py-1 rounded-full uppercase tracking-wider font-bold">
                          BETA
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>

              {/* Profile Section */}
              <div className="mt-auto pt-4 border-t border-gray-300/40 dark:border-neutral-700 space-y-3">
                <button
                  onClick={() => {
                    setIsPasswordModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl active:scale-[0.98] touch-manipulation ${domainConfig.getDefaultColor()} ${domainConfig.getHoverBg()} hover:shadow-md active:shadow-lg transition-all`}
                  aria-label="Trocar senha"
                >
                  <div className="p-2 rounded-lg bg-white/10 dark:bg-white/5 group-hover:bg-white/20 dark:group-hover:bg-white/10 transition-all">
                    <Key className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold">Trocar senha</span>
                </button>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 active:bg-red-200 dark:active:bg-red-800 hover:shadow-md active:shadow-lg active:scale-[0.98] touch-manipulation transition-all"
                  aria-label="Sair da conta"
                >
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900 group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-all">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold">Sair</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Top Navigation Bar - Fixo no topo */}
          <div
            className="fixed top-0 left-0 right-0 z-[9997] bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 shadow-sm transition-theme"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            {/* Header com logo e botão de usuário */}
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 active:bg-gray-200 dark:active:bg-neutral-600 transition-colors touch-manipulation"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
                </button>
                <img
                  src={theme === 'dark' ? logos.fullDark : logos.full}
                  alt="Logo"
                  className="h-14 object-contain"
                />
              </div>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`w-9 h-9 rounded-full ${domainConfig.getProfileBg()} flex items-center justify-center text-sm font-bold shadow-sm hover:shadow-md transition-shadow touch-manipulation text-gray-700 dark:text-neutral-100`}
              >
                {initials}
              </button>
            </div>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <>
                {/* Overlay */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute top-full right-4 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 z-50 overflow-hidden transition-theme">
                <div className="p-4 border-b border-gray-100 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${domainConfig.getProfileBg()} flex items-center justify-center text-base font-bold text-gray-700 dark:text-neutral-100`}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{userName}</p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">{currentWorkspaceName}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setIsWorkspaceModalOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 active:bg-gray-100 dark:active:bg-neutral-600 transition-colors touch-manipulation text-left"
                  >
                    <Users className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                    <span className="text-sm text-gray-700 dark:text-neutral-200">Trocar Workspace</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPasswordModalOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 active:bg-gray-100 dark:active:bg-neutral-600 transition-colors touch-manipulation text-left"
                  >
                    <Key className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                    <span className="text-sm text-gray-700 dark:text-neutral-200">Trocar Senha</span>
                  </button>
                </div>
                <div className="p-2 border-t border-gray-100 dark:border-neutral-700">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 active:bg-red-100 dark:active:bg-red-900 transition-colors touch-manipulation text-left text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sair</span>
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        </>
      )}


      {/* Desktop Sidebar */}
<div
  ref={sidebarRef}
  id="sidebar-container"
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
  className={`fixed top-0 left-0 bottom-0 z-[9999] transition-all duration-500 ease-in-out transform ${
    domainConfig.getSidebarColor()
  } border-r border-gray-300 dark:border-neutral-700 backdrop-blur-md shadow-xl transition-theme
  ${isExpanded ? 'w-56' : 'w-16'}
  ${isMobile ? 'hidden' : ''}
  `}
  style={{
    willChange: 'width, transform',
  }}
>


        {/* Background overlay */}
        {!isMobile && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 dark:from-black/10 to-white/2 dark:to-transparent backdrop-blur-sm"></div>
        )}

        {!isMobile && (
          <div className={`relative z-10 flex items-center px-4 pt-3 mb-2 ${isExpanded ? '' : 'justify-center'}`}>
            <div className="relative group">
              <img
                src={isExpanded ? (theme === 'dark' ? logos.fullDark : logos.full) : (theme === 'dark' ? logos.reducedDark : logos.reduced)}
                alt="Logo"
                className={`transition-all duration-300 ${
                  isExpanded
                    ? 'w-[180px] h-[60px] object-contain group-hover:scale-105'
                    : 'w-12 h-10 object-contain group-hover:scale-110'
                } filter drop-shadow-lg`}
              />
              {/* Glow effect */}
              <div className="absolute inset-0 bg-white/10 dark:bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
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



            </div>


{getMenuItems().map((item) =>
  item.text === 'Tutoriais' ? (
    <>
      {/* Divisor antes do Tutoriais */}
      <hr className="mx-3 my-2 border-t border-gray-300/40" />

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
          <div className="absolute bottom-0 left-0 w-full z-20 border-t border-white/10 dark:border-neutral-700 backdrop-blur-sm bg-white/30 dark:bg-neutral-900/50 p-3">
            {/* Novo botão Workspaces */}
<div className="relative mb-4">
  <button
    onClick={() => setIsWorkspaceModalOpen(true)}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
               bg-white/60 dark:bg-neutral-700/60 backdrop-blur-sm border border-gray-300/70 dark:border-neutral-600
               hover:bg-white dark:hover:bg-neutral-600 hover:shadow-md
               transition-all duration-300 text-gray-800 dark:text-neutral-100 group"
  >
    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-600 text-gray-600 dark:text-neutral-200 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors duration-300">
      <Users className="w-5 h-5" />
    </div>
    {isExpanded && (
      <div className="flex flex-col items-start text-left">
        <span className="text-[13px] font-semibold tracking-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
          Workspace
        </span>
        <span className="text-xs text-gray-500 dark:text-neutral-400 truncate mt-[2px]">
          {currentWorkspaceName ?? 'Desconhecido'}
        </span>
      </div>
    )}
  </button>
</div>


            {isExpanded && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`group w-full flex items-center gap-3 p-3 rounded-xl ${domainConfig.getDefaultColor()} ${domainConfig.getHoverBg()} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden`}
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 dark:from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className={`relative z-10 w-10 h-10 rounded-xl ${domainConfig.getProfileBg()} flex items-center justify-center text-sm font-bold text-gray-700 dark:text-neutral-100 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {initials}
                  </div>
                  <div className="relative z-10 flex-1 text-left">
                    <p className="text-sm font-semibold truncate">{userName}</p>
                    <p className="text-xs opacity-70">Minha conta</p>
                  </div>
                  <ChevronDown className={`relative z-10 w-5 h-5 transition-all duration-300 ${isProfileMenuOpen ? 'rotate-180' : 'group-hover:scale-110'}`} />
                </button>

                {isProfileMenuOpen && (
                  <div className={`mt-3 p-2 ${domainConfig.getActiveBg()} rounded-xl backdrop-blur-sm border border-white/10 dark:border-neutral-700 shadow-xl space-y-2`}>
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      className={`group w-full flex items-center gap-3 px-3 py-2 text-sm ${domainConfig.getActiveColor()} ${domainConfig.getHoverBg()} rounded-lg transition-all duration-300 hover:scale-[1.02]`}
                    >
                      <div className="p-1.5 rounded-lg bg-white/10 dark:bg-white/5 group-hover:bg-white/20 dark:group-hover:bg-white/10 transition-colors duration-300">
                        <Key className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Trocar senha</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Botão de toggle de tema */}
            <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} mb-3`}>
              {isExpanded && (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tema</span>
              )}
              <ThemeToggleButton />
            </div>

            <button
              onClick={handleLogout}
              className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${domainConfig.getDefaultColor()} ${domainConfig.getHoverBg()} hover:scale-[1.02] hover:shadow-lg relative overflow-hidden ${isExpanded ? '' : 'justify-center px-3'}`}
              title={isExpanded ? undefined : 'Sair'}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 dark:from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative z-10 p-1.5 rounded-lg bg-white/10 dark:bg-white/5 group-hover:bg-red-500/20 dark:group-hover:bg-red-500/30 transition-all duration-300 group-hover:scale-110">
                <LogOut className="w-5 h-5 group-hover:text-red-300 dark:group-hover:text-red-400 transition-colors duration-300" />
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
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-900 rounded-xl border border-gray-300/50 dark:border-neutral-700 p-6 transition-theme">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">
                Senha Atual
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 backdrop-blur-sm transition-all duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 backdrop-blur-sm transition-all duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">
                Confirme a Nova Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 backdrop-blur-sm transition-all duration-200"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-700 dark:text-red-300 font-medium text-sm">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-300 font-medium text-sm">{success}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-300/50 dark:border-neutral-700">
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
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
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
<Modal
  isOpen={isWorkspaceModalOpen}
  onClose={() => setIsWorkspaceModalOpen(false)}
  title="Selecionar Workspace"
  maxWidth="lg"
>
  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-900 rounded-xl border border-gray-300/50 dark:border-neutral-700 p-6 space-y-6 transition-theme">
    {/* 🧭 BLOCO SUPERIOR - WORKSPACE ATUAL */}
    <div className="p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-start gap-3">
      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
        <GitBranch className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">
          Você está no workspace:
        </span>
        <span className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
          {storedUser?.nome_cliente ?? 'Desconhecido'}
        </span>
        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
          Selecione outro workspace abaixo para mudar.
        </p>
      </div>
    </div>

    {/* 🧭 CABEÇALHO */}
    <div className="flex items-center justify-between border-b border-gray-300 dark:border-neutral-700 pb-3">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-neutral-100 flex items-center gap-2">
        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        Workspaces
      </h2>
      <span className="text-sm text-gray-400 dark:text-neutral-500">{linkedAccounts.length}</span>
    </div>

    {/* 🔍 CAMPO DE BUSCA */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
      <input
        type="text"
        value={linkedAccountsSearch}
        onChange={(e) => setLinkedAccountsSearch(e.target.value)}
        placeholder="Buscar workspace..."
        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-700 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
      />
    </div>

    {/* 🧾 LISTA DE WORKSPACES */}
    <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
      {linkedAccountsLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Carregando contas...</span>
        </div>
      ) : linkedAccountsError ? (
        <p className="text-sm text-rose-500 dark:text-rose-400">{linkedAccountsError}</p>
      ) : filteredLinkedAccounts.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-neutral-400">Nenhuma conta encontrada.</p>
      ) : (
        filteredLinkedAccounts.map((account, index) => {
          // Normaliza IDs
          const accClientId =
            account.id_cliente ??
            account.id_cliente_atual ??
            account.cliente_id ??
            account.company_id;

          const accUserId =
            account.id_usuario ??
            account.id_usuario_atual ??
            account.usuario_id ??
            account.user_id;

          const accountKey = `${accClientId ?? 'n'}-${accUserId ?? 'n'}-${index}`;
          const isCurrent =
            String(accClientId) === String(currentClientId) &&
            String(accUserId) === String(currentUserId);
          const isSwitching = switchingAccountKey === accountKey;

          return (
            <button
              key={accountKey}
              onClick={() => handleWorkspaceSwitch(account, accountKey)}
              disabled={isSwitching || isCurrent}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                isCurrent
                  ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/50 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isCurrent ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-neutral-600 text-gray-500 dark:text-neutral-300'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                </div>
                <span className="truncate">{account.nome_cliente ?? 'Sem nome'}</span>
              </div>

              <div className="flex items-center gap-2">
                {isSwitching && <Loader2 className="w-4 h-4 animate-spin text-emerald-500 dark:text-emerald-400" />}
                {isCurrent && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-100 dark:bg-emerald-900 px-2 py-1 rounded-lg">
                    Ativo
                  </span>
                )}
              </div>
            </button>
          );
        })
      )}
    </div>

    {/* ⚠️ MENSAGEM DE ERRO */}
    {workspaceSwitchError && (
      <p className="mt-3 text-sm font-medium text-rose-500 dark:text-rose-400">{workspaceSwitchError}</p>
    )}
  </div>
</Modal>




    
    </> 
  );
};

export default Sidebar;
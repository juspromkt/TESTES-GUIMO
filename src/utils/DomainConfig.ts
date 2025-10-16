import { colors, backgrounds, getColorScale } from '../styles/tokens';

export class DomainConfig {
  private static instance: DomainConfig;
  private isCustomDomain: boolean;
  private readonly STORAGE_KEY = 'domain_config';
  private readonly CUSTOM_DOMAINS = [
    'app.gestao10x.com',
    'crm.converteai.app.br',
    'app.closeia.pro',
    'app.atomdigital.com.br',
    'crm.sharkinteligenciacomercial.com.br',
    'app.agentesia.com.br',
    'app.renoveia.com',
    'crm.lumendigital.com.br',
    'app.aivia.chat',
    'admin.prospectax.site'
  ];

  private readonly DOMAIN_THEMES = {
    'default': {
      name: 'Guimoo',
      gradient: 'from-neutral-50 to-neutral-50',
      path: '/guimoo',

      // 🎨 Cores do Design System
      activeColor: 'text-neutral-900 dark:text-neutral-100',
      defaultColor: 'text-neutral-700 dark:text-neutral-300',
      hoverBg: 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
      activeBg: 'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 shadow-sm',
      sidebarBg: 'bg-neutral-50 dark:bg-neutral-900',
      profileBg: 'bg-neutral-100 dark:bg-neutral-800',
      textLoginColor: 'text-neutral-900 dark:text-neutral-100',

      // Design Tokens
      colors: {
        primary: 'primary',
        secondary: 'neutral',
        accent: 'accent'
      },

      // Backgrounds
      backgroundLight: backgrounds.light.primary,
      backgroundDark: backgrounds.dark.primary,
    },
    'purple': {
      name: 'Guimoo Purple',
      gradient: 'from-purple-50 to-purple-50',
      path: '/guimoo',

      // 🟣 Tema roxo alternativo (usado no login)
      activeColor: 'text-purple-900 dark:text-purple-100',
      defaultColor: 'text-purple-700 dark:text-purple-300',
      hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-900',
      activeBg: 'bg-white dark:bg-purple-900 border border-purple-300 dark:border-purple-700 shadow-sm',
      sidebarBg: 'bg-purple-50 dark:bg-purple-950',
      profileBg: 'bg-purple-100 dark:bg-purple-900',
      textLoginColor: 'text-purple-900 dark:text-purple-100',

      colors: {
        primary: 'purple',
        secondary: 'neutral',
        accent: 'accent'
      },

      backgroundLight: backgrounds.light.primary,
      backgroundDark: backgrounds.dark.primary,
    }
  };

  private constructor() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.isCustomDomain = JSON.parse(stored);
    } else {
      this.isCustomDomain = this.checkDomain();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.isCustomDomain));
    }
  }

  static getInstance(): DomainConfig {
    if (!DomainConfig.instance) {
      DomainConfig.instance = new DomainConfig();
    }
    return DomainConfig.instance;
  }

  private checkDomain(): boolean {
    return this.CUSTOM_DOMAINS.includes(window.location.hostname);
  }

  getCurrentDomain(): string {
    return window.location.hostname;
  }

  private getDomainTheme() {
    const currentDomain = this.getCurrentDomain();
    return this.DOMAIN_THEMES[currentDomain] || this.DOMAIN_THEMES.default;
  }

  isAppDomain(): boolean {
    return this.isCustomDomain;
  }

  getTextLoginColor(): string {
    return this.getDomainTheme().textLoginColor;
  }

  getSidebarColor(): string {
    return this.getDomainTheme().sidebarBg;
  }

  getActiveColor(): string {
    return this.getDomainTheme().activeColor;
  }

  getDefaultColor(): string {
    return this.getDomainTheme().defaultColor;
  }

  getHoverBg(): string {
    return this.getDomainTheme().hoverBg;
  }

  getActiveBg(): string {
    return this.getDomainTheme().activeBg;
  }

  getProfileBg(): string {
    return this.getDomainTheme().profileBg;
  }

  getLogos() {
    const theme = this.getDomainTheme();
    return {
      full: `${theme.path}/logo-cumprida.png`,
      fullDark: `${theme.path}/logo-dark-mode.png`,
      reduced: `${theme.path}/logo-reduzida.png`,
      reducedDark: `${theme.path}/icon-dark-mode.png`,
      login: `${theme.path}/logo-login.png`,
      loginDark: `${theme.path}/logo-login-dark.png`,
      favicon: `${theme.path}/favicon.ico`
    };
  }

  getTitle(): string {
    const currentDomain = this.getCurrentDomain();
    switch (currentDomain) {
      default:
        return 'Guimoo - IA para Advogados';
    }
  }

  getMenuItems() {
    const currentDomain = this.getCurrentDomain();

    return [
      { path: '/dashboard', text: 'Dashboard' },
      { path: '/chat', text: 'Chat' },
      { path: '/ai-agent', text: 'Agente de IA' },
      { path: '/crm', text: 'CRM' },
      { path: '/agendamentos', text: 'Agendamentos' },
      { path: '/conexao', text: 'Conexão' },
      { path: '/configuracoes', text: 'Configurações' }
    ];
  }

  // 🎯 Métodos para acessar cores dos tokens
  getPrimaryColor(shade: number = 600): string {
    const theme = this.getDomainTheme();
    return `${theme.colors.primary}-${shade}`;
  }

  getSecondaryColor(shade: number = 600): string {
    const theme = this.getDomainTheme();
    return `${theme.colors.secondary}-${shade}`;
  }

  getAccentColor(shade: number = 600): string {
    const theme = this.getDomainTheme();
    return `${theme.colors.accent}-${shade}`;
  }

  // 🎨 Classes utilitárias com suporte a dark mode
  getButtonClasses(): string {
    const theme = this.getDomainTheme();
    return `bg-${theme.colors.primary}-600 hover:bg-${theme.colors.primary}-700 dark:bg-${theme.colors.primary}-700 dark:hover:bg-${theme.colors.primary}-600 text-white transition-theme`;
  }

  getCardClasses(): string {
    const theme = this.getDomainTheme();
    return `bg-white dark:bg-neutral-800 border border-${theme.colors.primary}-100 dark:border-neutral-700 transition-theme`;
  }

  getStageClasses(): string {
    const theme = this.getDomainTheme();
    return `bg-${theme.colors.secondary}-50 dark:bg-${theme.colors.secondary}-900 border-${theme.colors.secondary}-100 dark:border-${theme.colors.secondary}-700 transition-theme`;
  }

  getAgentClasses(): string {
    const theme = this.getDomainTheme();
    return `bg-${theme.colors.accent}-50 dark:bg-${theme.colors.accent}-900 border-${theme.colors.accent}-100 dark:border-${theme.colors.accent}-700 transition-theme`;
  }

  // 🔧 Helper para obter cor do design system
  getColorFromTokens(color: keyof typeof colors, shade: number): string {
    return getColorScale(color, shade);
  }
}

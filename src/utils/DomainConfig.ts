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
      gradient: 'from-[#f9fafb] to-[#f9fafb]',
      path: '/guimoo',

      // 🎨 Cores neutras
      activeColor: 'text-gray-900',
      defaultColor: 'text-gray-700',
      hoverBg: 'hover:bg-gray-100',
      activeBg: 'bg-white border border-gray-200 shadow-sm',
      sidebarBg: 'bg-[#f9fafb]',
      profileBg: 'bg-gray-100',
      textLoginColor: 'text-gray-900',

      colors: {
        primary: 'gray',
        secondary: 'slate',
        accent: 'emerald'
      }
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
      reduced: `${theme.path}/logo-reduzida.png`,
      login: `${theme.path}/logo-login.png`,
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

  getButtonClasses(): string {
    const theme = this.getDomainTheme();
    return `bg-${theme.colors.primary}-600 hover:bg-${theme.colors.primary}-700 text-white`;
  }

  getCardClasses(): string {
    const theme = this.getDomainTheme();
    return `bg-${theme.colors.primary}-50 border-${theme.colors.primary}-100`;
  }

  getStageClasses(): string {
    const theme = this.getDomainTheme();
    return `bg-${theme.colors.secondary}-50 border-${theme.colors.secondary}-100`;
  }

  getAgentClasses(): string {
    const theme = this.getDomainTheme();
    return `bg-${theme.colors.accent}-50 border-${theme.colors.accent}-100`;
  }
}

import React, { useState, useEffect } from 'react';
import { Video, Search, GraduationCap, BookOpen, Clock, ChevronRight, FileText, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfigLayout from '../components/configuracoes/ConfigLayout';
import capaDefault from '/src/imgs/tutoriais/Capa Tutoriais.png';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import { allArticles as articles, Article } from '../data/articles';

// Importando capas dos tutoriais
import capaVisaoGeral from '../components/capaTutoriais/Visão Geral do Sistema.jpg';
import capaPrimeirosPassos from '../components/capaTutoriais/Primeiros Passos.jpg';
import capaConexoesWhatsApp from '../components/capaTutoriais/Conexões de WhatsApp.jpg';
import capaAbaConversas from '../components/capaTutoriais/Aba de Conversas.jpg';
import capaControleIA from '../components/capaTutoriais/Controle da IA.jpg';
import capaOrigemLead from '../components/capaTutoriais/Origem do Lead.jpg';
import capaCamposPersonalizados from '../components/capaTutoriais/Campos Personalizados.jpg';
import capaGestaoUsuarios from '../components/capaTutoriais/Gestão de Usuários.jpg';
import capaFunilVendas from '../components/capaTutoriais/Funil de Vendas.jpg';
import capaEtiquetas from '../components/capaTutoriais/Etiquetas.jpg';
import capaEnvioMassa from '../components/capaTutoriais/Envio em Massa.jpg';
import capaAgendamentos from '../components/capaTutoriais/Agendamentos.jpg';
import capaDashboard from '../components/capaTutoriais/Dashboard.jpg';
import capaFuncaoSair from '../components/capaTutoriais/Função Sair.jpg';
import capaZapSign from '../components/capaTutoriais/Como criar e usar modelos no ZapSign.jpg';
import capaHistoricoFollowUp from '../components/capaTutoriais/Histórico de Follow-Up.jpg';
import capaSistemaWorkspace from '../components/capaTutoriais/Sistema de Workspace.jpg';
import capaGoogleAgenda from '../components/capaTutoriais/Configuração do Google Agenda.jpg';
import capaGoogleAgendaWorkspace from '../components/capaTutoriais/Configurando Google Agenda - Workspace.jpg';
import capaIAMovimentacao from '../components/capaTutoriais/Agente de IA - Movimentação Automática.jpg';
import capaIAEtapas from '../components/capaTutoriais/Agente de IA - Etapas de Atendimento.jpg';
import capaIAPerguntasFrequentes from '../components/capaTutoriais/Agente de IA - Perguntas Frequentes.jpg';
import capaIARegrasGerais from '../components/capaTutoriais/Agente de IA - Regras Gerais.jpg';
import capaIAPersonalidade from '../components/capaTutoriais/Agente de IA - Personalidade.jpg';
import capaIAAudio from '../components/capaTutoriais/Agente de IA - Áudio.jpg';
import capaIAGatilhos from '../components/capaTutoriais/Agente de IA - Gatilhos.jpg';
import capaIAHorarios from '../components/capaTutoriais/Agente de IA - Horários de Funcionamento.jpg';
import capaIAModelos from '../components/capaTutoriais/Agente de IA - Modelos de Agente.jpg';
import capaIANotificacoes from '../components/capaTutoriais/Agente de IA - Notificações no WhatsApp.jpg';
import capaIAParametros from '../components/capaTutoriais/Agente de IA - Parâmetros do Agente.jpg';
import capaIATeste from '../components/capaTutoriais/Agente de IA - Teste de Agente.jpg';
import capaIAFollowUp from '../components/capaTutoriais/Agente de IA - Follow-Up Automático.jpg';
import capaCampanhaTrabalhista from '../components/capaTutoriais/Criando uma campanha trabalhista no Google Ads.jpg';
import capaCaixaPreta from '../components/capaTutoriais/Caixa Preta dos Anúncios BPC-LOAS que convertem.jpg';

type SectionId = 'videos' | 'artigos' | 'academy';

interface VideoLesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  category: SectionId;
  duration?: string;
  level?: 'iniciante' | 'intermediario' | 'avancado'; // Nível do vídeo
}

// Dados de exemplo - você pode substituir pelos seus vídeos reais
const videoLessons: VideoLesson[] = [
// ==========================
// 🟢 INICIANTE
// ==========================
{
  id: 'iniciante-1',
  title: 'Visão geral do sistema',
  description: 'Conheça a visão geral do sistema e entenda todas as principais áreas, menus e funcionalidades para começar a usar com confiança.',
  videoUrl: 'https://www.youtube.com/embed/9bvB2s3yYY4',
  thumbnail: capaVisaoGeral,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-1a',
  title: 'Primeiros passos',
  description: 'Aprenda como dar os primeiros passos no sistema e configurar sua conta inicial.',
  videoUrl: 'https://www.youtube.com/embed/JA1XbU0m7dg',
  thumbnail: capaPrimeirosPassos,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-2',
  title: 'Conexões de WhatsApp',
  description: 'Aprenda como conectar seu número de WhatsApp no sistema de forma segura e estável.',
  videoUrl: 'https://www.youtube.com/embed/opEk2CZXPbQ',
  thumbnail: capaConexoesWhatsApp,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-3',
  title: 'Aba de conversas',
  description: 'Entenda como funciona a aba de conversas e gerencie seus atendimentos com eficiência.',
  videoUrl: 'https://www.youtube.com/embed/zJ5uU6T7mXU',
  thumbnail: capaAbaConversas,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-4',
  title: 'Controle da IA',
  description: 'Veja como ativar, pausar e configurar o comportamento da inteligência artificial no atendimento.',
  videoUrl: 'https://www.youtube.com/embed/2dmfLEFO_M4',
  thumbnail: capaControleIA,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-5',
  title: 'Origem do Lead',
  description: 'Aprenda a identificar e organizar as origens dos seus leads para melhorar seus resultados.',
  videoUrl: 'https://www.youtube.com/embed/CvIO6rpdxyE',
  thumbnail: capaOrigemLead,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-6',
  title: 'Campos Personalizados',
  description: 'Veja como criar e usar campos personalizados para armazenar informações específicas dos seus contatos.',
  videoUrl: 'https://www.youtube.com/embed/BpqRa2z5C70',
  thumbnail: capaCamposPersonalizados,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-7',
  title: 'Gestão de Usuários',
  description: 'Veja como adicionar, editar e gerenciar usuários e suas permissões no sistema.',
  videoUrl: 'https://www.youtube.com/embed/rwpc7-RhnZY',
  thumbnail: capaGestaoUsuarios,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-8',
  title: 'Funil de Vendas',
  description: 'Entenda como funciona o funil de vendas e organize suas etapas de negociação.',
  videoUrl: 'https://www.youtube.com/embed/ZB7dnxzPtVQ',
  thumbnail: capaFunilVendas,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-9',
  title: 'Etiquetas',
  description: 'Aprenda a criar e usar etiquetas para classificar e filtrar seus contatos e atendimentos.',
  videoUrl: 'https://www.youtube.com/embed/MlfyAv0T-yM',
  thumbnail: capaEtiquetas,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-10',
  title: 'Envios em Massa',
  description: 'Descubra como enviar mensagens para vários contatos ao mesmo tempo de forma rápida e segura.',
  videoUrl: 'https://www.youtube.com/embed/g-LnY0tsRys',
  thumbnail: capaEnvioMassa,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-11',
  title: 'Agendamentos',
  description: 'Aprenda a criar e gerenciar agendamentos automáticos ou manuais dentro do sistema.',
  videoUrl: 'https://www.youtube.com/embed/sxfOVulE5bY',
  thumbnail: capaAgendamentos,
  category: 'videos',
  level: 'iniciante'
},
{
  id: 'iniciante-12',
  title: 'Dashboard',
  description: 'Veja como interpretar e acompanhar seus resultados através do painel de controle do sistema.',
  videoUrl: 'https://www.youtube.com/embed/CXEojhawVVA',
  thumbnail: capaDashboard,
  category: 'videos',
  level: 'iniciante'
},

// ==========================
// 🟡 INTERMEDIÁRIO
// ==========================
{
  id: 'intermediario-1',
  title: 'Função #SAIR',
  description: 'Saiba como utilizar o comando #SAIR para reiniciar uma conversa com a IA e evitar erros de contexto durante os testes.',
  videoUrl: 'https://www.youtube.com/embed/ac5xdr3eRvA',
  thumbnail: capaFuncaoSair,
  category: 'videos',
  level: 'intermediario'
},
{
  id: 'intermediario-2',
  title: 'Como criar e usar Modelos na ZapSign',
  description: 'Aprenda como criar modelos na ZapSign e integrar seus documentos de forma rápida e eficiente.',
  videoUrl: 'https://www.youtube.com/embed/yQHe_uflWH4',
  thumbnail: capaZapSign,
  category: 'videos',
  level: 'intermediario'
},
{
  id: 'intermediario-4',
  title: 'Histórico de Follow-up',
  description: 'Aprenda como visualizar e gerenciar o histórico de follow-up dos seus contatos e negociações.',
  videoUrl: 'https://www.youtube.com/embed/HIkErNJj_Oc',
  thumbnail: capaHistoricoFollowUp,
  category: 'videos',
  level: 'intermediario'
},
{
  id: 'intermediario-6',
  title: 'Sistema de Workspace',
  description: 'Veja como o sistema de Workspaces permite gerenciar múltiplas contas e equipes de forma organizada.',
  videoUrl: 'https://www.youtube.com/embed/sdcHHttDuNc',
  thumbnail: capaSistemaWorkspace,
  category: 'videos',
  level: 'intermediario'
},
{
  id: 'intermediario-7',
  title: 'Configuração do Google Agenda',
  description: 'Aprenda a integrar o Google Agenda com a Guimoo para automatizar seus compromissos.',
  videoUrl: 'https://www.youtube.com/embed/O00atxrkStY',
  thumbnail: capaGoogleAgenda,
  category: 'videos',
  level: 'intermediario'
},
{
  id: 'intermediario-8',
  title: 'Configurando Google Agenda - Workspace',
  description: 'Tutorial detalhado para integrar o Google Workspace com o sistema e sincronizar agendas de todos os usuários.',
  videoUrl: 'https://www.youtube.com/embed/MxRlIa5I45A',
  thumbnail: capaGoogleAgendaWorkspace,
  category: 'videos',
  level: 'intermediario'
},

// ==========================
// 🔵 AVANÇADO
// ==========================
{
  id: 'avancado-1',
  title: 'Agente de IA - Movimentação Automática',
  description: 'Entenda como configurar a movimentação automática da IA para agilizar atendimentos e distribuir tarefas entre etapas.',
  videoUrl: 'https://www.youtube.com/embed/RfMSykWNiSU',
  thumbnail: capaIAMovimentacao,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-2',
  title: 'Agente de IA - Etapas de Atendimento',
  description: 'Aprenda a criar e ajustar as etapas do atendimento do agente de IA, otimizando fluxos de conversa e qualificação de leads.',
  videoUrl: 'https://www.youtube.com/embed/ziAEnz_TtNU',
  thumbnail: capaIAEtapas,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-3',
  title: 'Agente de IA - Perguntas Frequentes',
  description: 'Configure perguntas frequentes para que a IA responda automaticamente dúvidas recorrentes dos clientes.',
  videoUrl: 'https://www.youtube.com/embed/QJtyEIlIOdg',
  thumbnail: capaIAPerguntasFrequentes,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-4',
  title: 'Agente de IA - Regras Gerais',
  description: 'Veja como definir regras gerais que orientam o comportamento da IA durante todo o atendimento.',
  videoUrl: 'https://www.youtube.com/embed/Ob57-CzgtKY',
  thumbnail: capaIARegrasGerais,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-5',
  title: 'Agente de IA - Personalidade',
  description: 'Crie a personalidade da sua IA para deixá-la mais próxima do tom de voz do seu escritório e público-alvo.',
  videoUrl: 'https://www.youtube.com/embed/7oyC6BeB5mU',
  thumbnail: capaIAPersonalidade,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-6',
  title: 'Agente de IA - Áudio',
  description: 'Aprenda a configurar o reconhecimento e envio de áudios pela IA, tornando o atendimento mais natural.',
  videoUrl: 'https://www.youtube.com/embed/IHMhKjGWRxc',
  thumbnail: capaIAAudio,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-7',
  title: 'Agente de IA - Gatilhos',
  description: 'Veja como criar gatilhos automáticos para ativar respostas e ações da IA de forma inteligente.',
  videoUrl: 'https://www.youtube.com/embed/ngpRqvil5dg',
  thumbnail: capaIAGatilhos,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-8',
  title: 'Agente de IA - Horário de Funcionamento',
  description: 'Configure o horário de funcionamento da IA para que ela atenda apenas dentro do período desejado.',
  videoUrl: 'https://www.youtube.com/embed/4-5hr5hhmU4',
  thumbnail: capaIAHorarios,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-9',
  title: 'Agente de IA - Modelos de Agente',
  description: 'Aprenda a salvar, duplicar e reaproveitar modelos de agentes para diferentes tipos de atendimento.',
  videoUrl: 'https://www.youtube.com/embed/PEgQzrvM2c0',
  thumbnail: capaIAModelos,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-10',
  title: 'Agente de IA - Notificações no WhatsApp',
  description: 'Saiba como configurar notificações automáticas via WhatsApp para acompanhar a atuação da IA em tempo real.',
  videoUrl: 'https://www.youtube.com/embed/LSK2t4GJACw',
  thumbnail: capaIANotificacoes,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-11',
  title: 'Agente de IA - Parâmetros do Agente',
  description: 'Entenda cada parâmetro do agente e aprenda a ajustar tempo de resposta, reativação e comportamento da IA.',
  videoUrl: 'https://www.youtube.com/embed/PMKp2fuN-QQ',
  thumbnail: capaIAParametros,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-12',
  title: 'Agente de IA - Teste de Agente',
  description: 'Veja como testar corretamente seu agente de IA e validar o comportamento em diferentes cenários.',
  videoUrl: 'https://www.youtube.com/embed/rVQ0lfx-TBU',
  thumbnail: capaIATeste,
  category: 'videos',
  level: 'avancado'
},
{
  id: 'avancado-13',
  title: 'Agente de IA - Follow-up Automático',
  description: 'Aprenda a configurar o follow-up automático para que a IA retome conversas e aumente a taxa de conversão.',
  videoUrl: 'https://www.youtube.com/embed/uk_K6VqrFOY',
  thumbnail: capaIAFollowUp,
  category: 'videos',
  level: 'avancado'
},

// ==========================
// 🎓 GUIMOO ACADEMY
// ==========================
{
  id: 'academy-1',
  title: 'Criando uma campanha Trabalhista no Google Ads',
  description: 'Aprenda passo a passo como criar uma campanha trabalhista no Google Ads para atrair clientes qualificados para seu escritório.',
  videoUrl: 'https://www.youtube.com/embed/wMfBxHPlhMs',
  thumbnail: capaCampanhaTrabalhista,
  category: 'academy'
},
{
  id: 'academy-2',
  title: 'Caixa Preta dos anúncios BPC/Loas que convertem',
  description: 'Descubra as estratégias e configurações que tornam os anúncios de BPC/Loas altamente eficazes e aprenda como replicar campanhas que realmente convertem.',
  videoUrl: 'https://www.youtube.com/embed/1MohNBa9ZBQ',
  thumbnail: capaCaixaPreta,
  category: 'academy'
},



];

// Artigos importados de src/data/articles

const TutorialInterno: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openVideo } = useVideoPlayer();
  const [searchQuery, setSearchQuery] = useState('');

  // Mapeia URLs para IDs de seção
  const urlToSection: Record<string, SectionId> = {
    '/tutorial-interno/videos': 'videos',
    '/tutorial-interno/artigos': 'artigos',
    '/tutorial-interno/guimoo-academy': 'academy',
  };

  // Mapeia IDs de seção para URLs
  const sectionToUrl: Record<SectionId, string> = {
    videos: '/tutorial-interno/videos',
    artigos: '/tutorial-interno/artigos',
    academy: '/tutorial-interno/guimoo-academy',
  };

  // Detecta a seção ativa baseado na URL
  const getActiveSectionFromUrl = (): SectionId => {
    return urlToSection[location.pathname] || 'videos';
  };

  const [activeSection, setActiveSection] = useState<SectionId>(getActiveSectionFromUrl());

  // Sincroniza a seção ativa quando a URL muda
  useEffect(() => {
    const section = getActiveSectionFromUrl();
    setActiveSection(section);
  }, [location.pathname]);

  const sections = [
    { id: 'videos', label: 'Vídeos', icon: Video, show: true },
    { id: 'artigos', label: 'Artigos', icon: BookOpen, show: true },
    { id: 'academy', label: 'Guimoo Academy', icon: GraduationCap, show: true },
  ];

  // Função para mudar de seção e atualizar a URL
  const handleSectionChange = (sectionId: string) => {
    const section = sectionId as SectionId;
    navigate(sectionToUrl[section]);
  };

  // Filtrar vídeos por categoria e busca
  const filteredVideos = videoLessons.filter(video => {
    const hasSearch = searchQuery.trim() !== '';
    const matchesSearch = hasSearch &&
      (video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Se houver busca, ignora a categoria e busca em todas as abas
    if (hasSearch) {
      return matchesSearch;
    }

    // Se não houver busca, filtra apenas pela categoria ativa
    return video.category === activeSection;
  });

  const handleVideoClick = (video: VideoLesson) => {
    openVideo(video);
  };

  // State para controlar artigo aberto no painel lateral
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Filtrar artigos por busca
  const filteredArticles = articles.filter(article => {
    const hasSearch = searchQuery.trim() !== '';
    if (hasSearch) {
      return (
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
  };

  const closeArticlePanel = () => {
    setSelectedArticle(null);
  };

  const renderContent = () => {
    // Se a seção de artigos está ativa
    if (activeSection === 'artigos') {
      return (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                Artigos e Guias
              </h1>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold rounded-full">
                {articles.length} {articles.length === 1 ? 'artigo' : 'artigos'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Base de conhecimento em texto
            </p>
          </div>

          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar artigos..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 transition-all"
            />
          </div>

          {/* Lista de artigos */}
          {filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className="w-full bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6 text-left transition-all duration-300 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {article.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-neutral-400 mb-3">
                        {article.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-neutral-500">
                        {article.readTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {article.readTime}
                          </span>
                        )}
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex gap-2">
                            {article.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-gray-400 dark:text-neutral-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'Nenhum artigo encontrado' : 'Em breve'}
              </h3>
              <p className="text-gray-600 dark:text-neutral-400">
                {searchQuery
                  ? 'Tente buscar com outros termos'
                  : 'Estamos preparando artigos e guias completos para você'}
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Cabeçalho com busca */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                {activeSection === 'videos' ? 'Tutorial Interno' :
                 activeSection === 'academy' ? 'Guimoo Academy' : 'Tutorial Interno'}
              </h1>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold rounded-full">
                {activeSection === 'videos'
                  ? `${videoLessons.filter(v => v.category === 'videos').length} vídeos`
                  : activeSection === 'academy'
                  ? `${videoLessons.filter(v => v.category === 'academy').length} aulas`
                  : '0 itens'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              {activeSection === 'videos' ? 'Aprenda a usar todas as funcionalidades do sistema' :
               activeSection === 'academy' ? 'Treinamentos exclusivos e estratégias avançadas' :
               'Aprenda a usar todas as funcionalidades do sistema'}
            </p>
          </div>

          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar aulas..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 transition-all"
            />
          </div>
        </div>

        {/* Lista de vídeos */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVideos.map((video) => (
              <button
                key={video.id}
                onClick={() => handleVideoClick(video)}
                className="group relative bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-400 text-left"
              >
                {/* Thumbnail */}
                {video.thumbnail && (
                  <div className="relative w-full aspect-video overflow-hidden bg-gray-200 dark:bg-neutral-800">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
                        {video.duration}
                      </span>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[20px] border-l-blue-600 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Conteúdo */}
                <div className="p-4">
                  {/* Badge de nível quando em modo busca ou na aba videos */}
                  {(searchQuery.trim() !== '' || activeSection === 'videos') && video.level && (
                    <div className="mb-2">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        video.level === 'iniciante' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        video.level === 'intermediario' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {video.level === 'iniciante' ? 'Iniciante' :
                         video.level === 'intermediario' ? 'Intermediário' :
                         'Avançado'}
                      </span>
                    </div>
                  )}
                  {/* Badge de categoria quando em modo busca e não é vídeo com nível */}
                  {searchQuery.trim() !== '' && video.category === 'academy' && (
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-amber-700 dark:text-amber-400">
                        Guimoo Academy
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-neutral-400 line-clamp-2">
                    {video.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Video className="w-16 h-16 text-gray-400 dark:text-neutral-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma aula encontrada
            </h3>
            <p className="text-gray-600 dark:text-neutral-400">
              {searchQuery ? 'Tente buscar com outros termos' : 'Nenhuma aula disponível nesta categoria'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <ConfigLayout
        title="Tutoriais"
        description="Aprenda a usar o sistema"
        sections={sections}
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
      >
        {renderContent()}
      </ConfigLayout>

      {/* Painel lateral do artigo */}
      {selectedArticle && (
        <>
          {/* Overlay de fundo */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={closeArticlePanel}
          />

          {/* Painel lateral */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[40%] bg-white dark:bg-neutral-900 shadow-2xl z-50 overflow-hidden flex flex-col animate-slide-in-right">
            {/* Header do painel */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-neutral-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex-1 pr-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedArticle.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-neutral-400">
                  {selectedArticle.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedArticle.readTime}
                    </span>
                  )}
                  {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                    <div className="flex gap-2">
                      {selectedArticle.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={closeArticlePanel}
                className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-neutral-400" />
              </button>
            </div>

            {/* Conteúdo do artigo com scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300"
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
              />
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default TutorialInterno;

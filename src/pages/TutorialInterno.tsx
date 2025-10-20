import React, { useState } from 'react';
import { Video, Search, GraduationCap } from 'lucide-react';
import ConfigLayout from '../components/configuracoes/ConfigLayout';
import capaDefault from '/src/imgs/tutoriais/Capa Tutoriais.png';
import { useVideoPlayer } from '../context/VideoPlayerContext';

type SectionId = 'iniciante' | 'intermediario' | 'avancado' | 'academy';

interface VideoLesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  category: SectionId;
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
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-1a',
  title: 'Primeiros passos',
  description: 'Aprenda como dar os primeiros passos no sistema e configurar sua conta inicial.',
  videoUrl: 'https://www.youtube.com/embed/JA1XbU0m7dg',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-2',
  title: 'Conexões de WhatsApp',
  description: 'Aprenda como conectar seu número de WhatsApp no sistema de forma segura e estável.',
  videoUrl: 'https://www.youtube.com/embed/opEk2CZXPbQ',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-3',
  title: 'Aba de conversas',
  description: 'Entenda como funciona a aba de conversas e gerencie seus atendimentos com eficiência.',
  videoUrl: 'https://www.youtube.com/embed/zJ5uU6T7mXU',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-4',
  title: 'Controle da IA',
  description: 'Veja como ativar, pausar e configurar o comportamento da inteligência artificial no atendimento.',
  videoUrl: 'https://www.youtube.com/embed/2dmfLEFO_M4',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-5',
  title: 'Origem do Lead',
  description: 'Aprenda a identificar e organizar as origens dos seus leads para melhorar seus resultados.',
  videoUrl: 'https://www.youtube.com/embed/CvIO6rpdxyE',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-6',
  title: 'Campos Personalizados',
  description: 'Veja como criar e usar campos personalizados para armazenar informações específicas dos seus contatos.',
  videoUrl: 'https://www.youtube.com/embed/BpqRa2z5C70',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-7',
  title: 'Gestão de Usuários',
  description: 'Veja como adicionar, editar e gerenciar usuários e suas permissões no sistema.',
  videoUrl: 'https://www.youtube.com/embed/rwpc7-RhnZY',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-8',
  title: 'Funil de Vendas',
  description: 'Entenda como funciona o funil de vendas e organize suas etapas de negociação.',
  videoUrl: 'https://www.youtube.com/embed/ZB7dnxzPtVQ',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-9',
  title: 'Etiquetas',
  description: 'Aprenda a criar e usar etiquetas para classificar e filtrar seus contatos e atendimentos.',
  videoUrl: 'https://www.youtube.com/embed/MlfyAv0T-yM',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-10',
  title: 'Envios em Massa',
  description: 'Descubra como enviar mensagens para vários contatos ao mesmo tempo de forma rápida e segura.',
  videoUrl: 'https://www.youtube.com/embed/g-LnY0tsRys',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-11',
  title: 'Agendamentos',
  description: 'Aprenda a criar e gerenciar agendamentos automáticos ou manuais dentro do sistema.',
  videoUrl: 'https://www.youtube.com/embed/sxfOVulE5bY',
  thumbnail: capaDefault,
  category: 'iniciante'
},
{
  id: 'iniciante-12',
  title: 'Dashboard',
  description: 'Veja como interpretar e acompanhar seus resultados através do painel de controle do sistema.',
  videoUrl: 'https://www.youtube.com/embed/CXEojhawVVA',
  thumbnail: capaDefault,
  category: 'iniciante'
},

// ==========================
// 🟡 INTERMEDIÁRIO
// ==========================
{
  id: 'intermediario-1',
  title: 'Função #SAIR',
  description: 'Saiba como utilizar o comando #SAIR para reiniciar uma conversa com a IA e evitar erros de contexto durante os testes.',
  videoUrl: 'https://www.youtube.com/embed/ac5xdr3eRvA',
  thumbnail: capaDefault,
  category: 'intermediario'
},
{
  id: 'intermediario-2',
  title: 'Como criar e usar Modelos na ZapSign',
  description: 'Aprenda como criar modelos na ZapSign e integrar seus documentos de forma rápida e eficiente.',
  videoUrl: 'https://www.youtube.com/embed/yQHe_uflWH4',
  thumbnail: capaDefault,
  category: 'intermediario'
},
{
  id: 'intermediario-4',
  title: 'Histórico de Follow-up',
  description: 'Aprenda como visualizar e gerenciar o histórico de follow-up dos seus contatos e negociações.',
  videoUrl: 'https://www.youtube.com/embed/HIkErNJj_Oc',
  thumbnail: capaDefault,
  category: 'intermediario'
},
{
  id: 'intermediario-6',
  title: 'Sistema de Workspace',
  description: 'Veja como o sistema de Workspaces permite gerenciar múltiplas contas e equipes de forma organizada.',
  videoUrl: 'https://www.youtube.com/embed/sdcHHttDuNc',
  thumbnail: capaDefault,
  category: 'intermediario'
},
{
  id: 'intermediario-7',
  title: 'Configuração do Google Agenda',
  description: 'Aprenda a integrar o Google Agenda com a Guimoo para automatizar seus compromissos.',
  videoUrl: 'https://www.youtube.com/embed/O00atxrkStY',
  thumbnail: capaDefault,
  category: 'intermediario'
},
{
  id: 'intermediario-8',
  title: 'Configurando Google Agenda - Workspace',
  description: 'Tutorial detalhado para integrar o Google Workspace com o sistema e sincronizar agendas de todos os usuários.',
  videoUrl: 'https://www.youtube.com/embed/MxRlIa5I45A',
  thumbnail: capaDefault,
  category: 'intermediario'
},

// ==========================
// 🔵 AVANÇADO
// ==========================
{
  id: 'avancado-1',
  title: 'Agente de IA - Movimentação Automática',
  description: 'Entenda como configurar a movimentação automática da IA para agilizar atendimentos e distribuir tarefas entre etapas.',
  videoUrl: 'https://www.youtube.com/embed/RfMSykWNiSU',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-2',
  title: 'Agente de IA - Etapas de Atendimento',
  description: 'Aprenda a criar e ajustar as etapas do atendimento do agente de IA, otimizando fluxos de conversa e qualificação de leads.',
  videoUrl: 'https://www.youtube.com/embed/ziAEnz_TtNU',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-3',
  title: 'Agente de IA - Perguntas Frequentes',
  description: 'Configure perguntas frequentes para que a IA responda automaticamente dúvidas recorrentes dos clientes.',
  videoUrl: 'https://www.youtube.com/embed/QJtyEIlIOdg',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-4',
  title: 'Agente de IA - Regras Gerais',
  description: 'Veja como definir regras gerais que orientam o comportamento da IA durante todo o atendimento.',
  videoUrl: 'https://www.youtube.com/embed/Ob57-CzgtKY',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-5',
  title: 'Agente de IA - Personalidade',
  description: 'Crie a personalidade da sua IA para deixá-la mais próxima do tom de voz do seu escritório e público-alvo.',
  videoUrl: 'https://www.youtube.com/embed/7oyC6BeB5mU',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-6',
  title: 'Agente de IA - Áudio',
  description: 'Aprenda a configurar o reconhecimento e envio de áudios pela IA, tornando o atendimento mais natural.',
  videoUrl: 'https://www.youtube.com/embed/IHMhKjGWRxc',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-7',
  title: 'Agente de IA - Gatilhos',
  description: 'Veja como criar gatilhos automáticos para ativar respostas e ações da IA de forma inteligente.',
  videoUrl: 'https://www.youtube.com/embed/ngpRqvil5dg',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-8',
  title: 'Agente de IA - Horário de Funcionamento',
  description: 'Configure o horário de funcionamento da IA para que ela atenda apenas dentro do período desejado.',
  videoUrl: 'https://www.youtube.com/embed/4-5hr5hhmU4',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-9',
  title: 'Agente de IA - Modelos de Agente',
  description: 'Aprenda a salvar, duplicar e reaproveitar modelos de agentes para diferentes tipos de atendimento.',
  videoUrl: 'https://www.youtube.com/embed/PEgQzrvM2c0',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-10',
  title: 'Agente de IA - Notificações no WhatsApp',
  description: 'Saiba como configurar notificações automáticas via WhatsApp para acompanhar a atuação da IA em tempo real.',
  videoUrl: 'https://www.youtube.com/embed/LSK2t4GJACw',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-11',
  title: 'Agente de IA - Parâmetros do Agente',
  description: 'Entenda cada parâmetro do agente e aprenda a ajustar tempo de resposta, reativação e comportamento da IA.',
  videoUrl: 'https://www.youtube.com/embed/PMKp2fuN-QQ',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-12',
  title: 'Agente de IA - Teste de Agente',
  description: 'Veja como testar corretamente seu agente de IA e validar o comportamento em diferentes cenários.',
  videoUrl: 'https://www.youtube.com/embed/rVQ0lfx-TBU',
  thumbnail: capaDefault,
  category: 'avancado'
},
{
  id: 'avancado-13',
  title: 'Agente de IA - Follow-up Automático',
  description: 'Aprenda a configurar o follow-up automático para que a IA retome conversas e aumente a taxa de conversão.',
  videoUrl: 'https://www.youtube.com/embed/uk_K6VqrFOY',
  thumbnail: capaDefault,
  category: 'avancado'
},

// ==========================
// 🎓 GUIMOO ACADEMY
// ==========================
{
  id: 'academy-1',
  title: 'Criando uma campanha Trabalhista no Google Ads',
  description: 'Aprenda passo a passo como criar uma campanha trabalhista no Google Ads para atrair clientes qualificados para seu escritório.',
  videoUrl: 'https://www.youtube.com/embed/wMfBxHPlhMs',
  thumbnail: capaDefault,
  category: 'academy'
},
{
  id: 'academy-2',
  title: 'Caixa Preta dos anúncios BPC/Loas que convertem',
  description: 'Descubra as estratégias e configurações que tornam os anúncios de BPC/Loas altamente eficazes e aprenda como replicar campanhas que realmente convertem.',
  videoUrl: 'https://www.youtube.com/embed/1MohNBa9ZBQ',
  thumbnail: capaDefault,
  category: 'academy'
},


  
];

const TutorialInterno: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('iniciante');
  const [searchQuery, setSearchQuery] = useState('');
  const { openVideo } = useVideoPlayer();

  const sections = [
    { id: 'iniciante', label: 'Iniciante', icon: Video, show: true },
    { id: 'intermediario', label: 'Intermediário', icon: Video, show: true },
    { id: 'avancado', label: 'Avançado', icon: Video, show: true },
    { id: 'academy', label: 'Guimoo Academy', icon: GraduationCap, show: true },
  ];

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

  const renderContent = () => {
    return (
      <div className="space-y-6">
        {/* Cabeçalho com busca */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
              Tutorial Interno
            </h1>
            <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
              Aprenda a usar todas as funcionalidades do sistema
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
                  {/* Badge de categoria quando em modo busca */}
                  {searchQuery.trim() !== '' && (
                    <div className="mb-2">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        video.category === 'iniciante' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        video.category === 'intermediario' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                        video.category === 'avancado' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {video.category === 'iniciante' ? 'Iniciante' :
                         video.category === 'intermediario' ? 'Intermediário' :
                         video.category === 'avancado' ? 'Avançado' :
                         'Guimoo Academy'}
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
        setActiveSection={(id) => setActiveSection(id as SectionId)}
      >
        {renderContent()}
      </ConfigLayout>
    </>
  );
};

export default TutorialInterno;

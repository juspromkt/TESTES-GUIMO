// src/pages/AIAgent.tsx
import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Bot,
  ChevronDown,
  Settings,
  MessageCircle,
  RefreshCw,
  FlaskConical,
  Menu,
  X,
} from 'lucide-react';
import { hasPermission } from '../utils/permissions';

// Seções internas
import PersonalitySection from '../components/ai-agent/PersonalitySection';
import RulesSection from '../components/ai-agent/RulesSection';
import ServiceStepsSection from '../components/ai-agent/ServiceStepsSection';
import FAQSection from '../components/ai-agent/FAQSection';
import AgentFunctionsSection from '../components/ai-agent/AgentFunctionsSection';
import OperatingHoursSection from '../components/ai-agent/OperatingHoursSection';
import DefaultModelsSection from '../components/ai-agent/DefaultModelsSection';
import TriggerSection from '../components/ai-agent/TriggerSection';
import AudioSettingsSection from '../components/ai-agent/AudioSettingsSection';
import AgentParametersSection from '../components/ai-agent/AgentParametersSection';
import FollowUpTab from '../components/ai-agent/FollowUpTab';
import AutoMovementTab from '../components/ai-agent/AutoMovementTab';
import AgentTestTab from '../components/ai-agent/AgentTestTab';

interface AgentPersonality {
  descricao: string;
  area: string;
  tom: string;
  valor_negociacao: number;
}

interface ServiceStep {
  ordem: number;
  nome: string;
  descricao: string;
  atribuir_lead?: boolean;
  desativar_agente?: boolean;
}

interface FAQ {
  ordem: number;
  pergunta: string;
  resposta: string;
}

type MainSection = 'config' | 'follow' | 'movement' | 'test';
type ConfigSub =
  | 'personalidade'
  | 'regras'
  | 'etapas'
  | 'faq'
  | 'notificacoes'
  | 'horarios'
  | 'modelos'
  | 'gatilhos'
  | 'audio'
  | 'parametros';
type FollowUpSub = 'config' | 'history';

const AIAgent = () => {
  const [mainSection, setMainSection] = useState<MainSection>('config');
  const [subSection, setSubSection] = useState<ConfigSub>('personalidade');
  const [followUpSubSection, setFollowUpSubSection] = useState<FollowUpSub>('config');
  const [configOpen, setConfigOpen] = useState(true);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isEnabled, setIsEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [loading, setLoading] = useState(true);

  const canEdit = hasPermission('can_edit_agent');
  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : '';

  const [personality, setPersonality] = useState<AgentPersonality>({
    descricao: '',
    area: '',
    tom: 'professional',
    valor_negociacao: 0,
  });
  const [serviceSteps, setServiceSteps] = useState<ServiceStep[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  // Estados de loading para salvar
  const [savingPersonality, setSavingPersonality] = useState(false);
  const [savingSteps, setSavingSteps] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Estados para mensagens de feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // 🔹 Status
      const statusResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/isAtivo',
        { headers: { token } }
      );
      const statusData = await statusResponse.json();
      setIsEnabled(!!statusData.isAgenteAtivo);

      // 🔹 Personalidade
      const personalityResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/get',
        {
          headers: { token },
          cache: 'no-cache' // Força buscar dados frescos, sem cache
        }
      );
      const personalityData = await personalityResponse.json();
      if (Array.isArray(personalityData) && personalityData.length > 0) {
        setPersonality(personalityData[0]);
      } else {
        // Se não houver dados, mantém o estado inicial
        console.warn('Nenhuma personalidade encontrada no servidor');
      }

      // 🔹 Etapas
      const stepsResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/get',
        { headers: { token } }
      );
      const stepsData = await stepsResponse.json();
      if (Array.isArray(stepsData)) setServiceSteps(stepsData);

      // 🔹 FAQs
      const faqResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/get',
        { headers: { token } }
      );
      const faqData = await faqResponse.json();
      if (Array.isArray(faqData)) setFaqs(faqData);

    } catch (err) {
      console.error('Erro ao carregar dados do agente:', err);
    } finally {
      setLoading(false);
    }
  };

const handleSavePersonality = async () => {
    setSavingPersonality(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(personality)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar personalidade do agente');
      }

      setSuccess('Personalidade do agente salva com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar personalidade:', err);
      setError('Erro ao salvar personalidade do agente');
    } finally {
      setSavingPersonality(false);
    }
  };



  // Handlers para etapas de atendimento
  const handleAddStep = () => {
    const newOrder = serviceSteps.length > 0 ? Math.max(...serviceSteps.map(s => s.ordem)) + 1 : 1;
    setServiceSteps([
      ...serviceSteps,
      {
        ordem: newOrder,
        nome: '',
        descricao: '',
        atribuir_lead: false,
        desativar_agente: false,
      },
    ]);
  };

  const handleRemoveStep = (ordem: number) => {
    const filtered = serviceSteps.filter(s => s.ordem !== ordem);
    const reordered = filtered.map((step, index) => ({
      ...step,
      ordem: index + 1,
    }));
    setServiceSteps(reordered);
  };

  const handleUpdateStep = (
    ordem: number,
    field: 'nome' | 'descricao' | 'atribuir_lead' | 'desativar_agente',
    value: string | boolean
  ) => {
    setServiceSteps(prev =>
      prev.map(step => {
        if (step.ordem === ordem) {
          // Se está ativando atribuir_lead nesta etapa, desativa nas outras
          if (field === 'atribuir_lead' && value === true) {
            return prev.map(s =>
              s.ordem === ordem
                ? { ...s, [field]: value }
                : { ...s, atribuir_lead: false }
            );
          }
          return { ...step, [field]: value };
        }
        return step;
      }).flat()
    );
  };

  const handleReorderSteps = (steps: ServiceStep[]) => {
    setServiceSteps(steps);
  };

  const handleSaveSteps = async () => {
    setSavingSteps(true);
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token,
          },
          body: JSON.stringify(serviceSteps),
        }
      );

      if (!response.ok) throw new Error('Erro ao salvar etapas');
    } catch (err) {
      console.error('Erro ao salvar etapas:', err);
      throw err;
    } finally {
      setSavingSteps(false);
    }
  };

  const onMediaUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/upload',
        {
          method: 'POST',
          headers: { token },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Erro ao fazer upload da mídia');

      const data = await response.json();
      return data.url || data.fileUrl || '';
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // Helper para obter o label da seção atual
  const getCurrentSectionLabel = () => {
    if (mainSection === 'follow') {
      const followLabels: Record<FollowUpSub, string> = {
        config: 'Configurações de Follow-up',
        history: 'Histórico de Follow-up',
      };
      return followLabels[followUpSubSection];
    }
    if (mainSection === 'movement') return 'Movimentação Automática';
    if (mainSection === 'test') return 'Teste de Agente';

    const configLabels: Record<ConfigSub, string> = {
      personalidade: 'Personalidade',
      regras: 'Regras Gerais',
      etapas: 'Etapas de Atendimento',
      faq: 'Perguntas Frequentes',
      notificacoes: 'Notificações no WhatsApp',
      horarios: 'Horário de Funcionamento',
      modelos: 'Modelo de Agente',
      gatilhos: 'Gatilhos',
      audio: 'Áudio (TTS/STT)',
      parametros: 'Parâmetros do Agente',
    };

    return configLabels[subSection];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-[280px_1fr] gap-4 md:gap-6 pb-20 md:pb-0">
      {/* Mobile Header com botão de menu */}
      <div className="md:hidden sticky top-0 z-10 bg-white dark:bg-neutral-800 border-b border-gray-300 dark:border-neutral-700 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">Agente de IA</h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">{getCurrentSectionLabel()}</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 active:bg-gray-200 dark:active:bg-neutral-600 transition-colors touch-manipulation"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
        </button>
      </div>

      {/* Overlay para mobile */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-white dark:bg-neutral-800 rounded-2xl border border-gray-300 dark:border-neutral-700 shadow-sm p-4 flex flex-col h-[calc(100vh-6rem)]
        md:relative md:translate-x-0
        fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-50 transition-transform duration-300
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex flex-col gap-3 px-2 pb-3 border-b border-gray-300 dark:border-neutral-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                  Agente de IA
                </h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400">Configure o comportamento</p>
              </div>
            </div>
            {/* Botão fechar apenas no mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 active:bg-gray-200 dark:active:bg-neutral-600 transition-colors touch-manipulation"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
            </button>
          </div>

          {/* IA Toggle */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-700/50 border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-neutral-300">
                {toggling
                  ? isEnabled
                    ? 'Desativando IA...'
                    : 'Ativando IA...'
                  : isEnabled
                  ? 'IA Ativada'
                  : 'IA Desativada'}
              </span>
              {toggling && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-neutral-500" />
              )}
            </div>

            <button
              onClick={async () => {
                const previous = isEnabled;
                setIsEnabled(!previous);
                setToggling(true);

                try {
                  const res = await fetch(
                    'https://n8n.lumendigital.com.br/webhook/prospecta/agente/toggle',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', token },
                    }
                  );

                  if (!res.ok) throw new Error('Erro ao alternar IA');

                  const verify = await fetch(
                    'https://n8n.lumendigital.com.br/webhook/prospecta/agente/isAtivo',
                    { headers: { token } }
                  );

                  if (verify.ok) {
                    const data = await verify.json();
                    setIsEnabled(!!data.isAgenteAtivo);
                  } else {
                    setIsEnabled(previous);
                  }
                } catch (err) {
                  console.error(err);
                  setIsEnabled(previous);
                } finally {
                  setToggling(false);
                }
              }}
              disabled={toggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                isEnabled ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-red-500 dark:bg-red-600'
              } ${toggling ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  isEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-neutral-400 ml-1">
            {toggling
              ? 'Aguarde... aplicando alteração'
              : isEnabled
              ? 'Seu agente está ativo.'
              : 'Seu agente está desativado.'}
          </p>
        </div>

        {/* Menus */}
        <nav className="flex-1 overflow-y-auto mt-4 space-y-1">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg ${
              mainSection === 'config'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações do Agente
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                configOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {configOpen && (
            <div className="ml-2 mt-1 space-y-1">
              {[
                ['personalidade', 'Personalidade'],
                ['regras', 'Regras Gerais'],
                ['etapas', 'Etapas de Atendimento'],
                ['faq', 'Perguntas Frequentes'],
                ['notificacoes', 'Notificações no WhatsApp'],
                ['horarios', 'Horário de Funcionamento'],
                ['modelos', 'Modelo de Agente'],
                ['gatilhos', 'Gatilhos'],
                ['audio', 'Áudio (TTS/STT)'],
                ['parametros', 'Parâmetros do Agente'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setMainSection('config');
                    setSubSection(key as ConfigSub);
                    setIsMobileSidebarOpen(false); // Fecha o drawer no mobile
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg touch-manipulation relative ${
                    key === 'modelos'
                      ? mainSection === 'config' && subSection === key
                        ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 text-purple-700 dark:text-purple-300 font-semibold shadow-sm'
                        : 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 text-purple-700 dark:text-purple-300 font-medium'
                      : mainSection === 'config' && subSection === key
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium'
                      : 'hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{label}</span>
                    {key === 'modelos' && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-sm">
                        ✨
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="my-3 border-t border-gray-300 dark:border-neutral-700"></div>

          <button
            onClick={() => setFollowUpOpen(!followUpOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg ${
              mainSection === 'follow'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Follow-up
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                followUpOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {followUpOpen && (
            <div className="ml-2 mt-1 space-y-1">
              {[
                ['config', 'Configurações de Follow-up'],
                ['history', 'Histórico de Follow-up'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setMainSection('follow');
                    setFollowUpSubSection(key as FollowUpSub);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg touch-manipulation ${
                    mainSection === 'follow' && followUpSubSection === key
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setMainSection('movement');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg touch-manipulation ${
              mainSection === 'movement'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Movimentação Automática
          </button>

          <button
            onClick={() => {
              setMainSection('test');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg touch-manipulation ${
              mainSection === 'test'
                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Teste de Agente
          </button>
        </nav>
      </aside>

      {/* Painel direito */}
      <main className="bg-white dark:bg-neutral-800 rounded-xl md:rounded-2xl shadow-sm border border-gray-300 dark:border-neutral-700 p-4 md:p-6 overflow-y-auto mx-2 md:mx-0">
        {mainSection === 'config' && (
          <>
            {subSection === 'personalidade' && (
              <PersonalitySection
                token={token}
                canEdit={canEdit}
                personality={personality}
                setPersonality={setPersonality}
                savingPersonality={savingPersonality}
                handleSavePersonality={handleSavePersonality}
              />
            )}
            {subSection === 'regras' && (
              <RulesSection token={token} canEdit={canEdit} />
            )}
            {subSection === 'etapas' && (
              <ServiceStepsSection
                token={token}
                canEdit={canEdit}
                serviceSteps={serviceSteps}
                handleAddStep={handleAddStep}
                handleRemoveStep={handleRemoveStep}
                handleUpdateStep={handleUpdateStep}
                handleReorderSteps={handleReorderSteps}
                savingSteps={savingSteps}
                handleSaveSteps={handleSaveSteps}
                onMediaUpload={onMediaUpload}
                isUploading={isUploading}
              />
            )}
            {subSection === 'faq' && (
              <FAQSection
                faqs={faqs}
                setFaqs={setFaqs}
                savingFAQs={false}
                token={token}
                canEdit={canEdit}
              />
            )}
            {subSection === 'notificacoes' && (
              <AgentFunctionsSection token={token} canEdit={canEdit} />
            )}
            {subSection === 'horarios' && (
              <OperatingHoursSection token={token} canEdit={canEdit} />
            )}
            {subSection === 'modelos' && (
              <DefaultModelsSection
                token={token}
                onSuccess={() => fetchInitialData()}
                canEdit={canEdit}
              />
            )}
            {subSection === 'gatilhos' && (
              <TriggerSection token={token} canEdit={canEdit} />
            )}
            {subSection === 'audio' && (
              <AudioSettingsSection token={token} canEdit={canEdit} />
            )}
            {subSection === 'parametros' && (
              <AgentParametersSection token={token} canEdit={canEdit} />
            )}
          </>
        )}

        {mainSection === 'follow' && (
          <FollowUpTab token={token} canViewAgent={canEdit} activeSubTab={followUpSubSection} />
        )}
        {mainSection === 'movement' && (
          <AutoMovementTab token={token} canViewAgent={canEdit} />
        )}
        {mainSection === 'test' && <AgentTestTab token={token} />}
      </main>
    </div>
  );
};

export default AIAgent;

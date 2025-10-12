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
} from 'lucide-react';
import { hasPermission } from '../utils/permissions';

// Seções internas
import PersonalitySection from '../components/ai-agent/PersonalitySection';
import RulesSection from '../components/ai-agent/RulesSection';
import ServiceStepsSection from '../components/ai-agent/ServiceStepsSection';
import FAQSection from '../components/ai-agent/FAQSection';
import AgentFunctionsSection from '../components/ai-agent/AgentFunctionsSection';
import SchedulingSection from '../components/ai-agent/SchedulingSection';
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

interface Scheduling {
  isAtivo: boolean;
  id_agenda: string;
  nome: string;
  descricao: string;
  prompt_consulta_horarios: string;
  prompt_marcar_horario: string;
  duracao_horario: string | null;
  limite_agendamento_horario: number | null;
  agenda_padrao: 'GOOGLE_MEET' | 'AGENDA_INTERNA' | 'SISTEMA_EXTERNO';
  url_consulta_externa: string | null;
  url_marcacao_externa: string | null;
}

type MainSection = 'config' | 'follow' | 'movement' | 'test';
type ConfigSub =
  | 'personalidade'
  | 'regras'
  | 'etapas'
  | 'faq'
  | 'notificacoes'
  | 'agendamento'
  | 'horarios'
  | 'modelos'
  | 'gatilhos'
  | 'audio'
  | 'parametros';

const AIAgent = () => {
  const [mainSection, setMainSection] = useState<MainSection>('config');
  const [subSection, setSubSection] = useState<ConfigSub>('personalidade');
  const [configOpen, setConfigOpen] = useState(true);

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
  const [scheduling, setScheduling] = useState<Scheduling>({
    isAtivo: false,
    id_agenda: '',
    nome: '',
    descricao: '',
    prompt_consulta_horarios: '',
    prompt_marcar_horario: '',
    duracao_horario: null,
    limite_agendamento_horario: 1,
    agenda_padrao: 'GOOGLE_MEET',
    url_consulta_externa: null,
    url_marcacao_externa: null,
  });

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
        { headers: { token } }
      );
      const personalityData = await personalityResponse.json();
      if (Array.isArray(personalityData) && personalityData.length > 0)
        setPersonality(personalityData[0]);

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

      // 🔹 Agendamento
      const schedResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/get',
        { headers: { token } }
      );
      const schedText = await schedResponse.text();
      const schedData = schedText ? JSON.parse(schedText) : [];
      if (Array.isArray(schedData) && schedData.length > 0)
        setScheduling(schedData[0]);

    } catch (err) {
      console.error('Erro ao carregar dados do agente:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[280px_1fr] gap-6">
      {/* Sidebar */}
      <aside className="bg-white rounded-2xl border border-gray-300 shadow-sm p-4 flex flex-col h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="flex flex-col gap-3 px-2 pb-3 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Agente de IA
              </h2>
              <p className="text-xs text-gray-500">Configure o comportamento</p>
            </div>
          </div>

          {/* IA Toggle */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                {toggling
                  ? isEnabled
                    ? 'Desativando IA...'
                    : 'Ativando IA...'
                  : isEnabled
                  ? 'IA Ativada'
                  : 'IA Desativada'}
              </span>
              {toggling && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
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
                isEnabled ? 'bg-emerald-600' : 'bg-red-500'
              } ${toggling ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  isEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <p className="text-[11px] text-gray-500 ml-1">
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
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-50'
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
                ['agendamento', 'Configurações de Agendamento'],
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
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${
                    mainSection === 'config' && subSection === key
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="my-3 border-t border-gray-300"></div>

          <button
            onClick={() => setMainSection('follow')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
              mainSection === 'follow'
                ? 'bg-emerald-50 text-emerald-700'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Follow-up
          </button>

          <button
            onClick={() => setMainSection('movement')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
              mainSection === 'movement'
                ? 'bg-blue-50 text-blue-700'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Movimentação Automática
          </button>

          <button
            onClick={() => setMainSection('test')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
              mainSection === 'test'
                ? 'bg-amber-50 text-amber-700'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Teste de Agente
          </button>
        </nav>
      </aside>

      {/* Painel direito */}
      <main className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6 overflow-y-auto">
        {mainSection === 'config' && (
          <>
            {subSection === 'personalidade' && (
              <PersonalitySection
                token={token}
                canEdit={canEdit}
                personality={personality}
                setPersonality={setPersonality}
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
                setServiceSteps={setServiceSteps}
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
            {subSection === 'agendamento' && (
              <SchedulingSection
                token={token}
                scheduling={scheduling}
                setScheduling={setScheduling}
                canEdit={canEdit}
              />
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
          <FollowUpTab token={token} canViewAgent={canEdit} />
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

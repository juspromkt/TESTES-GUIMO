import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ShieldCheck, ListChecks, HelpCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import RulesSection from './RulesSection';
import ServiceStepsSection from './ServiceStepsSection';
import FAQSection from './FAQSection';
import BasicSettingsSection from './BasicSettingsSection';
import TriggerSection from './TriggerSection';
import AudioSettingsSection from './AudioSettingsSection';
import AgentImportExportSection from './AgentImportExportSection';
import { hasPermission } from '../../utils/permissions';

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

interface Agent {
  Id: number;
  nome: string;
  isAtivo?: boolean;
  isAgentePrincipal?: boolean;
  isGatilho?: boolean;
  gatilho?: string;
}

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  token: string;
  onAgentUpdate?: (updatedAgent: Partial<Agent>) => void;
}

type ConfigTab = 'rules' | 'steps' | 'faq';

const CHARACTER_LIMIT = 10000; // Limite de caracteres recomendado

export default function AgentConfigModal({
  isOpen,
  onClose,
  agent,
  token,
  onAgentUpdate
}: AgentConfigModalProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('rules');
  const [serviceSteps, setServiceSteps] = useState<ServiceStep[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [rules, setRules] = useState('');
  const [savingSteps, setSavingSteps] = useState(false);
  const [savingFAQs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [serviceStepsLoading, setServiceStepsLoading] = useState(true);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Estados para controlar seções expansíveis
  const [isTriggerExpanded, setIsTriggerExpanded] = useState(false);
  const [isAudioExpanded, setIsAudioExpanded] = useState(false);
  const [isImportExportExpanded, setIsImportExportExpanded] = useState(false);

  // Estados locais para refletir mudanças em tempo real
  const [localAgentName, setLocalAgentName] = useState(agent?.nome || '');
  const [localIsAtivo, setLocalIsAtivo] = useState(agent?.isAtivo || false);
  const [localIsAgentePrincipal, setLocalIsAgentePrincipal] = useState(agent?.isAgentePrincipal || false);
  const [localIsGatilho, setLocalIsGatilho] = useState(agent?.isGatilho || false);

  const canEdit = hasPermission('can_edit_agent');

  // Atualiza estados locais quando o agente muda
  useEffect(() => {
    if (agent) {
      setLocalAgentName(agent.nome || '');
      setLocalIsAtivo(agent.isAtivo || false);
      setLocalIsAgentePrincipal(agent.isAgentePrincipal || false);
      setLocalIsGatilho(agent.isGatilho || false);
    }
  }, [agent]);

  // Callbacks para atualizar estados locais e propagar mudanças
  const handleNameChange = useCallback((newName: string) => {
    setLocalAgentName(newName);
    if (onAgentUpdate && agent) {
      onAgentUpdate({ Id: agent.Id, nome: newName });
    }
  }, [agent, onAgentUpdate]);

  const handleAtivoChange = useCallback((isAtivo: boolean) => {
    setLocalIsAtivo(isAtivo);
    if (onAgentUpdate && agent) {
      onAgentUpdate({ Id: agent.Id, isAtivo });
    }
  }, [agent, onAgentUpdate]);

  const handlePrincipalChange = useCallback((isAgentePrincipal: boolean) => {
    setLocalIsAgentePrincipal(isAgentePrincipal);
    if (onAgentUpdate && agent) {
      onAgentUpdate({ Id: agent.Id, isAgentePrincipal });
    }
  }, [agent, onAgentUpdate]);

  const handleGatilhoChange = useCallback((isGatilho: boolean) => {
    setLocalIsGatilho(isGatilho);
    if (onAgentUpdate && agent) {
      onAgentUpdate({ Id: agent.Id, isGatilho });
    }
  }, [agent, onAgentUpdate]);

  // Callback para quando regras são salvas
  const handleRulesSaved = useCallback(() => {
    if (onAgentUpdate && agent) {
      onAgentUpdate({ Id: agent.Id });
    }
  }, [agent, onAgentUpdate]);

  // Callback para quando roteiro é salvo
  const handleStepsSaved = useCallback(() => {
    if (onAgentUpdate && agent) {
      onAgentUpdate({ Id: agent.Id });
    }
  }, [agent, onAgentUpdate]);

  // Callback para quando FAQ é salvo
  const handleFAQSaved = useCallback(() => {
    if (onAgentUpdate && agent) {
      onAgentUpdate({ Id: agent.Id });
    }
  }, [agent, onAgentUpdate]);

  // Função para extrair texto puro do HTML (remove tags HTML)
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Função para contar caracteres contando mídias e chips de decisão como 1 caractere cada
  const countCharactersWithMediaAndChips = (html: string) => {
    if (!html) return 0;

    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    // Conta elementos de mídia (class="ql-media")
    const mediaElements = tmp.querySelectorAll('.ql-media');
    const mediaCount = mediaElements.length;

    // Conta chips de decisão inteligente (class="ql-smart-decision")
    const decisionChips = tmp.querySelectorAll('.ql-smart-decision');
    const decisionChipCount = decisionChips.length;

    // Remove os elementos de mídia e chips de decisão do DOM temporário
    mediaElements.forEach(el => el.remove());
    decisionChips.forEach(el => el.remove());

    // Conta o texto restante
    const textLength = (tmp.textContent || tmp.innerText || '').length;

    // Retorna: texto + 1 por mídia + 1 por chip
    return textLength + mediaCount + decisionChipCount;
  };

  // Calcula total de caracteres (incluindo regras)
  const totalCharacters = useMemo(() => {
    const rulesChars = stripHtml(rules).length;
    const stepsChars = serviceSteps.reduce((acc, step) =>
      acc + (step.nome?.length || 0) + countCharactersWithMediaAndChips(step.descricao || ''), 0
    );
    const faqsChars = faqs.reduce((acc, faq) =>
      acc + (faq.pergunta?.length || 0) + (faq.resposta?.length || 0), 0
    );
    return rulesChars + stepsChars + faqsChars;
  }, [rules, serviceSteps, faqs]);

  const characterPercentage = useMemo(() =>
    Math.min((totalCharacters / CHARACTER_LIMIT) * 100, 150),
    [totalCharacters]
  );

  const isOverLimit = totalCharacters > CHARACTER_LIMIT;

  const withAgentId = (url: string) => {
    if (!agent?.Id) return url;
    const hasQuery = url.includes('?');
    return `${url}${hasQuery ? '&' : '?'}id_agente=${agent.Id}`;
  };

  const fetchServiceSteps = useCallback(async () => {
    if (!token || !agent?.Id) {
      setServiceStepsLoading(false);
      return;
    }

    setServiceStepsLoading(true);
    try {
      const response = await fetch(
        withAgentId('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/get'),
        { headers: { token } }
      );

      if (!response.ok) throw new Error('Erro ao carregar etapas');

      const data = await response.json();
      setServiceSteps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar etapas:', err);
      setServiceSteps([]);
    } finally {
      setServiceStepsLoading(false);
    }
  }, [token, agent?.Id]);

  const fetchFaqs = useCallback(async () => {
    if (!token || !agent?.Id) {
      setFaqsLoading(false);
      return;
    }

    setFaqsLoading(true);
    try {
      const response = await fetch(
        withAgentId('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/get'),
        { headers: { token } }
      );

      if (!response.ok) throw new Error('Erro ao carregar FAQs');

      const data = await response.json();
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar FAQs:', err);
      setFaqs([]);
    } finally {
      setFaqsLoading(false);
    }
  }, [token, agent?.Id]);

  const fetchRules = useCallback(async () => {
    if (!token || !agent?.Id) {
      setRulesLoading(false);
      return;
    }

    setRulesLoading(true);
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/get?id_agente=${agent.Id}`,
        { headers: { token } }
      );

      if (!response.ok) throw new Error('Erro ao carregar regras');

      const data = await response.json();
      if (Array.isArray(data) && data[0]?.regras) {
        setRules(data[0].regras);
      } else {
        setRules('');
      }
    } catch (err) {
      console.error('Erro ao carregar regras:', err);
      setRules('');
    } finally {
      setRulesLoading(false);
    }
  }, [token, agent?.Id]);

  useEffect(() => {
    if (isOpen && agent?.Id) {
      fetchServiceSteps();
      fetchFaqs();
      fetchRules();
    }
  }, [isOpen, agent?.Id, fetchServiceSteps, fetchFaqs, fetchRules]);

  const handleSuccess = useCallback(async () => {
    await Promise.all([fetchServiceSteps(), fetchFaqs(), fetchRules()]);
  }, [fetchServiceSteps, fetchFaqs, fetchRules]);

  const handleAddStep = () => {
    const newOrder = serviceSteps.length + 1;
    setServiceSteps([
      ...serviceSteps,
      { ordem: newOrder, nome: '', descricao: '', atribuir_lead: false, desativar_agente: false },
    ]);
  };

  const handleRemoveStep = (ordem: number) => {
    const updatedSteps = serviceSteps
      .filter(step => step.ordem !== ordem)
      .map((step, index) => ({ ...step, ordem: index + 1 }));
    setServiceSteps(updatedSteps);
  };

  const handleUpdateStep = useCallback(
    (
      ordem: number,
      field: 'nome' | 'descricao' | 'atribuir_lead' | 'desativar_agente',
      value: string | boolean
    ) => {
      setServiceSteps(prevSteps =>
        prevSteps.map(step => (step.ordem === ordem ? { ...step, [field]: value } : step))
      );
    },
    []
  );

  const handleReorderSteps = useCallback((updatedSteps: ServiceStep[]) => {
    setServiceSteps(updatedSteps);
  }, []);

  const handleSaveSteps = async () => {
    setSavingSteps(true);

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(serviceSteps.map(s => ({ ...s, id_agente: agent?.Id })))
      });

      if (!response.ok) throw new Error('Erro ao salvar etapas');
      await fetchServiceSteps();
    } catch (err) {
      console.error('Erro ao salvar etapas:', err);
    } finally {
      setSavingSteps(false);
    }
  };

  const handleMediaUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('id_agente', String(agent?.Id ?? ''));

      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/upload',
        { method: 'POST', headers: { token }, body: formData }
      );

      if (!response.ok) throw new Error('Erro ao fazer upload da mídia');

      const { url } = await response.json();
      return url;
    } catch (err) {
      console.error('Error uploading media:', err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // Gerencia overflow do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !agent) return null;

  const tabs = [
    { id: 'rules', label: 'Regras Gerais', icon: ShieldCheck },
    { id: 'steps', label: 'Roteiro de Atendimento', icon: ListChecks },
    { id: 'faq', label: 'Perguntas Frequentes', icon: HelpCircle },
  ] as const;

  return (
    <div className="fixed inset-y-0 left-16 right-0 z-[100] bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header Fixo */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {localAgentName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Configuração do agente
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Badges de Status */}
            {localIsAgentePrincipal && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Principal
              </span>
            )}
            {localIsAgentePrincipal && localIsGatilho && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                Gatilho Ativo
              </span>
            )}
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
              localIsAtivo
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
            }`}>
              {localIsAtivo ? 'Ativo' : 'Inativo'}
            </span>

            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-gray-900 dark:border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Layout Principal - Duas Colunas */}
      <div className="flex h-[calc(100vh-129px)] bg-gray-50 dark:bg-gray-900">
        {/* Coluna Esquerda (60%) */}
        <div className="w-[60%] overflow-y-auto p-8">
          {activeTab === 'rules' && (
            <RulesSection
              token={token}
              idAgente={agent.Id}
              canEdit={canEdit}
              onRulesChange={(newRules) => setRules(newRules)}
              onSaved={handleRulesSaved}
            />
          )}

          {activeTab === 'steps' && (
            <ServiceStepsSection
              serviceSteps={serviceSteps}
              handleAddStep={handleAddStep}
              handleRemoveStep={handleRemoveStep}
              handleUpdateStep={handleUpdateStep}
              handleReorderSteps={handleReorderSteps}
              savingSteps={savingSteps}
              handleSaveSteps={handleSaveSteps}
              onMediaUpload={handleMediaUpload}
              isUploading={isUploading}
              canEdit={canEdit}
              token={token}
              idAgente={agent.Id}
              isLoading={serviceStepsLoading}
              onSaved={handleStepsSaved}
            />
          )}

          {activeTab === 'faq' && (
            <FAQSection
              faqs={faqs}
              setFaqs={setFaqs}
              savingFAQs={savingFAQs}
              token={token}
              canEdit={canEdit}
              idAgente={agent.Id}
              isLoading={faqsLoading}
              onSaved={handleFAQSaved}
            />
          )}
        </div>

        {/* Coluna Direita (40%) - Painel de Configurações */}
        <aside className="w-[40%] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto p-6 transition-colors duration-200">
          {/* 1️⃣ CONTADOR DE CARACTERES */}
          <div className={`border-2 rounded-lg p-4 mb-6 transition-all duration-200 ${
            isOverLimit
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
              : characterPercentage > 75
              ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Total de Caracteres
              </h3>
              <span className={`text-sm font-mono font-bold ${
                isOverLimit
                  ? 'text-red-600 dark:text-red-400'
                  : characterPercentage > 75
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {totalCharacters.toLocaleString()} / {CHARACTER_LIMIT.toLocaleString()}
              </span>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverLimit
                    ? 'bg-red-500 dark:bg-red-600'
                    : characterPercentage > 75
                    ? 'bg-yellow-500 dark:bg-yellow-600'
                    : 'bg-green-500 dark:bg-green-600'
                }`}
                style={{ width: `${characterPercentage}%` }}
              />
            </div>

            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
              {Math.round(characterPercentage)}% do limite recomendado
            </p>

            {/* Alerta de Limite Excedido */}
            {isOverLimit && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                      Limite excedido!
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400 mb-2">
                      O agente pode "alucinar" com muito conteúdo.
                    </p>

                    <button
                      onClick={() => setShowLimitWarning(!showLimitWarning)}
                      className="flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                    >
                      {showLimitWarning ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Ocultar detalhes
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Saiba mais
                        </>
                      )}
                    </button>

                    {showLimitWarning && (
                      <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">
                            🧠 Por que há um limite de caracteres?
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-400">
                            Os agentes de IA funcionam com base em contexto — eles processam uma quantidade limitada de informações por vez.
                            Quando esse limite é ultrapassado, o agente pode se perder, ignorar partes importantes ou até gerar respostas incorretas ("alucinações").
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">
                            💡 Recomendação Guimoo:
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-400">
                            Ao invés de se arriscar criando um único agente com muito contexto, tente dividir o conteúdo em dois (ou mais) agentes.
                            Cada agente pode assumir uma função específica e, juntos, eles formam uma super inteligência colaborativa, mais precisa, leve e eficiente.
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                            Assim, você aproveita melhor o poder do sistema de multiagentes da Guimoo — garantindo clareza, desempenho e respostas de alta qualidade.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-100 dark:border-gray-700 my-6"></div>

          {/* 2️⃣ CONFIGURAÇÕES BÁSICAS */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
              Configurações Básicas
            </h3>
            <BasicSettingsSection
              token={token}
              idAgente={agent.Id}
              canEdit={canEdit}
              onNameChange={handleNameChange}
              onAtivoChange={handleAtivoChange}
              onPrincipalChange={handlePrincipalChange}
            />
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-100 dark:border-gray-700 my-6"></div>

          {/* 3️⃣ GATILHOS DE ATIVAÇÃO */}
          <div className="mb-6">
            <button
              onClick={() => setIsTriggerExpanded(!isTriggerExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Gatilhos de Ativação
              </h3>
              {isTriggerExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            {isTriggerExpanded && (
              <div className="mt-3">
                {localIsAgentePrincipal ? (
                  <TriggerSection
                    token={token}
                    idAgente={agent.Id}
                    canEdit={canEdit}
                    onGatilhoChange={handleGatilhoChange}
                  />
                ) : (
                  <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-lg text-sm">
                    <p className="font-semibold mb-1">Gatilhos disponíveis apenas para agente principal</p>
                    <p className="text-xs">
                      Para configurar gatilhos de ativação, este agente precisa ser marcado como "Agente Principal" nas Configurações Básicas acima.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-100 dark:border-gray-700 my-6"></div>

          {/* 4️⃣ CONFIGURAÇÕES DE ÁUDIO */}
          <div className="mb-6">
            <button
              onClick={() => setIsAudioExpanded(!isAudioExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Configurações de Áudio
              </h3>
              {isAudioExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            {isAudioExpanded && (
              <div className="mt-3">
                <AudioSettingsSection
                  token={token}
                  idAgente={agent.Id}
                  canEdit={canEdit}
                />
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-100 dark:border-gray-700 my-6"></div>

          {/* 5️⃣ EXPORTAR/IMPORTAR AGENTE */}
          <div className="mb-6">
            <button
              onClick={() => setIsImportExportExpanded(!isImportExportExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Exportar/Importar Agente
              </h3>
              {isImportExportExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            {isImportExportExpanded && (
              <div className="mt-3">
                <AgentImportExportSection
                  token={token}
                  idAgente={agent.Id}
                  canEdit={canEdit}
                  onImportSuccess={handleSuccess}
                />
              </div>
            )}
          </div>

        </aside>
      </div>
    </div>
  );
}

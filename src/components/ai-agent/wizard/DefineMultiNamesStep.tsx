import { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { StepComponentProps } from '../../../types/agent-wizard';

interface AgentNameStatus {
  templateId: string;
  templateNome: string;
  customName: string;
  isValid: boolean;
  errorMessage: string;
}

export default function DefineMultiNamesStep({ state, onNext, onBack, token }: StepComponentProps) {
  const [nameStatuses, setNameStatuses] = useState<AgentNameStatus[]>([]);
  const [principalAgentName, setPrincipalAgentName] = useState('');
  const [principalNameValid, setPrincipalNameValid] = useState(true);
  const [principalNameError, setPrincipalNameError] = useState('');
  const [checkingNames, setCheckingNames] = useState(false);
  const [existingAgents, setExistingAgents] = useState<any[]>([]);

  useEffect(() => {
    // Inicializar nomes vazios (usuário vai preencher)
    const initialStatuses: AgentNameStatus[] = state.multiAgent.selectedTemplates.map(template => ({
      templateId: template.id,
      templateNome: template.nome,
      customName: '',
      isValid: true,
      errorMessage: ''
    }));
    setNameStatuses(initialStatuses);

    // Buscar agentes existentes
    loadExistingAgents();
  }, []);

  const loadExistingAgents = async () => {
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get',
        { headers: { token } }
      );
      if (response.ok) {
        const agents = await response.json();
        if (Array.isArray(agents)) {
          setExistingAgents(agents);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar agentes existentes:', error);
    }
  };

  const validateName = (name: string, excludeIndex?: number): { isValid: boolean; errorMessage: string } => {
    const trimmedName = name.trim();

    // Validação 1: Nome vazio
    if (!trimmedName) {
      return { isValid: false, errorMessage: 'O nome não pode estar vazio' };
    }

    // Validação 2: Verificar se já existe um agente com esse nome
    const existingNames = existingAgents.map(a => a.nome.trim().toLowerCase());
    if (existingNames.includes(trimmedName.toLowerCase())) {
      return { isValid: false, errorMessage: 'Já existe um agente com esse nome' };
    }

    // Validação 3: Verificar duplicação entre os nomes sendo criados
    const currentNames = nameStatuses
      .map((ns, idx) => idx !== excludeIndex ? ns.customName.trim().toLowerCase() : null)
      .filter(n => n !== null);

    if (currentNames.includes(trimmedName.toLowerCase())) {
      return { isValid: false, errorMessage: 'Nome duplicado nesta lista' };
    }

    // Validação 4: Verificar duplicação com o nome do agente principal
    if (excludeIndex !== undefined && trimmedName.toLowerCase() === principalAgentName.trim().toLowerCase()) {
      return { isValid: false, errorMessage: 'Nome igual ao agente principal' };
    }

    return { isValid: true, errorMessage: '' };
  };

  const validatePrincipalName = (name: string): { isValid: boolean; errorMessage: string } => {
    const trimmedName = name.trim();

    // Validação 1: Nome vazio
    if (!trimmedName) {
      return { isValid: false, errorMessage: 'O nome não pode estar vazio' };
    }

    // Validação 2: Verificar se já existe um agente com esse nome
    const existingNames = existingAgents.map(a => a.nome.trim().toLowerCase());
    if (existingNames.includes(trimmedName.toLowerCase())) {
      return { isValid: false, errorMessage: 'Já existe um agente com esse nome' };
    }

    // Validação 3: Verificar duplicação com os especialistas
    const specialistNames = nameStatuses.map(ns => ns.customName.trim().toLowerCase());
    if (specialistNames.includes(trimmedName.toLowerCase())) {
      return { isValid: false, errorMessage: 'Nome duplicado com um especialista' };
    }

    return { isValid: true, errorMessage: '' };
  };

  const handlePrincipalNameChange = (newName: string) => {
    setPrincipalAgentName(newName);
    const validation = validatePrincipalName(newName);
    setPrincipalNameValid(validation.isValid);
    setPrincipalNameError(validation.errorMessage);
  };

  const handleNameChange = (index: number, newName: string) => {
    const validation = validateName(newName, index);

    setNameStatuses(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        customName: newName,
        isValid: validation.isValid,
        errorMessage: validation.errorMessage
      };
      return updated;
    });
  };

  const handleBlur = (index: number) => {
    // Revalidar ao perder o foco
    const currentName = nameStatuses[index].customName;
    const validation = validateName(currentName, index);

    setNameStatuses(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isValid: validation.isValid,
        errorMessage: validation.errorMessage
      };
      return updated;
    });
  };

  const handlePrincipalBlur = () => {
    const validation = validatePrincipalName(principalAgentName);
    setPrincipalNameValid(validation.isValid);
    setPrincipalNameError(validation.errorMessage);
  };

  const handleContinue = () => {
    // Verificar se todos os nomes são válidos
    const allValid = nameStatuses.every(ns => ns.isValid) && principalNameValid;

    if (!allValid) {
      return;
    }

    // Criar mapa de nomes customizados
    const customNames = new Map<string, string>();
    customNames.set('principal', principalAgentName.trim());

    nameStatuses.forEach(ns => {
      customNames.set(ns.templateId, ns.customName.trim());
    });

    onNext({
      multiAgent: {
        ...state.multiAgent,
        customAgentNames: customNames
      },
      currentStep: 'batch-creation'
    });
  };

  const allNamesValid = nameStatuses.every(ns => ns.isValid) && principalNameValid;
  const hasEmptyNames = nameStatuses.some(ns => !ns.customName.trim()) || !principalAgentName.trim();

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Defina os nomes dos agentes
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Personalize o nome de cada agente que será criado
        </p>
      </div>

      {/* Informação */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-medium mb-1">Importante:</p>
            <ul className="space-y-1 text-xs">
              <li>• Os nomes devem ser únicos (não podem existir agentes com o mesmo nome)</li>
              <li>• O sistema verifica automaticamente se há duplicações</li>
              <li>• <strong>Este nome é apenas para identificação interna e não reflete no atendimento</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Nome do Agente Principal */}
      <div className="p-5 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300">
              Agente Principal (Nível 1)
            </h4>
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-xs text-purple-700 dark:text-purple-300 rounded">
              Recepção
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={principalAgentName}
              onChange={(e) => handlePrincipalNameChange(e.target.value)}
              onBlur={handlePrincipalBlur}
              className={`w-full px-4 py-3 pr-10 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${
                !principalAgentName.trim()
                  ? 'border-gray-300 dark:border-gray-600'
                  : principalNameValid
                  ? 'border-green-500 dark:border-green-400'
                  : 'border-red-500 dark:border-red-400'
              }`}
              placeholder="Digite o nome do agente principal"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {principalAgentName.trim() && (
                principalNameValid ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                )
              )}
            </div>
          </div>

          {!principalNameValid && principalNameError && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {principalNameError}
            </p>
          )}
        </div>
      </div>

      {/* Nomes dos Agentes Especialistas */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Agentes Especialistas (Nível 2) - {nameStatuses.length}
        </h4>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {nameStatuses.map((status, index) => (
            <div
              key={status.templateId}
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Agente {index + 1}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Template: {status.templateNome}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 rounded">
                    Especialista
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={status.customName}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    onBlur={() => handleBlur(index)}
                    className={`w-full px-4 py-2.5 pr-10 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${
                      !status.customName.trim()
                        ? 'border-gray-300 dark:border-gray-600'
                        : status.isValid
                        ? 'border-green-500 dark:border-green-400'
                        : 'border-red-500 dark:border-red-400'
                    }`}
                    placeholder="Digite o nome do agente"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {status.customName.trim() && (
                      status.isValid ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )
                    )}
                  </div>
                </div>

                {!status.isValid && status.errorMessage && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {status.errorMessage}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botões de navegação */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Voltar
        </button>
        <button
          onClick={handleContinue}
          disabled={!allNamesValid || hasEmptyNames}
          className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Criar Agentes →
        </button>
      </div>
    </div>
  );
}

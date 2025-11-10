// Tipos para o sistema de criação guiada de agentes

export type WizardMode = 'single' | 'multi';

export type SingleAgentStep =
  | 'select-mode'           // Step 1: Escolher entre único ou multi
  | 'select-creation-type'  // Step 2a: Escolher criar do zero ou usar modelo
  | 'select-template'       // Step 3a: Selecionar modelo (se escolheu modelo)
  | 'define-name'           // Step 4a: Definir nome do agente
  | 'creation-confirm'      // Step 5a: Confirmação de criação
  | 'edit-rules'            // Step 6a: Editar regras
  | 'edit-steps'            // Step 7a: Editar roteiro (etapas)
  | 'edit-faq'              // Step 8a: Editar FAQ
  | 'final-confirmation';   // Step 9a: Confirmação final

export type MultiAgentStep =
  | 'select-mode'           // Step 1: Escolher entre único ou multi
  | 'select-templates'      // Step 2b: Seleção múltipla de modelos
  | 'review-agents'         // Step 3b: Revisão dos agentes a criar
  | 'define-multi-names'    // Step 4b: Definir nomes personalizados
  | 'batch-creation'        // Step 5b: Criação em lote
  | 'creation-confirm'      // Step 6b: Confirmação de criação múltipla
  | 'edit-agents'           // Step 7b: Edição individual de cada agente
  | 'edit-multi-agent'      // Step 8b: Edição individual (usado no wizard)
  | 'final-confirmation';   // Step 9b: Confirmação final

export type WizardStep = SingleAgentStep | MultiAgentStep;

export interface AgentTemplate {
  id: string;
  nome: string;
  area: string;
  descricao: string;
  nivel: 1 | 2; // Nível 1 = principal, Nível 2 = especialista
  personalidade: {
    descricao: string;
    area: string;
    tom: string;
    valor_negociacao: number;
  };
  regras: {
    regras: string; // HTML
  };
  etapas: Array<{
    ordem: number;
    nome: string;
    descricao: string; // HTML
  }>;
  faq: Array<{
    ordem: number;
    nome: string | null;
    descricao: string; // HTML
  }>;
}

export interface CreatedAgent {
  Id: number;
  nome: string;
  isAtivo: boolean;
  isAgentePrincipal: boolean;
  isGatilho: boolean;
  gatilho: string;
  templateId?: string; // ID do template usado (se houver)
}

export interface WizardState {
  // Estado comum
  mode: WizardMode | null;
  currentStep: WizardStep;

  // Estado para agente único
  singleAgent: {
    creationType: 'scratch' | 'template' | null;
    selectedTemplate: AgentTemplate | null;
    agentName: string;
    createdAgent: CreatedAgent | null;
    editedContent: {
      regras: string;
      etapas: AgentTemplate['etapas'];
      faq: AgentTemplate['faq'];
    } | null;
  };

  // Estado para multiagentes
  multiAgent: {
    selectedTemplates: AgentTemplate[];
    customAgentNames?: Map<string, string>; // Mapa de templateId -> nome customizado
    createdAgents: CreatedAgent[];
    currentEditingIndex: number; // Índice do agente sendo editado
    editedContents: Map<number, {
      regras: string;
      etapas: AgentTemplate['etapas'];
      faq: AgentTemplate['faq'];
    }>;
  };
}

export interface StepComponentProps {
  state: WizardState;
  onNext: (updates: Partial<WizardState>) => void;
  onBack: () => void;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

// Constantes para os modelos de agentes disponíveis
export const AGENT_MODELS = {
  NIVEL_1: {
    id: 'nivel-1-principal',
    nome: 'Agente Principal - Recepção',
    area: 'Atendimento e Triagem',
    nivel: 1 as const,
    descricao: 'Agente principal que faz a recepção, entende a demanda do lead e transfere para o agente especialista adequado'
  },
  NIVEL_2: [
    {
      id: 'bancario',
      nome: 'Bancário',
      area: 'Direito Bancário',
      nivel: 2 as const,
      file: 'bancario.json'
    },
    {
      id: 'bpc',
      nome: 'BPC/LOAS',
      area: 'Benefício de Prestação Continuada',
      nivel: 2 as const,
      file: 'bpc.json'
    },
    {
      id: 'maternidade',
      nome: 'Salário Maternidade',
      area: 'Previdenciário',
      nivel: 2 as const,
      file: 'maternidade.json'
    },
    {
      id: 'trabalhista',
      nome: 'Trabalhista',
      area: 'Direito do Trabalho',
      nivel: 2 as const,
      file: 'trabalhista.json'
    },
    {
      id: 'auxilio',
      nome: 'Auxílio',
      area: 'Previdenciário',
      nivel: 2 as const,
      file: 'auxilio.json'
    },
    {
      id: 'invalidez',
      nome: 'Invalidez',
      area: 'Previdenciário',
      nivel: 2 as const,
      file: 'invalidez.json'
    },
    {
      id: 'desconto-indevido',
      nome: 'Desconto Indevido',
      area: 'Bancário',
      nivel: 2 as const,
      file: 'descontoIndevido.json'
    },
    {
      id: 'bancario-produtor',
      nome: 'Bancário - Produtor Rural',
      area: 'Bancário Rural',
      nivel: 2 as const,
      file: 'Bancário - Produtor Rural.json'
    },
    {
      id: 'pensao-divorcio',
      nome: 'Pensão e Divórcio',
      area: 'Família',
      nivel: 2 as const,
      file: 'Pensão e Divórcio.json'
    },
    {
      id: 'pensao-morte',
      nome: 'Pensão por Morte',
      area: 'Previdenciário',
      nivel: 2 as const,
      file: 'Pensão por Morte.json'
    }
  ]
} as const;

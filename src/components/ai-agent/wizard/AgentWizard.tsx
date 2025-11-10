import { useState } from 'react';
import { WizardState, WizardStep } from '../../../types/agent-wizard';

// Import all step components
import SelectModeStep from './SelectModeStep';
import SelectCreationTypeStep from './SelectCreationTypeStep';
import SelectTemplateStep from './SelectTemplateStep';
import DefineNameStep from './DefineNameStep';
import CreationConfirmStep from './CreationConfirmStep';
import EditRulesStep from './EditRulesStep';
import EditStepsStep from './EditStepsStep';
import EditFaqStep from './EditFaqStep';
import FinalConfirmationStep from './FinalConfirmationStep';
import SelectMultiTemplatesStep from './SelectMultiTemplatesStep';
import ReviewMultiAgentsStep from './ReviewMultiAgentsStep';
import DefineMultiNamesStep from './DefineMultiNamesStep';
import BatchCreationStep from './BatchCreationStep';
import MultiAgentEditStep from './MultiAgentEditStep';

interface AgentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

export default function AgentWizard({ isOpen, onClose, onSuccess, token }: AgentWizardProps) {
  const [wizardState, setWizardState] = useState<WizardState>({
    mode: null,
    currentStep: 'select-mode',
    singleAgent: {
      creationType: null,
      selectedTemplate: null,
      agentName: '',
      createdAgent: null,
      editedContent: null
    },
    multiAgent: {
      selectedTemplates: [],
      createdAgents: [],
      currentEditingIndex: 0,
      editedContents: new Map()
    }
  });

  const handleNext = (updates: Partial<WizardState>) => {
    setWizardState(prev => ({
      ...prev,
      ...updates,
      singleAgent: {
        ...prev.singleAgent,
        ...(updates.singleAgent || {})
      },
      multiAgent: {
        ...prev.multiAgent,
        ...(updates.multiAgent || {})
      }
    }));
  };

  const handleBack = () => {
    const { currentStep, mode } = wizardState;

    // Definir qual é o step anterior baseado no step atual
    let previousStep: WizardStep = 'select-mode';

    // Fluxo de Agente Único
    if (mode === 'single') {
      switch (currentStep) {
        case 'select-creation-type':
          previousStep = 'select-mode';
          break;
        case 'select-template':
          previousStep = 'select-creation-type';
          break;
        case 'define-name':
          previousStep = wizardState.singleAgent.creationType === 'template'
            ? 'select-template'
            : 'select-creation-type';
          break;
        case 'creation-confirm':
          previousStep = 'define-name';
          break;
        case 'edit-rules':
          previousStep = 'creation-confirm';
          break;
        case 'edit-steps':
          previousStep = 'edit-rules';
          break;
        case 'edit-faq':
          previousStep = 'edit-steps';
          break;
        case 'final-confirmation':
          previousStep = 'edit-faq';
          break;
      }
    }

    // Fluxo de Multiagentes
    if (mode === 'multi') {
      switch (currentStep) {
        case 'select-templates':
          previousStep = 'select-mode';
          break;
        case 'review-agents':
          previousStep = 'select-templates';
          break;
        case 'define-multi-names':
          previousStep = 'review-agents';
          break;
        case 'batch-creation':
          previousStep = 'define-multi-names';
          break;
        case 'creation-confirm':
          previousStep = 'batch-creation';
          break;
        case 'edit-multi-agent':
          previousStep = 'creation-confirm';
          break;
        case 'edit-agents':
          previousStep = 'creation-confirm';
          break;
        case 'final-confirmation':
          previousStep = 'edit-multi-agent';
          break;
      }
    }

    setWizardState(prev => ({
      ...prev,
      currentStep: previousStep
    }));
  };

  const renderStep = () => {
    const commonProps = {
      state: wizardState,
      onNext: handleNext,
      onBack: handleBack,
      onClose,
      onSuccess,
      token
    };

    switch (wizardState.currentStep) {
      // Step compartilhado
      case 'select-mode':
        return <SelectModeStep {...commonProps} />;

      // Steps de Agente Único
      case 'select-creation-type':
        return <SelectCreationTypeStep {...commonProps} />;
      case 'select-template':
        return <SelectTemplateStep {...commonProps} />;
      case 'define-name':
        return <DefineNameStep {...commonProps} />;
      case 'edit-rules':
        return <EditRulesStep {...commonProps} />;
      case 'edit-steps':
        return <EditStepsStep {...commonProps} />;
      case 'edit-faq':
        return <EditFaqStep {...commonProps} />;

      // Steps de Multiagentes
      case 'select-templates':
        return <SelectMultiTemplatesStep {...commonProps} />;
      case 'review-agents':
        return <ReviewMultiAgentsStep {...commonProps} />;
      case 'define-multi-names':
        return <DefineMultiNamesStep {...commonProps} />;
      case 'batch-creation':
        return <BatchCreationStep {...commonProps} />;
      case 'edit-multi-agent':
        return <MultiAgentEditStep {...commonProps} />;

      // Steps compartilhados entre single e multi (mas com lógica diferente)
      case 'creation-confirm':
        if (wizardState.mode === 'single') {
          return <CreationConfirmStep {...commonProps} />;
        }
        // Multiagent usa batch-creation ao invés de creation-confirm
        return <div>Redirecionando...</div>;

      case 'final-confirmation':
        return <FinalConfirmationStep {...commonProps} />;

      default:
        return <div>Step não implementado: {wizardState.currentStep}</div>;
    }
  };

  if (!isOpen) return null;

  return renderStep();
}

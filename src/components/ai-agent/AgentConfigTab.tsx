import React, { useState } from 'react';
import PersonalitySection from './PersonalitySection';
import RulesSection from './RulesSection';
import ServiceStepsSection from './ServiceStepsSection';
import FAQSection from './FAQSection';
import SchedulingSection from './SchedulingSection';
import TriggerSection from './TriggerSection';
import DefaultModelsSection from './DefaultModelsSection';
import AgentParametersSection from './AgentParametersSection';
import { hasPermission } from '../../utils/permissions';
import AudioSettingsSection from './AudioSettingsSection';
import OperatingHoursSection from './OperatingHoursSection';
import AgentFunctionsSection from './AgentFunctionsSection';

interface ServiceStep {
  ordem: number;
  nome: string;
  descricao: string;
  atribuir_lead?: boolean;
  desativar_agente?: boolean;
}

interface AgentConfigTabProps {
  personality: any;
  setPersonality: (personality: any) => void;
  savingPersonality: boolean;
  handleSavePersonality: () => Promise<void>;
  token: string;
  serviceSteps: any[];
  handleAddStep: () => void;
  handleRemoveStep: (ordem: number) => void;
  handleUpdateStep: (
    ordem: number,
    field: 'nome' | 'descricao' | 'atribuir_lead' | 'desativar_agente',
    value: string | boolean
  ) => void;
  handleReorderSteps: (steps: ServiceStep[]) => void;
  savingSteps: boolean;
  handleSaveSteps: () => Promise<void>;
  faqs: any[];
  setFaqs: React.Dispatch<React.SetStateAction<any[]>>;
  savingFAQs: boolean;
  scheduling: any;
  setScheduling: (scheduling: any) => void;
  savingScheduling: boolean;
  onMediaUpload: (file: File) => Promise<string>;
  isUploading: boolean;
  onSuccess: () => void;
}

type ConfigSubTab =
  | 'personality'
  | 'rules'
  | 'steps'
  | 'faq'
  | 'scheduling'
  | 'default-models'
  | 'trigger'
  | 'audio'
  | 'operating-hours'
  | 'parameters'
  | 'functions';

export default function AgentConfigTab({
  personality,
  setPersonality,
  savingPersonality,
  handleSavePersonality,
  token,
  serviceSteps,
  handleAddStep,
  handleRemoveStep,
  handleUpdateStep,
  handleReorderSteps,
  savingSteps,
  handleSaveSteps,
  faqs,
  setFaqs,
  savingFAQs,
  scheduling,
  setScheduling,
  savingScheduling,
  onMediaUpload,
  isUploading,
  onSuccess
}: AgentConfigTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ConfigSubTab>('personality');

  const subTabs = [
    { id: 'personality', label: 'Personalidade do Agente' },
    { id: 'rules', label: 'Regras Gerais' },
    { id: 'steps', label: 'Etapas de Atendimento' },
    { id: 'faq', label: 'Perguntas Frequentes' },
    { id: 'functions', label: 'Funções do Agente' },
    { id: 'scheduling', label: 'Configurações de Agendamento' },
    { id: 'default-models', label: 'Modelos' },
    { id: 'trigger', label: 'Gatilho de Acionamento' },
    { id: 'audio', label: 'Configurações de Áudio' },
    { id: 'operating-hours', label: 'Horário de Funcionamento' },
    { id: 'parameters', label: 'Parâmetros do Agente' }
  ];

  const canEditAgent = hasPermission('can_edit_agent');

  return (
    <div className="space-y-8">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto max-w-full whitespace-nowrap px-0 custom-scrollbar">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as ConfigSubTab)}
              className={`flex items-center whitespace-nowrap px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeSubTab === tab.id
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
<span className="flex items-center gap-1">
  {tab.label}
</span>
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'personality' && (
        <PersonalitySection
          personality={personality}
          setPersonality={setPersonality}
          savingPersonality={savingPersonality}
          handleSavePersonality={handleSavePersonality}
          canEdit={canEditAgent}
        />
      )}

      {activeSubTab === 'rules' && (
        <RulesSection
          token={token}
          canEdit={canEditAgent}
        />
      )}

      {activeSubTab === 'steps' && (
        <ServiceStepsSection
          serviceSteps={serviceSteps}
          handleAddStep={handleAddStep}
          handleRemoveStep={handleRemoveStep}
          handleUpdateStep={handleUpdateStep}
          handleReorderSteps={handleReorderSteps}
          savingSteps={savingSteps}
          handleSaveSteps={handleSaveSteps}
          onMediaUpload={onMediaUpload}
          isUploading={isUploading}
          canEdit={canEditAgent}
          token={token}
        />
      )}

      {activeSubTab === 'faq' && (
        <FAQSection
          faqs={faqs}
          setFaqs={setFaqs}
          savingFAQs={savingFAQs}
          token={token}
          canEdit={canEditAgent}
        />
      )}

      {activeSubTab === 'scheduling' && (
        <SchedulingSection
          scheduling={scheduling}
          setScheduling={setScheduling}
          savingScheduling={savingScheduling}
          token={token}
          canEdit={canEditAgent}
        />
      )}

      {activeSubTab === 'default-models' && (
        <DefaultModelsSection
          token={token}
          onSuccess={onSuccess}
          canEdit={canEditAgent}
        />
      )}

      {activeSubTab === 'trigger' && (
        <TriggerSection
          token={token}
          canEdit={canEditAgent}
        />
      )}

      {activeSubTab === 'functions' && (
        <AgentFunctionsSection token={token} canEdit={canEditAgent} />
      )}
 
      {activeSubTab === 'audio' && (
        <AudioSettingsSection token={token} canEdit={canEditAgent} />
      )}

      {activeSubTab === 'operating-hours' && (
        <OperatingHoursSection token={token} canEdit={canEditAgent} />
      )}

      {activeSubTab === 'parameters' && (
        <AgentParametersSection
          token={token}
          canEdit={canEditAgent}
          />
      )}
    </div>
  );
}
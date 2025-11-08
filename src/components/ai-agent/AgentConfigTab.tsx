import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  ListChecks,
  HelpCircle,
  Calendar,
  Blocks,
  Volume2,
  Clock,
  SlidersHorizontal
} from 'lucide-react';
import RulesSection from './RulesSection';
import ServiceStepsSection from './ServiceStepsSection';
import FAQSection from './FAQSection';
import SchedulingSection from './SchedulingSection';
import DefaultModelsSection from './DefaultModelsSection';
import AgentParametersSection from './AgentParametersSection';
import { hasPermission } from '../../utils/permissions';
import AudioSettingsSection from './AudioSettingsSection';
import OperatingHoursSection from './OperatingHoursSection';
import AgentFunctionsSection from './AgentFunctionsSection';
// import AutoMovementTab from './AutoMovementTab';

interface ServiceStep {
  ordem: number;
  nome: string;
  descricao: string;
  atribuir_lead?: boolean;
  desativar_agente?: boolean;
}

interface AgentConfigTabProps {
  idAgente: number;
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
  isServiceStepsLoading: boolean;
  isFaqsLoading: boolean;
  isSchedulingLoading: boolean;
}

type ConfigSubTab =
  | 'rules'
  | 'steps'
  | 'faq'
  | 'scheduling'
  | 'default-models'
  | 'audio'
  | 'operating-hours'
  | 'parameters'
  | 'functions';

export default function AgentConfigTab({
  idAgente,
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
  onSuccess,
  isServiceStepsLoading,
  isFaqsLoading,
  isSchedulingLoading
}: AgentConfigTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ConfigSubTab>('rules');

  const subTabs = useMemo(
    () => [
      { id: 'rules', label: 'Regras Gerais', icon: ShieldCheck },
      { id: 'steps', label: 'Etapas de Atendimento', icon: ListChecks },
      { id: 'faq', label: 'Perguntas Frequentes', icon: HelpCircle },
      { id: 'functions', label: 'Funções do Agente', icon: Blocks },
      { id: 'scheduling', label: 'Agendamento', icon: Calendar },
            { id: 'default-models', label: 'Modelos', icon: Blocks },
      { id: 'audio', label: 'Áudio', icon: Volume2 },
      { id: 'operating-hours', label: 'Funcionamento', icon: Clock },
      { id: 'parameters', label: 'Parâmetros', icon: SlidersHorizontal },
    ],
    []
  );

  const canEditAgent = hasPermission('can_edit_agent');

  return (
    <div className="lg:grid lg:grid-cols-[180px,1fr] lg:gap-4">
      {/* Sidebar */}
      <aside className="mb-4 lg:mb-0">
        <div className="sticky top-16">
          <nav className="rounded-lg border border-gray-200 bg-white p-2 space-y-0.5">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeSubTab === (tab.id as ConfigSubTab);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as ConfigSubTab)}
                  className={`w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="space-y-6 min-w-0">
        {activeSubTab === 'rules' && (
          <RulesSection
            token={token}
            idAgente={idAgente}
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
            idAgente={idAgente}
            isLoading={isServiceStepsLoading}
          />
        )}

        {activeSubTab === 'faq' && (
          <FAQSection
            faqs={faqs}
            setFaqs={setFaqs}
            savingFAQs={savingFAQs}
            token={token}
            canEdit={canEditAgent}
            idAgente={idAgente}
            isLoading={isFaqsLoading}
          />
        )}

        {activeSubTab === 'scheduling' && (
          <SchedulingSection
            scheduling={scheduling}
            setScheduling={setScheduling}
            savingScheduling={savingScheduling}
            token={token}
            canEdit={canEditAgent}
            idAgente={idAgente}
            isLoading={isSchedulingLoading}
          />
        )}

        {activeSubTab === 'default-models' && (
          <DefaultModelsSection
            token={token}
            onSuccess={onSuccess}
            idAgente={idAgente}
            canEdit={canEditAgent}
          />
        )}

        {activeSubTab === 'functions' && (
          <AgentFunctionsSection token={token} idAgente={idAgente} canEdit={canEditAgent} />
        )}

        {activeSubTab === 'audio' && (
          <AudioSettingsSection token={token} idAgente={idAgente} canEdit={canEditAgent} />
        )}

        {activeSubTab === 'operating-hours' && (
          <OperatingHoursSection token={token} idAgente={idAgente} canEdit={canEditAgent} />
        )}

        {activeSubTab === 'parameters' && (
          <AgentParametersSection
            token={token}
            idAgente={idAgente}
            canEdit={canEditAgent}
          />
        )}

        {/* Aba Movimentação Automática removida */}
      </div>
    </div>
  );
}


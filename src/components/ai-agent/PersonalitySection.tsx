import React from 'react';
import { Brain, Loader2, Save } from 'lucide-react';
import Modal from '../Modal';

interface PersonalitySectionProps {
  personality: {
    descricao: string;
    area: string;
    tom: string;
    valor_negociacao: number;
  };
  setPersonality: (personality: any) => void;
  savingPersonality: boolean;
  handleSavePersonality: () => Promise<void>;
  canEdit: boolean; // <- NOVO
  isLoading: boolean;
}

const FieldWrapper = ({
  isLoading,
  children
}: {
  isLoading: boolean;
  children: React.ReactNode;
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
      </div>
    )}
  </div>
);

export default function PersonalitySection({
  personality,
  setPersonality,
  savingPersonality,
  handleSavePersonality,
  canEdit, // <- NOVO
  isLoading
}: PersonalitySectionProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
const [modalLoading, setModalLoading] = React.useState(false);

  const handleSaveWithModal = async () => {
  setModalLoading(true);
  try {
    await handleSavePersonality();
    setTimeout(() => {
      setModalOpen(true);
      setModalLoading(false);
    }, 300);
  } catch (err) {
    console.error('Erro ao salvar personalidade:', err);
    setModalLoading(false);
  }
};

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <Brain className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Personalidade do Agente</h2>
          <p className="text-sm text-gray-500 mt-1">Configure a personalidade e comportamento do seu agente</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição da Personalidade
          </label>
          <FieldWrapper isLoading={isLoading}>
            <textarea
              value={personality.descricao}
              onChange={(e) => setPersonality({ ...personality, descricao: e.target.value })}
              placeholder="Ex: Um assistente profissional e amigável, especializado em vendas e atendimento ao cliente..."
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[120px]"
              readOnly={!canEdit || isLoading}
            />
            <div className="pointer-events-none absolute bottom-3 right-3 text-xs text-gray-400">
              Seja descritivo e específico
            </div>
          </FieldWrapper>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Área de Expertise
          </label>
          <FieldWrapper isLoading={isLoading}>
            <textarea
              value={personality.area}
              onChange={(e) => setPersonality({ ...personality, area: e.target.value })}
              placeholder="Ex: Conhecimento profundo em vendas B2B, prospecção de clientes e negociação..."
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[120px]"
              readOnly={!canEdit || isLoading}
            />
            <div className="pointer-events-none absolute bottom-3 right-3 text-xs text-gray-400">
              Liste as principais áreas de conhecimento
            </div>
          </FieldWrapper>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tom de Voz
          </label>
          <FieldWrapper isLoading={isLoading}>
            <select
              value={personality.tom}
              onChange={(e) => setPersonality({ ...personality, tom: e.target.value })}
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              disabled={!canEdit || isLoading}
            >
              <option value="professional">Profissional</option>
              <option value="friendly">Amigável</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </FieldWrapper>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor da negociação no CRM
          </label>
          <FieldWrapper isLoading={isLoading}>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <span className="text-gray-500">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={personality.valor_negociacao}
                onChange={(e) =>
                  setPersonality({ ...personality, valor_negociacao: parseFloat(e.target.value) })
                }
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={!canEdit || isLoading}
              />
            </div>
          </FieldWrapper>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveWithModal}
              disabled={savingPersonality || isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
            >
              {savingPersonality ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar Personalidade</span>
                </>
              )}
            </button>
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Sucesso">
  {modalLoading ? (
    <div className="flex items-center justify-center gap-2 py-4">
      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
      <p className="text-sm text-gray-600">Processando personalidade...</p>
    </div>
  ) : (
    <p className="text-gray-700">Personalidade salva com sucesso!</p>
  )}
</Modal>

      </div>
    </div>
  );
}
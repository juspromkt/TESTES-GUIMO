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
}

export default function PersonalitySection({
  personality,
  setPersonality,
  savingPersonality,
  handleSavePersonality,
  canEdit // <- NOVO
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
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
          <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Personalidade do Agente</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Configure a personalidade e comportamento do seu agente</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
            Descrição da Personalidade
          </label>
          <div className="relative">
            <textarea
              value={personality.descricao}
              onChange={(e) => setPersonality({ ...personality, descricao: e.target.value })}
              placeholder="Ex: Você é Clara, analista jurídica do escritório Sales Caetano Advogados. Conduza o atendimento com empatia e clareza.

Você é inteligente e consegue interpretar e responder o que a lead fala, responda e retorne ao fluxo com leveza.

Consulte a base fornecida para dúvidas relacionadas ao escritório, procedimentos internos e informações. Se a informação não estiver na base fornecida , não invente. Apenas diga que essa informação não nos foi repassada e siga com o fluxo de atendimento padrão."
              className="w-full px-4 py-3 text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 min-h-[120px] placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              readOnly={!canEdit}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-neutral-500">
              Seja descritivo e específico
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
            Área de Expertise
          </label>
          <div className="relative">
            <textarea
              value={personality.area}
              onChange={(e) => setPersonality({ ...personality, area: e.target.value })}
              placeholder="Ex: Coloque todos os motivos para uma rescisão indireta, ou as deficiências/doenças que são válidas para o BPC/Loas"
              className="w-full px-4 py-3 text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 min-h-[120px] placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              readOnly={!canEdit}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-neutral-500">
              Liste as principais áreas de conhecimento
            </div>
          </div>
        </div>


        {canEdit && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveWithModal}
              disabled={savingPersonality}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 font-medium"
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
      <Loader2 className="w-5 h-5 animate-spin text-purple-500 dark:text-purple-400" />
      <p className="text-sm text-gray-600 dark:text-neutral-400">Processando personalidade...</p>
    </div>
  ) : (
    <p className="text-gray-700 dark:text-neutral-300">Personalidade salva com sucesso!</p>
  )}
</Modal>

      </div>
    </div>
  );
}

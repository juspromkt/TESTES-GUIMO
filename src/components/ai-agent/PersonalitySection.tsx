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

  const MAX_CHARS_DESCRICAO = 500;
  const MAX_CHARS_AREA = 1500;

  // Funções para contar caracteres
  const descricaoCount = personality.descricao.length;
  const areaCount = personality.area.length;

  const descricaoPercentage = (descricaoCount / MAX_CHARS_DESCRICAO) * 100;
  const areaPercentage = (areaCount / MAX_CHARS_AREA) * 100;

  // Determina a cor baseada na porcentagem
  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-emerald-500 dark:bg-emerald-600';
    if (percentage < 75) return 'bg-yellow-500 dark:bg-yellow-600';
    if (percentage < 90) return 'bg-orange-500 dark:bg-orange-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  const getTextColor = (percentage: number) => {
    if (percentage < 50) return 'text-emerald-600 dark:text-emerald-400';
    if (percentage < 75) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage < 90) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

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

          {/* Contador de caracteres - Descrição */}
          <div className="mb-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${getTextColor(descricaoPercentage)}`}>
                {descricaoCount}/{MAX_CHARS_DESCRICAO}
              </span>
              <span className={`text-xs ${getTextColor(descricaoPercentage)}`}>
                ({descricaoPercentage.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(descricaoPercentage)} transition-all duration-300 ease-out`}
                style={{ width: `${Math.min(descricaoPercentage, 100)}%` }}
              />
            </div>

            {/* Alerta quando exceder o limite - Descrição */}
            {descricaoCount > MAX_CHARS_DESCRICAO && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800/50 rounded-lg flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Limite recomendado excedido
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Seu agente pode se perder pelo volume de caracteres. Recomendamos manter até {MAX_CHARS_DESCRICAO} caracteres.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <textarea
              value={personality.descricao}
              onChange={(e) => setPersonality({ ...personality, descricao: e.target.value })}
              placeholder="Ex: Um assistente profissional e amigável, especializado em vendas e atendimento ao cliente..."
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

          {/* Contador de caracteres - Área */}
          <div className="mb-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${getTextColor(areaPercentage)}`}>
                {areaCount}/{MAX_CHARS_AREA}
              </span>
              <span className={`text-xs ${getTextColor(areaPercentage)}`}>
                ({areaPercentage.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(areaPercentage)} transition-all duration-300 ease-out`}
                style={{ width: `${Math.min(areaPercentage, 100)}%` }}
              />
            </div>

            {/* Alerta quando exceder o limite - Área */}
            {areaCount > MAX_CHARS_AREA && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800/50 rounded-lg flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Limite recomendado excedido
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Seu agente pode se perder pelo volume de caracteres. Recomendamos manter até {MAX_CHARS_AREA} caracteres.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <textarea
              value={personality.area}
              onChange={(e) => setPersonality({ ...personality, area: e.target.value })}
              placeholder="Ex: Conhecimento profundo em vendas B2B, prospecção de clientes e negociação..."
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
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 font-medium"
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
      <p className="text-sm text-gray-600 dark:text-neutral-300">Processando personalidade...</p>
    </div>
  ) : (
    <p className="text-gray-700 dark:text-neutral-200">Personalidade salva com sucesso!</p>
  )}
</Modal>

      </div>
    </div>
  );
}
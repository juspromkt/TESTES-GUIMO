import React, { useState } from 'react';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import Modal from '../Modal';

interface AIPromptGeneratorProps {
  token: string;
  onApplyModel: (model: any) => void;
  canEdit: boolean;
}

export default function AIPromptGenerator({ token, onApplyModel, canEdit }: AIPromptGeneratorProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModel, setGeneratedModel] = useState<any>(null);
  const [error, setError] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Por favor, forneça uma descrição para gerar o prompt.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/prompt/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          descricao: description
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar prompt com IA');
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setGeneratedModel(data[0]);
        setIsResultModalOpen(true);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar prompt com IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedModel) {
      onApplyModel(generatedModel);
      setIsConfirmModalOpen(false);
      setIsResultModalOpen(false);
      setDescription('');
      setGeneratedModel(null);
    }
  };

  return (
    <div className="-mt-4">
      {/* Layout 16:9 com 2 colunas */}
      <div className="h-[550px] flex overflow-hidden bg-white dark:bg-neutral-900 rounded-2xl">
        {/* Coluna Esquerda - Hero */}
        <div className="w-2/5 relative overflow-hidden rounded-l-2xl flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 shadow-xl">
              <Sparkles className="w-14 h-14 text-white drop-shadow-lg" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight drop-shadow-md">
              Gerar Prompt com IA
            </h2>
            <p className="text-white/95 text-base leading-relaxed max-w-sm mx-auto font-light mb-8">
              Crie um prompt personalizado para seu agente com ajuda da IA
            </p>

            {/* Como funciona - Card compacto */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h3 className="text-base font-bold text-white">Como funciona?</h3>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                Descreva o que você quer que o seu agente faça. Nossa IA irá gerar um prompt completo incluindo personalidade, regras, etapas e FAQ.
              </p>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Formulário */}
        <div className="w-3/5 overflow-hidden bg-gradient-to-br from-gray-50/50 to-white dark:from-neutral-900 dark:to-neutral-900 flex flex-col rounded-r-2xl">
          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Dicas */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 dark:border-amber-600 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">✨</span>
                <p className="font-bold text-amber-900 dark:text-amber-300 text-sm">Dicas para melhores resultados:</p>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                  <span className="flex-shrink-0 w-5 h-5 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">1</span>
                  <span>Especifique sua área de atuação (ex: BPC/Loas, Trabalhista, Bancário)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                  <span className="flex-shrink-0 w-5 h-5 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">2</span>
                  <span>Mencione se precisa de agendamento ou não</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                  <span className="flex-shrink-0 w-5 h-5 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">3</span>
                  <span>Descreva o tom de voz desejado (formal, casual, amigável)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                  <span className="flex-shrink-0 w-5 h-5 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">4</span>
                  <span>Mencione qualquer fluxo de atendimento específico que deseja implementar</span>
                </li>
              </ul>
            </div>

            {/* Input Section */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                <span className="text-lg">📝</span>
                Descrição do seu escritório e necessidades
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-4 text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 border-2 border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 min-h-[140px] placeholder:text-gray-400 dark:placeholder:text-neutral-500 transition-all resize-none text-sm"
                placeholder="Ex: Gere um prompt para meu escritório de advocacia especializado em BPC/Loas, com recepção, análise de viabilidade, oferta do contrato, envio do link para assinatura e agendamento de reunião..."
                disabled={!canEdit}
                autoFocus
              />

              {/* Character counter */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-neutral-500">
                  {description.length} caracteres
                </p>
                {description.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Descrição fornecida
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mt-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Botão fixo */}
          {canEdit && (
            <div className="flex-shrink-0 px-8 py-4 border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                className={`w-full flex items-center justify-center gap-2 px-8 py-3 text-white rounded-xl font-semibold shadow-lg transition-all ${
                  isGenerating || !description.trim()
                    ? 'bg-gray-400 dark:bg-neutral-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Gerando Prompt com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Gerar com IA</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result Modal */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="Prompt Gerado com IA"
        maxWidth="4xl"
        maxHeight="90vh"
      >
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {generatedModel && (
            <>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Personalidade</h3>
                  <div className="bg-gray-50 dark:bg-neutral-700 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">{generatedModel.personalidade.descricao}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Área de Expertise</h3>
                  <div className="bg-gray-50 dark:bg-neutral-700 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">{generatedModel.personalidade.area}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Regras</h3>
                  <div className="bg-gray-50 dark:bg-neutral-700 p-4 rounded-lg text-gray-700 dark:text-neutral-300">
                    <div dangerouslySetInnerHTML={{ __html: generatedModel.regras.regras }} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Etapas de Atendimento</h3>
                  <div className="space-y-4">
                    {generatedModel.etapas.map((etapa: any, index: number) => (
                      <div key={index} className="bg-gray-50 dark:bg-neutral-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-neutral-100">{etapa.nome}</h4>
                        <div className="text-gray-700 dark:text-neutral-300" dangerouslySetInnerHTML={{ __html: etapa.descricao }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Perguntas Frequentes</h3>
                  <div className="space-y-4">
                    {generatedModel.faq.map((faq: any, index: number) => (
                      <div key={index} className="bg-gray-50 dark:bg-neutral-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-neutral-100">{faq.nome}</h4>
                        <div className="text-gray-700 dark:text-neutral-300" dangerouslySetInnerHTML={{ __html: faq.descricao }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-300 dark:border-neutral-700 mt-6">
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsResultModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                    Aplicar este Modelo
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Aplicação do Modelo"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                Atenção!
              </h3>
              <p className="text-gray-500 dark:text-neutral-400 mt-1">
                Esta ação irá substituir todas as configurações atuais do seu agente, incluindo personalidade, regras, etapas e FAQ.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 dark:border-amber-700 p-4">
            <p className="text-amber-800 dark:text-amber-400">
              Esta ação é <strong>irreversível</strong>. Todas as configurações atuais serão perdidas.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-md"
            >
              Sim, Aplicar Modelo
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
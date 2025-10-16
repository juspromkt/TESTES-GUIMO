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
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl shadow-md p-8 mb-8 border border-indigo-100 dark:border-indigo-900">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Gerar Prompt com IA</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Crie um prompt personalizado para seu agente com ajuda da IA</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-lg p-6 mb-6 border border-indigo-100 dark:border-indigo-900">
        <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-400 mb-3">Como funciona?</h3>
        <p className="text-gray-700 dark:text-neutral-300 mb-4">
          Descreva o que você quer que o seu agente faça, em detalhes. Nossa IA irá gerar um prompt personalizado
          para seu agente, incluindo personalidade, regras, etapas de atendimento e perguntas frequentes.
        </p>
        <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 dark:border-amber-700 p-4 text-amber-700 dark:text-amber-400">
          <p className="font-medium">Dicas para obter melhores resultados:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Especifique sua área de atuação (ex: BPC/Loas, Trabalhista, Bancário )</li>
            <li>Mencione se precisa de agendamento ou não</li>
            <li>Descreva o tom de voz desejado (formal, casual, amigável)</li>
            <li>Mencione qualquer fluxo de atendimento específico que deseja implementar</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
            Descrição do seu escritório e necessidades
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 min-h-[150px] placeholder:text-gray-400 dark:placeholder:text-neutral-500"
            placeholder="Ex: Gere um prompt para meu escritório de advocacia especializado em BPC/Loas, com recepção, análise de viabilidade, oferta do contrato, envio do link para assinatura e agendamento de reunião..."
            disabled={!canEdit}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gerando Prompt...</span>
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
import { useState, useEffect } from 'react';
import { HelpCircle, Loader2 } from 'lucide-react';
import { StepComponentProps, AgentTemplate } from '../../../types/agent-wizard';

export default function EditFaqStep({ state, onNext, onBack, token }: StepComponentProps) {
  const [faq, setFaq] = useState<AgentTemplate['faq']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Prioridade 1: Carregar do editedContent (se já foi editado)
    if (state.singleAgent.editedContent?.faq) {
      setFaq(state.singleAgent.editedContent.faq);
    }
    // Prioridade 2: Carregar FAQ do template se houver
    else if (state.singleAgent.selectedTemplate && state.singleAgent.creationType === 'template') {
      const template = state.singleAgent.selectedTemplate;
      setFaq(template.faq || []);
    }
  }, []);

  const handleAddFaq = () => {
    const newOrdem = faq.length > 0 ? Math.max(...faq.map(f => f.ordem)) + 1 : 1;
    setFaq([
      ...faq,
      {
        ordem: newOrdem,
        nome: '',
        descricao: '<p></p>'
      }
    ]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaq(faq.filter((_, i) => i !== index));
  };

  const handleUpdateFaq = (index: number, field: 'nome' | 'descricao', value: string) => {
    const updated = [...faq];
    updated[index] = { ...updated[index], [field]: value };
    setFaq(updated);
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);

    const agentId = state.singleAgent.createdAgent?.Id;

    if (!agentId) {
      setError('ID do agente não encontrado. Não é possível salvar.');
      setLoading(false);
      return;
    }

    try {
      // Salvar Perguntas Frequentes (apenas se houver perguntas)
      if (faq && faq.length > 0) {
        const faqResponse = await fetch(
          'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/create',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify(
              faq.map(f => ({ ...f, id_agente: agentId }))
            )
          }
        );

        if (!faqResponse.ok) {
          throw new Error('Erro ao salvar Perguntas Frequentes');
        }
      }

      // Passar para etapa final (final-confirmation)
      onNext({
        singleAgent: {
          ...state.singleAgent,
          editedContent: {
            regras: state.singleAgent.editedContent?.regras || '',
            etapas: state.singleAgent.editedContent?.etapas || [],
            faq
          }
        },
        currentStep: 'final-confirmation'
      });
    } catch (err: any) {
      console.error('Erro ao salvar Perguntas Frequentes:', err);
      setError(err.message || 'Erro ao salvar Perguntas Frequentes. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Configure as Perguntas Frequentes
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Adicione perguntas e respostas que o agente "{state.singleAgent.createdAgent?.nome}" deve saber
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Formulário */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {faq.length} pergunta(s) configurada(s)
          </p>
          <button
            onClick={handleAddFaq}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
          >
            + Adicionar Pergunta Frequente
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {faq.map((item, index) => (
            <div
              key={index}
              className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.nome || ''}
                    onChange={(e) => handleUpdateFaq(index, 'nome', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                    placeholder="Pergunta"
                  />
                </div>
                <button
                  onClick={() => handleRemoveFaq(index)}
                  className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                >
                  Remover
                </button>
              </div>
              <textarea
                value={item.descricao.replace(/<[^>]*>/g, '')}
                onChange={(e) => handleUpdateFaq(index, 'descricao', `<p>${e.target.value}</p>`)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                placeholder="Resposta..."
              />
            </div>
          ))}
        </div>

        {faq.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Nenhuma pergunta configurada. Clique em "Adicionar Pergunta Frequente" para começar.
          </div>
        )}

        {/* Dicas */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Dicas para boas Perguntas Frequentes:
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Escreva perguntas como os clientes realmente perguntariam</li>
            <li>• Mantenha as respostas claras, diretas e concisas</li>
            <li>• Inclua variações de perguntas similares quando relevante</li>
            <li>• Priorize as dúvidas mais comuns no topo da lista</li>
          </ul>
        </div>
      </div>

      {/* Botões de navegação */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>Salvar e Finalizar →</>
          )}
        </button>
      </div>
    </div>
  );
}

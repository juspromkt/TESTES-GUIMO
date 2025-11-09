import { useState, useEffect } from 'react';
import { FileText, List, HelpCircle, Loader2 } from 'lucide-react';
import { StepComponentProps, AgentTemplate } from '../../../types/agent-wizard';

type Tab = 'regras' | 'roteiro' | 'faq';

export default function EditContentStep({ state, onNext, token }: StepComponentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('regras');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para os conteúdos editáveis
  const [regras, setRegras] = useState('');
  const [etapas, setEtapas] = useState<AgentTemplate['etapas']>([]);
  const [faq, setFaq] = useState<AgentTemplate['faq']>([]);

  useEffect(() => {
    // Carregar conteúdo do template se houver
    if (state.singleAgent.selectedTemplate && state.singleAgent.creationType === 'template') {
      const template = state.singleAgent.selectedTemplate;
      setRegras(template.regras?.regras || '');
      setEtapas(template.etapas || []);
      setFaq(template.faq || []);
    }
  }, []);

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
      // 1. Salvar Regras
      const regrasResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            id_agente: agentId,
            regras: regras || '<p></p>'
          })
        }
      );

      if (!regrasResponse.ok) {
        throw new Error('Erro ao salvar regras');
      }

      // 2. Salvar Etapas
      if (etapas && etapas.length > 0) {
        const etapasResponse = await fetch(
          'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/create',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify({
              id_agente: agentId,
              etapas: etapas
            })
          }
        );

        if (!etapasResponse.ok) {
          throw new Error('Erro ao salvar etapas');
        }
      }

      // 3. Salvar FAQ
      if (faq && faq.length > 0) {
        const faqResponse = await fetch(
          'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/create',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify({
              id_agente: agentId,
              faq: faq
            })
          }
        );

        if (!faqResponse.ok) {
          throw new Error('Erro ao salvar FAQ');
        }
      }

      // Armazenar também no estado para referência
      onNext({
        singleAgent: {
          ...state.singleAgent,
          editedContent: {
            regras,
            etapas,
            faq
          }
        },
        currentStep: 'final-confirmation'
      });
    } catch (err: any) {
      console.error('Erro ao salvar conteúdo:', err);
      setError(err.message || 'Erro ao salvar conteúdo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEtapa = () => {
    const newOrdem = etapas.length > 0 ? Math.max(...etapas.map(e => e.ordem)) + 1 : 1;
    setEtapas([
      ...etapas,
      {
        ordem: newOrdem,
        nome: `Nova Etapa ${newOrdem}`,
        descricao: '<p>Descrição da etapa...</p>'
      }
    ]);
  };

  const handleRemoveEtapa = (index: number) => {
    setEtapas(etapas.filter((_, i) => i !== index));
  };

  const handleUpdateEtapa = (index: number, field: 'nome' | 'descricao', value: string) => {
    const updated = [...etapas];
    updated[index] = { ...updated[index], [field]: value };
    setEtapas(updated);
  };

  const handleAddFaq = () => {
    const newOrdem = faq.length > 0 ? Math.max(...faq.map(f => f.ordem)) + 1 : 1;
    setFaq([
      ...faq,
      {
        ordem: newOrdem,
        nome: 'Nova pergunta',
        descricao: '<p>Resposta...</p>'
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

  const tabs = [
    { id: 'regras' as Tab, label: 'Regras', icon: FileText },
    { id: 'roteiro' as Tab, label: 'Roteiro (Etapas)', icon: List },
    { id: 'faq' as Tab, label: 'FAQ', icon: HelpCircle }
  ];

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Configure seu agente
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Personalize as regras, roteiro e perguntas frequentes
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo das tabs */}
      <div className="min-h-[400px]">
        {/* Tab: Regras */}
        {activeTab === 'regras' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Regras de Atendimento
              </label>
              <textarea
                value={regras.replace(/<[^>]*>/g, '')} // Remove HTML tags para edição
                onChange={(e) => setRegras(`<p>${e.target.value}</p>`)}
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 font-mono text-sm"
                placeholder="Digite as regras de atendimento do agente..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Defina como o agente deve se comportar durante o atendimento
              </p>
            </div>
          </div>
        )}

        {/* Tab: Roteiro (Etapas) */}
        {activeTab === 'roteiro' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {etapas.length} etapa(s) configurada(s)
              </p>
              <button
                onClick={handleAddEtapa}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
              >
                + Adicionar Etapa
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {etapas.map((etapa, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={etapa.nome}
                        onChange={(e) => handleUpdateEtapa(index, 'nome', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                        placeholder="Nome da etapa"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveEtapa(index)}
                      className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                    >
                      Remover
                    </button>
                  </div>
                  <textarea
                    value={etapa.descricao.replace(/<[^>]*>/g, '')}
                    onChange={(e) => handleUpdateEtapa(index, 'descricao', `<p>${e.target.value}</p>`)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    placeholder="Descrição da etapa..."
                  />
                </div>
              ))}
            </div>

            {etapas.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Nenhuma etapa configurada. Clique em "Adicionar Etapa" para começar.
              </div>
            )}
          </div>
        )}

        {/* Tab: FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {faq.length} pergunta(s) configurada(s)
              </p>
              <button
                onClick={handleAddFaq}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
              >
                + Adicionar FAQ
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
                Nenhuma pergunta configurada. Clique em "Adicionar FAQ" para começar.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botão de salvar e continuar */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
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
            <>Salvar e Continuar →</>
          )}
        </button>
      </div>
    </div>
  );
}

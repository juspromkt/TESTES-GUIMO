import { useState, useEffect } from 'react';
import { Search, CheckSquare, Square, Info } from 'lucide-react';
import { StepComponentProps, AgentTemplate, AGENT_MODELS } from '../../../types/agent-wizard';
import { agentModels } from '../../../data/agent-models';

export default function SelectMultiTemplatesStep({ state, onNext, onBack }: StepComponentProps) {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<AgentTemplate[]>(
    state.multiAgent.selectedTemplates || []
  );

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const loadedTemplates: AgentTemplate[] = [];

      // Mapeamento de IDs para as chaves do agentModels
      const modelMap: Record<string, string> = {
        'bancario': 'bancario',
        'bpc': 'bpc',
        'maternidade': 'maternidade',
        'trabalhista': 'trabalhista',
        'auxilio': 'auxilio',
        'invalidez': 'invalidez',
        'desconto-indevido': 'descontoIndevido',
        'bancario-produtor': 'bancarioProdutorRural',
        'pensao-divorcio': 'pensaoDivorcio',
        'pensao-morte': 'pensaoMorte'
      };

      for (const model of AGENT_MODELS.NIVEL_2) {
        try {
          const modelKey = modelMap[model.id];

          if (!modelKey || !agentModels[modelKey]) {
            console.warn(`⚠️ Modelo ${model.id} não encontrado no mapeamento`);
            continue;
          }

          const data = agentModels[modelKey].data;

          console.log(`📦 Carregando template ${model.nome}:`, {
            hasPersonalidade: !!data.personalidade,
            hasRegras: !!data.regras,
            hasEtapas: !!data.etapas,
            etapasCount: data.etapas?.length || 0,
            hasFaq: !!data.faq,
            faqCount: data.faq?.length || 0
          });

          loadedTemplates.push({
            id: model.id,
            nome: model.nome,
            area: model.area,
            descricao: data.personalidade?.descricao || '',
            nivel: 2,
            ...data
          });
        } catch (error) {
          console.error(`❌ Erro ao carregar modelo ${model.id}:`, error);
        }
      }

      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('❌ Erro geral ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTemplate = (template: AgentTemplate) => {
    const isSelected = selectedTemplates.some(t => t.id === template.id);
    if (isSelected) {
      setSelectedTemplates(selectedTemplates.filter(t => t.id !== template.id));
    } else {
      setSelectedTemplates([...selectedTemplates, template]);
    }
  };

  const handleContinue = () => {
    if (selectedTemplates.length === 0) return;

    onNext({
      multiAgent: {
        ...state.multiAgent,
        selectedTemplates
      },
      currentStep: 'review-agents'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-8 max-w-md">
          {/* Spinner animado com gradiente */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-purple-400 border-r-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>

          {/* Texto */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Carregando modelos
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Buscando templates disponíveis para multiagentes...
            </p>
          </div>

          {/* Barra de progresso animada */}
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-progress"></div>
          </div>

          {/* Pontos animados */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        <style>{`
          @keyframes progress {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(400%);
            }
          }
          .animate-progress {
            animation: progress 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título e instruções */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Selecione as áreas de atendimento
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha os agentes especialistas que farão parte do seu sistema
        </p>
      </div>

      {/* Informações sobre o sistema */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-300 space-y-1">
            <p className="font-medium">Sistema de Multiagentes:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>1 Agente Principal (Nível 1):</strong> Recepciona e direciona leads</li>
              <li>• <strong>{selectedTemplates.length} Agente(s) Especialista(s) (Nível 2):</strong> Áreas selecionadas</li>
              <li>• Total de agentes que serão criados: <strong>{selectedTemplates.length + 1}</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou área..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
        />
      </div>

      {/* Contador de selecionados */}
      {selectedTemplates.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
          <span className="text-sm font-medium text-green-900 dark:text-green-300">
            {selectedTemplates.length} área(s) selecionada(s)
          </span>
          <button
            onClick={() => setSelectedTemplates([])}
            className="text-sm text-green-700 dark:text-green-400 hover:underline"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {/* Lista de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplates.some(t => t.id === template.id);
          return (
            <button
              key={template.id}
              onClick={() => toggleTemplate(template)}
              className={`relative p-5 border-2 rounded-lg text-left transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {template.nome}
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {template.area}
                    </p>
                  </div>
                  {isSelected ? (
                    <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  ) : (
                    <Square className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {template.descricao.replace(/<[^>]*>/g, '').substring(0, 120)}...
                </p>
                <div className="flex gap-2 pt-2">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded">
                    {template.etapas?.length || 0} etapas
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded">
                    {template.faq?.length || 0} FAQs
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum modelo encontrado para "{searchTerm}"
          </p>
        </div>
      )}

      {/* Botões de navegação */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Voltar
        </button>
        <button
          onClick={handleContinue}
          disabled={selectedTemplates.length === 0}
          className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar ({selectedTemplates.length}) →
        </button>
      </div>
    </div>
  );
}

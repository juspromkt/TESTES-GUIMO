import { useState, useEffect } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { StepComponentProps, AgentTemplate, AGENT_MODELS } from '../../../types/agent-wizard';
import { agentModels } from '../../../data/agent-models';

export default function SelectTemplateStep({ state, onNext, onBack }: StepComponentProps) {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(
    state.singleAgent.selectedTemplate
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

  const handleSelectTemplate = (template: AgentTemplate) => {
    setSelectedTemplate(template);
  };

  const handleContinue = () => {
    if (!selectedTemplate) return;

    onNext({
      singleAgent: {
        ...state.singleAgent,
        selectedTemplate
      },
      currentStep: 'define-name'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando modelos disponíveis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título e instruções */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Escolha um modelo para seu agente
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Selecione o modelo que melhor se adequa à sua necessidade
        </p>
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

      {/* Lista de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            className={`relative p-5 border-2 rounded-lg text-left transition-all duration-200 ${
              selectedTemplate?.id === template.id
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
                {selectedTemplate?.id === template.id && (
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
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
        ))}
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
          disabled={!selectedTemplate}
          className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}

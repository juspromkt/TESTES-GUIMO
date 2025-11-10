import { useState } from 'react';
import { Download, Upload, X, Copy, Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface AgentImportExportSectionProps {
  token: string;
  idAgente: number;
  canEdit: boolean;
  onImportSuccess?: () => void;
}

interface AgentModel {
  regras: {
    regras: string;
  };
  etapas: Array<{
    ordem: number;
    nome: string;
    descricao: string;
  }>;
  faq: Array<{
    ordem: number;
    nome: string;
    descricao: string;
  }>;
}

export default function AgentImportExportSection({
  token,
  idAgente,
  canEdit,
  onImportSuccess
}: AgentImportExportSectionProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportData, setExportData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      // Buscar regras gerais
      const rulesResponse = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/get?id_agente=${idAgente}`,
        { headers: { token } }
      );
      const rulesData = await rulesResponse.json();
      const rules = Array.isArray(rulesData) && rulesData.length > 0 ? rulesData[0].regras : '';

      // Buscar etapas (roteiro)
      const stepsResponse = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/get?id_agente=${idAgente}`,
        { headers: { token } }
      );
      const stepsData = await stepsResponse.json();
      const steps = Array.isArray(stepsData)
        ? stepsData.map((step, index) => ({
            ordem: index + 1,
            nome: step.nome || '',
            descricao: step.descricao || ''
          }))
        : [];

      // Buscar FAQ
      const faqResponse = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/get?id_agente=${idAgente}`,
        { headers: { token } }
      );
      const faqData = await faqResponse.json();
      const faq = Array.isArray(faqData)
        ? faqData.map((item, index) => ({
            ordem: index + 1,
            nome: item.pergunta || '',
            descricao: item.resposta || ''
          }))
        : [];

      // Montar objeto de exportação
      const agentModel: AgentModel = {
        regras: {
          regras: rules
        },
        etapas: steps,
        faq: faq
      };

      const jsonString = JSON.stringify(agentModel, null, 2);
      setExportData(jsonString);
      setShowExportModal(true);
    } catch (err) {
      console.error('Erro ao exportar agente:', err);
      toast.error('Erro ao exportar agente');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      toast.success('JSON copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar JSON:', err);
      toast.error('Erro ao copiar JSON');
    }
  };

  const handleDownloadJSON = () => {
    try {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agente-${idAgente}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (err) {
      console.error('Erro ao fazer download:', err);
      toast.error('Erro ao fazer download');
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error('Cole o JSON do modelo para importar');
      return;
    }

    setLoading(true);
    try {
      // Validar e parsear JSON
      const model: AgentModel = JSON.parse(importData);

      // Validar estrutura
      if (!model.regras || !model.etapas || !model.faq) {
        throw new Error('Formato JSON inválido. Certifique-se de que contém regras, etapas e faq.');
      }

      console.log('[Import] Iniciando importação:', {
        regras: !!model.regras.regras,
        etapas: model.etapas.length,
        faq: model.faq.length
      });

      let importedCount = 0;

      // Importar regras
      if (model.regras.regras) {
        console.log('[Import] Importando Regras...');
        const rulesPayload = {
          id_agente: idAgente,
          regras: model.regras.regras
        };

        const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', token },
          body: JSON.stringify(rulesPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Import] Erro ao importar Regras:', errorText);
        } else {
          console.log('[Import] Regras importadas com sucesso');
          importedCount++;
        }
      }

      // Importar etapas
      if (Array.isArray(model.etapas) && model.etapas.length > 0) {
        console.log('[Import] Importando Etapas:', model.etapas.length, 'itens');

        const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', token },
          body: JSON.stringify(
            model.etapas.map(e => ({ ...e, id_agente: idAgente }))
          )
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Import] Erro ao importar Etapas:', errorText);
        } else {
          console.log(`[Import] ${model.etapas.length} etapa(s) importada(s) com sucesso`);
          importedCount++;
        }
      }

      // Importar FAQ
      if (Array.isArray(model.faq) && model.faq.length > 0) {
        console.log('[Import] Importando FAQ:', model.faq.length, 'itens');

        const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', token },
          body: JSON.stringify(
            model.faq.map(f => ({ ...f, id_agente: idAgente }))
          )
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Import] Erro ao importar FAQ:', errorText);
        } else {
          console.log(`[Import] ${model.faq.length} FAQ(s) importado(s) com sucesso`);
          importedCount++;
        }
      }

      const message = `Importado com sucesso: ${importedCount === 3 ? 'Regras, Etapas e FAQ' : importedCount === 2 ? 'Regras e Etapas' : 'Parcialmente'}`;
      toast.success(message);
      setShowImportModal(false);
      setImportData('');

      // Notificar componente pai para recarregar dados
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      console.error('Erro ao importar agente:', err);
      if (err instanceof SyntaxError) {
        toast.error('Formato JSON inválido. Verifique o conteúdo.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Erro ao importar agente');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-3">
        {/* Botão Exportar */}
        <button
          onClick={handleExport}
          disabled={loading || !canEdit}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          Exportar Modelo
        </button>

        {/* Botão Importar */}
        <button
          onClick={() => setShowImportModal(true)}
          disabled={loading || !canEdit}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Upload className="h-4 w-4" />
          Importar Modelo
        </button>
      </div>

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExportModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Exportar Modelo
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Abaixo está o JSON do seu modelo atual. Você pode copiá-lo ou fazer o download para importar em outro sistema.
              </p>

              {/* Área do JSON */}
              <div className="relative">
                <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-[400px] overflow-y-auto text-gray-800 dark:text-gray-200">
                  {exportData}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 font-medium transition-colors"
              >
                Fechar
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyJSON}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar JSON
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowImportModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Importar Modelo
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Cole o JSON do modelo que deseja importar. Certifique-se de que o formato está correto.
              </p>

              {/* Área de texto para colar JSON */}
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Cole o JSON do modelo aqui..."
                className="w-full h-[400px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-xs font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={loading || !importData.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4" />
                {loading ? 'Importando...' : 'Importar Modelo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { Book, AlertCircle, Check, Loader2, Download, Upload } from 'lucide-react';
import { agentModels } from '../../data/agent-models';
import Modal from '../Modal';
import AIPromptGenerator from './AIPromptGenerator';

interface DefaultModelsSectionProps {
  token: string;
  onSuccess: () => void;
  canEdit: boolean;
}

export default function DefaultModelsSection({ token, onSuccess, canEdit }: DefaultModelsSectionProps) {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportedModel, setExportedModel] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedModel, setImportedModel] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  const CONFIRMATION_TEXT = "Eu confirmo que desejo aplicar este modelo";

  // Fetch current model data for export
  const fetchCurrentModel = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch personality
      const personalityResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/get', {
        headers: { token }
      });
      const personalityData = await personalityResponse.json();
      const personality = Array.isArray(personalityData) && personalityData.length > 0 ? personalityData[0] : null;
      
      // Fetch rules
      const rulesResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/get', {
        headers: { token }
      });
      const rulesData = await rulesResponse.json();
      const rules = Array.isArray(rulesData) && rulesData.length > 0 ? rulesData[0] : null;
      
      // Fetch steps
      const stepsResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/get', {
        headers: { token }
      });
      const steps = await stepsResponse.json();
      
      // Fetch FAQ
      const faqResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/get', {
        headers: { token }
      });
      const faq = await faqResponse.json();
      
      // Combine all data
      const modelData = {
        personalidade: {
          descricao: personality?.descricao || '',
          area: personality?.area || '',
          tom: personality?.tom || 'professional',
          valor_negociacao: personality?.valor_negociacao || 0
        },
        regras: {
          regras: rules?.regras || ''
        },
        etapas: Array.isArray(steps) ? steps.map(step => ({
          ordem: step.ordem,
          nome: step.nome,
          descricao: step.descricao
        })) : [],
        faq: Array.isArray(faq) ? faq.map(item => ({
          ordem: item.ordem,
          nome: item.pergunta,
          descricao: item.resposta
        })) : []
      };
      
      setExportedModel(JSON.stringify(modelData, null, 2));
      setIsExportModalOpen(true);
    } catch (err) {
      console.error('Erro ao exportar modelo:', err);
      setError('Erro ao exportar modelo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportModel = async () => {
    setImportLoading(true);
    setImportError('');
    
    try {
      let modelData;
      try {
        modelData = JSON.parse(importedModel);
      } catch (err) {
        throw new Error('JSON inválido. Verifique o formato do modelo.');
      }
      
      // Validate model structure
      if (!modelData.personalidade || !modelData.regras || !Array.isArray(modelData.etapas) || !Array.isArray(modelData.faq)) {
        throw new Error('Estrutura do modelo inválida. Verifique se o JSON contém personalidade, regras, etapas e faq.');
      }
      
      // Apply personality
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(modelData.personalidade)
      });
      
      // Apply rules
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(modelData.regras)
      });
      
      // Apply steps
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(modelData.etapas)
      });
      
      // Apply FAQ
      const faqData = modelData.faq.map(item => ({
        ordem: item.ordem,
        pergunta: item.nome,
        resposta: item.descricao
      }));
      
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(faqData)
      });
      
      setIsImportModalOpen(false);
      setImportedModel('');
      setSuccess('Modelo importado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh data
      onSuccess();
    } catch (err) {
      console.error('Erro ao importar modelo:', err);
      setImportError(err instanceof Error ? err.message : 'Erro ao importar modelo');
    } finally {
      setImportLoading(false);
    }
  };

  const handleApplyModel = async () => {
    if (!selectedModel || confirmText !== CONFIRMATION_TEXT) return;

    setLoading(true);
    setError('');

    try {
      const model = agentModels[selectedModel].data;

      // Aplicar personalidade
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.personalidade)
      });

      // Aplicar regras
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.regras)
      });

      // Aplicar etapas
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.etapas)
      });

      // Aplicar FAQ
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.faq)
      });

      setIsConfirmModalOpen(false);
      
      // Add a small delay before refreshing
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (err) {
      console.error('Erro ao aplicar modelo:', err);
      setError('Erro ao aplicar modelo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyGeneratedModel = async (model: any) => {
    setLoading(true);
    setError('');

    try {
      // Apply personality
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          descricao: model.personalidade.descricao,
          area: model.personalidade.area,
          tom: 'professional',
          valor_negociacao: 0
        })
      });

      // Apply rules
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.regras)
      });

      // Apply steps
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.etapas)
      });

      // Apply FAQ
      const faqData = model.faq.map((item: any) => ({
        ordem: item.ordem,
        pergunta: item.nome,
        resposta: item.descricao
      }));

      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(faqData)
      });

      setSuccess('Modelo aplicado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh data
      onSuccess();
    } catch (err) {
      console.error('Erro ao aplicar modelo gerado:', err);
      setError('Erro ao aplicar modelo gerado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadModel = () => {
    const blob = new Blob([exportedModel], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-agente.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Book className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Modelos</h2>
            <p className="text-sm text-gray-500 mt-1">Selecione um modelo pré-configurado para seu agente</p>
          </div>
        </div>

        <div className="flex gap-4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!canEdit}
          >
            <option value="">Selecione um modelo...</option>
            {Object.entries(agentModels).map(([key, model]) => (
              <option key={key} value={key}>
                {model.name}
              </option>
            ))}
          </select>
          {canEdit && (
            <button
              onClick={() => {
                if (selectedModel) {
                  setIsConfirmModalOpen(true);
                  setConfirmText('');
                  setError('');
                }
              }}
              disabled={!selectedModel || !canEdit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar Modelo
            </button>
          )}
        </div>

        {success && (
          <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Exportar/Importar Modelo</h3>
          
          <div className="flex gap-4">
            <button
              onClick={fetchCurrentModel}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>Exportar Modelo Atual</span>
            </button>
            {canEdit && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>Importar Modelo</span>
              </button>
            )}
          </div>
        </div>

        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setConfirmText('');
            setError('');
          }}
          title="Confirmar Aplicação do Modelo"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Atenção!
                </h3>
                <p className="text-gray-500 mt-1">
                  Esta ação irá substituir todas as configurações atuais do seu agente.
                  Digite o texto abaixo para confirmar:
                </p>
              </div>
            </div>

            <div className="bg-gray-100 p-3 rounded-lg">
              <code className="text-sm">{CONFIRMATION_TEXT}</code>
            </div>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite o texto de confirmação"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setConfirmText('');
                  setError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyModel}
                disabled={confirmText !== CONFIRMATION_TEXT || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Aplicando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Aplicar Modelo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          title="Exportar Modelo"
          maxWidth="lg"
        >
          <div className="p-6 space-y-4">
            <p className="text-gray-600">
              Abaixo está o JSON do seu modelo atual. Você pode copiá-lo ou fazer o download para importar em outro sistema.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 overflow-auto max-h-[400px]">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">{exportedModel}</pre>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Fechar
              </button>
              <button
                onClick={handleDownloadModel}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                <Download className="w-4 h-4" />
                <span>Download JSON</span>
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setImportedModel('');
            setImportError('');
          }}
          title="Importar Modelo"
          maxWidth="lg"
        >
          <div className="p-6 space-y-4">
            <p className="text-gray-600">
              Cole o JSON do modelo que deseja importar. Certifique-se de que o formato está correto.
            </p>
            
            <textarea
              value={importedModel}
              onChange={(e) => setImportedModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={12}
              placeholder="Cole o JSON do modelo aqui..."
            />
            
            {importError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                {importError}
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportedModel('');
                  setImportError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportModel}
                disabled={!importedModel.trim() || importLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Importar Modelo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>

            {/* AI Prompt Generator */}
      <AIPromptGenerator 
        token={token} 
        onApplyModel={handleApplyGeneratedModel}
        canEdit={canEdit}
      />
    </>
  );
}
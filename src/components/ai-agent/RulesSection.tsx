import { useState, useEffect } from 'react';
import { Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RulesSectionProps {
  token: string;
  idAgente: number;
  canEdit: boolean;
  onRulesChange?: (rules: string) => void;
  onSaved?: () => void;
}

export default function RulesSection({ token, idAgente, canEdit, onRulesChange, onSaved }: RulesSectionProps) {
  const [rules, setRules] = useState('');
  const [originalRules, setOriginalRules] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    if (idAgente && token) {
      fetchRules();
    }
  }, [idAgente, token]);

  // Função para atualizar regras e propagar mudanças
  const handleRulesChange = (newRules: string) => {
    setRules(newRules);
    if (onRulesChange) {
      onRulesChange(newRules);
    }
  };

  // Verifica se há mudanças não salvas
  const hasUnsavedChanges = rules !== originalRules;

  async function fetchRules() {
    try {
      setIsLoadingRules(true);
      const res = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/get?id_agente=${idAgente}`, {
        headers: { token },
      });
      if (!res.ok) throw new Error('Erro ao carregar regras');
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.regras) {
        const loadedRules = data[0].regras;
        setRules(loadedRules);
        setOriginalRules(loadedRules);
        // Propaga para o componente pai
        if (onRulesChange) {
          onRulesChange(loadedRules);
        }
      }
    } catch (error) {
      console.error(error);
      setError('Erro ao carregar regras');
    } finally {
      setIsLoadingRules(false);
    }
  }

  async function handleSaveRules() {
    setSaving(true);
    setError('');
    setSuccessMessage(false);

    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify({ regras: rules, id_agente: idAgente }),
      });

      if (!res.ok) throw new Error('Erro ao salvar regras');

      // Atualiza o original para sincronizar
      setOriginalRules(rules);

      // Mostra mensagem de sucesso
      setSuccessMessage(true);

      // Notifica o componente pai que as regras foram salvas
      if (onSaved) {
        onSaved();
      }

      // Oculta mensagem após 3 segundos
      setTimeout(() => {
        setSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      setError('Erro ao salvar regras');
    } finally {
      setSaving(false);
    }
  }

  const modules = {
    toolbar: false,
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'list',
    'bullet',
    'link',
  ];

  return (
    <div className="h-full flex flex-col transition-colors duration-200">
      <style>{`
        .rules-quill-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .rules-quill-container .quill {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: white;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .dark .rules-quill-container .quill {
          background-color: rgba(31, 41, 55, 0.4);
        }
        .rules-quill-container .ql-container {
          flex: 1;
          border: 1px solid rgb(209, 213, 219);
          border-radius: 0.5rem;
          font-size: 0.95rem;
        }
        .dark .rules-quill-container .ql-container {
          border-color: rgba(75, 85, 99, 0.5);
        }
        .rules-quill-container .ql-editor {
          min-height: 100%;
          color: rgb(17, 24, 39);
        }
        .dark .rules-quill-container .ql-editor {
          color: white;
        }
        .rules-quill-container .ql-editor.ql-blank::before {
          color: rgb(156, 163, 175);
          font-style: normal;
        }
        .dark .rules-quill-container .ql-editor.ql-blank::before {
          color: rgb(107, 114, 128);
        }
      `}</style>

      {/* Botão Salvar no canto superior direito */}
      {canEdit && (
        <div className="flex items-center justify-end gap-3 mb-4">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Alterações não salvas
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Regras salvas com sucesso!
            </div>
          )}
          <button
            onClick={handleSaveRules}
            disabled={saving || !hasUnsavedChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              saving || !hasUnsavedChanges
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      )}

      {/* Editor Quill */}
      <div className="flex-1 relative rules-quill-container">
        {isLoadingRules ? (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 dark:text-blue-400" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Carregando regras...</span>
          </div>
        ) : (
          <ReactQuill
            value={rules}
            onChange={(content) => canEdit && handleRulesChange(content)}
            modules={modules}
            formats={formats}
            readOnly={!canEdit}
            placeholder="Defina as regras gerais que o agente deve seguir..."
            className="quill h-full"
          />
        )}
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="mt-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}

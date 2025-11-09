import React, { useState, useEffect } from 'react';
import { Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react';

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

  return (
    <div className="h-full flex flex-col transition-colors duration-200">
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

      {/* Campo de Texto */}
      <div className="flex-1 relative">
        <textarea
          value={rules}
          onChange={(e) => canEdit && handleRulesChange(e.target.value)}
          placeholder="Defina as regras gerais que o agente deve seguir..."
          disabled={!canEdit || isLoadingRules}
          className={`w-full h-full p-4 border rounded-lg
                   backdrop-blur-sm resize-none transition-all duration-200
                   ${isLoadingRules
                     ? 'border-gray-300 dark:border-gray-600/50 bg-gray-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400'
                     : 'border-gray-300 dark:border-gray-600/50 bg-white dark:bg-gray-800/40 text-gray-900 dark:text-white'
                   }
                   placeholder-gray-400 dark:placeholder-gray-500
                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                   disabled:bg-gray-50 dark:disabled:bg-gray-800/40 disabled:text-gray-500 dark:disabled:text-gray-400`}
        />
        {isLoadingRules && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 dark:text-blue-400" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Carregando regras...</span>
          </div>
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

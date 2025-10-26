import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Loader2, Zap, X, Sparkles } from 'lucide-react';

interface TriggerSectionProps {
  token: string;
  canEdit: boolean;
}

export default function TriggerSection({ token, canEdit }: TriggerSectionProps) {
  const [isActive, setIsActive] = useState(false);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    fetchTriggerConfig();
  }, []);

  // Auto-save quando triggers mudam (exceto no carregamento inicial)
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    if (!canEdit) return;

    autoSave();
  }, [triggers]);

  const fetchTriggerConfig = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/gatilho/get', {
        headers: { token }
      });
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setIsActive(data[0].isAtivo);

        // Backend retorna 'gatilho' como string
        // Convertemos para array separando por vírgula para exibir como chips
        if (data[0].gatilho) {
          const triggersArray = data[0].gatilho.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '');
          setTriggers(triggersArray);
        } else {
          setTriggers([]);
        }
      } else {
        setIsActive(false);
        setTriggers([]);
      }
    } catch (err) {
      console.error('Erro ao carregar configuração do gatilho:', err);
      setError('Erro ao carregar configuração do gatilho');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    setError('');
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/gatilho/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        }
      });
      const data = await response.json();
      setIsActive(data.isAtivo);
    } catch (err) {
      console.error('Erro ao alternar status do gatilho:', err);
      setError('Erro ao alternar status do gatilho');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleAddTrigger = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue === '') return;

    // Evita duplicatas
    if (triggers.includes(trimmedValue)) {
      setError('Este gatilho já foi adicionado.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setTriggers([...triggers, trimmedValue]);
    setInputValue('');
    setError('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTrigger();
    }
  };

  const handleRemoveTrigger = (index: number) => {
    setTriggers(triggers.filter((_, i) => i !== index));
  };

  const autoSave = async () => {
    if (isActive && triggers.length === 0) {
      return; // Não mostra erro no auto-save, apenas não salva
    }
    setSaving(true);
    setError('');

    // Converte o array de gatilhos em string separada por vírgula (formato que o backend espera)
    const gatilhoString = triggers.join(', ');
    const payload = { isAtivo: isActive, gatilho: gatilhoString };

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/gatilho/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao salvar gatilho');
    } catch (err) {
      console.error('Erro ao salvar gatilho:', err);
      setError('Erro ao salvar gatilho');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-neutral-700/60 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden">
        {/* Header com gradiente sutil */}
        <div className="relative bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-950/20 dark:to-neutral-900 border-b border-gray-200/60 dark:border-neutral-700/60 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Ícone estilizado */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-md"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gatilho de Acionamento</h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                  Configure palavras-chave que ativarão a IA automaticamente
                </p>
              </div>
            </div>

            {/* Toggle Premium */}
            {canEdit && (
              <div className="flex items-center gap-3 bg-white/80 dark:bg-neutral-800/80 px-4 py-2 rounded-xl border border-gray-200/60 dark:border-neutral-700/60 shadow-sm">
                <span className="text-xs font-medium text-gray-600 dark:text-neutral-400">
                  {togglingStatus ? 'Alternando...' : isActive ? 'Ativo' : 'Inativo'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isActive}
                    onChange={handleToggleStatus}
                    disabled={togglingStatus}
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-blue-500"></div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 space-y-6">
          {/* Section Header com indicador de salvamento */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-purple-600 to-blue-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wide">
                Gatilhos
              </h3>
            </div>
            {saving && (
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Salvando...</span>
              </div>
            )}
          </div>

          {/* Input Customizado */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!canEdit}
                  className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-neutral-900 placeholder:text-gray-400 dark:placeholder:text-neutral-500 transition-all"
                  placeholder="Digite um gatilho e pressione Enter..."
                />
              </div>
              {canEdit && (
                <button
                  onClick={handleAddTrigger}
                  disabled={inputValue.trim() === ''}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Adicionar
                </button>
              )}
            </div>
          </div>

          {/* Chips Container */}
          {triggers.length > 0 && (
            <div className="relative">
              <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-br from-gray-50 to-purple-50/50 dark:from-neutral-800 dark:to-purple-950/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-neutral-700">
                {triggers.map((trigger, index) => (
                  <div
                    key={index}
                    className="group relative inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-800 rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-neutral-200">{trigger}</span>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveTrigger(index)}
                        className="w-5 h-5 flex items-center justify-center bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips Section Redesenhada */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-5 border border-purple-100 dark:border-purple-900/40">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
            <div className="relative flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg shadow-lg flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Como funciona?</p>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                      <span className="font-semibold text-gray-900 dark:text-white">Gatilho Inativo:</span> A IA atenderá automaticamente <span className="font-semibold text-purple-600 dark:text-purple-400">todos os leads</span> que entrarem em contato (recomendado).
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                      <span className="font-semibold text-gray-900 dark:text-white">Gatilho Ativo:</span> A IA só responderá quando o lead mencionar uma das palavras-chave configuradas.
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-800/50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Exemplos de gatilhos:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["tenho interesse", "quero saber mais", "quanto custa"].map((ex, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-white/60 dark:bg-neutral-800/60 text-gray-700 dark:text-neutral-300 rounded-md border border-purple-200/50 dark:border-purple-800/50">
                          "{ex}"
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-4 py-3 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
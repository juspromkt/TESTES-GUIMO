import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Loader2, Pencil, Trash2, AlertCircle, Sparkles, Save, RefreshCw, Upload, Book } from 'lucide-react';
import type { Fonte } from '../../types/fonte';
import type { Funil } from '../../types/funil';
import Pagination from '../Pagination';
import Modal from '../Modal';
import { registerMediaBlot } from './mediaBlot';
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';


interface MediaItem {
  url: string;
  type: string;
  name?: string;
}

interface FollowUpConfig {
  quantidade: number;
  tempo_entre_mensagens: string;
  prompt: string;
  isAtivo: boolean;
}

interface FollowUpHistory {
  Id: number;
  data: string;
  numero: string;
  id_funil: number;
  id_estagio: number;
  funil?: string;
  estagio?: string;
}

interface FollowUpTabProps {
  token: string;
  canViewAgent: boolean;
}

const CACHE_KEY = 'followup_history';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export default function FollowUpTab({ token, canViewAgent }: FollowUpTabProps) {
  const [config, setConfig] = useState<FollowUpConfig>({
    quantidade: 0,
    tempo_entre_mensagens: '30 minutos',
    prompt: '',
    isAtivo: false
  });
  const [history, setHistory] = useState<FollowUpHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [funnels, setFunnels] = useState<Funil[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptInstructions, setPromptInstructions] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const timeOptions = [
    { value: '10 minutos', label: '10 minutos' },
    { value: '20 minutos', label: '20 minutos' },
    { value: '30 minutos', label: '30 minutos' },
    { value: '1 hora', label: '1 hora' },
    { value: '2 horas', label: '2 horas' },
    { value: '6 horas', label: '6 horas' },
    { value: '24 horas', label: '24 horas' },
    { value: '48 horas', label: '48 horas' },
    { value: '72 horas', label: '72 horas' }
  ];

  useEffect(() => {
    fetchConfig();
    fetchHistory();
    registerMediaBlot();
  }, []);

async function registerMediaBlot() {
  if (typeof window !== 'undefined') {
    const { Quill } = await import('react-quill');
    const BlockEmbed = Quill.import('blots/block/embed');

    class MediaBlot extends BlockEmbed {
      static create(value: MediaItem | string) {
        const node = super.create();
        node.setAttribute('contenteditable', 'false');

        if (typeof value === 'string') {
          node.innerHTML = value;
          return node;
        }

        // Adiciona os atributos data-*
        node.setAttribute('data-url', value.url);
        node.setAttribute('data-type', value.type);
        if (value.name) {
          node.setAttribute('data-name', value.name);
        }

        if (value.type.startsWith('image')) {
          node.innerHTML = `<img src="${value.url}" alt="${value.name || ''}" style="max-width: 300px; border-radius: 8px;" />`;
        } else if (value.type.startsWith('video')) {
          node.innerHTML = `<video src="${value.url}" controls style="max-width: 200px; border-radius: 8px;"></video>`;
        } else if (value.type.startsWith('audio')) {
          node.innerHTML = `<audio src="${value.url}" controls style="width: 300px;"></audio>`;
        } else if (value.type === 'application/pdf') {
          node.innerHTML = `
            <div style="display: flex; align-items: center; background: #eff6ff; padding: 12px; border-radius: 8px; max-width: 80%; margin: 0 auto;">
              <div style="width: 40px; height: 40px; background: #dc2626; display: flex; justify-content: center; align-items: center; border-radius: 8px; color: white; font-size: 20px;">📄</div>
              <a href="${value.url}" target="_blank" style="margin-left: 12px; color: #2563eb; font-weight: 500; text-decoration: none;">${value.name || 'Abrir PDF'}</a>
            </div>`;
        }

        return node;
      }

      static value(node: HTMLElement) {
        return {
          url: node.getAttribute('data-url'),
          type: node.getAttribute('data-type'),
          name: node.getAttribute('data-name'),
          html: node.innerHTML
        };
      }
    }

    MediaBlot.blotName = 'media';
    MediaBlot.tagName = 'div';
    MediaBlot.className = 'ql-media';
    Quill.register(MediaBlot);
  }
}

  // Load cached history
  const loadCachedHistory = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        setHistory(data);
        return true;
      }
    }
    return false;
  };

  // Cache history data
  const cacheHistory = (data: FollowUpHistory[]) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  };

  // Fetch follow-up configuration
  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/follow/get', {
        headers: { token }
      });

      const configText = await response.text();
      
      if (configText && configText.trim()) {
        const configData = JSON.parse(configText);
        if (Array.isArray(configData) && configData.length > 0) {
          setConfig(configData[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Erro ao carregar configurações do follow-up');
    } finally {
      setLoadingConfig(false);
    }
  };

  // Fetch funnel data once
  const fetchFunnels = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', {
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar funis');
      }

      const data = await response.json();
      setFunnels(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error('Erro ao carregar funis:', err);
      return [];
    }
  };

// Fetch history data
const fetchHistory = async (isRefreshing = false) => {
  if (!isRefreshing && loadCachedHistory()) {
    setLoading(false);
    return;
  }

  try {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    // Fetch history and funnels in parallel
    const [historyResponse, funnelsData] = await Promise.all([
      fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/follow/historico/get', {
        headers: { token }
      }).then(res => res.json()),
      fetchFunnels()
    ]);

    // Verifica se o histórico está vazio ou contém apenas um objeto vazio
    const isEmpty = 
      !Array.isArray(historyResponse) || 
      historyResponse.length === 0 || 
      (historyResponse.length === 1 && Object.keys(historyResponse[0]).length === 0);

    if (isEmpty) {
      setHistory([]);
      cacheHistory([]);
      return;
    }

    // Map funnel and stage names to history items
    const historyWithNames = historyResponse.map((item: FollowUpHistory) => {
      const funnel = funnelsData.find((f: Funil) => f.id === item.id_funil);
      let stageName = '';

      if (funnel?.estagios) {
        const stage = funnel.estagios.find(s => s.Id === item.id_estagio.toString());
        if (stage) {
          stageName = stage.nome;
        }
      }

      return {
        ...item,
        funil: funnel ? funnel.nome : 'N/A',
        estagio: stageName || 'N/A'
      };
    });

    setHistory(historyWithNames);
    cacheHistory(historyWithNames);

  } catch (err) {
    console.error('Erro ao carregar histórico:', err);
    setError('Erro ao carregar histórico');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/follow/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao alternar status do follow-up');
      }

      await fetchConfig();
      setSuccess('Status do follow-up alterado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao alternar status do follow-up');
      setTimeout(() => setError(''), 3000);
    } finally {
      setTogglingStatus(false);
    }
  };

  // Função para lidar com o upload de arquivos
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/upload', {
        method: 'POST',
        headers: { token },
        body: formData,
      });

      if (!res.ok) throw new Error('Erro no upload');

      const { url } = await res.json();
      const editor = quillRef.current?.getEditor();

      if (editor) {
        const range = editor.getSelection(true);

        editor.insertEmbed(range.index, 'media', { 
          url, 
          type: file.type, 
          name: file.name 
        });

        editor.setSelection(range.index + 1, 0);
      }
    } catch (error) {
      console.error(error);
      setError('Erro ao fazer upload');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/follow/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar configurações do follow-up');
      }

      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
      setError('Erro ao salvar configurações do follow-up');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    setError('');
    
    try {
      // Fetch current agent configuration
      const personalityResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/get', {
        headers: { token }
      });
      
      const rulesResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/get', {
        headers: { token }
      });
      
      const stepsResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/get', {
        headers: { token }
      });
      
      const faqResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/get', {
        headers: { token }
      });
      
      const personalityData = await personalityResponse.json();
      const rulesData = await rulesResponse.json();
      const stepsData = await stepsResponse.json();
      const faqData = await faqResponse.json();
      
      // Prepare the agent configuration
      const agentConfig = {
        personalidade: Array.isArray(personalityData) && personalityData.length > 0 ? {
          descricao: personalityData[0].descricao,
          area: personalityData[0].area
        } : { descricao: '', area: '' },
        regras: Array.isArray(rulesData) && rulesData.length > 0 ? {
          regras: rulesData[0].regras
        } : { regras: '' },
        etapas: Array.isArray(stepsData) ? stepsData.map(step => ({
          ordem: step.ordem,
          nome: step.nome,
          descricao: step.descricao
        })) : [],
        faq: Array.isArray(faqData) ? faqData.map(item => ({
          ordem: item.ordem,
          nome: item.pergunta,
          descricao: item.resposta
        })) : []
      };
      
      // Generate follow-up prompt
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/prompt/follow/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          parametro: agentConfig,
          descricao: promptInstructions
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar prompt de follow-up');
      }
      
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].output) {
        setGeneratedPrompt(data[0].output);
        setIsPromptModalOpen(true);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (err) {
      console.error('Erro ao gerar prompt:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar prompt de follow-up');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleApplyGeneratedPrompt = () => {
    setConfig(prev => ({
      ...prev,
      prompt: generatedPrompt
    }));
    setIsPromptModalOpen(false);
    setIsConfirmModalOpen(false);
    setPromptInstructions('');
  };

 const formatPhoneNumber = (phone: string | undefined) => {
  if (!phone) return 'Não há registros'; // Retorna 'N/A' se o número for undefined, null ou string vazia
  
  try {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
    }
    return phone;
  } catch (error) {
    console.warn('Erro ao formatar número de telefone:', phone);
    return phone || 'N/A';
  }
};

  const formatDateTime = (dateString: string) => {

    if (!dateString) return 'Não há registros'; // Retorna 'N/A' se o número for undefined, null ou string vazia

    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Configurações do ReactQuill
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean'],
      ],
    },
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'media',
  ];

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = history.slice(startIndex, endIndex);

  if (loading && loadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* AI Prompt Generator */}

      {/* Configurações de Follow-up */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {loadingConfig ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Configurações de Follow-up</h2>
                        {canViewAgent && (

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={config.isAtivo}
                  onChange={handleToggleStatus}
                  disabled={togglingStatus}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {togglingStatus ? 'Alternando...' : config.isAtivo ? 'Ativado' : 'Desativado'}
                </span>
              </label>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de Follow-ups
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  disable={!canViewAgent}
                  value={config.quantidade}
                  onChange={(e) => setConfig({ ...config, quantidade: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo entre Mensagens
                </label>
                <select
                  value={config.tempo_entre_mensagens}
                  onChange={(e) => setConfig({ ...config, tempo_entre_mensagens: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {timeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt de Follow-up (explique quando e como o follow-up deve ser enviado)
              </label>
{canViewAgent && (

              <input
                id="followup-file-upload"
                type="file"
                accept="image/*,video/*,audio/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              )}
              {canViewAgent && (
              <button
                type="button"
                onClick={() => document.getElementById('followup-file-upload')?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg mb-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Carregando...' : 'Adicionar Mídia'}
              </button>
              )}


              <div className="relative">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={config.prompt}
onChange={canViewAgent ? (content) => setConfig({ ...config, prompt: content }) : undefined}
                  modules={modules}
                  formats={formats}
                  readOnly={!canViewAgent }
                  placeholder="Digite o prompt para follow-up..."
                  className="bg-white rounded-lg"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <div className="flex justify-end">
                          {canViewAgent && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Salvar Configurações</span>
                  </>
                )}
              </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-md p-8 mb-8 border border-indigo-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gerar Prompt de Follow-up com IA</h2>
            <p className="text-sm text-gray-500 mt-1">Crie um prompt de follow-up personalizado com ajuda da IA</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6 border border-indigo-100">
          <h3 className="text-lg font-medium text-indigo-800 mb-3">Como funciona?</h3>
          <p className="text-gray-700 mb-4">
            A IA analisará seu agente atual e gerará um prompt de follow-up personalizado com base nas suas instruções.
            Descreva como você quer que o follow-up funcione, incluindo tom, frequência e objetivos.
          </p>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-700">
            <p className="font-medium">Dicas para obter melhores resultados:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Especifique o tom desejado (formal, amigável, direto)</li>
              <li>Mencione se deseja incluir gatilhos de urgência ou escassez</li>
              <li>Indique se há ofertas especiais a serem mencionadas</li>
              <li>Descreva o objetivo principal do follow-up (agendar, vender, informar)</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instruções para o prompt de follow-up
            </label>
            <textarea
              value={promptInstructions}
              onChange={(e) => setPromptInstructions(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Quero um follow-up amigável mas persistente, com foco em agendar uma reunião. Deve incluir perguntas sobre o interesse do cliente e oferecer um desconto especial no terceiro contato..."
              disabled={!canViewAgent}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {canViewAgent && (
            <div className="flex justify-end pt-4">
              <button
                onClick={handleGeneratePrompt}
                disabled={isGeneratingPrompt || !promptInstructions.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isGeneratingPrompt ? (
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
      </div>

      {/* Histórico de Follow-up */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Histórico de Follow-up</h2>
                        {canViewAgent && (
            <button
              onClick={() => fetchHistory(true)}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              title="Atualizar histórico"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estágio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedHistory.map((item) => (
                <tr key={item.Id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(item.data)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPhoneNumber(item.numero)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.funil}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.estagio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            totalItems={history.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>

      {/* Generated Prompt Modal */}
      <Modal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        title="Prompt de Follow-up Gerado"
        maxWidth="4xl"
      >
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-300 max-h-[400px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-gray-800 text-sm font-mono">{generatedPrompt}</pre>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsPromptModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Aplicar este Prompt
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Aplicação do Prompt"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tem certeza que deseja aplicar este prompt?
              </h3>
              <p className="text-gray-500 mt-1">
                Esta ação substituirá o prompt de follow-up atual. A alteração é irreversível.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyGeneratedPrompt}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sim, Aplicar Prompt
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
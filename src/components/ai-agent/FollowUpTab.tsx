import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, RefreshCw, Upload } from 'lucide-react';
import type { Fonte } from '../../types/fonte';
import type { Funil } from '../../types/funil';
import Pagination from '../Pagination';
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
  activeSubTab: 'config' | 'history';
}

const CACHE_KEY = 'followup_history';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export default function FollowUpTab({ token, canViewAgent, activeSubTab }: FollowUpTabProps) {
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
    <div className="space-y-4">
      {/* Configurações de Follow-up */}
      {activeSubTab === 'config' && (
      <div className="space-y-4">
        {loadingConfig ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            {/* Header com Toggle */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 transition-theme">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Status do Follow-up</h2>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                    {config.isAtivo ? 'Follow-up automático está ativo' : 'Follow-up automático está desativado'}
                  </p>
                </div>
                {canViewAgent && (
                  <button
                    onClick={handleToggleStatus}
                    disabled={togglingStatus}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                      config.isAtivo ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-gray-300 dark:bg-neutral-600'
                    } ${togglingStatus ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform bg-white rounded-full shadow-sm transition-transform duration-300 ${
                        config.isAtivo ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Configurações Básicas */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 transition-theme">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100 mb-3">Configurações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">
                    Quantidade de Follow-ups
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    disabled={!canViewAgent}
                    value={config.quantidade}
                    onChange={(e) => setConfig({ ...config, quantidade: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">
                    Intervalo entre Mensagens
                  </label>
                  <select
                    value={config.tempo_entre_mensagens}
                    onChange={(e) => setConfig({ ...config, tempo_entre_mensagens: e.target.value })}
                    disabled={!canViewAgent}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all"
                  >
                    {timeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Prompt de Follow-up */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 transition-theme">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">Prompt de Follow-up</h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Defina quando e como o follow-up deve ser enviado</p>
                </div>
                {canViewAgent && (
                  <>
                    <input
                      id="followup-file-upload"
                      type="file"
                      accept="image/*,video/*,audio/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('followup-file-upload')?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg text-gray-700 dark:text-neutral-200 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'Carregando...' : 'Adicionar Mídia'}
                    </button>
                  </>
                )}
              </div>

              <div className="relative">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={config.prompt}
                  onChange={canViewAgent ? (content) => setConfig({ ...config, prompt: content }) : undefined}
                  modules={modules}
                  formats={formats}
                  readOnly={!canViewAgent}
                  placeholder="Digite o prompt para follow-up..."
                  className="bg-white dark:bg-neutral-700 rounded-lg"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center rounded-lg">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Mensagens de Feedback */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            {/* Botão Salvar */}
            {canViewAgent && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Configurações</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      )}

      {/* Histórico de Follow-up */}
      {activeSubTab === 'history' && (
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden transition-theme">
        {/* Header Minimalista */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-neutral-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-neutral-100">Histórico</h2>
              <span className="text-xs font-medium text-gray-500 dark:text-neutral-500">
                {history.length} {history.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            {canViewAgent && (
              <button
                onClick={() => fetchHistory(true)}
                disabled={refreshing}
                className="p-1.5 text-gray-500 dark:text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all disabled:opacity-50"
                title="Atualizar histórico"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Tabela Refinada */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-neutral-700/50">
                <th className="px-5 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wider">
                  Data e Hora
                </th>
                <th className="px-5 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-5 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wider">
                  Funil
                </th>
                <th className="px-5 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wider">
                  Etapa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-neutral-700/30">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-700 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-neutral-600">
                        <RefreshCw className="w-6 h-6 text-gray-300 dark:text-neutral-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-neutral-100">Nenhum registro</p>
                        <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">Os follow-ups enviados aparecerão aqui</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((item) => (
                  <tr
                    key={item.Id}
                    className="group hover:bg-gray-50/50 dark:hover:bg-neutral-700/20 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-neutral-400">
                      {formatDateTime(item.data)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-gray-900 dark:text-neutral-100">
                        {formatPhoneNumber(item.numero)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-600 dark:text-neutral-400">
                        {item.funil}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                        {item.estagio}
                      </span>
                    </td>
                  </tr>
                ))
              )}
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
      )}
    </div>
  );
}
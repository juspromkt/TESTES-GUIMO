import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Repeat2,
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  Upload,
  Clock,
  MessageSquare,
  Sparkles,
  X,
  Info,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface MediaItem {
  url: string;
  type: string;
  name: string;
}

interface FollowUp {
  Id?: number;
  ordem: number;
  prompt: string;
  horario: string;
}

interface FollowUpTabProps {
  token: string;
  canViewAgent: boolean;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const DEFAULT_PROMPT = `Analise as últimas mensagens trocadas e continue o atendimento a partir do ponto exato em que parou, sem repetir perguntas já feitas.

Regras:
- Sempre leia o histórico recente da conversa antes de responder.
- Identifique o último ponto da interação e continue de forma contextual.
- Evite mensagens genéricas e nunca diga o nome do cliente.
- Mantenha linguagem acolhedora, profissional e consultiva.

Estrutura:
1. Retome o contexto da conversa.
2. Avance no ponto parado.
3. Finalize com uma chamada leve para ação.

Exemplos:
• Se o cliente parou em análise: "Você tinha me contado sobre [resumo]. Para avançarmos, preciso só confirmar [pergunta]."
• Se parou em contrato: "Na última mensagem falamos sobre o contrato. Deseja que eu reenvie o link para assinatura?"
• Se ficou em dúvida: "Notei que você ficou em dúvida sobre [tema]. Posso explicar melhor ou mostrar um exemplo prático?"

⚠️ Regra Interna: Nunca dê instruções jurídicas ou respostas sobre casos. Seu papel é apenas analisar se o cliente tem direito de abrir um processo, mantendo tom acolhedor e direto.`;

export default function FollowUpTab({ token, canViewAgent }: FollowUpTabProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFollowUp, setActiveFollowUp] = useState<number | null>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);
  const [showDefaultPromptModal, setShowDefaultPromptModal] = useState(false);
  const [selectedFollowUpForPrompt, setSelectedFollowUpForPrompt] = useState<number | null>(null);
  const [collapsedFollowUps, setCollapsedFollowUps] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFollowUps, setInitialFollowUps] = useState<FollowUp[]>([]);
  const quillRefs = useRef<{ [key: number]: ReactQuill | null }>({});

  const timeOptions = [
    { value: '10 minutos', label: '10 minutos', minutes: 10 },
    { value: '20 minutos', label: '20 minutos', minutes: 20 },
    { value: '30 minutos', label: '30 minutos', minutes: 30 },
    { value: '1 hora', label: '1 hora', minutes: 60 },
    { value: '2 horas', label: '2 horas', minutes: 120 },
    { value: '6 horas', label: '6 horas', minutes: 360 },
    { value: '12 horas', label: '12 horas', minutes: 720 },
    { value: '24 horas', label: '24 horas', minutes: 1440 },
    { value: '2 dias', label: '2 dias', minutes: 2880 },
    { value: '3 dias', label: '3 dias', minutes: 4320 },
    { value: '7 dias', label: '7 dias', minutes: 10080 },
    { value: '15 dias', label: '15 dias', minutes: 21600 },
    { value: '30 dias', label: '30 dias', minutes: 43200 },
  ];

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const getTimeInMinutes = (horario: string): number => {
    const option = timeOptions.find(opt => opt.value === horario);
    return option?.minutes || 0;
  };

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/follow/get',
        {
          headers: { token },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar follow-ups');
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setFollowUps(data);
        setInitialFollowUps(JSON.parse(JSON.stringify(data))); // Deep copy
        // Inicializa todos os follow-ups como recolhidos
        setCollapsedFollowUps(new Set(data.map((f: FollowUp) => f.ordem)));
      } else {
        setFollowUps([]);
        setInitialFollowUps([]);
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Erro ao carregar follow-ups:', err);
      addToast('error', 'Erro ao carregar configurações de follow-up');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  useEffect(() => {
    const initializeQuill = async () => {
      await registerMediaBlot();
      setIsQuillReady(true);
    };
    initializeQuill();
  }, []);

  // Aviso de navegação com alterações não salvas
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Registrar MediaBlot para suporte a mídias
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

          node.setAttribute('data-url', value.url);
          node.setAttribute('data-type', value.type);
          if (value.name) {
            node.setAttribute('data-name', value.name);
          }

          if (value.type.startsWith('image')) {
            node.innerHTML = `<img src="${value.url}" alt="${
              value.name || ''
            }" style="max-width: 300px; border-radius: 8px;" />`;
          } else if (value.type.startsWith('video')) {
            node.innerHTML = `<video src="${value.url}" controls style="max-width: 200px; border-radius: 8px;"></video>`;
          } else if (value.type.startsWith('audio')) {
            node.innerHTML = `<audio src="${value.url}" controls style="width: 300px;"></audio>`;
          } else if (value.type === 'application/pdf') {
            node.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: flex-start; background: #eff6ff; padding: 4px; border-radius: 8px; max-width: 80%; margin: 2px; line-height: 1;">
                <div style="width: 40px; height: 40px; background: #dc2626; display: flex; justify-content: center; align-items: center; border-radius: 8px; color: white; font-size: 24px; line-height: 1; transform: translateY(1px);">📄</div>
                <a href="${value.url}" target="_blank" style="color: #2563eb; font-weight: 500; text-decoration: none; margin-left: 8px;">${
              value.name || 'Abrir PDF'
            }</a>
              </div>`;
          }

          return node;
        }

        static value(node: HTMLElement) {
          return {
            url: node.getAttribute('data-url'),
            type: node.getAttribute('data-type'),
            name: node.getAttribute('data-name'),
            html: node.innerHTML,
          };
        }
      }

      MediaBlot.blotName = 'media';
      MediaBlot.tagName = 'div';
      MediaBlot.className = 'ql-media';
      Quill.register(MediaBlot);
    }
  }

  // Upload de arquivo
  const handleFileUpload = async (
    ordem: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setActiveFollowUp(ordem);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/upload',
        {
          method: 'POST',
          headers: { token },
          body: formData,
        }
      );

      if (!res.ok) throw new Error('Erro no upload');

      const { url } = await res.json();
      const editor = quillRefs.current[ordem]?.getEditor();

      if (editor) {
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'media', {
          url,
          type: file.type,
          name: file.name,
        });
        editor.setSelection(range.index + 1, 0);
      }
      addToast('success', 'Mídia adicionada com sucesso');
    } catch (error) {
      console.error('Error uploading media:', error);
      addToast('error', 'Erro ao fazer upload da mídia');
    } finally {
      setIsUploading(false);
      setActiveFollowUp(null);
      event.target.value = '';
    }
  };

  const handleAddFollowUp = () => {
    const newOrder = followUps.length + 1;
    setFollowUps([
      ...followUps,
      {
        ordem: newOrder,
        prompt: '',
        horario: '30 minutos',
      },
    ]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveFollowUp = (ordem: number) => {
    setFollowUpToDelete(ordem);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (followUpToDelete !== null) {
      const updatedFollowUps = followUps
        .filter((followUp) => followUp.ordem !== followUpToDelete)
        .map((followUp, index) => ({
          ...followUp,
          ordem: index + 1,
        }));
      setFollowUps(updatedFollowUps);
      setHasUnsavedChanges(true);
      addToast('success', 'Follow-up removido com sucesso');
    }
    setShowDeleteModal(false);
    setFollowUpToDelete(null);
  };

  const handleUpdateFollowUp = (
    ordem: number,
    field: 'prompt' | 'horario',
    value: string
  ) => {
    setFollowUps((prevFollowUps) =>
      prevFollowUps.map((followUp) =>
        followUp.ordem === ordem ? { ...followUp, [field]: value } : followUp
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newFollowUps = Array.from(followUps);
    const [moved] = newFollowUps.splice(result.source.index, 1);
    newFollowUps.splice(result.destination.index, 0, moved);

    const reordered = newFollowUps.map((followUp, index) => ({
      ...followUp,
      ordem: index + 1,
    }));

    setFollowUps(reordered);
    setHasUnsavedChanges(true);
  };

  const handleApplyDefaultPrompt = () => {
    if (selectedFollowUpForPrompt !== null) {
      // Converte o texto em HTML formatado preservando quebras de linha
      const formattedPrompt = DEFAULT_PROMPT
        .split('\n')
        .map(line => {
          if (line.trim() === '') {
            return '<p><br></p>';
          }
          return `<p>${line}</p>`;
        })
        .join('');

      handleUpdateFollowUp(selectedFollowUpForPrompt, 'prompt', formattedPrompt);
      addToast('success', 'Texto padrão aplicado com sucesso');
    }
    setShowDefaultPromptModal(false);
    setSelectedFollowUpForPrompt(null);
  };

  const toggleCollapse = (ordem: number) => {
    setCollapsedFollowUps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ordem)) {
        newSet.delete(ordem);
      } else {
        newSet.add(ordem);
      }
      return newSet;
    });
  };

  // Configurações do ReactQuill - sem toolbar
  const modules = {
    toolbar: false,
  };

  const formats = ['media'];

  const handleSave = async () => {
    setSaving(true);

    try {
      // Ordenar follow-ups por tempo de espera (menor para maior)
      const sortedFollowUps = [...followUps].sort((a, b) => {
        return getTimeInMinutes(a.horario) - getTimeInMinutes(b.horario);
      });

      // Reatribuir ordem após ordenação
      const reorderedFollowUps = sortedFollowUps.map((followUp, index) => ({
        ...followUp,
        ordem: index + 1,
      }));

      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/follow/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token,
          },
          body: JSON.stringify(reorderedFollowUps),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao salvar follow-ups');
      }

      await fetchFollowUps();
      addToast('success', 'Follow-ups salvos e ordenados com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar follow-ups:', err);
      addToast('error', 'Erro ao salvar configurações de follow-up');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-neutral-400" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .toast-enter {
          animation: slideInRight 0.3s ease-out forwards;
        }
        .ql-editor {
          font-size: 18px !important;
          padding: 0 !important;
          min-height: 60px !important;
        }
        .ql-container {
          border: none !important;
          font-size: 18px !important;
        }
      `}</style>

      {/* Toast Container */}
      {toasts.length > 0 && createPortal(
        <div className="fixed top-4 right-4 z-[10001] flex flex-col gap-3 max-w-md">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast-enter flex items-start gap-3 p-4 rounded-lg shadow-2xl border ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-sm font-medium">
                {toast.message}
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-current opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}

      <div className="h-full flex flex-col bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
        {/* Header Fixo */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Cabeçalho com ícone, título e contador */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-20"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Repeat2 className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-neutral-100 dark:to-white bg-clip-text text-transparent">
                    Follow-up Automático
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1.5 font-light">
                    Configure mensagens automáticas inteligentes para reativar leads
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {followUps.length > 0 && (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-light tracking-tight text-gray-900 dark:text-white">
                        {followUps.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Follow-up{followUps.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            {canViewAgent && followUps.length > 0 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleAddFollowUp}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
                  <span>Criar Novo Follow-up</span>
                </button>
                <div className="relative">
                  {hasUnsavedChanges && !saving && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg" />
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      hasUnsavedChanges && !saving
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 hover:shadow-lg hover:-translate-y-0.5'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                    }`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                        Salvando...
                      </>
                    ) : hasUnsavedChanges ? (
                      <>
                        <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
                        Salvar alterações
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Área Scrollável dos Follow-ups */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {followUps.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="followups">
                {(provided) => (
                  <div
                    className="relative space-y-6 before:content-[''] before:absolute before:left-5 before:top-0 before:bottom-0 before:w-0.5 before:bg-neutral-300 dark:before:bg-neutral-700"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {followUps.map((followUp, index) => (
                      <Draggable
                        draggableId={followUp.ordem.toString()}
                        index={index}
                        key={followUp.ordem}
                        isDragDisabled={!canViewAgent}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="relative pl-12 group"
                          >
                            {/* Node */}
                            <div className="absolute left-2.5 top-3 w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-[10px] shadow-lg">
                              {followUp.ordem}
                            </div>

                            {/* Card */}
                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm hover:shadow-md transition-all">
                              <div className="p-4">
                                {/* Header - Clicável */}
                                <div
                                  className="flex items-center justify-between gap-2 cursor-pointer"
                                  onClick={() => toggleCollapse(followUp.ordem)}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="p-1 flex-shrink-0">
                                      {collapsedFollowUps.has(followUp.ordem) ? (
                                        <ChevronDown className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                                      ) : (
                                        <ChevronUp className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                                      )}
                                    </div>
                                    <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                                    <select
                                      value={followUp.horario}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleUpdateFollowUp(
                                          followUp.ordem,
                                          'horario',
                                          e.target.value
                                        );
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={!canViewAgent}
                                      className="text-xs font-medium text-neutral-700 dark:text-white bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white disabled:opacity-50"
                                    >
                                      {timeOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-neutral-700 text-neutral-700 dark:text-white">{opt.label}</option>
                                      ))}
                                    </select>
                                    <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-md">
                                      <Info className="w-3 h-3 mr-1 text-neutral-400 dark:text-neutral-300" />
                                      Enviado <span className="mx-1 font-medium text-neutral-700 dark:text-neutral-200">{followUp.horario}</span> após a última mensagem do lead
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {canViewAgent && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFollowUpForPrompt(followUp.ordem);
                                            setShowDefaultPromptModal(true);
                                          }}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md text-xs font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition"
                                        >
                                          <Sparkles className="w-3.5 h-3.5" /> Aplicar texto padrão
                                        </button>
                                        <div
                                          {...provided.dragHandleProps}
                                          className="cursor-grab active:cursor-grabbing p-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <GripVertical className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFollowUp(followUp.ordem);
                                          }}
                                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                                          title="Remover"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Message - Expandable */}
                                {!collapsedFollowUps.has(followUp.ordem) && (
                                  <div className="mt-3 space-y-2">
                                    <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
                                      <div className="relative">
                                        {isQuillReady && (
                                          <ReactQuill
                                            ref={(el) =>
                                              (quillRefs.current[followUp.ordem] = el)
                                            }
                                            theme="snow"
                                            value={followUp.prompt}
                                            onChange={
                                              canViewAgent
                                                ? (content) =>
                                                    handleUpdateFollowUp(
                                                      followUp.ordem,
                                                      'prompt',
                                                      content
                                                    )
                                                : undefined
                                            }
                                            modules={modules}
                                            formats={formats}
                                            readOnly={!canViewAgent}
                                            placeholder="Digite a mensagem que o agente deve enviar..."
                                            className="bg-transparent text-neutral-700 dark:text-neutral-300"
                                          />
                                        )}
                                        {isUploading &&
                                          activeFollowUp === followUp.ordem && (
                                            <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 flex items-center justify-center rounded-lg">
                                              <Loader2 className="w-5 h-5 animate-spin text-gray-500 dark:text-neutral-400" />
                                            </div>
                                          )}
                                      </div>
                                      {canViewAgent && (
                                        <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                          <input
                                            type="file"
                                            id={`file-upload-followup-${followUp.ordem}`}
                                            accept="image/*,video/*,audio/*,application/pdf"
                                            onChange={(e) =>
                                              handleFileUpload(followUp.ordem, e)
                                            }
                                            className="hidden"
                                          />
                                          <button
                                            onClick={() =>
                                              document
                                                .getElementById(
                                                  `file-upload-followup-${followUp.ordem}`
                                                )
                                                ?.click()
                                            }
                                            disabled={
                                              isUploading &&
                                              activeFollowUp === followUp.ordem
                                            }
                                            className="flex items-center gap-1.5 text-xs bg-neutral-100 dark:bg-neutral-700 px-2.5 py-1.5 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition disabled:opacity-50"
                                          >
                                            <Upload className="w-3.5 h-3.5" /> Adicionar Mídia
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <Repeat2 className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
                Nenhum follow-up configurado
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                Crie sua primeira sequência de mensagens automáticas
              </p>
              {canViewAgent && (
                <button
                  onClick={handleAddFollowUp}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
                  <span>Criar Novo Follow-up</span>
                </button>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Modal de Texto Padrão */}
      {showDefaultPromptModal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          onClick={() => setShowDefaultPromptModal(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 max-w-2xl w-full rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-6 relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDefaultPromptModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" /> Texto Padrão da IA
            </h2>
            <div className="h-80 overflow-y-auto bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
              {DEFAULT_PROMPT}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowDefaultPromptModal(false)}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyDefaultPrompt}
                className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                Inserir no campo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
          onClick={() => {
            setShowDeleteModal(false);
            setFollowUpToDelete(null);
          }}
        >
          <div
            className="bg-white dark:bg-neutral-900 max-w-md w-full rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-6 relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                Excluir Follow-up
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Tem certeza que deseja excluir este follow-up? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setFollowUpToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 transition"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

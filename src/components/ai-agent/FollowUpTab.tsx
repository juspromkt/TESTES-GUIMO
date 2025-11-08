import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Repeat2,
  Plus,
  Trash2,
  Loader2,
  Save,
  GripVertical,
  Maximize2,
  Minimize2,
  Upload,
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

export default function FollowUpTab({ token, canViewAgent }: FollowUpTabProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [collapsedFollowUps, setCollapsedFollowUps] = useState<boolean[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFollowUp, setActiveFollowUp] = useState<number | null>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);
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

  // Função para converter horário em minutos
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
        setCollapsedFollowUps(data.map(() => true));
      } else {
        setFollowUps([]);
        setCollapsedFollowUps([]);
      }
    } catch (err) {
      console.error('Erro ao carregar follow-ups:', err);
      setError('Erro ao carregar configurações de follow-up');
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

  useEffect(() => {
    setCollapsedFollowUps((prev) => {
      if (prev.length === 0) {
        return followUps.map(() => true);
      }

      if (followUps.length > prev.length) {
        return [...prev, ...Array(followUps.length - prev.length).fill(true)];
      }

      if (followUps.length < prev.length) {
        return prev.slice(0, followUps.length);
      }

      return prev;
    });
  }, [followUps.length]);

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
    } catch (error) {
      console.error('Error uploading media:', error);
      setError('Erro ao fazer upload da mídia');
      setTimeout(() => setError(''), 3000);
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
    setCollapsedFollowUps([...collapsedFollowUps, false]);
  };

  const handleRemoveFollowUp = (ordem: number) => {
    const updatedFollowUps = followUps
      .filter((followUp) => followUp.ordem !== ordem)
      .map((followUp, index) => ({
        ...followUp,
        ordem: index + 1,
      }));
    setFollowUps(updatedFollowUps);
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

    setCollapsedFollowUps((prev) => {
      const updated = [...prev];
      const [collapsed] = updated.splice(result.source.index, 1);
      updated.splice(
        result.destination!.index,
        0,
        collapsed !== undefined ? collapsed : true
      );
      return updated.slice(0, reordered.length);
    });
  };

  const toggleFollowUpCollapse = (index: number) => {
    setCollapsedFollowUps((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
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
    'bold',
    'italic',
    'underline',
    'list',
    'bullet',
    'media',
  ];

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

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
      setSuccess('Follow-ups salvos e ordenados com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar follow-ups:', err);
      setError('Erro ao salvar configurações de follow-up');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Verificar se há inconsistência na ordem dos tempos
  const hasTimeOrderIssue = followUps.some((followUp, index) => {
    if (index === 0) return false;
    const currentTime = getTimeInMinutes(followUp.horario);
    const previousTime = getTimeInMinutes(followUps[index - 1].horario);
    return currentTime < previousTime;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center">
            <Repeat2 className="w-4 h-4 text-neutral-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Follow-up Automático
            </h2>
            <p className="text-xs text-neutral-500">
              Configuração global - funciona para todos os agentes
            </p>
          </div>
        </div>
        {canViewAgent && (
          <button
            onClick={handleAddFollowUp}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        )}
      </div>

      {/* Validation Warning */}
      {hasTimeOrderIssue && (
        <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
          <p className="text-xs font-medium">Atenção: Ordem de tempo inconsistente</p>
          <p className="text-xs mt-0.5 text-amber-700">
            Os follow-ups serão reordenados automaticamente ao salvar.
          </p>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-lg text-xs">
          {success}
        </div>
      )}

      {error && (
        <div className="px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Follow-ups List */}
      <div className="space-y-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="followups">
            {(provided) => (
              <div
                className="space-y-4"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {followUps.map((followUp, index) => {
                  const isCollapsed = collapsedFollowUps[index] ?? true;
                  return (
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
                          className="bg-neutral-50 border border-neutral-200 rounded-lg p-4"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              {canViewAgent && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
                                  title="Arraste para reordenar"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                              )}
                              <div className="w-7 h-7 bg-neutral-200 rounded flex items-center justify-center text-neutral-900 font-semibold text-xs">
                                {followUp.ordem}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-neutral-900">
                                  Follow-up #{followUp.ordem}
                                </p>
                                {isCollapsed && (
                                  <p className="text-xs text-neutral-500">
                                    {followUp.horario}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleFollowUpCollapse(index)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-200 rounded hover:bg-neutral-300 transition-colors"
                              >
                                {isCollapsed ? (
                                  <>
                                    <Maximize2 className="w-3 h-3" />
                                    Expandir
                                  </>
                                ) : (
                                  <>
                                    <Minimize2 className="w-3 h-3" />
                                    Reduzir
                                  </>
                                )}
                              </button>
                              {canViewAgent && !isCollapsed && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveFollowUp(followUp.ordem)
                                  }
                                  className="text-red-600 hover:text-red-700 p-1"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          {!isCollapsed && (
                            <div className="space-y-3">
                              {/* Horário */}
                              <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                  Tempo de Espera
                                </label>
                                <select
                                  value={followUp.horario}
                                  onChange={(e) =>
                                    handleUpdateFollowUp(
                                      followUp.ordem,
                                      'horario',
                                      e.target.value
                                    )
                                  }
                                  disabled={!canViewAgent}
                                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
                                >
                                  {timeOptions.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-xs text-neutral-500 mt-1">
                                  Tempo após a última interação
                                </p>
                              </div>

                              {/* Prompt */}
                              <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                  Mensagem de Follow-up
                                </label>
                                {canViewAgent && (
                                  <>
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
                                      type="button"
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
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded transition-colors disabled:opacity-50 mb-2"
                                    >
                                      <Upload className="w-3.5 h-3.5" />
                                      Adicionar Mídia
                                    </button>
                                  </>
                                )}

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
                                      modules={
                                        canViewAgent ? modules : { toolbar: false }
                                      }
                                      formats={formats}
                                      readOnly={!canViewAgent}
                                      placeholder="Digite a mensagem que o agente deve enviar neste follow-up..."
                                      className="bg-white rounded-lg"
                                    />
                                  )}
                                  {isUploading &&
                                    activeFollowUp === followUp.ordem && (
                                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                                      </div>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">
                                  Instrução para reativar o lead
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Empty State */}
        {followUps.length === 0 && (
          <div className="text-center py-10 bg-neutral-50 rounded-lg border border-neutral-200">
            <Repeat2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-xs text-neutral-500 mb-3">
              Nenhum follow-up configurado
            </p>
            {canViewAgent && (
              <button
                onClick={handleAddFollowUp}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Follow-up
              </button>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      {canViewAgent && followUps.length > 0 && (
        <div className="flex justify-end pt-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

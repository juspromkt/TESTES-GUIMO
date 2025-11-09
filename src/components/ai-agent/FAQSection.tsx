import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  Upload,
  MessageSquare,
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

interface FAQ {
  Id?: number;
  ordem: number;
  pergunta: string;
  resposta: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  setFaqs: React.Dispatch<React.SetStateAction<FAQ[]>>;
  savingFAQs: boolean;
  token: string;
  idAgente: number;
  canEdit: boolean;
  isLoading: boolean;
}

export default function FAQSection({
  faqs,
  setFaqs,
  savingFAQs,
  token,
  idAgente,
  canEdit,
  isLoading,
}: FAQSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);
  const [collapsedFaqs, setCollapsedFaqs] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const quillRefs = useRef<{ [key: number]: ReactQuill | null }>({});

  // Inicializar FAQs como recolhidos e registrar MediaBlot
  useEffect(() => {
    const initializeQuill = async () => {
      await registerMediaBlot();
      setIsQuillReady(true);
    };
    initializeQuill();

    if (faqs.length > 0) {
      setCollapsedFaqs(new Set(faqs.map(f => f.ordem)));
    }
  }, []);

  // Atualizar collapsed state quando FAQs mudarem
  useEffect(() => {
    if (faqs.length > 0) {
      setCollapsedFaqs(new Set(faqs.map(f => f.ordem)));
    }
  }, [faqs.length]);

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

    setActiveFaq(ordem);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('id_agente', String(idAgente));

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
    } finally {
      setIsUploading(false);
      setActiveFaq(null);
      event.target.value = '';
    }
  };

  const handleAddFaq = () => {
    const newOrder = faqs.length + 1;
    setFaqs([
      ...faqs,
      {
        ordem: newOrder,
        pergunta: '',
        resposta: '',
      },
    ]);
  };

  const handleRemoveFaq = (ordem: number) => {
    setFaqToDelete(ordem);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (faqToDelete !== null) {
      const updatedFaqs = faqs
        .filter((faq) => faq.ordem !== faqToDelete)
        .map((faq, index) => ({
          ...faq,
          ordem: index + 1,
        }));
      setFaqs(updatedFaqs);
    }
    setShowDeleteModal(false);
    setFaqToDelete(null);
  };

  const handleUpdateFaq = (
    ordem: number,
    field: 'pergunta' | 'resposta',
    value: string
  ) => {
    setFaqs((prevFaqs) =>
      prevFaqs.map((faq) =>
        faq.ordem === ordem ? { ...faq, [field]: value } : faq
      )
    );
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newFaqs = Array.from(faqs);
    const [moved] = newFaqs.splice(result.source.index, 1);
    newFaqs.splice(result.destination.index, 0, moved);

    const reordered = newFaqs.map((faq, index) => ({
      ...faq,
      ordem: index + 1,
    }));

    setFaqs(reordered);
  };

  const toggleCollapse = (ordem: number) => {
    setCollapsedFaqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ordem)) {
        newSet.delete(ordem);
      } else {
        newSet.add(ordem);
      }
      return newSet;
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

    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token,
          },
          body: JSON.stringify(faqs.map(f => ({ ...f, id_agente: idAgente }))),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao salvar FAQs');
      }

      // Atualizar FAQs
      const updated = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/get?id_agente=${idAgente}`,
        { headers: { token } }
      );

      if (updated.ok) {
        const json = await updated.json();
        setFaqs(json);
      }
    } catch (err) {
      console.error('Erro ao salvar FAQs:', err);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-neutral-400" />
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {faqs.length > 0 ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="faqs">
                  {(provided) => (
                    <div
                      className="relative space-y-6 before:content-[''] before:absolute before:left-5 before:top-0 before:bottom-0 before:w-0.5 before:bg-neutral-300 dark:before:bg-neutral-700"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {faqs.map((faq, index) => {
                        const isCollapsed = collapsedFaqs.has(faq.ordem);
                        return (
                          <Draggable
                            draggableId={faq.ordem.toString()}
                            index={index}
                            key={faq.ordem}
                            isDragDisabled={!canEdit}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="relative pl-12 group"
                              >
                                {/* Node */}
                                <div className="absolute left-2.5 top-3 w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-[10px] shadow-lg">
                                  {faq.ordem}
                                </div>

                                {/* Card */}
                                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm hover:shadow-md transition-all">
                                  <div className="p-4">
                                    {/* Header - Clicável */}
                                    <div
                                      className="flex items-center justify-between gap-2 cursor-pointer"
                                      onClick={() => toggleCollapse(faq.ordem)}
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="p-1 flex-shrink-0">
                                          {isCollapsed ? (
                                            <ChevronDown className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                                          ) : (
                                            <ChevronUp className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                                          )}
                                        </div>
                                        <MessageSquare className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                                        <span className="text-xs font-medium text-neutral-700 dark:text-white truncate">
                                          {faq.pergunta || `Pergunta #${faq.ordem}`}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {canEdit && (
                                          <button
                                            type="button"
                                            {...provided.dragHandleProps}
                                            onClick={(e) => e.stopPropagation()}
                                            className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1"
                                            title="Arraste para reordenar"
                                          >
                                            <GripVertical className="w-4 h-4" />
                                          </button>
                                        )}
                                        {canEdit && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveFaq(faq.ordem);
                                            }}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Content - Expandable */}
                                    {!isCollapsed && (
                                      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
                                        {/* Pergunta */}
                                        <div>
                                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                                            Pergunta
                                          </label>
                                          <input
                                            type="text"
                                            value={faq.pergunta}
                                            onChange={(e) =>
                                              handleUpdateFaq(faq.ordem, 'pergunta', e.target.value)
                                            }
                                            placeholder="Ex: Qual o prazo de entrega?"
                                            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                                            disabled={!canEdit}
                                          />
                                        </div>

                                        {/* Resposta */}
                                        <div>
                                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                                            Resposta
                                          </label>
                                          <div className="relative">
                                            {canEdit && (
                                              <div className="flex items-center gap-2 mb-2">
                                                <input
                                                  type="file"
                                                  id={`file-upload-${faq.ordem}`}
                                                  accept="image/*,video/*,audio/*,application/pdf"
                                                  onChange={(e) =>
                                                    handleFileUpload(faq.ordem, e)
                                                  }
                                                  className="hidden"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    document
                                                      .getElementById(`file-upload-${faq.ordem}`)
                                                      ?.click()
                                                  }
                                                  disabled={isUploading && activeFaq === faq.ordem}
                                                  className="flex items-center gap-1.5 text-xs bg-neutral-100 dark:bg-neutral-700 px-2.5 py-1.5 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition disabled:opacity-50"
                                                >
                                                  <Upload className="w-3.5 h-3.5" /> Adicionar Mídia
                                                </button>
                                              </div>
                                            )}
                                            {isQuillReady && (
                                              <ReactQuill
                                                ref={(el) =>
                                                  (quillRefs.current[faq.ordem] = el)
                                                }
                                                theme="snow"
                                                value={faq.resposta}
                                                onChange={
                                                  canEdit
                                                    ? (content) =>
                                                        handleUpdateFaq(faq.ordem, 'resposta', content)
                                                    : () => {}
                                                }
                                                modules={canEdit ? modules : { toolbar: false }}
                                                formats={formats}
                                                readOnly={!canEdit}
                                                placeholder="Descreva a resposta para esta pergunta..."
                                                className="bg-white dark:bg-neutral-700 rounded-lg text-sm"
                                              />
                                            )}
                                            {isUploading && activeFaq === faq.ordem && (
                                              <div className="absolute inset-0 bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center rounded-lg">
                                                <Loader2 className="w-5 h-5 animate-spin text-neutral-600 dark:text-neutral-400" />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
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
            ) : (
              <div className="text-center py-20">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma pergunta frequente configurada
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Crie perguntas que o agente deve responder automaticamente
                </p>
                {canEdit && (
                  <button
                    onClick={handleAddFaq}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:shadow-md transition"
                  >
                    <Plus className="w-4 h-4" /> Criar Pergunta
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
          onClick={() => {
            setShowDeleteModal(false);
            setFaqToDelete(null);
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
                Excluir FAQ
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Tem certeza que deseja excluir esta pergunta frequente? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setFaqToDelete(null);
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

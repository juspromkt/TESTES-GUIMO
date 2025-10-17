// NOVO FAQSection.tsx COM DRAG AND DROP E MÍDIA COMO NAS ETAPAS

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Loader2,
  GripVertical,
  Trash2,
  Upload,
  Save,
  Maximize2,
  Minimize2,
} from "lucide-react";
import ReactQuill from "react-quill";
import { registerMediaBlot } from "./mediaBlot";
import Modal from "../Modal";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import "react-quill/dist/quill.snow.css";

interface FAQ {
  ordem: number;
  pergunta: string;
  resposta: string;
}

interface MediaItem {
  url: string;
  type: string;
  name?: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  setFaqs: React.Dispatch<React.SetStateAction<FAQ[]>>;
  savingFAQs: boolean;
  token: string;
  canEdit: boolean;
}

export default function FAQSection({
  faqs,
  setFaqs,
  savingFAQs,
  token,
  canEdit,
}: FAQSectionProps) {
  const quillRefs = useRef<{ [key: number]: ReactQuill | null }>({});
  const [activeUpload, setActiveUpload] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);
  const [collapsedFaqs, setCollapsedFaqs] = useState<boolean[]>(() =>
    faqs.map(() => true)
  );

  const MAX_CHARS = 2000;

  // Função para remover tags HTML e contar caracteres
  const getTextLength = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.length || 0;
  };

  // Contabilizar caracteres de todas as perguntas juntas
  const totalCharCount = faqs.reduce((total, faq) => {
    const perguntaLength = faq.pergunta.length;
    const respostaLength = getTextLength(faq.resposta);
    return total + perguntaLength + respostaLength;
  }, 0);

  const charPercentage = (totalCharCount / MAX_CHARS) * 100;

  // Determina a cor baseada na porcentagem
  const getProgressColor = () => {
    if (charPercentage < 50) return 'bg-emerald-500 dark:bg-emerald-600';
    if (charPercentage < 75) return 'bg-yellow-500 dark:bg-yellow-600';
    if (charPercentage < 90) return 'bg-orange-500 dark:bg-orange-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  const getTextColor = () => {
    if (charPercentage < 50) return 'text-emerald-600 dark:text-emerald-400';
    if (charPercentage < 75) return 'text-yellow-600 dark:text-yellow-400';
    if (charPercentage < 90) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  useEffect(() => {
    const init = async () => {
      await registerMediaBlot();
      setIsQuillReady(true); // só depois de registrar o blot
    };
    init();
  }, []);

  useEffect(() => {
    setCollapsedFaqs((prev) => {
      if (prev.length === 0) {
        return faqs.map(() => true);
      }

      if (faqs.length > prev.length) {
        return [...prev, ...Array(faqs.length - prev.length).fill(true)];
      }

      if (faqs.length < prev.length) {
        return prev.slice(0, faqs.length);
      }

      return prev;
    });
  }, [faqs.length, faqs]);

  async function registerMediaBlot() {
    if (typeof window !== "undefined") {
      const { Quill } = await import("react-quill");
      const BlockEmbed = Quill.import("blots/block/embed");

      class MediaBlot extends BlockEmbed {
        static create(value: MediaItem | string) {
          const node = super.create();
          node.setAttribute("contenteditable", "false");

          if (typeof value === "string") {
            node.innerHTML = value;
            return node;
          }

          node.setAttribute("data-url", value.url);
          node.setAttribute("data-type", value.type);
          if (value.name) {
            node.setAttribute("data-name", value.name);
          }

          if (value.type.startsWith("image")) {
            node.innerHTML = `<img src="${value.url}" alt="${
              value.name || ""
            }" style="max-width: 300px; border-radius: 8px;" />`;
          } else if (value.type.startsWith("video")) {
            node.innerHTML = `<video src="${value.url}" controls style="max-width: 200px; border-radius: 8px;"></video>`;
          } else if (value.type.startsWith("audio")) {
            node.innerHTML = `<audio src="${value.url}" controls style="width: 300px;"></audio>`;
          } else if (value.type === "application/pdf") {
            node.innerHTML = `
              <div style="display: flex; align-items: center; background: #eff6ff; padding: 12px; border-radius: 8px; max-width: 80%; margin: 0 auto;">
                <div style="width: 40px; height: 40px; background: #dc2626; display: flex; justify-content: center; align-items: center; border-radius: 8px; color: white; font-size: 20px;">📄</div>
                <a href="${
                  value.url
                }" target="_blank" style="margin-left: 12px; color: #2563eb; font-weight: 500; text-decoration: none;">${
              value.name || "Abrir PDF"
            }</a>
              </div>`;
          }

          return node;
        }

        static value(node: HTMLElement) {
          return {
            url: node.getAttribute("data-url"),
            type: node.getAttribute("data-type"),
            name: node.getAttribute("data-name"),
            html: node.innerHTML,
          };
        }
      }

      MediaBlot.blotName = "media";
      MediaBlot.tagName = "div";
      MediaBlot.className = "ql-media";
      Quill.register(MediaBlot);
    }
  }

  const handleAddFAQ = () => {
    setFaqs((prev) => [
      ...prev,
      { ordem: prev.length + 1, pergunta: "", resposta: "" },
    ]);
  };

  const handleDeleteClick = (ordem: number) => {
    setFaqToDelete(ordem);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (faqToDelete !== null) {
      const updated = faqs
        .filter((f) => f.ordem !== faqToDelete)
        .map((f, i) => ({ ...f, ordem: i + 1 }));
      setFaqs(updated);
      setDeleteModalOpen(false);
      setFaqToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setFaqToDelete(null);
  };

  const handleRemoveFAQ = (ordem: number) => {
    const updated = faqs
      .filter((f) => f.ordem !== ordem)
      .map((f, i) => ({ ...f, ordem: i + 1 }));
    setFaqs(updated);
  };

  const handleUpdateFAQ = (
    ordem: number,
    field: "pergunta" | "resposta",
    value: string
  ) => {
    setFaqs((prev) =>
      prev.map((f) => (f.ordem === ordem ? { ...f, [field]: value } : f))
    );
  };

  const handleMediaUpload = async (ordem: number, file: File) => {
    setActiveUpload(ordem);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        "https://n8n.lumendigital.com.br/webhook/prospecta/agente/upload",
        {
          method: "POST",
          headers: { token },
          body: formData,
        }
      );

      const { url } = await res.json();
      const editor = quillRefs.current[ordem]?.getEditor();
      const range = editor?.getSelection(true);
      if (editor && range) {
        editor.insertEmbed(range.index, "media", {
          url,
          type: file.type,
          name: file.name,
        });
        editor.setSelection(range.index + 1);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setActiveUpload(null);
    }
  };

  const handleSave = async () => {
    setSaving(-1);
    setModalLoading(true);
    try {
      await fetch(
        "https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(faqs),
        }
      );

      const updated = await fetch(
        "https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/get",
        {
          headers: { token },
        }
      );

      if (updated.ok) {
        const json = await updated.json();
        setFaqs(json);
        setTimeout(() => {
          setModalOpen(true);
          setModalLoading(false);
        }, 300); // Delay proposital para não parecer travado
      }
    } catch (e) {
      console.error("Erro ao salvar FAQ");
      setModalLoading(false);
    } finally {
      setSaving(null);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = [...faqs];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setFaqs(reordered.map((faq, i) => ({ ...faq, ordem: i + 1 })));

    setCollapsedFaqs((prev) => {
      const updated = [...prev];
      const [collapsed] = updated.splice(result.source.index, 1);
      updated.splice(
        result.destination.index,
        0,
        collapsed !== undefined ? collapsed : true
      );
      return updated.slice(0, reordered.length);
    });
  };

  const toggleFaqCollapse = (index: number) => {
    setCollapsedFaqs((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "media",
  ];

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-300 dark:border-neutral-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
            Perguntas frequentes e informações do seu escritório
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Adicione as principais informações do seu escritório e as perguntas mais frequentes que a IA deve saber responder
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleAddFAQ}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-500 dark:bg-emerald-600 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        )}
      </div>

      {/* Contador de caracteres total */}
      {faqs.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${getTextColor()}`}>
              Total de caracteres: {totalCharCount}/{MAX_CHARS}
            </span>
            <span className={`text-xs ${getTextColor()}`}>
              ({charPercentage.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-300 ease-out`}
              style={{ width: `${Math.min(charPercentage, 100)}%` }}
            />
          </div>

          {/* Alerta quando exceder o limite */}
          {totalCharCount > MAX_CHARS && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800/50 rounded-lg flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Limite recomendado excedido
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Seu agente pode se perder pelo volume de caracteres. Recomendamos manter até {MAX_CHARS} caracteres no total de todas as perguntas.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="faq">
          {(provided) => (
            <div
              className="space-y-6 no-scroll-anchor"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {faqs.map((faq, index) => (
                <Draggable
                  key={faq.ordem}
                  draggableId={String(faq.ordem)}
                  index={index}
                >
                  {(provided) => {
                    const isCollapsed = collapsedFaqs[index] ?? true;
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border border-gray-300 dark:border-neutral-600 rounded-lg p-4 bg-gray-50 dark:bg-neutral-700/50"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-400"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                                Pergunta {faq.ordem}
                              </p>
                              {isCollapsed && (
                                <p
                                  className="text-sm font-semibold text-gray-900 dark:text-neutral-100 truncate"
                                  title={faq.pergunta || "Pergunta sem título"}
                                >
                                  {faq.pergunta || "Pergunta sem título"}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(faq.ordem)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Excluir pergunta"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleFaqCollapse(index)}
                              aria-expanded={!isCollapsed}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                            >
                              {isCollapsed ? (
                                <>
                                  <Maximize2 className="w-4 h-4" />
                                  Expandir
                                </>
                              ) : (
                                <>
                                  <Minimize2 className="w-4 h-4" />
                                  Reduzir
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                                Pergunta {faq.ordem}
                              </label>
                              <input
                                type="text"
                                value={faq.pergunta}
                                onChange={(e) =>
                                  handleUpdateFAQ(
                                    faq.ordem,
                                    "pergunta",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                                placeholder="Digite a pergunta"
                                disabled={!canEdit}
                              />
                            </div>

                            <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                              Resposta
                            </label>
                            {canEdit && (
                              <>
                                <input
                                  type="file"
                                  id={`upload-${faq.ordem}`}
                                  className="hidden"
                                  accept="image/*,video/*,audio/*,application/pdf"
                                  onChange={(e) =>
                                    e.target.files?.[0] &&
                                    handleMediaUpload(
                                      faq.ordem,
                                      e.target.files[0]
                                    )
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    document
                                      .getElementById(`upload-${faq.ordem}`)
                                      ?.click()
                                  }
                                  disabled={activeUpload === faq.ordem}
                                  className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg mb-2"
                                >
                                  <Upload className="w-4 h-4" /> Adicionar Mídia
                                </button>
                              </>
                            )}

                            <div className="relative">
                              {isQuillReady && (
                              <ReactQuill
                                ref={(el) =>
                                  (quillRefs.current[faq.ordem] = el)
                                }
                                theme="snow"
                                value={faq.resposta}
                                onChange={
                                  canEdit
                                    ? (v) =>
                                        handleUpdateFAQ(
                                          faq.ordem,
                                          "resposta",
                                          v
                                        )
                                    : () => {}
                                }
                                modules={canEdit ? modules : { toolbar: false }}
                                formats={formats}
                                readOnly={!canEdit}
                                placeholder="Digite a resposta"
                                className="bg-white dark:bg-neutral-700 rounded-lg
                                  [&_.ql-editor]:text-gray-900 [&_.ql-editor]:dark:text-neutral-100
                                  [&_.ql-editor]:min-h-[120px]
                                  [&_.ql-toolbar]:dark:bg-neutral-800
                                  [&_.ql-toolbar]:dark:border-neutral-600
                                  [&_.ql-container]:dark:border-neutral-600
                                  [&_.ql-container]:dark:bg-neutral-700
                                  [&_.ql-stroke]:dark:stroke-neutral-300
                                  [&_.ql-fill]:dark:fill-neutral-300
                                  [&_.ql-picker-label]:dark:text-neutral-300
                                  [&_.ql-picker-options]:dark:bg-neutral-700
                                  [&_.ql-picker-item]:dark:text-neutral-300
                                  [&_.ql-picker-item:hover]:dark:bg-neutral-600
                                  [&_button:hover]:dark:bg-neutral-600
                                  [&_button.ql-active]:dark:bg-emerald-900/30
                                  [&_.ql-editor.ql-blank::before]:dark:text-neutral-500"
                              />
                      )}
                              {activeUpload === faq.ordem && (
                                <div className="absolute inset-0 bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 dark:text-emerald-400" />
                                </div>
                              )}
                            </div>
                          </div>

                          {canEdit && (
                            <div className="flex justify-end items-center pt-2">
                              <button
                                onClick={handleSave}
                                disabled={savingFAQs || modalLoading}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50"
                              >
                                {savingFAQs || modalLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Salvando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    <span>Salvar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Sucesso"
      >
        {modalLoading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500 dark:text-emerald-400" />
            <p className="text-sm text-gray-600 dark:text-neutral-400">Processando resposta...</p>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-neutral-300">Alterações salvas com sucesso!</p>
        )}
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={cancelDelete}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-neutral-300">
            Tem certeza que deseja excluir a Pergunta #{faqToDelete}?
          </p>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={cancelDelete}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
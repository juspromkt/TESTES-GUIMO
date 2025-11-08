// NOVO FAQSection.tsx COM DRAG AND DROP E MÃDIA COMO NAS ETAPAS

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
  Zap,
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
import SmartDecisionModal from "./SmartDecisionModal";

interface FAQ {
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
  const quillRefs = useRef<{ [key: number]: ReactQuill | null }>({});
  const [activeUpload, setActiveUpload] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [isQuillReady, setIsQuillReady] = useState(false);
  const [collapsedFaqs, setCollapsedFaqs] = useState<boolean[]>(() =>
    faqs.map(() => true)
  );
  // Smart Decision state
  const [smartDecisionModalOpen, setSmartDecisionModalOpen] = useState(false);
  const [currentDecisionFaq, setCurrentDecisionFaq] = useState<number | null>(null);

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
        if (value.name) node.setAttribute("data-name", value.name);

        if (value.type.startsWith("image")) {
          node.innerHTML = `<img src="${value.url}" alt="${value.name || ""}" style="max-width: 300px; border-radius: 8px;" />`;
        } else if (value.type.startsWith("video")) {
          node.innerHTML = `<video src="${value.url}" controls style="max-width: 200px; border-radius: 8px;"></video>`;
        } else if (value.type.startsWith("audio")) {
          node.innerHTML = `<audio src="${value.url}" controls style="width: 300px;"></audio>`;
        } else if (value.type === "application/pdf") {
          node.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:flex-start;background:#eff6ff;padding:4px;border-radius:8px;max-width:80%;margin:2px;line-height:1;">
              <div style="width:40px;height:40px;background:#dc2626;display:flex;justify-content:center;align-items:center;border-radius:8px;color:#fff;font-size:24px;line-height:1;transform:translateY(1px);">📄</div>
              <a href="${value.url}" target="_blank" style="color:#2563eb;font-weight:500;text-decoration:none;margin-left:8px;">${value.name || "Abrir PDF"}</a>
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

    // SmartDecision inline embed
    const Embed = Quill.import("blots/embed");
    class SmartDecisionBlot extends Embed {
      static create(value: any) {
        const node = super.create() as HTMLElement;
        node.setAttribute('contenteditable','false');
        const t = value?.type || '';
        const id = value?.id ?? null;
        const label = value?.label ?? '';
        node.setAttribute('data-type', t);
        if (id !== null) node.setAttribute('data-id', String(id));
        if (label) node.setAttribute('data-label', String(label));

        const base = 'display:inline-flex;align-items:center;gap:4px;border-radius:9999px;padding:1px 8px;margin:1px 1px;font-size:11px;font-weight:600;white-space:nowrap;line-height:1;user-select:none;';
        const styles: Record<string, { bg: string; border: string; color: string; icon: string; prefix: string }> = {
          add_tag: { bg:'#FFF7ED', border:'#FED7AA', color:'#9A3412', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>', prefix:'Adicionar Tag' },
          transfer_agent: { bg:'#EFF6FF', border:'#BFDBFE', color:'#1E40AF', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>', prefix:'Ação: Transferir para Agente' },
          transfer_user: { bg:'#ECFDF5', border:'#BBF7D0', color:'#065F46', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="8.5" cy="7" r="4"></circle></svg>', prefix:'Ação: Transferir para Usuário' },
          assign_source: { bg:'#F5F3FF', border:'#DDD6FE', color:'#5B21B6', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h18"></path><path d="M3 12h18"></path><path d="M3 17h18"></path></svg>', prefix:'Ação: Atribuir Fonte' },
          stop_agent: { bg:'#FEF2F2', border:'#FECACA', color:'#991B1B', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>', prefix:'Ação: Interromper Agente' },
        };
        const s = styles[t] || styles.add_tag;
        const prefix = t === 'transfer_stage'
          ? 'Ação: Transferir para o estágio'
          : t === 'notify'
          ? 'Ação: Notificação'
          : t === 'assign_product'
          ? 'Ação: Atribuir Produto'
          : s.prefix;
        const formatted = t === 'stop_agent'
          ? prefix
          : t === 'transfer_stage'
          ? `${prefix} ${value?.id != null ? `#${value.id} ` : ''}${value?.label ?? ''}`
          : `${prefix} ${value?.id != null ? `#${value.id} - ` : ''}${value?.label ?? ''}`;

        node.setAttribute('style', `${base}background:${s.bg};border:1px solid ${s.border};color:${s.color};`);
        node.innerHTML = `${s.icon}<span>${formatted}</span>`;
        return node;
      }
      static value(node: HTMLElement) {
        return {
          type: node.getAttribute('data-type') || '',
          id: node.getAttribute('data-id') ? Number(node.getAttribute('data-id')) : null,
          label: node.getAttribute('data-label') || '',
          text: node.textContent || ''
        };
      }
    }
    SmartDecisionBlot.blotName = 'smartDecision';
    SmartDecisionBlot.tagName = 'span';
    SmartDecisionBlot.className = 'ql-smart-decision';
    Quill.register(SmartDecisionBlot);
  }
}

  const handleAddFAQ = () => {
    setFaqs((prev) => [
      ...prev,
      { ordem: prev.length + 1, pergunta: "", resposta: "" },
    ]);
  };

  // Abrir modal de decisão inteligente
  const handleOpenSmartDecision = (ordem: number) => {
    setCurrentDecisionFaq(ordem);
    setSmartDecisionModalOpen(true);
  };
  // Inserir decisão inteligente no editor (FAQ) via embed
  const handleInsertSmartDecision = (html: string) => {
    if (currentDecisionFaq === null) return;
    const editor = quillRefs.current[currentDecisionFaq]?.getEditor();
    if (editor) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const el = temp.querySelector('[data-type]') as HTMLElement | null;
      const type = (el?.getAttribute('data-type') || '') as 'add_tag' | 'transfer_agent' | 'transfer_user' | 'assign_source' | 'transfer_stage' | 'notify' | 'assign_product' | 'stop_agent';
      const idAttr = el?.getAttribute('data-id');
      const id = idAttr ? parseInt(idAttr) : null;
      const label = el?.getAttribute('data-label') || '';

      const range = editor.getSelection(true);
      if (range) {
        editor.insertEmbed(range.index, 'smartDecision', { type, id, label }, 'user');
        editor.setSelection(range.index + 1, 0);
      }

      const currentContent = editor.root.innerHTML;
      handleUpdateFAQ(currentDecisionFaq, 'resposta', currentContent);
    }
  };




  // Atalho Ctrl+D para abrir decisão inteligente no editor focado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const focusedElement = document.activeElement as Element | null;
        const quillContainer = focusedElement?.closest('.ql-container');
        if (quillContainer) {
          for (const faq of faqs) {
            const editorRef = quillRefs.current[faq.ordem];
            if (
              editorRef &&
              editorRef.getEditor().root === quillContainer.querySelector('.ql-editor')
            ) {
              handleOpenSmartDecision(faq.ordem);
              break;
            }
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [faqs]);

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
        `https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/upload?id_agente=${idAgente}`,
        {
          method: "POST",
          headers: { token },
          body: (() => { formData.append('id_agente', String(idAgente)); return formData; })(),
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
        "https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(faqs.map(f => ({ ...f, id_agente: idAgente }))),
        }
      );

      const updated = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/get?id_agente=${idAgente}`,
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
    "smartDecision",
  ];

  return (
    <div className="relative" aria-busy={isLoading}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Perguntas Frequentes
          </h2>
          <p className="text-sm text-gray-500">
            Configure as perguntas que o agente deve responder
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleAddFAQ}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        )}
      </div>

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
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab text-gray-400 hover:text-gray-600"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-700">
                                Pergunta {faq.ordem}
                              </p>
                              {isCollapsed && (
                                <p
                                  className="text-sm font-semibold text-gray-900 truncate"
                                  title={faq.pergunta || "Pergunta sem título"}
                                >
                                  {faq.pergunta || "Pergunta sem título"}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleFaqCollapse(index)}
                              aria-expanded={!isCollapsed}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
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
                              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Digite a pergunta"
                                disabled={!canEdit}
                              />
                            </div>

                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Resposta
                            </label>
                            <div className="relative">
                              {/* Action buttons above editor */}
                              {canEdit && (
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="file"
                                    id={`upload-${faq.ordem}`}
                                    className="hidden"
                                    accept="image/*,video/*,audio/*,application/pdf"
                                    onChange={(e) =>
                                      e.target.files?.[0] &&
                                      handleMediaUpload(
                                        faq.ordem,
                                        e.target.files![0]
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
                                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                                  >
                                    <Upload className="w-4 h-4" /> Adicionar Mídia
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSmartDecision(faq.ordem)}
                                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                                    title="Inserir Decisão Inteligente (Ctrl+D)"
                                  >
                                    <Zap className="w-4 h-4" /> Decisão Inteligente (Ctrl+D)
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
                                className="bg-white rounded-lg"
                              />
                              )}
                              {activeUpload === faq.ordem && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                                </div>
                              )}
                             </div>
                           </div>

                          {canEdit && (
                            <div className="flex justify-between items-center pt-2">
                              <button
                                onClick={() => handleRemoveFAQ(faq.ordem)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={handleSave}
                                disabled={savingFAQs || modalLoading}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
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
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-600">Processando resposta...</p>
          </div>
        ) : (
          <p className="text-gray-700">Alterações salvas com sucesso!</p>
        )}
        </Modal>
        <SmartDecisionModal
          isOpen={smartDecisionModalOpen}
          onClose={() => setSmartDecisionModalOpen(false)}
          onInsert={handleInsertSmartDecision}
          token={token}
          currentAgentId={idAgente}
        />
      </div>
      {isLoading && (
        <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      )}
    </div>
  );
}



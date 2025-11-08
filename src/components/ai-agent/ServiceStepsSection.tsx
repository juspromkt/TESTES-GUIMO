import React, { useState, useEffect, useRef } from "react";
import {
  ListOrdered,
  Plus,
  Trash2,
  Loader2,
  Save,
  Upload,
  Maximize2,
  Minimize2,
  GripVertical,
  Zap,
  MessageSquare,
} from "lucide-react";
import ReactQuill from "react-quill";
import { registerMediaBlot } from "./mediaBlot";
import "react-quill/dist/quill.snow.css";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import Modal from "../Modal";
import SmartDecisionModal from "./SmartDecisionModal";

interface ServiceStep {
  ordem: number;
  nome: string;
  descricao: string;
  atribuir_lead?: boolean;
  desativar_agente?: boolean;
}

interface ServiceStepsSectionProps {
  serviceSteps: ServiceStep[];
  handleAddStep: () => void;
  handleRemoveStep: (ordem: number) => void;
  handleUpdateStep: (
    ordem: number,
    field: "nome" | "descricao" | "atribuir_lead" | "desativar_agente",
    value: string | boolean
  ) => void;
  handleReorderSteps: (steps: ServiceStep[]) => void;
  savingSteps: boolean;
  handleSaveSteps: () => Promise<void>;
  onMediaUpload: (file: File) => Promise<string>;
  isUploading: boolean;
  canEdit: boolean; // âœ… NOVO
  token: string;
  idAgente: number;
  isLoading: boolean;
}

interface MediaItem {
  url: string;
  type: string;
  name: string;
}

export default function ServiceStepsSection({
  serviceSteps,
  handleAddStep,
  handleRemoveStep,
  handleUpdateStep,
  handleReorderSteps,
  savingSteps,
  handleSaveSteps,
  onMediaUpload,
  isUploading,
  canEdit,
  token,
  idAgente,
  isLoading,
}: ServiceStepsSectionProps) {
  const quillRefs = useRef<{ [key: number]: ReactQuill | null }>({});
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [atribuirStepIndex, setAtribuirStepIndex] = useState<number | null>(
    null
  );
  const [atribuicoes, setAtribuicoes] = useState<any[]>([]);
  const [usuariosAtivos, setUsuariosAtivos] = useState<any[]>([]);
  const [isLoadingAtrib, setIsLoadingAtrib] = useState(false);
  const [isSavingAtrib, setIsSavingAtrib] = useState(false);
  const [collapsedSteps, setCollapsedSteps] = useState<boolean[]>(() =>
    serviceSteps.map(() => true)
  );

  // Smart Decision Modal
  const [smartDecisionModalOpen, setSmartDecisionModalOpen] = useState(false);
  const [currentDecisionStep, setCurrentDecisionStep] = useState<number | null>(null);

  const fetchAtribuicoes = async () => {
    setIsLoadingAtrib(true);
    try {
      const res = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/atribuicao/get?id_agente=${idAgente}`,
        {
          headers: { token },
        }
      );
      const data = await res.json();
      setAtribuicoes(data);
    } catch (err) {
      console.error("Erro ao buscar atribuições", err);
    } finally {
      setIsLoadingAtrib(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(
        "https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get",
        {
          headers: { token },
        }
      );
      const data = await res.json();
      setUsuariosAtivos(data);
    } catch (err) {
      console.error("Erro ao buscar usuários", err);
    }
  };

  const saveAtribuicoes = async () => {
    setIsSavingAtrib(true);
    try {
      await fetch(
        "https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/atribuicao/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
          body: JSON.stringify(atribuicoes.map(a => ({ ...a, id_agente: idAgente }))),
        }
      );
    } catch (err) {
      console.error("Erro ao salvar atribuições", err);
    } finally {
      setIsSavingAtrib(false);
    }
  };

  const handleSaveWithModal = async () => {
    setModalLoading(true); // somente o loading do modal
    try {
      await handleSaveSteps(); // já atualiza os dados por prop
      setTimeout(() => {
        setModalOpen(true);
        setModalLoading(false);
      }, 300);
    } catch (err) {
      console.error("Erro ao salvar etapas:", err);
      setModalLoading(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newSteps = Array.from(serviceSteps);
    const [moved] = newSteps.splice(result.source.index, 1);
    newSteps.splice(result.destination.index, 0, moved);

    // Reatribuir ordem sequencial
    const reordered = newSteps.map((step, index) => ({
      ...step,
      ordem: index + 1,
    }));

    handleReorderSteps(reordered);

    setCollapsedSteps((prev) => {
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

  const toggleStepCollapse = (index: number) => {
    setCollapsedSteps((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  useEffect(() => {
    const etapaComAtribuicao = serviceSteps.find((step) => step.atribuir_lead);
    setAtribuirStepIndex(etapaComAtribuicao ? etapaComAtribuicao.ordem : null);
  }, [serviceSteps]);

  useEffect(() => {
    setCollapsedSteps((prev) => {
      if (prev.length === 0) {
        return serviceSteps.map(() => true);
      }

      if (serviceSteps.length > prev.length) {
        return [
          ...prev,
          ...Array(serviceSteps.length - prev.length).fill(true),
        ];
      }

      if (serviceSteps.length < prev.length) {
        return prev.slice(0, serviceSteps.length);
      }

      return prev;
    });
  }, [serviceSteps.length, serviceSteps]);

  // Evita duplicar carregamentos em StrictMode
  const loadedOnceRef = useRef(false);
  useEffect(() => {
    if (loadedOnceRef.current) return;
    loadedOnceRef.current = true;
    fetchAtribuicoes();
    fetchUsuarios();
  }, []);

  // Recarrega atribuições quando o agente selecionado mudar
  const prevAgentRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevAgentRef.current === null) {
      prevAgentRef.current = idAgente;
      return; // evita duplicar com o carregamento inicial
    }
    if (prevAgentRef.current !== idAgente) {
      prevAgentRef.current = idAgente;
      fetchAtribuicoes();
    }
  }, [idAgente]);

  useEffect(() => {
    const initializeQuill = async () => {
      await registerMediaBlot();
      setIsQuillReady(true);
    };
    initializeQuill();
  }, []);

  async function registerMediaBlot() {
    if (typeof window !== "undefined") {
      const { Quill } = await import("react-quill");
      const BlockEmbed = Quill.import("blots/block/embed");      const Embed = Quill.import("blots/embed");

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
          const text = t === 'stop_agent'
            ? prefix
            : t === 'transfer_stage'
            ? `${prefix} ${id !== null ? `#${id} ` : ''}${label}`
            : `${prefix} ${id !== null ? `#${id} - ` : ''}${label}`;
          node.setAttribute('style', `${base}background:${s.bg};border:1px solid ${s.border};color:${s.color};`);
          node.innerHTML = `${s.icon}<span>${text}</span>`;
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
  <div style="display: flex; align-items: center; justify-content: flex-start; background: #eff6ff; padding: 4px; border-radius: 8px; max-width: 80%; margin: 2px; line-height: 1;">
    <div style="width: 40px; height: 40px; background: #dc2626; display: flex; justify-content: center; align-items: center; border-radius: 8px; color: white; font-size: 24px; line-height: 1; transform: translateY(1px);">ðŸ“„</div> 
    <a href="${value.url}" target="_blank" style="color: #2563eb; font-weight: 500; text-decoration: none; margin-left: 8px;">${value.name || "Abrir PDF"}</a>
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

  const handleFileUpload = async (
    ordem: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setActiveStep(ordem);

    try {
      const url = await onMediaUpload(file);
      const editor = quillRefs.current[ordem]?.getEditor();

      if (editor) {
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, "media", {
          url,
          type: file.type,
          name: file.name,
        });
        editor.setSelection(range.index + 1, 0);
      }
    } catch (error) {
      console.error("Error uploading media:", error);
    } finally {
      setActiveStep(null);
      event.target.value = "";
    }
  };

  // Abrir modal de decisão inteligente
  const handleOpenSmartDecision = (ordem: number) => {
    setCurrentDecisionStep(ordem);
    setSmartDecisionModalOpen(true);
  };
  // Inserir decisão inteligente no editor via embed customizado
  const handleInsertSmartDecision = (html: string) => {
    if (currentDecisionStep === null) return;

    const editor = quillRefs.current[currentDecisionStep]?.getEditor();
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
      handleUpdateStep(currentDecisionStep, 'descricao', currentContent);
    }
  };

  // Inserir template situação/mensagem diretamente no editor
  const handleInsertSituationTemplate = (ordem: number) => {
    const editor = quillRefs.current[ordem]?.getEditor();
    if (editor) {
      const range = editor.getSelection(true);
      if (range) {
        // Cria um HTML com o template destacado
        const templateHTML = `<div style="background: rgba(254, 202, 202, 0.3); border: 2px solid #fca5a5; border-radius: 6px; padding: 12px; margin: 8px 0;"><p style="margin: 0 0 8px 0;"><strong>🚩 Situação:</strong> Digite aqui a situação...</p><p style="margin: 0;"><strong>💬 Mensagem (o que você deve retornar):</strong><br>Digite aqui a mensagem que o agente deve retornar...</p></div><p><br></p>`;

        // Insere o HTML usando o clipboard do Quill
        const delta = editor.clipboard.convert(templateHTML);
        editor.setContents(
          editor.getContents().compose(
            new (editor.constructor as any).imports.delta().retain(range.index).concat(delta)
          ),
          'user'
        );
        editor.setSelection(range.index + delta.length(), 0);
      }

      const currentContent = editor.root.innerHTML;
      handleUpdateStep(ordem, 'descricao', currentContent);
    }
  };
  // Listener para tecla de atalho Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        // Encontrar qual editor está focado
        const focusedElement = document.activeElement;
        const quillEditor = focusedElement?.closest('.ql-container');

        if (quillEditor) {
          // Encontrar qual step corresponde a este editor
          for (const step of serviceSteps) {
            const editorRef = quillRefs.current[step.ordem];
            if (editorRef && editorRef.getEditor().root === quillEditor.querySelector('.ql-editor')) {
              handleOpenSmartDecision(step.ordem);
              break;
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [serviceSteps]);

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
    },
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
      <div className="bg-white rounded-xl shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <ListOrdered className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Etapas de Atendimento
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure o fluxo de atendimento do agente
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={handleAddStep}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" />
            Adicionar Etapa
          </button>
        )}
      </div>

      <div className="space-y-6 no-scroll-anchor">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="steps">
            {(provided) => (
              <div
                className="space-y-6 no-scroll-anchor"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {serviceSteps.map((step, index) => {
                  return (
                    <Draggable
                      draggableId={step.ordem.toString()}
                      index={index}
                      key={step.ordem}
                    >
                      {(provided) => {
                        const isCollapsed = collapsedSteps[index] ?? true;
                        return (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="bg-orange-50/50 rounded-lg p-6 no-scroll-anchor"
                          >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                title="Arraste para reordenar"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                                {step.ordem}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-700">
                                  Etapa #{step.ordem}
                                </p>
                                {isCollapsed && (
                                  <p
                                    className="text-sm font-semibold text-gray-900 truncate"
                                    title={step.nome || "Sem nome"}
                                  >
                                    {step.nome || "Sem nome"}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleStepCollapse(index)}
                                aria-expanded={!isCollapsed}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
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
                              {canEdit && !isCollapsed && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStep(step.ordem)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="mt-4 space-y-4">
                              <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nome da Etapa
                            </label>
                            <input
                              type="text"
                              value={step.nome}
                              onChange={(e) =>
                                handleUpdateStep(
                                  step.ordem,
                                  "nome",
                                  e.target.value
                                )
                              }
                              placeholder="Ex: Apresentação Inicial"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              disabled={!canEdit}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Descrição da Etapa
                            </label>
                            <div className="relative">
                              {canEdit && (
                                <div className="flex items-center gap-2 mb-2">
                                  <button
                                    type="button"
                                    onClick={() => handleInsertSituationTemplate(step.ordem)}
                                    className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                                    title="Inserir Modelo Situação/Mensagem"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    Situação/Mensagem
                                  </button>
                                  <input
                                    type="file"
                                    id={`file-upload-${step.ordem}`}
                                    accept="image/*,video/*,audio/*,application/pdf"
                                    onChange={(e) =>
                                      handleFileUpload(step.ordem, e)
                                    }
                                    className="hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      document
                                        .getElementById(
                                          `file-upload-${step.ordem}`
                                        )
                                        ?.click()
                                    }
                                    disabled={
                                      isUploading && activeStep === step.ordem
                                    }
                                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    <Upload className="w-4 h-4" />
                                    Adicionar Mídia
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSmartDecision(step.ordem)}
                                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                    title="Inserir Decisão Inteligente (Ctrl+D)"
                                  >
                                    <Zap className="w-4 h-4" />
                                    Decisão Inteligente (Ctrl+D)
                                  </button>
                                </div>
                              )}
                              {isQuillReady && (
                                <ReactQuill
                                  ref={(el) =>
                                    (quillRefs.current[step.ordem] = el)
                                  }
                                  theme="snow"
                                  value={step.descricao}
                                  onChange={
                                    canEdit
                                      ? (content) =>
                                          handleUpdateStep(
                                            step.ordem,
                                            "descricao",
                                            content
                                          )
                                      : () => {}
                                  }
                                  modules={
                                    canEdit ? modules : { toolbar: false }
                                  }
                                  formats={formats}
                                  readOnly={!canEdit}
                                  placeholder="Descreva esta etapa de atendimento..."
                                  className="bg-white rounded-lg"
                                />
                              )}
                              {isUploading && activeStep === step.ordem && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                </div>
                              )}
                            </div>
                          </div>
                          {canEdit && (
                              <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      checked={!!step.atribuir_lead}
                                      disabled={!canEdit}
                                      onChange={() => {
                                        const novoValor = !step.atribuir_lead;
                                        handleUpdateStep(
                                          step.ordem,
                                          "atribuir_lead",
                                          novoValor
                                        );

                                        if (novoValor) {
                                          setAtribuirStepIndex(step.ordem);
                                        } else {
                                          setAtribuirStepIndex(null);
                                          setAtribuicoes([]);
                                        }
                                      }}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-orange-500 transition-colors"></div>
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                                  </div>
                                  <span className="text-sm text-gray-700">
                                    Atribuir automaticamente usuário ao lead
                                  </span>
                                </label>
                              </div>
                            )}

                          {step.atribuir_lead && canEdit && (
                            <div className="bg-white border border-orange-200 rounded-lg p-4 mt-4">
                              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                Lista de usuários que participam do rodízio de leads
                              </h3>

                              {isLoadingAtrib ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                  <span className="ml-2 text-sm text-gray-600">
                                    Carregando usuários...
                                  </span>
                                </div>
                              ) : (
                                <>
                                  {Array.isArray(atribuicoes) && atribuicoes.length > 0 ? (
                                  <ul className="space-y-2 mb-4">
                                    {atribuicoes.map((atr) => {
                                      const user = usuariosAtivos.find(
                                        (u) => u.Id === atr.id_usuario
                                      );
                                      return (
                                        <li
                                          key={atr.id_usuario}
                                          className="flex justify-between items-center border p-2 rounded"
                                        >
                                          <span className="text-sm">
                                            {user?.nome ||
                                              `Usuário ${atr.id_usuario}`}
                                          </span>
                                          <label className="flex items-center gap-2 cursor-pointer">
                                            <div className="relative">
                                              <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={atr.isAtivo}
                                                onChange={(e) => {
                                                  const updated =
                                                    atribuicoes.map((a) =>
                                                      a.id_usuario ===
                                                      atr.id_usuario
                                                        ? {
                                                            ...a,
                                                            isAtivo:
                                                              e.target.checked,
                                                          }
                                                        : a
                                                    );
                                                  setAtribuicoes(updated);
                                                }}
                                              />
                                              <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-orange-500 transition-colors"></div>
                                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                                            </div>
                                          </label>
                                        </li>
                                      );
                                    })}
                                  </ul>
) : (
  <div className="text-sm text-gray-500 mb-4">
    Nenhum usuário adicionado Ã  atribuição automática.
  </div>
)}
 <select
  onChange={(e) => {
    const id = parseInt(e.target.value);

    if (!id) return;

    const existe =
      Array.isArray(atribuicoes) &&
      atribuicoes.find((a) => a.id_usuario === id);

    if (!existe) {
      setAtribuicoes([
        ...(Array.isArray(atribuicoes) ? atribuicoes : []),
        { id_usuario: id, isAtivo: true },
      ]);
    }
  }}
  className="w-full text-sm border rounded p-2 mb-3"
>
  <option value="">Adicionar usuário à atribuição</option>
  {usuariosAtivos.map((user) => (
    <option key={user.Id} value={user.Id}>
      {user.nome}
    </option>
  ))}
</select>


                                  <button
                                    onClick={saveAtribuicoes}
                                    disabled={isSavingAtrib}
                                    className="text-sm px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition disabled:opacity-50"
                                  >
                                    {isSavingAtrib
                                      ? "Salvando..."
                                      : "Salvar Atribuições"}
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Opção de interromper agente removida */}

                          {canEdit && (
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={handleSaveWithModal}
                                disabled={savingSteps}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 font-medium"
                              >
                                {savingSteps ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Salvando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    <span>Salvar Etapa</span>
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
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {serviceSteps.length === 0 && (
          <div className="text-center py-12 bg-orange-50/50 rounded-lg">
            <ListOrdered className="w-12 h-12 text-orange-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Nenhuma etapa cadastrada. Adicione etapas para treinar o agente.
            </p>
          </div>
        )}

        {canEdit && serviceSteps.length > 0 && (
          <div className="flex justify-end pt-6">
            <button
              onClick={handleAddStep}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar Etapa</span>
            </button>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Sucesso"
        >
          {modalLoading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              <p className="text-sm text-gray-600">Processando etapas...</p>
            </div>
          ) : (
            <p className="text-gray-700">Etapas salvas com sucesso!</p>
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
      </div>
      {isLoading && (
        <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      )}
    </div>
  );
}


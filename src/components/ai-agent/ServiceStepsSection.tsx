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
  canEdit: boolean; // ✅ NOVO
  token: string;
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

  const fetchAtribuicoes = async () => {
    setIsLoadingAtrib(true);
    try {
      const res = await fetch(
        "https://n8n.lumendigital.com.br/webhook/prospecta/agente/atribuicao/get",
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
        "https://n8n.lumendigital.com.br/webhook/prospecta/agente/atribuicao/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
          body: JSON.stringify(atribuicoes),
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

  useEffect(() => {
    fetchAtribuicoes();
    fetchUsuarios();
  }, []);

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
  ];

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <ListOrdered className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
              Etapas de Atendimento
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
              Configure o fluxo de atendimento do agente
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={handleAddStep}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors font-medium"
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
                            className="bg-orange-50/50 dark:bg-orange-900/10 rounded-lg p-6 no-scroll-anchor border border-transparent dark:border-neutral-700"
                          >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-400"
                                title="Arraste para reordenar"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-semibold">
                                {step.ordem}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                                  Etapa #{step.ordem}
                                </p>
                                {isCollapsed && (
                                  <p
                                    className="text-sm font-semibold text-gray-900 dark:text-neutral-100 truncate"
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
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
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
                                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="mt-4 space-y-4">
                              <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
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
                              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                              disabled={!canEdit}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                              Descrição da Etapa
                            </label>
                            {canEdit && (
                              <>
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
                                  className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg transition-colors disabled:opacity-50 mb-2"
                                >
                                  <Upload className="w-4 h-4" />
                                  Adicionar Mídia - Suporta imagens, vídeos, áudios e PDFs (máx. 63MB)
                                </button>
                              </>
                            )}

                            <div className="relative">
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
                                    [&_button.ql-active]:dark:bg-orange-900/30
                                    [&_.ql-editor.ql-blank::before]:dark:text-neutral-500"
                                />
                              )}
                              {isUploading && activeStep === step.ordem && (
                                <div className="absolute inset-0 bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 dark:text-orange-400" />
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
                                    <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-orange-500 dark:peer-checked:bg-orange-600 transition-colors"></div>
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                                  </div>
                                  <span className="text-sm text-gray-700 dark:text-neutral-300">
                                    Transferir o atendimento para um usuário (use junto com "Desativar a IA nessa etapa")
                                  </span>
                                </label>
                              </div>
                            )}

                          {step.atribuir_lead && canEdit && (
                            <div className="bg-white dark:bg-neutral-700/50 border border-orange-200 dark:border-orange-800/50 rounded-lg p-4 mt-4">
                              <h3 className="text-sm font-semibold text-gray-800 dark:text-neutral-200 mb-2">
                                Lista de usuários que participam do rodízio de leads
                              </h3>

                              {isLoadingAtrib ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="w-4 h-4 animate-spin text-orange-500 dark:text-orange-400" />
                                  <span className="ml-2 text-sm text-gray-600 dark:text-neutral-400">
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
                                          className="flex justify-between items-center border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 p-2 rounded"
                                        >
                                          <span className="text-sm text-gray-900 dark:text-neutral-100">
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
                                              <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-600 rounded-full peer-checked:bg-orange-500 dark:peer-checked:bg-orange-600 transition-colors"></div>
                                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                                            </div>
                                          </label>
                                        </li>
                                      );
                                    })}
                                  </ul>
) : (
  <div className="text-sm text-gray-500 dark:text-neutral-400 mb-4">
    Nenhum usuário adicionado à atribuição automática.
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
  className="w-full text-sm border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded p-2 mb-3"
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
                                    className="text-sm px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded hover:bg-orange-700 dark:hover:bg-orange-600 transition disabled:opacity-50"
                                  >
                                    {isSavingAtrib
                                      ? "Salvando..."
                                      : "Salvar Atribuições"}
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {canEdit && (
                            <div className="flex items-center justify-between pt-2">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={!!step.desativar_agente}
                                    disabled={!canEdit}
                                    onChange={() =>
                                      handleUpdateStep(
                                        step.ordem,
                                        "desativar_agente",
                                        !step.desativar_agente
                                      )
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-orange-500 dark:peer-checked:bg-orange-600 transition-colors"></div>
                                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                                </div>
                                <span className="text-sm text-gray-700 dark:text-neutral-300">Desativar a IA nessa etapa</span>
                              </label>
                            </div>
                          )}

                          {canEdit && (
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={handleSaveWithModal}
                                disabled={savingSteps}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
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
          <div className="text-center py-12 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-transparent dark:border-neutral-700">
            <ListOrdered className="w-12 h-12 text-orange-300 dark:text-orange-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-neutral-400">
              Nenhuma etapa cadastrada. Adicione etapas para treinar o agente.
            </p>
          </div>
        )}

        {canEdit && serviceSteps.length > 0 && (
          <div className="flex justify-end pt-6">
            <button
              onClick={handleAddStep}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors font-medium"
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
              <Loader2 className="w-5 h-5 animate-spin text-orange-500 dark:text-orange-400" />
              <p className="text-sm text-gray-600 dark:text-neutral-400">Processando etapas...</p>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-neutral-300">Etapas salvas com sucesso!</p>
          )}
        </Modal>
      </div>
    </div>
  );
}
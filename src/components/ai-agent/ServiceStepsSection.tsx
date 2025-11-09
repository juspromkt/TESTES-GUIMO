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
  AlertCircle,
  CheckCircle,
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
import SmartDecisionModal from "./SmartDecisionModal";
import QuickCommandMenu from "./QuickCommandMenu";

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

  // Controle de alterações não salvas
  const [originalSteps, setOriginalSteps] = useState<ServiceStep[]>([]);
  const [successMessage, setSuccessMessage] = useState(false);

  // Controle do step ativo (qual está sendo editado)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Smart Decision Modal
  const [smartDecisionModalOpen, setSmartDecisionModalOpen] = useState(false);
  const [currentDecisionStep, setCurrentDecisionStep] = useState<number | null>(null);

  // Quick Command Menu
  const [quickCommandOpen, setQuickCommandOpen] = useState(false);
  const [quickCommandPosition, setQuickCommandPosition] = useState({ top: 0, left: 0 });
  const [quickCommandStep, setQuickCommandStep] = useState<number | null>(null);
  const [quickCommandInitial, setQuickCommandInitial] = useState<'add_tag' | 'transfer_agent' | 'transfer_user' | 'assign_source' | 'transfer_stage' | 'notify' | 'assign_product' | 'stop_agent' | null>(null);
  const [chipToReplace, setChipToReplace] = useState<{ index: number; length: number } | null>(null);

  // Verifica se há mudanças não salvas
  const hasUnsavedChanges = JSON.stringify(serviceSteps) !== JSON.stringify(originalSteps);

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
    setSuccessMessage(false);
    try {
      await handleSaveSteps(); // já atualiza os dados por prop

      // Atualiza o original para sincronizar
      setOriginalSteps(JSON.parse(JSON.stringify(serviceSteps)));

      // Mostra mensagem de sucesso
      setSuccessMessage(true);

      // Oculta mensagem após 3 segundos
      setTimeout(() => {
        setSuccessMessage(false);
      }, 3000);
    } catch (err) {
      console.error("Erro ao salvar etapas:", err);
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

  // Sincroniza os steps originais quando os dados são carregados
  useEffect(() => {
    if (serviceSteps.length > 0 && originalSteps.length === 0) {
      setOriginalSteps(JSON.parse(JSON.stringify(serviceSteps)));
    }
  }, [serviceSteps]);

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
          const invalid = value?.invalid ?? false;
          node.setAttribute('data-type', t);
          if (id !== null) node.setAttribute('data-id', String(id));
          if (label) node.setAttribute('data-label', String(label));
          if (invalid) node.setAttribute('data-invalid', 'true');

          const base = 'display:inline-flex;align-items:center;border-radius:6px;padding:4px 10px;margin:0 2px;font-size:12px;font-weight:500;white-space:nowrap;line-height:1.4;user-select:none;';

          // Se inválido, usa estilo vermelho
          if (invalid) {
            const text = t === 'stop_agent'
              ? 'Interromper agente (INVÁLIDO)'
              : `${label} (INVÁLIDO)`;
            node.setAttribute('style', `${base}background:#FEE2E2;border:1px solid #DC2626;color:#991B1B;`);
            node.innerHTML = `<span>${text}</span>`;
            node.setAttribute('title', 'Este chip está inválido. O item foi removido ou está inativo.');
            return node;
          }

          const styles: Record<string, { bg: string; border: string; color: string; text: string }> = {
            add_tag: { bg:'#FFF7ED', border:'#FED7AA', color:'#9A3412', text:'Adicionar tag' },
            transfer_agent: { bg:'#EFF6FF', border:'#BFDBFE', color:'#1E40AF', text:'Transferir para agente' },
            transfer_user: { bg:'#ECFDF5', border:'#BBF7D0', color:'#065F46', text:'Transferir para usuário' },
            assign_source: { bg:'#F5F3FF', border:'#DDD6FE', color:'#5B21B6', text:'Atribuir fonte' },
            transfer_stage: { bg:'#DBEAFE', border:'#93C5FD', color:'#1E3A8A', text:'Transferir para estágio' },
            notify: { bg:'#FEF3C7', border:'#FCD34D', color:'#92400E', text:'Enviar notificação' },
            assign_product: { bg:'#FCE7F3', border:'#F9A8D4', color:'#831843', text:'Atribuir produto' },
            stop_agent: { bg:'#FEF2F2', border:'#FECACA', color:'#991B1B', text:'Interromper agente' },
          };
          const s = styles[t] || styles.add_tag;

          let text = '';
          if (t === 'stop_agent') {
            text = s.text;
          } else if (label) {
            text = `${s.text}: ${label}`;
          } else {
            text = s.text;
          }

          node.setAttribute('style', `${base}background:${s.bg};border:1px solid ${s.border};color:${s.color};`);
          node.innerHTML = `<span>${text}</span>`;
          return node;
        }
        static value(node: HTMLElement) {
          return {
            type: node.getAttribute('data-type') || '',
            id: node.getAttribute('data-id') ? Number(node.getAttribute('data-id')) : null,
            label: node.getAttribute('data-label') || '',
            invalid: node.getAttribute('data-invalid') === 'true',
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

  // Inserir decisão via QuickCommand (remove "/" e insere, ou substitui chip existente)
  const handleInsertQuickCommand = (html: string) => {
    if (quickCommandStep === null) return;

    const editor = quillRefs.current[quickCommandStep]?.getEditor();
    if (editor) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const el = temp.querySelector('[data-type]') as HTMLElement | null;
      const type = (el?.getAttribute('data-type') || '') as 'add_tag' | 'transfer_agent' | 'transfer_user' | 'assign_source' | 'transfer_stage' | 'notify' | 'assign_product' | 'stop_agent';
      const idAttr = el?.getAttribute('data-id');
      const id = idAttr ? parseInt(idAttr) : null;
      const label = el?.getAttribute('data-label') || '';

      const selection = editor.getSelection(true);
      if (selection) {
        if (chipToReplace) {
          // Se está substituindo um chip existente, deleta o chip antigo e insere o novo
          editor.deleteText(chipToReplace.index, chipToReplace.length, 'user');
          editor.insertEmbed(chipToReplace.index, 'smartDecision', { type, id, label }, 'user');
          editor.setSelection(chipToReplace.index + 1, 0);
        } else {
          // Remove a barra "/" e insere o chip
          editor.deleteText(selection.index - 1, 1, 'user');
          editor.insertEmbed(selection.index - 1, 'smartDecision', { type, id, label }, 'user');
          editor.setSelection(selection.index, 0);
        }
      }

      const currentContent = editor.root.innerHTML;
      handleUpdateStep(quickCommandStep, 'descricao', currentContent);
    }

    setQuickCommandOpen(false);
    setChipToReplace(null);
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

  // Listener para detectar "/" e abrir QuickCommandMenu
  useEffect(() => {
    const handleTextChange = () => {
      for (const step of serviceSteps) {
        const editor = quillRefs.current[step.ordem]?.getEditor();
        if (!editor) continue;

        const selection = editor.getSelection();
        if (!selection) continue;

        const text = editor.getText(Math.max(0, selection.index - 1), 1);

        if (text === '/') {
          // Pega a posição do cursor
          const bounds = editor.getBounds(selection.index);
          const editorElement = editor.root.parentElement;
          if (editorElement) {
            const rect = editorElement.getBoundingClientRect();
            setQuickCommandPosition({
              top: rect.top + bounds.top + bounds.height,
              left: rect.left + bounds.left
            });
            setQuickCommandStep(step.ordem);
            setQuickCommandInitial(null); // Reset para não ter comando inicial
            setChipToReplace(null); // Reset para não substituir nenhum chip
            setQuickCommandOpen(true);
          }
        }
      }
    };

    // Adiciona listener de mudança de texto em todos os editores
    const editorRefs = Object.values(quillRefs.current);
    editorRefs.forEach(ref => {
      if (ref) {
        const editor = ref.getEditor();
        editor.on('text-change', handleTextChange);
      }
    });

    return () => {
      editorRefs.forEach(ref => {
        if (ref) {
          const editor = ref.getEditor();
          editor.off('text-change', handleTextChange);
        }
      });
    };
  }, [serviceSteps, isQuillReady]);

  // Validação de chips ao carregar
  useEffect(() => {
    if (!isQuillReady || serviceSteps.length === 0) return;

    const validateChips = async () => {
      try {
        // Busca todos os dados necessários para validação
        const [tagsRes, agentsRes, usersRes, sourcesRes, funnelsRes, productsRes] = await Promise.all([
          fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/list', { headers: { token } }).then(r => r.json()).catch(() => []),
          fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', { headers: { token } }).then(r => r.json()).catch(() => []),
          fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get', { headers: { token } }).then(r => r.json()).catch(() => []),
          fetch('https://n8n.lumendigital.com.br/webhook/prospecta/fonte/get', { headers: { token } }).then(r => r.json()).catch(() => []),
          fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', { headers: { token } }).then(r => r.json()).catch(() => []),
          fetch('https://n8n.lumendigital.com.br/webhook/produtos/get', { headers: { token } }).then(r => r.json()).catch(() => []),
        ]);

        const tags = Array.isArray(tagsRes) ? tagsRes : [];
        const agents = Array.isArray(agentsRes) ? agentsRes.filter(a => a.isAtivo === true) : [];
        const users = Array.isArray(usersRes) ? usersRes : [];
        const sources = Array.isArray(sourcesRes) ? sourcesRes : [];
        const funnels = Array.isArray(funnelsRes) ? funnelsRes : [];
        const products = Array.isArray(productsRes) ? productsRes : [];

        // Busca notificações do agente principal
        const principalAgent = agents.find((a: any) => a.isAgentePrincipal);
        let notifications: any[] = [];
        if (principalAgent) {
          notifications = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/geral?id_agente=${principalAgent.Id}`, { headers: { token } })
            .then(r => r.json())
            .then(data => Array.isArray(data) ? data.filter(f => f.tipo === 'NOTIFICACAO') : [])
            .catch(() => []);
        }

        // Valida cada roteiro
        for (const step of serviceSteps) {
          const editor = quillRefs.current[step.ordem]?.getEditor();
          if (!editor) continue;

          const container = editor.root;
          const chipElements = container.querySelectorAll('.ql-smart-decision');
          let needsUpdate = false;

          chipElements.forEach((chipEl: Element) => {
            const htmlEl = chipEl as HTMLElement;
            const type = htmlEl.getAttribute('data-type');
            const idStr = htmlEl.getAttribute('data-id');
            const id = idStr ? parseInt(idStr) : null;
            const currentlyInvalid = htmlEl.getAttribute('data-invalid') === 'true';

            let isValid = true;

            // Valida baseado no tipo
            if (type === 'add_tag' && id) {
              isValid = tags.some((t: any) => t.Id === id);
            } else if (type === 'transfer_agent' && id) {
              isValid = agents.some((a: any) => a.Id === id && a.isAtivo === true);
            } else if (type === 'transfer_user' && id) {
              isValid = users.some((u: any) => u.Id === id);
            } else if (type === 'assign_source' && id) {
              isValid = sources.some((s: any) => s.Id === id);
            } else if (type === 'transfer_stage' && id) {
              isValid = funnels.some((f: any) => f.estagios?.some((s: any) => s.Id === id));
            } else if (type === 'notify' && id) {
              isValid = notifications.some((n: any) => n.id === id);
            } else if (type === 'assign_product' && id) {
              isValid = products.some((p: any) => p.Id === id);
            } else if (type === 'stop_agent') {
              isValid = true; // stop_agent não precisa validação
            }

            // Se o estado de validade mudou, atualiza
            if ((isValid && currentlyInvalid) || (!isValid && !currentlyInvalid)) {
              needsUpdate = true;
            }
          });

          // Se precisa atualizar, re-renderiza o editor
          if (needsUpdate) {
            const Delta = (editor.constructor as any).imports.delta;
            const currentContents = editor.getContents();
            const newOps = currentContents.ops.map((op: any) => {
              if (op.insert && typeof op.insert === 'object' && op.insert.smartDecision) {
                const chipData = op.insert.smartDecision;
                const type = chipData.type;
                const id = chipData.id;

                let isValid = true;
                if (type === 'add_tag' && id) {
                  isValid = tags.some((t: any) => t.Id === id);
                } else if (type === 'transfer_agent' && id) {
                  isValid = agents.some((a: any) => a.Id === id && a.isAtivo === true);
                } else if (type === 'transfer_user' && id) {
                  isValid = users.some((u: any) => u.Id === id);
                } else if (type === 'assign_source' && id) {
                  isValid = sources.some((s: any) => s.Id === id);
                } else if (type === 'transfer_stage' && id) {
                  isValid = funnels.some((f: any) => f.estagios?.some((s: any) => s.Id === id));
                } else if (type === 'notify' && id) {
                  isValid = notifications.some((n: any) => n.id === id);
                } else if (type === 'assign_product' && id) {
                  isValid = products.some((p: any) => p.Id === id);
                }

                return {
                  ...op,
                  insert: {
                    smartDecision: {
                      ...chipData,
                      invalid: !isValid
                    }
                  }
                };
              }
              return op;
            });

            editor.setContents(new Delta(newOps), 'silent');
            const currentContent = editor.root.innerHTML;
            handleUpdateStep(step.ordem, 'descricao', currentContent);
          }
        }
      } catch (error) {
        console.error('Erro ao validar chips:', error);
      }
    };

    validateChips();
  }, [serviceSteps, isQuillReady, token]);

  // Listener para click em chips
  useEffect(() => {
    if (!isQuillReady || !canEdit) return;

    const handleChipClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const chipElement = target.closest('.ql-smart-decision') as HTMLElement;

      if (!chipElement) return;

      // Encontra qual roteiro contém este chip
      for (const step of serviceSteps) {
        const editor = quillRefs.current[step.ordem]?.getEditor();
        if (!editor) continue;

        const editorRoot = editor.root;
        if (editorRoot.contains(chipElement)) {
          const type = chipElement.getAttribute('data-type') as 'add_tag' | 'transfer_agent' | 'transfer_user' | 'assign_source' | 'transfer_stage' | 'notify' | 'assign_product' | 'stop_agent' | null;

          if (type) {
            // Encontra o índice do chip no conteúdo do editor
            const contents = editor.getContents();
            let chipIndex = -1;
            let currentIndex = 0;

            for (let i = 0; i < contents.ops.length; i++) {
              const op = contents.ops[i];

              if (op.insert && typeof op.insert === 'object' && op.insert.smartDecision) {
                // Verifica se este é o chip clicado comparando os atributos
                const chipData = op.insert.smartDecision;
                const chipId = chipElement.getAttribute('data-id');
                const chipLabel = chipElement.getAttribute('data-label');
                const chipType = chipElement.getAttribute('data-type');

                if (chipData.type === chipType &&
                    String(chipData.id || '') === String(chipId || '') &&
                    chipData.label === chipLabel) {
                  chipIndex = currentIndex;
                  break;
                }
              }

              // Incrementa o índice baseado no tamanho do insert
              if (typeof op.insert === 'string') {
                currentIndex += op.insert.length;
              } else {
                currentIndex += 1; // Embeds ocupam 1 posição
              }
            }

            if (chipIndex !== -1) {
              // Pega a posição do chip
              const rect = chipElement.getBoundingClientRect();
              setQuickCommandPosition({
                top: rect.bottom + 5,
                left: rect.left
              });
              setQuickCommandStep(step.ordem);
              setQuickCommandInitial(type);
              setChipToReplace({ index: chipIndex, length: 1 });
              setQuickCommandOpen(true);
            }
          }
          break;
        }
      }
    };

    document.addEventListener('click', handleChipClick);
    return () => document.removeEventListener('click', handleChipClick);
  }, [serviceSteps, isQuillReady, canEdit]);

  // Listener para copiar/colar preservando os chips
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // Verifica se está dentro de um editor Quill
      const container = selection.getRangeAt(0).commonAncestorContainer;
      const editorElement = (container instanceof Element ? container : container.parentElement)?.closest('.ql-editor');

      if (!editorElement) return;

      // Pega o HTML selecionado
      const range = selection.getRangeAt(0);
      const clonedSelection = range.cloneContents();
      const div = document.createElement('div');
      div.appendChild(clonedSelection);

      // Adiciona o HTML completo (com chips) ao clipboard
      const html = div.innerHTML;
      const text = div.textContent || '';

      e.clipboardData?.setData('text/html', html);
      e.clipboardData?.setData('text/plain', text);
      e.preventDefault();
    };

    const handlePaste = (e: ClipboardEvent) => {
      const focusedElement = document.activeElement;
      const editorElement = focusedElement?.closest('.ql-container');

      if (!editorElement) return;

      // Encontra qual editor está focado
      for (const step of serviceSteps) {
        const editorRef = quillRefs.current[step.ordem];
        if (editorRef && editorRef.getEditor().root === editorElement.querySelector('.ql-editor')) {
          const editor = editorRef.getEditor();
          const html = e.clipboardData?.getData('text/html');
          const text = e.clipboardData?.getData('text/plain');

          if (html && html.includes('smart-decision-token')) {
            // Se tem HTML com chips, usa o HTML
            e.preventDefault();

            const selection = editor.getSelection(true);
            if (selection) {
              const delta = editor.clipboard.convert(html);
              editor.updateContents(
                new (editor.constructor as any).imports.delta()
                  .retain(selection.index)
                  .delete(selection.length)
                  .concat(delta),
                'user'
              );
              editor.setSelection(selection.index + delta.length(), 0);

              const currentContent = editor.root.innerHTML;
              handleUpdateStep(step.ordem, 'descricao', currentContent);
            }
          } else if (text && text.includes('Ação:')) {
            // Se é texto puro com padrão de chips, reconstrói os chips
            e.preventDefault();

            const selection = editor.getSelection(true);
            if (selection) {
              const Delta = (editor.constructor as any).imports.delta;
              const delta = new Delta();

              // Regex para detectar padrões de chips no texto
              const chipPattern = /Ação: (Transferir para Agente|Transferir para Usuário|Transferir para o estágio|Notificação|Atribuir Produto|Interromper Agente|Adicionar Tag|Atribuir Fonte) #?(\d+)?\s*-?\s*([^\n\r]*?)(?=(?:Ação:|$))/g;

              let lastIndex = 0;
              let match;

              while ((match = chipPattern.exec(text)) !== null) {
                // Adiciona texto antes do chip
                if (match.index > lastIndex) {
                  delta.insert(text.substring(lastIndex, match.index));
                }

                const actionType = match[1];
                const id = match[2] ? parseInt(match[2]) : null;
                const label = match[3]?.trim() || '';

                // Mapeia o tipo de ação para o tipo de chip
                let chipType: 'add_tag' | 'transfer_agent' | 'transfer_user' | 'assign_source' | 'transfer_stage' | 'notify' | 'assign_product' | 'stop_agent' | null = null;

                if (actionType === 'Transferir para Agente') chipType = 'transfer_agent';
                else if (actionType === 'Transferir para Usuário') chipType = 'transfer_user';
                else if (actionType === 'Transferir para o estágio') chipType = 'transfer_stage';
                else if (actionType === 'Notificação') chipType = 'notify';
                else if (actionType === 'Atribuir Produto') chipType = 'assign_product';
                else if (actionType === 'Interromper Agente') chipType = 'stop_agent';
                else if (actionType === 'Adicionar Tag') chipType = 'add_tag';
                else if (actionType === 'Atribuir Fonte') chipType = 'assign_source';

                if (chipType) {
                  delta.insert({ smartDecision: { type: chipType, id, label } });
                }

                lastIndex = chipPattern.lastIndex;
              }

              // Adiciona texto restante
              if (lastIndex < text.length) {
                delta.insert(text.substring(lastIndex));
              }

              editor.updateContents(
                new Delta()
                  .retain(selection.index)
                  .delete(selection.length)
                  .concat(delta),
                'user'
              );
              editor.setSelection(selection.index + delta.length(), 0);

              const currentContent = editor.root.innerHTML;
              handleUpdateStep(step.ordem, 'descricao', currentContent);
            }
          }
          break;
        }
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [serviceSteps, isQuillReady]);

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
    <div className="h-full flex flex-col transition-colors duration-200" aria-busy={isLoading}>
      <style>{`
        .quill-editor-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .quill-editor-container .quill {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .quill-editor-container .quill .ql-container {
          border: 1px solid rgb(209 213 219) !important;
          border-radius: 0.5rem !important;
          background: white !important;
          backdrop-filter: blur(4px) !important;
          transition: all 200ms !important;
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .dark .quill-editor-container .quill .ql-container {
          border: 1px solid rgba(75, 85, 99, 0.5) !important;
          background: rgba(31, 41, 55, 0.4) !important;
        }
        .quill-editor-container .quill .ql-editor {
          height: 100%;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          padding: 1rem !important;
          color: rgb(17 24 39) !important;
        }
        .dark .quill-editor-container .quill .ql-editor {
          color: white !important;
        }
        .quill-editor-container .quill .ql-editor.ql-blank::before {
          color: rgb(156 163 175) !important;
        }
        .dark .quill-editor-container .quill .ql-editor.ql-blank::before {
          color: rgb(107 114 128) !important;
        }
        .quill-editor-container .quill .ql-toolbar {
          display: none !important;
        }
        /* Estilo da scrollbar para combinar com o RulesSection */
        .quill-editor-container .quill .ql-editor::-webkit-scrollbar {
          width: 8px;
        }
        .quill-editor-container .quill .ql-editor::-webkit-scrollbar-track {
          background: transparent;
        }
        .quill-editor-container .quill .ql-editor::-webkit-scrollbar-thumb {
          background: rgb(209 213 219);
          border-radius: 4px;
        }
        .dark .quill-editor-container .quill .ql-editor::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
        }
        .quill-editor-container .quill .ql-editor::-webkit-scrollbar-thumb:hover {
          background: rgb(156 163 175);
        }
        .dark .quill-editor-container .quill .ql-editor::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.7);
        }
      `}</style>

      {/* Botões de ação no topo junto com o botão Salvar */}
      {canEdit && serviceSteps.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {/* Botões de ação à esquerda */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleInsertSituationTemplate(serviceSteps[currentStepIndex].ordem);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              title="Inserir Modelo Situação/Mensagem"
            >
              <MessageSquare className="w-4 h-4" />
              Situação/Mensagem
            </button>
            <input
              type="file"
              id="file-upload-global"
              accept="image/*,video/*,audio/*,application/pdf"
              onChange={(e) => {
                handleFileUpload(serviceSteps[currentStepIndex].ordem, e);
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => document.getElementById('file-upload-global')?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
            >
              <Upload className="w-4 h-4" />
              Adicionar Mídia
            </button>
            <button
              type="button"
              onClick={() => {
                handleOpenSmartDecision(serviceSteps[currentStepIndex].ordem);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              title="Inserir Decisão Inteligente (Ctrl+D)"
            >
              <Zap className="w-4 h-4" />
              Decisão Inteligente
            </button>
          </div>

          {/* Indicadores e Botão Salvar à direita */}
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Alterações não salvas
              </div>
            )}
            {successMessage && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Roteiros salvos com sucesso!
              </div>
            )}
            <button
              onClick={handleSaveWithModal}
              disabled={savingSteps || !hasUnsavedChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                savingSteps || !hasUnsavedChanges
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
              }`}
            >
              {savingSteps ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Campo de texto com scroll interno */}
      <div className="flex-1 relative quill-editor-container">
        {isQuillReady && serviceSteps.length > 0 && (
          <div className="h-full">
            {serviceSteps.map((step, index) => (
              <div
                key={step.ordem}
                className="h-full"
                style={{ display: index === currentStepIndex ? 'block' : 'none' }}
              >
                <ReactQuill
                  ref={(el) => (quillRefs.current[step.ordem] = el)}
                  theme="snow"
                  value={step.descricao}
                  onChange={
                    canEdit
                      ? (content) =>
                          handleUpdateStep(step.ordem, "descricao", content)
                      : () => {}
                  }
                  modules={{ toolbar: false }}
                  formats={formats}
                  readOnly={!canEdit}
                  placeholder="Descreva como o agente deve conduzir a conversa neste roteiro..."
                  className="quill h-full"
                />
                {isUploading && activeStep === step.ordem && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 dark:text-blue-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {serviceSteps.length === 0 && canEdit && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum roteiro cadastrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
              Crie o roteiro que o seu agente seguirá nas conversas com os clientes. Esse roteiro define a estrutura de raciocínio, as perguntas e o estilo de comunicação da IA.
            </p>
            <button
              onClick={handleAddStep}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
              disabled={isLoading}
            >
              Adicionar Roteiro
            </button>
          </div>
        )}
        {serviceSteps.length === 0 && !canEdit && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum roteiro cadastrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
              Nenhum roteiro foi configurado para este agente.
            </p>
          </div>
        )}
      </div>

      {/* Inputs de arquivo escondidos para cada step */}
      {serviceSteps.map((step) => (
        <input
          key={`file-${step.ordem}`}
          type="file"
          id={`file-upload-${step.ordem}`}
          accept="image/*,video/*,audio/*,application/pdf"
          onChange={(e) => handleFileUpload(step.ordem, e)}
          className="hidden"
        />
      ))}

      <SmartDecisionModal
        isOpen={smartDecisionModalOpen}
        onClose={() => setSmartDecisionModalOpen(false)}
        onInsert={handleInsertSmartDecision}
        token={token}
        currentAgentId={idAgente}
      />
      <QuickCommandMenu
        isOpen={quickCommandOpen}
        position={quickCommandPosition}
        onInsert={handleInsertQuickCommand}
        onClose={() => {
          setQuickCommandOpen(false);
          setQuickCommandInitial(null);
          setChipToReplace(null);
        }}
        token={token}
        currentAgentId={idAgente}
        initialCommand={quickCommandInitial}
      />
      {isLoading && (
        <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 dark:text-blue-400" />
        </div>
      )}
    </div>
  );
}

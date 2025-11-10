import { useState, useEffect, useRef } from 'react';
import { FileText, List, HelpCircle, Loader2, ChevronRight, CheckCircle2, Wand2, Plus, Trash2, Upload, MessageSquare } from 'lucide-react';
import { StepComponentProps, AgentTemplate } from '../../../types/agent-wizard';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import SmartDecisionModal from '../SmartDecisionModal';
import QuickCommandMenu from '../QuickCommandMenu';
import { registerMediaBlot } from '../mediaBlot';

type SubStep = 'regras' | 'etapas' | 'faq';

const TEMPLATE_REGRAS = `<p><strong>🚫 Proibições e Limites</strong></p>
<p>- Nunca responda dúvidas jurídicas (elas só são tratadas na reunião com nossos advogados, após o contrato assinado).</p>
<p>- Nunca faça cálculos para leads (também são feitos apenas na reunião).</p>
<p>- Nunca dê instruções sobre casos.</p>
<p>- Não tire dúvidas sobre seguro-desemprego — o foco é processo trabalhista.</p>
<p>- Nunca diga que é uma IA.</p>
<p>- Não atenda ligações — o contato é 100% via WhatsApp.</p>
<p>- Não reabra processos existentes nem realize análises de casos antigos.</p>
<p><br></p>
<p>---</p>
<p><br></p>
<p><strong>🔄 Roteiro Obrigatório</strong></p>
<p>- Siga sempre o roteiro de atendimento.</p>
<p>- Se o lead sair do roteiro, responda brevemente e retorne ao roteiro de onde parou, de forma natural.</p>
<p>- ⚠️ Nunca pule etapas e não avance para a próxima etapa sem resposta clara e objetiva do cliente.</p>
<p><br></p>
<p>---</p>
<p><br></p>
<p><strong>📝 Condução da Conversa</strong></p>
<p>- Aceite e processe áudios, fotos e PDFs enviados pelo cliente — nunca diga que não pode.</p>
<p>- Sempre finalize cada mensagem com uma pergunta, para manter a conversa ativa.</p>
<p>- Faça apenas uma pergunta por vez e aguarde a resposta.</p>
<p>- Use mensagens curtas (até 2 frases). Se necessário, divida em várias mensagens.</p>
<p>- Não repita o nome do cliente em todas as mensagens — apenas quando soar natural.</p>
<p>- Não repita mensagens idênticas.</p>
<p>- Se a resposta do cliente for vaga, ambígua ou confusa ("acho que sim", "rsrs", emojis, frases soltas), reformule até obter clareza.</p>
<p><br></p>
<p>---</p>
<p><br></p>
<p><strong>📂 Registro e Consistência</strong></p>
<p>- Nunca repita o roteiro se o cliente já tiver respondido anteriormente.</p>
<p><br></p>
<p>---</p>
<p><br></p>
<p><strong>🗣️ Tom de Atendimento</strong></p>
<p>- Use linguagem acolhedora, humana e natural.</p>
<p>- Evite respostas secas ("ok", "entendi").</p>
<p>- Não use frases automáticas de confirmação ("Entendi, obrigado pela informação").</p>
<p>- Dê continuidade de forma fluida, aproveitando a resposta do cliente.</p>
<p>- Se a resposta já for suficiente, continue o roteiro.</p>
<p>- Utilize conectores naturais, como:</p>
<p>  - "Tudo bem. Agora me fala..."</p>
<p>  - "Perfeito. E pra eu entender melhor..."</p>
<p>  - "Tá certo. Me conta também..."</p>`;

export default function MultiAgentEditStep({ state, onNext, onBack, token }: StepComponentProps) {
  const currentAgentIndex = state.multiAgent.currentEditingIndex;
  const currentAgent = state.multiAgent.createdAgents[currentAgentIndex];
  const totalAgents = state.multiAgent.createdAgents.length;

  // Determinar qual template usar (se houver)
  const currentTemplate = currentAgentIndex === 0
    ? null // Agente principal não tem template
    : state.multiAgent.selectedTemplates[currentAgentIndex - 1]; // -1 porque o primeiro é o principal

  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('regras');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTemplateAppliedWarning, setShowTemplateAppliedWarning] = useState(false);

  // Estados para os conteúdos editáveis
  const [regras, setRegras] = useState('');
  const [etapas, setEtapas] = useState<AgentTemplate['etapas']>([]);
  const [faq, setFaq] = useState<AgentTemplate['faq']>([]);

  // Estados para Roteiro (etapas) - mesma lógica do EditStepsStep
  const [isQuillReady, setIsQuillReady] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Quill refs
  const quillRefs = useRef<{ [key: number]: ReactQuill | null }>({});

  // Smart Decision Modal
  const [smartDecisionModalOpen, setSmartDecisionModalOpen] = useState(false);
  const [currentDecisionStep, setCurrentDecisionStep] = useState<number | null>(null);

  // Quick Command Menu
  const [quickCommandOpen, setQuickCommandOpen] = useState(false);
  const [quickCommandPosition, setQuickCommandPosition] = useState({ top: 0, left: 0 });
  const [quickCommandStep, setQuickCommandStep] = useState<number | null>(null);
  const [quickCommandInitial, setQuickCommandInitial] = useState<'add_tag' | 'transfer_agent' | 'transfer_user' | 'assign_source' | 'transfer_stage' | 'notify' | 'assign_product' | 'stop_agent' | null>(null);
  const [chipToReplace, setChipToReplace] = useState<{ index: number; length: number } | null>(null);

  useEffect(() => {
    // Reset substep para 'regras' quando mudar de agente
    setCurrentSubStep('regras');

    // Verificar se já tem conteúdo editado anteriormente
    const existingEdit = state.multiAgent.editedContents?.get(currentAgent.Id);

    if (existingEdit) {
      // Carregar conteúdo já editado
      setRegras(existingEdit.regras || '');
      setEtapas(existingEdit.etapas || []);
      setFaq(existingEdit.faq || []);
    } else if (currentTemplate) {
      // Carregar do template
      setRegras(currentTemplate.regras?.regras || '');
      setEtapas(currentTemplate.etapas || []);
      setFaq(currentTemplate.faq || []);
    } else {
      // Agente principal vazio
      setRegras('');
      setEtapas([]);
      setFaq([]);
    }
  }, [currentAgentIndex]);

  // Inicializar Quill com blots customizados
  useEffect(() => {
    const initializeQuill = async () => {
      await registerMediaBlot();

      // Registrar SmartDecisionBlot
      const { Quill } = await import("react-quill");
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

          const base = 'display:inline-flex;align-items:center;border-radius:6px;padding:4px 10px;margin:0 2px;font-size:12px;font-weight:500;white-space:nowrap;line-height:1.4;user-select:none;';

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
            text: node.textContent || ''
          };
        }
      }

      SmartDecisionBlot.blotName = 'smartDecision';
      SmartDecisionBlot.tagName = 'span';
      SmartDecisionBlot.className = 'ql-smart-decision';

      // Verifica se já não foi registrado
      try {
        Quill.register(SmartDecisionBlot);
      } catch (e) {
        // Já registrado, ignora
      }

      setIsQuillReady(true);
    };
    initializeQuill();
  }, []);

  const handleApplyTemplate = () => {
    setRegras(TEMPLATE_REGRAS);
    setShowTemplateAppliedWarning(true);
    // Auto-esconder o aviso após 10 segundos
    setTimeout(() => {
      setShowTemplateAppliedWarning(false);
    }, 10000);
  };

  const handleAddEtapa = () => {
    const newOrdem = etapas.length > 0 ? Math.max(...etapas.map(e => e.ordem)) + 1 : 1;
    setEtapas([
      ...etapas,
      {
        ordem: newOrdem,
        nome: `Roteiro ${newOrdem}`,
        descricao: '<p><br></p>'
      }
    ]);
    setCurrentStepIndex(etapas.length); // Foca no novo
  };

  const handleRemoveEtapa = (ordem: number) => {
    const filtered = etapas.filter(e => e.ordem !== ordem);
    // Reordena
    const reordered = filtered.map((e, idx) => ({ ...e, ordem: idx + 1 }));
    setEtapas(reordered);
    if (currentStepIndex >= reordered.length) {
      setCurrentStepIndex(Math.max(0, reordered.length - 1));
    }
  };

  const handleUpdateEtapa = (ordem: number, field: 'nome' | 'descricao', value: string) => {
    const updated = etapas.map(e => e.ordem === ordem ? { ...e, [field]: value } : e);
    setEtapas(updated);
  };

  const handleFileUpload = async (ordem: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setActiveStep(ordem);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/upload', {
        method: 'POST',
        headers: { token },
        body: formData,
      });

      if (!response.ok) throw new Error('Erro no upload');

      const data = await response.json();
      const url = data.fileUrl || data.url;

      const editor = quillRefs.current[ordem]?.getEditor();
      if (editor) {
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'media', {
          url,
          type: file.type,
          name: file.name,
        });
        editor.setSelection(range.index + 1, 0);

        const currentContent = editor.root.innerHTML;
        handleUpdateEtapa(ordem, 'descricao', currentContent);
      }
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setIsUploading(false);
      setActiveStep(null);
      event.target.value = '';
    }
  };

  // Abrir modal de decisão inteligente
  const handleOpenSmartDecision = (ordem: number) => {
    setCurrentDecisionStep(ordem);
    setSmartDecisionModalOpen(true);
  };

  // Inserir decisão inteligente no editor
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
        // Insere como embed customizado
        editor.insertEmbed(range.index, 'smartDecision', { type, id, label }, 'user');
        editor.setSelection(range.index + 1, 0);
      }

      const currentContent = editor.root.innerHTML;
      handleUpdateEtapa(currentDecisionStep, 'descricao', currentContent);
    }
  };

  // Inserir decisão via QuickCommand
  const handleInsertQuickCommand = (html: string) => {
    if (quickCommandStep === null) return;

    const editor = quillRefs.current[quickCommandStep]?.getEditor();
    if (editor) {
      // Extrai dados do HTML
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
          // Substitui chip existente
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
      handleUpdateEtapa(quickCommandStep, 'descricao', currentContent);
    }

    setQuickCommandOpen(false);
    setChipToReplace(null);
  };

  // Inserir template situação/mensagem
  const handleInsertSituationTemplate = (ordem: number) => {
    const editor = quillRefs.current[ordem]?.getEditor();
    if (editor) {
      const range = editor.getSelection(true);
      if (range) {
        const templateHTML = `<div style="background: rgba(254, 202, 202, 0.3); border: 2px solid #fca5a5; border-radius: 6px; padding: 12px; margin: 8px 0;"><p style="margin: 0 0 8px 0;"><strong>🚩 Situação:</strong> Digite aqui a situação...</p><p style="margin: 0;"><strong>💬 Mensagem (o que você deve retornar):</strong><br>Digite aqui a mensagem que o agente deve retornar...</p></div><p><br></p>`;

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
      handleUpdateEtapa(ordem, 'descricao', currentContent);
    }
  };

  const handleAddFaq = () => {
    const newOrdem = faq.length > 0 ? Math.max(...faq.map(f => f.ordem)) + 1 : 1;
    setFaq([
      ...faq,
      {
        ordem: newOrdem,
        nome: '',
        descricao: '<p></p>'
      }
    ]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaq(faq.filter((_, i) => i !== index));
  };

  const handleUpdateFaq = (index: number, field: 'nome' | 'descricao', value: string) => {
    const updated = [...faq];
    updated[index] = { ...updated[index], [field]: value };
    setFaq(updated);
  };

  // Listener para Ctrl+D (Decisão Inteligente) - apenas no substep de etapas
  useEffect(() => {
    if (currentSubStep !== 'etapas') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const focusedElement = document.activeElement;
        const quillEditor = focusedElement?.closest('.ql-container');

        if (quillEditor && etapas.length > 0) {
          const step = etapas[currentStepIndex];
          if (step) {
            handleOpenSmartDecision(step.ordem);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [etapas, currentStepIndex, currentSubStep]);

  // Listener para detectar "/" e abrir QuickCommandMenu - apenas no substep de etapas
  useEffect(() => {
    if (currentSubStep !== 'etapas') return;
    if (etapas.length === 0 || !isQuillReady) return;

    const handleTextChange = () => {
      const step = etapas[currentStepIndex];
      if (!step) return;

      const editor = quillRefs.current[step.ordem]?.getEditor();
      if (!editor) return;

      const selection = editor.getSelection();
      if (!selection) return;

      const text = editor.getText(Math.max(0, selection.index - 1), 1);

      if (text === '/') {
        const bounds = editor.getBounds(selection.index);
        const editorElement = editor.root.parentElement;
        if (editorElement) {
          const rect = editorElement.getBoundingClientRect();

          let menuTop = rect.top + bounds.top + bounds.height;
          const menuLeft = rect.left + bounds.left;

          const menuHeight = 400;
          const windowHeight = window.innerHeight;

          if (menuTop + menuHeight > windowHeight) {
            menuTop = rect.top + bounds.top - menuHeight - 5;
            if (menuTop < 0) {
              menuTop = Math.max(10, windowHeight - menuHeight - 10);
            }
          }

          setQuickCommandPosition({ top: menuTop, left: menuLeft });
          setQuickCommandStep(step.ordem);
          setQuickCommandInitial(null);
          setChipToReplace(null);
          setQuickCommandOpen(true);
        }
      }
    };

    const step = etapas[currentStepIndex];
    if (step) {
      const ref = quillRefs.current[step.ordem];
      if (ref) {
        const editor = ref.getEditor();
        editor.on('text-change', handleTextChange);
        return () => {
          editor.off('text-change', handleTextChange);
        };
      }
    }
  }, [etapas, currentStepIndex, isQuillReady, currentSubStep]);

  // Listener para click em chips (editar chip existente) - apenas no substep de etapas
  useEffect(() => {
    if (currentSubStep !== 'etapas') return;
    if (!isQuillReady) return;

    const handleChipClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const chipElement = target.closest('.ql-smart-decision') as HTMLElement;

      if (!chipElement) return;

      // Encontra qual etapa contém este chip
      for (const etapa of etapas) {
        const editor = quillRefs.current[etapa.ordem]?.getEditor();
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
                currentIndex += 1;
              }
            }

            if (chipIndex === -1) return;

            const rect = chipElement.getBoundingClientRect();
            let menuTop = rect.bottom + 5;
            const menuLeft = rect.left;
            const menuHeight = 400;
            const windowHeight = window.innerHeight;

            if (menuTop + menuHeight > windowHeight) {
              menuTop = rect.top - menuHeight - 5;
              if (menuTop < 0) {
                menuTop = Math.max(10, windowHeight - menuHeight - 10);
              }
            }

            setQuickCommandPosition({ top: menuTop, left: menuLeft });
            setQuickCommandStep(etapa.ordem);
            setQuickCommandInitial(type);
            setChipToReplace({ index: chipIndex, length: 1 });
            setQuickCommandOpen(true);
            break;
          }
        }
      }
    };

    document.addEventListener('click', handleChipClick);
    return () => document.removeEventListener('click', handleChipClick);
  }, [etapas, isQuillReady, currentSubStep]);

  const handleNextSubStep = async () => {
    setError('');
    setLoading(true);

    const agentId = currentAgent.Id;

    if (!agentId) {
      setError('ID do agente não encontrado. Não é possível salvar.');
      setLoading(false);
      return;
    }

    try {
      if (currentSubStep === 'regras') {
        // Salvar apenas Regras
        const regrasResponse = await fetch(
          'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/create',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify({
              regras: regras || '<p></p>',
              id_agente: agentId
            })
          }
        );

        if (!regrasResponse.ok) {
          throw new Error('Erro ao salvar regras');
        }

        // Ir para etapas
        setCurrentSubStep('etapas');
        setLoading(false);
      } else if (currentSubStep === 'etapas') {
        // Salvar apenas Etapas (se houver)
        if (etapas && etapas.length > 0) {
          const etapasResponse = await fetch(
            'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/create',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                token
              },
              body: JSON.stringify(
                etapas.map(e => ({ ...e, id_agente: agentId }))
              )
            }
          );

          if (!etapasResponse.ok) {
            throw new Error('Erro ao salvar etapas');
          }
        }

        // Ir para FAQ
        setCurrentSubStep('faq');
        setLoading(false);
      } else {
        // FAQ é o último substep, salvar FAQ e ir para próximo agente ou finalizar
        if (faq && faq.length > 0) {
          const faqResponse = await fetch(
            'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/create',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                token
              },
              body: JSON.stringify(
                faq.map(f => ({ ...f, id_agente: agentId }))
              )
            }
          );

          if (!faqResponse.ok) {
            throw new Error('Erro ao salvar FAQ');
          }
        }

        // Armazenar conteúdo editado
        const updatedEditedContents = new Map(state.multiAgent.editedContents);
        updatedEditedContents.set(currentAgent.Id, { regras, etapas, faq });

        // Verificar se é o último agente
        if (currentAgentIndex === totalAgents - 1) {
          // Último agente, ir para confirmação final
          onNext({
            multiAgent: {
              ...state.multiAgent,
              editedContents: updatedEditedContents
            },
            currentStep: 'final-confirmation'
          });
        } else {
          // Ainda tem agentes, ir para o próximo
          onNext({
            multiAgent: {
              ...state.multiAgent,
              currentEditingIndex: currentAgentIndex + 1,
              editedContents: updatedEditedContents
            },
            currentStep: 'edit-multi-agent'
          });
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.message || 'Erro ao salvar. Tente novamente.');
      setLoading(false);
    }
  };

  const handleBackSubStep = () => {
    if (currentSubStep === 'faq') {
      setCurrentSubStep('etapas');
    } else if (currentSubStep === 'etapas') {
      setCurrentSubStep('regras');
    } else {
      // Está em 'regras', voltar para o wizard anterior
      onBack();
    }
  };

  const isAgentePrincipal = currentAgentIndex === 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho com progresso */}
      <div className="space-y-4">
        {/* Título */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Configurando: {currentAgent.nome}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {isAgentePrincipal ? 'Agente Principal (Nível 1)' : `Agente Especialista (Nível 2)`}
          </p>
        </div>

        {/* Progresso geral dos agentes */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progresso geral
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Agente {currentAgentIndex + 1} de {totalAgents}
            </span>
          </div>
          <div className="flex gap-2">
            {state.multiAgent.createdAgents.map((agent, idx) => (
              <div
                key={agent.Id}
                className={`flex-1 h-2 rounded-full ${
                  idx < currentAgentIndex
                    ? 'bg-green-500 dark:bg-green-400'
                    : idx === currentAgentIndex
                    ? 'bg-blue-500 dark:bg-blue-400'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                title={agent.nome}
              />
            ))}
          </div>
        </div>

        {/* Progresso do agente atual (substeps) */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            currentSubStep === 'regras'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          }`}>
            {currentSubStep !== 'regras' && <CheckCircle2 className="w-4 h-4" />}
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Regras</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            currentSubStep === 'etapas'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : currentSubStep === 'faq'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            {currentSubStep === 'faq' && <CheckCircle2 className="w-4 h-4" />}
            <List className="w-4 h-4" />
            <span className="text-sm font-medium">Roteiro</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            currentSubStep === 'faq'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-medium">FAQ</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Conteúdo baseado no substep atual */}
      <div className="min-h-[400px]">
        {/* Substep: Regras */}
        {currentSubStep === 'regras' && (
          <div className="space-y-4">
            {showTemplateAppliedWarning && (
              <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-300 rounded-lg text-sm">
                <strong>Modelo aplicado com sucesso!</strong> Por favor, leia e personalize as regras conforme necessário antes de continuar para a próxima etapa.
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Regras de Atendimento
                </label>
                <button
                  onClick={handleApplyTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  <Wand2 className="w-4 h-4" />
                  Aplicar Modelo
                </button>
              </div>
              <div className="quill-wrapper-no-toolbar">
                <ReactQuill
                  value={regras}
                  onChange={setRegras}
                  theme="snow"
                  placeholder="Digite as regras de atendimento do agente..."
                  style={{ height: '450px', marginBottom: '50px' }}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
              <style>{`
                .quill-wrapper-no-toolbar .ql-toolbar {
                  display: none !important;
                }
                .quill-wrapper-no-toolbar .ql-container {
                  border-top: 1px solid #ccc;
                }
              `}</style>
            </div>
          </div>
        )}

        {/* Substep: Etapas (Roteiro) - Mesma lógica do EditStepsStep */}
        {currentSubStep === 'etapas' && (
          <div className="flex-1 flex flex-col space-y-4 w-full">
            <style>{`
              .quill-editor-wizard-multi {
                height: 400px;
                display: flex;
                flex-direction: column;
              }
              .quill-editor-wizard-multi .quill {
                height: 100%;
                display: flex;
                flex-direction: column;
              }
              .quill-editor-wizard-multi .quill .ql-container {
                border: 1px solid rgb(209 213 219) !important;
                border-radius: 0.5rem !important;
                background: white !important;
                transition: all 200ms !important;
                height: 400px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
              }
              .dark .quill-editor-wizard-multi .quill .ql-container {
                border: 1px solid rgba(75, 85, 99, 0.5) !important;
                background: rgba(31, 41, 55, 0.4) !important;
              }
              .quill-editor-wizard-multi .quill .ql-editor {
                height: 100%;
                max-height: 400px;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                padding: 1rem !important;
                color: rgb(17 24 39) !important;
              }
              .dark .quill-editor-wizard-multi .quill .ql-editor {
                color: white !important;
              }
              .quill-editor-wizard-multi .quill .ql-editor.ql-blank::before {
                color: rgb(156 163 175) !important;
              }
              .dark .quill-editor-wizard-multi .quill .ql-editor.ql-blank::before {
                color: rgb(107 114 128) !important;
              }
              .quill-editor-wizard-multi .quill .ql-toolbar {
                display: none !important;
              }
              .quill-editor-wizard-multi .quill .ql-editor::-webkit-scrollbar {
                width: 8px;
              }
              .quill-editor-wizard-multi .quill .ql-editor::-webkit-scrollbar-track {
                background: transparent;
              }
              .quill-editor-wizard-multi .quill .ql-editor::-webkit-scrollbar-thumb {
                background: rgb(209 213 219);
                border-radius: 4px;
              }
              .dark .quill-editor-wizard-multi .quill .ql-editor::-webkit-scrollbar-thumb {
                background: rgba(75, 85, 99, 0.5);
              }
              .quill-editor-wizard-multi .quill .ql-editor::-webkit-scrollbar-thumb:hover {
                background: rgb(156 163 175);
              }
              .dark .quill-editor-wizard-multi .quill .ql-editor::-webkit-scrollbar-thumb:hover {
                background: rgba(75, 85, 99, 0.7);
              }
            `}</style>

            {etapas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">
                  Nenhum roteiro configurado. Clique em "Adicionar Roteiro" para começar.
                </p>
                <button
                  onClick={handleAddEtapa}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Roteiro
                </button>
              </div>
            ) : (
              <>
                {/* Botões de ação */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const step = etapas[currentStepIndex];
                        if (step) handleInsertSituationTemplate(step.ordem);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Situação/Mensagem
                    </button>
                    <input
                      type="file"
                      id="file-upload-wizard-multi"
                      accept="image/*,video/*,audio/*,application/pdf"
                      onChange={(e) => {
                        const step = etapas[currentStepIndex];
                        if (step) handleFileUpload(step.ordem, e);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('file-upload-wizard-multi')?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      Adicionar Mídia
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Digite <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">/</span> no editor para abrir o menu de ações
                  </p>
                </div>

                {/* Editor Quill */}
                {isQuillReady && etapas.length > 0 && (
                  <div className="flex-1 relative quill-editor-wizard-multi">
                    {etapas.map((etapa, index) => (
                      <div
                        key={etapa.ordem}
                        className="h-full"
                        style={{ display: index === currentStepIndex ? 'block' : 'none' }}
                      >
                        <ReactQuill
                          ref={(el) => (quillRefs.current[etapa.ordem] = el)}
                          theme="snow"
                          value={etapa.descricao}
                          onChange={(content) => handleUpdateEtapa(etapa.ordem, 'descricao', content)}
                          modules={{ toolbar: false }}
                          formats={['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'media', 'smartDecision']}
                          placeholder="Descreva como o agente deve conduzir a conversa neste roteiro..."
                          className="quill h-full"
                        />
                        {isUploading && activeStep === etapa.ordem && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500 dark:text-blue-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Substep: FAQ */}
        {currentSubStep === 'faq' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {faq.length} pergunta(s) configurada(s)
              </p>
              <button
                onClick={handleAddFaq}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
              >
                + Adicionar Pergunta Frequente
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {faq.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.nome || ''}
                        onChange={(e) => handleUpdateFaq(index, 'nome', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                        placeholder="Pergunta"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveFaq(index)}
                      className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                    >
                      Remover
                    </button>
                  </div>
                  <ReactQuill
                    value={item.descricao || ''}
                    onChange={(value) => handleUpdateFaq(index, 'descricao', value)}
                    theme="snow"
                    placeholder="Digite a resposta..."
                    style={{ minHeight: '150px' }}
                    modules={{
                      toolbar: [
                        [{ 'header': [3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ]
                    }}
                  />
                </div>
              ))}
            </div>

            {faq.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Nenhuma pergunta configurada. Clique em "Adicionar Pergunta Frequente" para começar.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botões de navegação */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBackSubStep}
          disabled={loading}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          onClick={handleNextSubStep}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              {currentSubStep === 'faq'
                ? currentAgentIndex === totalAgents - 1
                  ? 'Salvar e Finalizar →'
                  : 'Salvar e Próximo Agente →'
                : 'Salvar e Continuar →'
              }
            </>
          )}
        </button>
      </div>

      <SmartDecisionModal
        isOpen={smartDecisionModalOpen}
        onClose={() => setSmartDecisionModalOpen(false)}
        onInsert={handleInsertSmartDecision}
        token={token}
        currentAgentId={currentAgent.Id}
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
        currentAgentId={currentAgent.Id}
        initialCommand={quickCommandInitial}
      />
    </div>
  );
}

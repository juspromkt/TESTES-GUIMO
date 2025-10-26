import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Phone,
  User,
  Mail,
  AlertCircle,
  Loader2,
  Pencil,
  X,
  Check,
  Trash2,
  GitBranch,
  Calendar,
  Clock,
  Plus,
  Upload,
  Shield,
  MoreVertical,
  Edit,
  Save,
  Package,
  Bot,
  Building2
} from 'lucide-react';
import type { Deal } from '../types/deal';
import type { Funil } from '../types/funil';
import type { Fonte } from '../types/fonte';
import type { Anuncio } from '../types/anuncio';
import type { CampoPersonalizado, CampoPersonalizadoValor } from '../types/campo';
import type { Departamento } from '../types/departamento';
import { isDepartamento } from '../types/departamento';
import AnuncioCard from '../components/crm/AnuncioCard';
import Modal from '../components/Modal';
import DealAppointmentsTab from '../components/crm/DealAppointmentsTab';
import DealSummaryWidget from '../components/crm/DealSummaryWidget';
import { hasPermission } from '../utils/permissions';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';

type TabType = 'geral' | 'conversas' | 'agendamentos';

interface EditableContact {
  id: number;
  nome: string;
  email: string;
  telefone: string;
}

interface EditableDeal {
  Id: number;
  titulo: string;
  descricao: string;
  id_usuario?: number | null;
  id_fonte: number | null;
}

interface DealDetailsProps {
  dealId?: number;
  hideConversations?: boolean;
  onClose?: () => void;
}


interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
  };
  pushName: string;
  messageType: 'imageMessage' | 'audioMessage' | 'conversation';
  message: {
    conversation: string | null;
    audioMessage?: {
      url: string | null;
    };
    mediaUrl: string | null;
  };
  data: string;
  messageTimestamp?: number;
  // Flags para identificação de remetente
  respostaIA?: boolean;
  isFollowUp?: boolean;
  isLembrete?: boolean;
  isGerouIntervencao?: boolean;
  isIntervencaoAtiva?: boolean;
  isAbriuSessao?: boolean;
}

interface User {
  Id: number;
  nome: string;
  email: string;
  tipo: string;
  isAtivo: boolean;
}

interface Activity {
  Id: number;
  id_negociacao: number;
  id_usuario: number;
  descricao: string;
  CreatedAt: string;
  UpdatedAt: string | null;
}

interface MediaItem {
  url: string;
  type: string;
  name?: string;
}

export default function DealDetails({ dealId: dealIdProp, hideConversations = false, onClose }: DealDetailsProps = {}) {
  const params = useParams();
  const navigate = useNavigate();
    const id = dealIdProp ?? Number(params.id);
  const [activeTab, setActiveTab] = useState<TabType>('geral');
  const [deal, setDeal] = useState<Deal | null>(null);
  const [fonte, setFonte] = useState<Fonte | null>(null);
  const [fontes, setFontes] = useState<Fonte[]>([]);
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  // Edit states
  const [editingBasicInfo, setEditingBasicInfo] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState(false);
  const [editedDeal, setEditedDeal] = useState<EditableDeal | null>(null);
  const [editedContact, setEditedContact] = useState<EditableContact | null>(null);
  const [savingChanges, setSavingChanges] = useState(false);

  // Funnel states
  const [funnels, setFunnels] = useState<Funil[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<number | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  
  // User states
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [responsibleUser, setResponsibleUser] = useState<User | null>(null);
  const [selectedFonteId, setSelectedFonteId] = useState<number | null>(null);

  // Tags states
  const [availableTags, setAvailableTags] = useState<import('../types/tag').Tag[]>([]);
  const [dealTags, setDealTags] = useState<import('../types/tag').Tag[]>([]);
  const [editingTags, setEditingTags] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [savingTag, setSavingTag] = useState(false);

  // Departamentos states
  const [availableDepartamentos, setAvailableDepartamentos] = useState<Departamento[]>([]);
  const [dealDepartamentos, setDealDepartamentos] = useState<Departamento[]>([]);
  const [editingDepartamentos, setEditingDepartamentos] = useState(false);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<number | null>(null);
  const [savingDepartamento, setSavingDepartamento] = useState(false);

  // Custom fields states
  const [customFields, setCustomFields] = useState<CampoPersonalizado[]>([]);
  const [leadFields, setLeadFields] = useState<CampoPersonalizadoValor[]>([]);
  const [fieldValues, setFieldValues] = useState<
    Record<number, string | number | boolean | null>
  >({});
  const [savingFieldId, setSavingFieldId] = useState<number | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [addingField, setAddingField] = useState(false);
  const [newFieldId, setNewFieldId] = useState<number | null>(null);
  const [newFieldValue, setNewFieldValue] = useState<string | number | boolean | null>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [creatingSummary, setCreatingSummary] = useState(false);
  const [deletingSummary, setDeletingSummary] = useState(false);
  
  const buildRemoteJid = (phone: string) => {
    return phone.replace(/\D/g, '') + '@s.whatsapp.net';
  };

  const goToConversation = () => {
    if (deal?.contato?.telefone) {
      const jid = buildRemoteJid(deal.contato.telefone);
      navigate('/conversas', { state: { remoteJid: jid, name: deal.contato.nome } });
    }
  };

  const renderFieldInput = (
    field: CampoPersonalizado,
    value: string | number | boolean | null,
    onChange: (val: string | number | boolean | null) => void
  ) => {
    const baseClasses =
      'w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-theme';
    switch (field.tipo) {
      case 'INTEGER':
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : parseInt(e.target.value))}
            className={baseClasses}
          />
        );
      case 'DECIMAL':
        return (
          <input
            type="number"
            step="0.01"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className={baseClasses}
          />
        );
      case 'STRING':
        return (
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
          />
        );
      case 'BOOLEAN':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4"
          />
        );
      case 'DATE': {
        let dateValue = '';
        if (value) {
          const d = new Date(String(value));
          if (!isNaN(d.getTime())) {
            dateValue = format(d, 'yyyy-MM-dd');
          }
        }
        return (
          <input
            type="date"
            value={dateValue}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
          />
        );
      }
      case 'DATETIME': {
        let dateValue = '';
        if (value) {
          const d = new Date(String(value));
          if (!isNaN(d.getTime())) {
            dateValue = format(d, "yyyy-MM-dd'T'HH:mm");
          }
        }
        return (
          <input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
          />
        );
      }
      default:
        return null;
    }
  };

  const parseFieldValue = (
    field: CampoPersonalizado,
    value: string | number | boolean | null
  ) => {
    if (value === '' || value === undefined || value === null) return value;
    switch (field.tipo) {
      case 'INTEGER':
        return parseInt(value);
      case 'DECIMAL':
        return parseFloat(value);
      case 'BOOLEAN':
        return Boolean(value);
      default:
        return value;
    }
  };

  const formatFieldValue = (
    field: CampoPersonalizado,
    value: string | number | boolean | null
  ) => {
    if (value === undefined || value === null || value === '') return '';
    switch (field.tipo) {
      case 'BOOLEAN':
        return value ? 'Sim' : 'Não';
      case 'DATE': {
        const d = new Date(String(value));
        return isNaN(d.getTime()) ? String(value) : format(d, 'dd/MM/yyyy');
      }
      case 'DATETIME': {
        const d = new Date(String(value));
        return isNaN(d.getTime())
          ? String(value)
          : format(d, 'dd/MM/yyyy HH:mm');
      }
      default:
        return String(value);
    }
  };
  
  const handleSaveField = async (fieldId: number, valueOverride?: unknown) => {
    const field = customFields.find((f) => f.Id === fieldId);
    if (!field) return;
    setSavingFieldId(fieldId);
    try {
      const valor = valueOverride ?? parseFieldValue(field, fieldValues[fieldId]);
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/campos/lead/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id_negociacao: Number(id),
          id_campo_personalizado: fieldId,
          valor: valor
        })
      });
      setLeadFields((prev) => {
        const idx = prev.findIndex((l) => l.id_campo_personalizado === fieldId);
        if (idx === -1) {
          return [...prev, { id_campo_personalizado: fieldId, valor }];
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], valor };
        return updated;
      });
      setEditingFieldId(null);
    } catch (err) {
      console.error('Erro ao salvar campo personalizado:', err);
    } finally {
      setSavingFieldId(null);
    }
  };

  const handleAddField = async () => {
    if (!newFieldId) return;
    const field = customFields.find((f) => f.Id === newFieldId);
    if (!field) return;
    const parsed = parseFieldValue(field, newFieldValue);
    setFieldValues((prev) => ({ ...prev, [newFieldId]: newFieldValue }));
    await handleSaveField(newFieldId, parsed);
    setAddingField(false);
    setNewFieldId(null);
    setNewFieldValue(null);
  };

  
  // Activities states
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [savingActivity, setSavingActivity] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuillReady, setIsQuillReady] = useState(false);

  const canEditCRM = hasPermission('can_edit_crm');

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  const tabs = [
    { id: 'geral', label: 'Geral', icon: FileText },
    { id: 'agendamentos', label: 'Agendamentos', icon: Calendar }
  ];

  useEffect(() => {
    const initializeQuill = async () => {
      await registerMediaBlot();
      setIsQuillReady(true);
    };
    initializeQuill();
  }, []);

  useEffect(() => {
    const fetchFontes = async () => {
      try {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/fonte/get', {
          headers: { token }
        });
        if (res.ok) {
          const data = await res.json();
          setFontes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Erro ao carregar fontes:', err);
      }
    };
    fetchFontes();
  }, [token]);

  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        const [fieldsRes, valuesRes] = await Promise.all([
          fetch('https://n8n.lumendigital.com.br/webhook/prospecta/campos/get', { headers: { token } }),
          fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/campos/lead/get?id_negociacao=${id}`, { headers: { token } })
        ]);
        let fields: CampoPersonalizado[] = [];
        if (fieldsRes.ok) {
          const data = await fieldsRes.json();
          fields = Array.isArray(data)
            ? (data as CampoPersonalizado[]).filter((f) => f && f.Id)
            : [];
          setCustomFields(fields);
        }
        if (valuesRes.ok) {
          const data = await valuesRes.json();
          const valid = Array.isArray(data)
            ? (data as CampoPersonalizadoValor[]).filter(
                (v) => v && v.id_campo_personalizado
              )
            : [];
          setLeadFields(valid);
          const valuesMap: Record<number, string | number | boolean | null> = {};
          valid.forEach((v) => {
            const field = fields.find((f) => f.Id === v.id_campo_personalizado);
            valuesMap[v.id_campo_personalizado] = field
              ? (parseFieldValue(field, v.valor) as
                  | string
                  | number
                  | boolean
                  | null)
              : v.valor;
          });
          setFieldValues(valuesMap);
        }
      } catch (err) {
        console.error('Erro ao carregar campos personalizados:', err);
      }
    };
    if (id) {
      fetchCustomFields();
    }
  }, [id, token]);
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

  const fetchDealDetails = async () => {
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/getById?id=${id}`,
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar detalhes da negociação');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const baseDeal = data[0];

        const contactPromise = fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/contato/getById?id=${baseDeal.id_contato}`,
          { headers: { token } }
        )
          .then(res => (res.ok ? res.json() : null))
          .catch(err => {
            console.error('Erro ao carregar contato:', err);
            return null;
          });

        const fontePromise = baseDeal.id_fonte
          ? fetch(
              `https://n8n.lumendigital.com.br/webhook/prospecta/fonte/getById?id=${baseDeal.id_fonte}`,
              { headers: { token } }
            )
              .then(res => (res.ok ? res.json() : null))
              .catch(err => {
                console.error('Erro ao carregar fonte:', err);
                return null;
              })
          : Promise.resolve(null);

        const anuncioPromise = baseDeal.id_anuncio
          ? fetch(
              `https://n8n.lumendigital.com.br/webhook/prospecta/anuncio/getById?id=${baseDeal.id_anuncio}`,
              { headers: { token } }
            )
              .then(res => (res.ok ? res.json() : null))
              .catch(err => {
                console.error('Erro ao carregar anúncio:', err);
                return null;
              })
          : Promise.resolve(null);

        const [contactResult, fonteResult, anuncioResult] = await Promise.allSettled([
          contactPromise,
          fontePromise,
          anuncioPromise,
        ]);

        const contactData =
          contactResult.status === 'fulfilled' && contactResult.value
            ? Array.isArray(contactResult.value)
              ? contactResult.value[0]
              : contactResult.value
            : null;

        const fonteData =
          fonteResult.status === 'fulfilled' && fonteResult.value
            ? Array.isArray(fonteResult.value)
              ? fonteResult.value[0]
              : fonteResult.value
            : null;

        const anuncioData =
          anuncioResult.status === 'fulfilled' && anuncioResult.value
            ? Array.isArray(anuncioResult.value)
              ? anuncioResult.value[0]
              : anuncioResult.value
            : null;

        const dealData = {
          ...baseDeal,
          ...(contactData ? { contato: contactData } : {}),
        };

        setDeal(dealData);
        setSelectedFunnelId(dealData.id_funil);
        setSelectedStageId(dealData.id_estagio);
        setSelectedUserId(dealData.id_usuario);
        setSelectedFonteId(dealData.id_fonte);
        setEditedDeal({
          Id: dealData.Id,
          titulo: dealData.titulo,
          descricao: dealData.descricao || '',
          id_usuario: dealData.id_usuario,
          id_fonte: dealData.id_fonte || null,
        });

        if (contactData) {
          setEditedContact({
            id: contactData.Id,
            nome: contactData.nome,
            email: contactData.Email,
            telefone: contactData.telefone,
          });
        }

        setFonte(fonteData || null);
        if (anuncioData) {
          setAnuncio(anuncioData);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setError('Erro ao carregar detalhes da negociação');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Erro ao carregar funis:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get', {
        headers: { token }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
      
      // If we have a selected user ID, find the user in the list
      if (selectedUserId) {
        const user = data.find((u: User) => u.Id === selectedUserId);
        if (user) {
          setResponsibleUser(user);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/list', { headers: { token } });
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar etiquetas:', err);
    }
  };

  const fetchDealTags = async () => {
    if (!id) return;
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao/list/id?id=${id}`,
        { headers: { token } }
      );
      if (response.ok) {
        const data = await response.json();
        const tagIds: number[] = [];
        if (Array.isArray(data)) {
          data.forEach(
            (
              item: {
                id_tag: number | number[];
                id_negociacao: number | number[];
              }
            ) => {
              const tagsArr = (Array.isArray(item.id_tag) ? item.id_tag : [item.id_tag]).map(Number);
              const dealsArr = (Array.isArray(item.id_negociacao) ? item.id_negociacao : [item.id_negociacao]).map(Number);
              if (dealsArr.includes(parseInt(id))) {
                tagIds.push(...tagsArr);
              }
            }
          );
        }
        setDealTags(availableTags.filter(t => tagIds.includes(t.Id)));
      }
    } catch (err) {
      console.error('Erro ao carregar etiquetas da negociação:', err);
    }
  };

  const fetchActivities = async () => {
    if (!id) return;
    
    setLoadingActivities(true);
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/atividades/get?id=${id}`,
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar atividades');
      }

      const data = await response.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar atividades:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

    const fetchSummary = async () => {
    if (!id) return;

    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/crm/resumo/get?id_negociacao=${id}`,
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar resumo');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].resumo) {
        setSummary(data[0].resumo);
      } else {
        setSummary(null);
      }
    } catch (err) {
      console.error('Erro ao carregar resumo:', err);
      setSummaryError('Erro ao carregar resumo');
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCreateSummary = async () => {
    if (!id) return;

    setCreatingSummary(true);
    setSummaryError(null);
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/crm/resumo/create?id_negociacao=${id}`,
        { method: 'POST', headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao criar resumo');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].resumo) {
        setSummary(data[0].resumo);
      } else {
        setSummary(null);
      }
    } catch (err) {
      console.error('Erro ao criar resumo:', err);
      setSummaryError('Erro ao criar resumo');
    } finally {
      setCreatingSummary(false);
    }
  };

  const handleDeleteSummary = async () => {
    if (!id) return;

    setDeletingSummary(true);
    setSummaryError(null);
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/crm/resumo/delete?id_negociacao=${id}`,
        { method: 'DELETE', headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir resumo');
      }

      setSummary(null);
    } catch (err) {
      console.error('Erro ao excluir resumo:', err);
      setSummaryError('Erro ao excluir resumo');
    } finally {
      setDeletingSummary(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/conversas/get?id=${id}`,
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar mensagens');
      }

      const data = await response.json();
      const validMessages = Array.isArray(data) && data.length > 0 && Object.keys(data[0]).length > 1;
      
      const sortedMessages = validMessages ? 
        data.sort((a: WhatsAppMessage, b: WhatsAppMessage) => 
          new Date(a.data).getTime() - new Date(b.data).getTime()
        ) : [];
      
      setMessages(sortedMessages);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError('Erro ao carregar mensagens');
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/delete?id=${id}`,
        {
          method: 'DELETE',
          headers: { token }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir negociação');
      }

      setIsDeleteModalOpen(false);
      navigate('/crm');
    } catch (err) {
      console.error('Erro ao excluir negociação:', err);
      setError('Erro ao excluir negociação');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateBasicInfo = async () => {
    if (!editedDeal) return;
    setSavingChanges(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(editedDeal)
      });

      if (!response.ok) throw new Error('Erro ao atualizar informações');

      await fetchDealDetails();
      setEditingBasicInfo(false);
      setSuccess('Informações básicas atualizadas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao atualizar informações básicas:', error);
      setError('Erro ao atualizar informações básicas');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingChanges(false);
    }
  };

  const handleUpdateFunnel = async () => {
    if (!selectedFunnelId || !selectedStageId || !deal) return;
    setSavingChanges(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/update/funil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          Id: deal.Id,
          id_funil: selectedFunnelId,
          id_estagio: selectedStageId
        })
      });

      if (!response.ok) throw new Error('Erro ao atualizar funil');

      await fetchDealDetails();
      setEditingFunnel(false);
      setSuccess('Funil atualizado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao atualizar funil:', error);
      setError('Erro ao atualizar funil');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingChanges(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!editedContact) return;
    setSavingChanges(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/contato/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(editedContact)
      });

      if (!response.ok) throw new Error('Erro ao atualizar contato');

      await fetchDealDetails();
      setEditingContact(false);
      setSuccess('Contato atualizado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      setError('Erro ao atualizar contato');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingChanges(false);
    }
  };

  const handleCreateActivity = async () => {
    if (!newActivity.trim() || !id) return;
    
    setSavingActivity(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/atividades/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id_negociacao: parseInt(id),
          descricao: newActivity
        })
      });

      if (!response.ok) throw new Error('Erro ao criar atividade');

      await fetchActivities();
      setNewActivity('');
      setSuccess('Atividade criada com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      setError('Erro ao criar atividade');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingActivity(false);
    }
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity) return;
    
    setSavingActivity(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/atividades/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          Id: editingActivity.Id,
          descricao: editingActivity.descricao
        })
      });

      if (!response.ok) throw new Error('Erro ao atualizar atividade');

      await fetchActivities();
      setEditingActivity(null);
      setSuccess('Atividade atualizada com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      setError('Erro ao atualizar atividade');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingActivity(false);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    setSavingActivity(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/atividades/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          Id: activityId
        })
      });

      if (!response.ok) throw new Error('Erro ao excluir atividade');

      await fetchActivities();
      setSuccess('Atividade excluída com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
      setError('Erro ao excluir atividade');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingActivity(false);
    }
  };

  const handleAddTag = async () => {
    if (!id || !selectedTagId) return;
    setSavingTag(true);
    try {
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ id_negociacao: parseInt(id), id_tag: selectedTagId })
      });
      await fetchDealTags();
      localStorage.setItem('tags_updated', Date.now().toString());
      setSelectedTagId(null);
      setEditingTags(false);
    } catch (err) {
      console.error('Erro ao adicionar etiqueta:', err);
    } finally {
      setSavingTag(false);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!id) return;
    setSavingTag(true);
    try {
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ id_negociacao: parseInt(id), id_tag: tagId })
      });
      await fetchDealTags();
      localStorage.setItem('tags_updated', Date.now().toString());
      setEditingTags(false);
    } catch (err) {
      console.error('Erro ao remover etiqueta:', err);
    } finally {
      setSavingTag(false);
    }
  };

  // Departamentos functions
  const fetchAvailableDepartamentos = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/produtos/get', { headers: { token } });
      if (response.ok) {
        const data = await response.json();
        const departamentos = Array.isArray(data) ? data.filter(isDepartamento) : [];
        setAvailableDepartamentos(departamentos);
      }
    } catch (err) {
      console.error('Erro ao carregar departamentos:', err);
    }
  };

  const fetchDealDepartamentos = async () => {
    if (!id) return;
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/produtos/lead/get?id_negociacao=${id}`,
        { headers: { token } }
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const departamentoIds = data
            .filter(item => item.id_produto)
            .map(item => item.id_produto);

          const departamentos = availableDepartamentos.filter(dept =>
            departamentoIds.includes(dept.Id)
          );
          setDealDepartamentos(departamentos);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar departamentos do lead:', err);
    }
  };

  const handleAddDepartamento = async () => {
    if (!id || !selectedDepartamentoId) return;
    setSavingDepartamento(true);
    try {
      await fetch('https://n8n.lumendigital.com.br/webhook/produtos/lead/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({
          id_negociacao: parseInt(id),
          id_produto: selectedDepartamentoId,
          quantidade: 1,
          valor_unitario: 0
        })
      });
      await fetchDealDepartamentos();
      setSelectedDepartamentoId(null);
      setEditingDepartamentos(false);
    } catch (err) {
      console.error('Erro ao adicionar departamento:', err);
    } finally {
      setSavingDepartamento(false);
    }
  };

  const handleRemoveDepartamento = async (departamentoId: number) => {
    if (!id) return;
    setSavingDepartamento(true);
    try {
      await fetch('https://n8n.lumendigital.com.br/webhook/produtos/lead/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ id_negociacao: parseInt(id), id_produto: departamentoId })
      });
      await fetchDealDepartamentos();
      setEditingDepartamentos(false);
    } catch (err) {
      console.error('Erro ao remover departamento:', err);
    } finally {
      setSavingDepartamento(false);
    }
  };

  const handleMediaUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/upload', {
        method: 'POST',
        headers: { token },
        body: formData
      });

      if (!response.ok) throw new Error('Erro ao fazer upload da mídia');

      const { url } = await response.json();
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
      console.error('Error uploading media:', error);
      setError('Erro ao fazer upload da mídia');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageDateTime = (dateStr: string) => {
    const messageDate = new Date(dateStr);
    const today = new Date();
    const isToday = messageDate.toDateString() === today.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return messageDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWhatsAppMessage = (text: string) => {
    if (!text) return '';

    // Handle bold text (*text*)
    text = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

    // Handle italic text (_text_)
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');

    return text;
  };

  // Função para identificar o remetente da mensagem
  const getRemetente = (message: WhatsAppMessage): string => {
    // Se não é da empresa, é do lead
    if (!message.key.fromMe) {
      return 'Lead';
    }

    // Se é da empresa, verifica as flags
    if (message.respostaIA) {
      return 'IA (Agente Automatizado)';
    }

    if (message.isFollowUp) {
      return 'Follow-up automático';
    }

    if (message.isLembrete) {
      return 'Lembrete de reunião';
    }

    // Se não tem nenhuma flag específica, é usuário humano
    return 'Usuário humano';
  };

  // Função para formatar data/hora completa
  const formatarDataHora = (message: WhatsAppMessage): string => {
    // Usa messageTimestamp se disponível, senão usa data
    const timestamp = message.messageTimestamp || new Date(message.data).getTime();
    const date = new Date(timestamp);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  useEffect(() => {
    const loadData = async () => {
      const tasks = [
        fetchDealDetails(),
        fetchFunnels(),
        fetchUsers(),
        fetchActivities(),
        fetchSummary(),
      ];
      if (id) tasks.push(fetchMessages());
      await Promise.allSettled(tasks);
    };
    loadData();
  }, [id]);

  useEffect(() => {
    fetchAvailableTags();
    fetchAvailableDepartamentos();
  }, []);

  useEffect(() => {
    if (id && availableTags.length > 0) {
      fetchDealTags();
    }
  }, [id, availableTags]);

  useEffect(() => {
    if (id && availableDepartamentos.length > 0) {
      fetchDealDepartamentos();
    }
  }, [id, availableDepartamentos]);

  useEffect(() => {
    if (!hideConversations && activeTab === 'conversas') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  useEffect(() => {
    // Update responsible user when users are loaded or selectedUserId changes
    if (users.length > 0 && selectedUserId) {
      const user = users.find(u => u.Id === selectedUserId);
      if (user) {
        setResponsibleUser(user);
      }
    }
  }, [users, selectedUserId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex items-center justify-center h-full text-red-600">
        <AlertCircle className="w-8 h-8 mr-2" />
        <span>{error || 'Negociação não encontrada'}</span>
      </div>
    );
  }

  const currentFunnel = funnels.find(f => f.id === selectedFunnelId);
  const currentStage = currentFunnel?.estagios?.find(s => parseInt(s.Id) === selectedStageId);

  return (
    <>
      <style>{`
        /* Estilos para os dropdowns do select no dark mode */
        .dark select {
          background-color: #404040 !important;
          color: #f5f5f5 !important;
        }

        .dark select option {
          background-color: #262626 !important;
          color: #f5f5f5 !important;
          padding: 8px !important;
        }

        .dark select option:checked,
        .dark select option:hover {
          background-color: #3b82f6 !important;
          color: white !important;
        }

        /* Estilos adicionais para ReactQuill no dark mode */
        .dark .ql-editor {
          color: white !important;
        }

        .dark .ql-editor.ql-blank::before {
          color: #a3a3a3 !important;
        }

        .dark .ql-toolbar {
          background-color: #404040 !important;
          border-color: #525252 !important;
        }

        .dark .ql-container {
          background-color: #262626 !important;
          border-color: #525252 !important;
        }

        .dark .ql-stroke {
          stroke: #e5e5e5 !important;
        }

        .dark .ql-fill {
          fill: #e5e5e5 !important;
        }

        .dark .ql-picker-label {
          color: #e5e5e5 !important;
        }

        .dark .ql-picker-options {
          background-color: #404040 !important;
          border-color: #525252 !important;
        }

        .dark .ql-picker-item {
          color: #e5e5e5 !important;
        }

        .dark .ql-picker-item:hover {
          background-color: #525252 !important;
        }

        /* Estilos para conteúdo HTML renderizado no dark mode */
        .dark .prose-sm strong,
        .dark .prose-sm b {
          color: white !important;
        }

        .dark .prose-sm em,
        .dark .prose-sm i {
          color: #f5f5f5 !important;
        }

        .dark .prose-sm h1,
        .dark .prose-sm h2,
        .dark .prose-sm h3 {
          color: white !important;
        }

        .dark .prose-sm p {
          color: #e5e5e5 !important;
        }

        .dark .prose-sm ul,
        .dark .prose-sm ol {
          color: #e5e5e5 !important;
        }

        .dark .prose-sm a {
          color: #60a5fa !important;
        }
      `}</style>

      <div className="h-full flex flex-col bg-gray-50 dark:bg-neutral-900 transition-theme">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-300 dark:border-neutral-700 px-8 py-6 shadow-sm transition-theme">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose ? (
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-neutral-400 dark:text-neutral-400 hover:text-gray-700 dark:text-neutral-300 dark:hover:text-neutral-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/crm')}
                className="text-gray-500 dark:text-neutral-400 dark:text-neutral-400 hover:text-gray-700 dark:text-neutral-300 dark:hover:text-neutral-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">{deal.titulo}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-neutral-400 dark:text-neutral-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Criado em {formatDate(deal.CreatedAt)}</span>
                </div>
                {deal.UpdatedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Atualizado em {formatDate(deal.UpdatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canEditCRM && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-theme"
              >
                <Trash2 className="w-5 h-5" />
                Excluir
              </button>
            )}
          </div>
        </div>

        {success && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-1 mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-theme ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}

          {deal.contato?.telefone && (
            <button
              onClick={goToConversation}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-theme ml-2"
            >
              <MessageSquare className="w-5 h-5" />
              Ir para conversa
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Basic Info & Funnel */}
            <div className="md:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 border border-gray-300 dark:border-neutral-700 transition-theme">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    Informações Básicas
                  </h2>
                  {!editingBasicInfo ? (
                    canEditCRM && (
                      <button
                        onClick={() => setEditingBasicInfo(true)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-theme"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )
                  ) : (
                    <div className="flex gap-2">
                      {canEditCRM && (
                        <button
                          onClick={() => setEditingBasicInfo(false)}
                          className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 p-2 rounded-full hover:bg-gray-50 dark:hover:bg-neutral-700 transition-theme"
                          disabled={savingChanges}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={handleUpdateBasicInfo}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-theme"
                        disabled={savingChanges}
                      >
                        {savingChanges ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-neutral-400 dark:text-neutral-400 mb-1">Título</label>
                    {editingBasicInfo ? (
                      <input
                        type="text"
                        value={editedDeal?.titulo}
                        onChange={(e) => setEditedDeal(prev => prev ? {...prev, titulo: e.target.value} : null)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-theme"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900 dark:text-neutral-100 font-medium">{deal.titulo}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-neutral-400 dark:text-neutral-400 mb-1">Usuário Responsável</label>
                    {editingBasicInfo ? (
                      <select
                        value={selectedUserId || ''}
                        onChange={(e) => {
                          const userId = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedUserId(userId);
                          setEditedDeal(prev => prev ? {...prev, id_usuario: userId} : null);
                        }}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-theme"
                      >
                        <option value="">Sem responsável</option>
                        {users.map((user) => (
                          <option key={user.Id} value={user.Id}>
                            {user.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1 flex items-center gap-2">
                        {responsibleUser ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <Shield className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="text-gray-900">{responsibleUser.nome}</span>
                          </>
                        ) : (
                          <span className="text-gray-500 dark:text-neutral-400">Sem responsável</span>
                        )}
                      </div>
                    )}

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-neutral-400 dark:text-neutral-400 mb-1">Fonte</label>
                    {editingBasicInfo ? (
                      <select
                        value={selectedFonteId || ''}
                        onChange={(e) => {
                          const fonteId = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedFonteId(fonteId);
                          setEditedDeal(prev => prev ? { ...prev, id_fonte: fonteId } : null);
                        }}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-theme"
                      >
                        <option value="">Sem fonte</option>
                        {fontes.map(f => (
                          <option key={f.Id} value={f.Id}>
                            {f.source ? `${f.nome} (${f.source})` : f.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-gray-900 dark:text-neutral-100 font-medium">
                        {fonte ? (fonte.source ? `${fonte.nome} (${fonte.source})` : fonte.nome) : 'Sem fonte'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 dark:text-neutral-400 dark:text-neutral-400 mb-1">Etiquetas</label>
                  {editingTags ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={selectedTagId || ''}
                          onChange={e => setSelectedTagId(e.target.value ? parseInt(e.target.value) : null)}
                          className="px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg transition-theme"
                        >
                          <option value="">Selecione</option>
                          {availableTags.map(tag => (
                            <option key={tag.Id} value={tag.Id}>{tag.nome}</option>
                          ))}
                        </select>
                        <button onClick={handleAddTag} disabled={savingTag} className="px-3 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-theme">Adicionar</button>
                        <button type="button" onClick={() => setEditingTags(false)} className="px-3 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-theme">Concluir</button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dealTags.map(tag => (
                          <span key={tag.Id} className="px-2 py-0.5 rounded text-xs flex items-center" style={{ backgroundColor: tag.cor, color: tag.cor_texto }}>
                            {tag.nome}
                            <button type="button" className="ml-1" onClick={() => handleRemoveTag(tag.Id)}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 items-center">
                      {dealTags.length === 0 && <span className="text-sm text-gray-500 dark:text-neutral-400">Sem etiquetas</span>}
                      {dealTags.map(tag => (
                        <span key={tag.Id} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: tag.cor, color: tag.cor_texto }}>{tag.nome}</span>
                      ))}
                      {canEditCRM && (
                        <button type="button" onClick={() => setEditingTags(true)} className="ml-2 text-blue-600">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 dark:text-neutral-400 mb-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Departamentos
                  </label>
                  {editingDepartamentos ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={selectedDepartamentoId || ''}
                          onChange={e => setSelectedDepartamentoId(e.target.value ? parseInt(e.target.value) : null)}
                          className="px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg transition-theme"
                        >
                          <option value="">Selecione</option>
                          {availableDepartamentos.filter(dept => !dealDepartamentos.find(d => d.Id === dept.Id)).map(dept => (
                            <option key={dept.Id} value={dept.Id}>{dept.nome}</option>
                          ))}
                        </select>
                        <button onClick={handleAddDepartamento} disabled={savingDepartamento} className="px-3 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-theme">Adicionar</button>
                        <button type="button" onClick={() => setEditingDepartamentos(false)} className="px-3 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-theme">Concluir</button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dealDepartamentos.map(dept => (
                          <span key={dept.Id} className="px-2 py-0.5 rounded text-xs flex items-center bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                            <Building2 className="w-3 h-3 mr-1" />
                            {dept.nome}
                            <button type="button" className="ml-1" onClick={() => handleRemoveDepartamento(dept.Id)}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 items-center">
                      {dealDepartamentos.length === 0 && <span className="text-sm text-gray-500 dark:text-neutral-400">Sem departamentos</span>}
                      {dealDepartamentos.map(dept => (
                        <span key={dept.Id} className="px-2 py-0.5 rounded text-xs flex items-center bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          <Building2 className="w-3 h-3 mr-1" />
                          {dept.nome}
                        </span>
                      ))}
                      {canEditCRM && (
                        <button type="button" onClick={() => setEditingDepartamentos(true)} className="ml-2 text-indigo-600">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {deal.id_anuncio && anuncio && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-500 dark:text-neutral-400 dark:text-neutral-400 mb-1">Anúncio</label>
                    <AnuncioCard anuncio={anuncio} />
                  </div>
                )}
              </div>

              {/* Funnel Card */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 border border-gray-300 dark:border-neutral-700 transition-theme">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-indigo-500" />
                    Funil e Estágio
                  </h2>
                  {!editingFunnel ? (
                    canEditCRM && (
                      <button
                        onClick={() => setEditingFunnel(true)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingFunnel(false)}
                        className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-50"
                        disabled={savingChanges}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleUpdateFunnel}
                        className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50"
                        disabled={savingChanges}
                      >
                        {savingChanges ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-neutral-400 dark:text-neutral-400 mb-1">Funil</label>
                    {editingFunnel ? (
                      <select
                        value={selectedFunnelId || ''}
                        onChange={(e) => {
                          const funnelId = parseInt(e.target.value);
                          setSelectedFunnelId(funnelId);
                          setSelectedStageId(null);
                        }}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-theme"
                      >
                        <option value="">Selecione um funil</option>
                        {funnels.map((funnel) => (
                          <option key={funnel.id} value={funnel.id}>
                            {funnel.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        <p className="text-gray-900 dark:text-neutral-100 font-medium">
                          {currentFunnel?.nome || 'Não definido'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-neutral-400 dark:text-neutral-400 mb-1">Estágio</label>
                    {editingFunnel ? (
                      <select
                        value={selectedStageId || ''}
                        onChange={(e) => setSelectedStageId(parseInt(e.target.value))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-theme"
                        disabled={!selectedFunnelId}
                      >
                        <option value="">Selecione um estágio</option>
                        {currentFunnel?.estagios?.map((stage) => (
                          <option key={stage.Id} value={stage.Id}>
                            {stage.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <p className="text-gray-900 dark:text-neutral-100 font-medium">
                          {currentStage?.nome || 'Não definido'}
                        </p>
                      </div>
                    )}
                  </div>
              </div>
            </div>

              {/* Activities Section */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 border border-gray-300 dark:border-neutral-700 transition-theme">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    Atividades
                  </h2>
                </div>

                {/* New Activity Form */}
                {canEditCRM && (
                  <div className="mb-6 border-b border-gray-300 dark:border-neutral-700 pb-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Nova Atividade</h3>
                    <div className="space-y-3">
                      {canEditCRM && (
                        <div>
                          <input
                            type="file"
                            id="activity-media-upload"
                            className="hidden"
                            accept="image/*,video/*,audio/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleMediaUpload(file);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('activity-media-upload')?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg mb-2 transition-theme"
                          >
                            <Upload className="w-4 h-4" />
                            {isUploading ? 'Carregando...' : 'Adicionar Mídia'}
                          </button>
                        </div>
                      )}

                      <div className="relative">
                        {isQuillReady && (
                          <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={newActivity}
                            onChange={setNewActivity}
                            modules={modules}
                            formats={formats}
                            placeholder="Adicione uma nova atividade..."
                            className="bg-white dark:bg-neutral-800 rounded-lg [&_.ql-toolbar]:dark:bg-neutral-700 [&_.ql-toolbar]:dark:border-neutral-600 [&_.ql-container]:dark:bg-neutral-800 [&_.ql-container]:dark:border-neutral-600 [&_.ql-editor]:dark:text-white [&_.ql-editor.ql-blank::before]:dark:text-neutral-400 [&_.ql-stroke]:dark:stroke-neutral-200 [&_.ql-fill]:dark:fill-neutral-200 [&_.ql-picker-label]:dark:text-neutral-200"
                          />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500 dark:text-blue-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={handleCreateActivity}
                          disabled={!newActivity.trim() || savingActivity}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-theme transition-colors disabled:opacity-50"
                        >
                          {savingActivity ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Salvando...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Adicionar Atividade</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300">Histórico de Atividades</h3>
                  
                  {loadingActivities ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                      <p>Nenhuma atividade registrada</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => {
                        const activityUser = users.find(u => u.Id === activity.id_usuario);
                        
                        return (
                          <div key={activity.Id} className="border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded-lg p-4 transition-theme">
                            {editingActivity?.Id === activity.Id ? (
                              <div className="space-y-3">
                                <div className="relative">
                                  {isQuillReady && (
                                    <ReactQuill
                                      theme="snow"
                                      value={editingActivity.descricao}
                                      onChange={(value) => setEditingActivity({...editingActivity, descricao: value})}
                                      modules={modules}
                                      formats={formats}
                                      className="bg-white dark:bg-neutral-800 rounded-lg [&_.ql-toolbar]:dark:bg-neutral-700 [&_.ql-toolbar]:dark:border-neutral-600 [&_.ql-container]:dark:bg-neutral-800 [&_.ql-container]:dark:border-neutral-600 [&_.ql-editor]:dark:text-white [&_.ql-editor.ql-blank::before]:dark:text-neutral-400 [&_.ql-stroke]:dark:stroke-neutral-200 [&_.ql-fill]:dark:fill-neutral-200 [&_.ql-picker-label]:dark:text-neutral-200"
                                    />
                                  )}
                                </div>

                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingActivity(null)}
                                    className="px-3 py-1 text-sm text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-theme"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={handleUpdateActivity}
                                    disabled={savingActivity}
                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-theme"
                                  >
                                    {savingActivity ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Save className="w-3 h-3" />
                                    )}
                                    <span>Salvar</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-neutral-100">{activityUser?.nome || 'Usuário'}</p>
                                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                                        {formatDate(activity.CreatedAt)} às {formatTime(activity.CreatedAt)}
                                      </p>
                                    </div>
                                  </div>

                                  {canEditCRM && (
                                    <div className="relative group">
                                      <button className="p-1 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 transition-theme">
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                      <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-neutral-700 shadow-lg rounded-lg overflow-hidden border border-gray-300 dark:border-neutral-600 hidden group-hover:block z-10">
                                        <button
                                          onClick={() => setEditingActivity(activity)}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-600 flex items-center gap-2 transition-theme"
                                        >
                                          <Edit className="w-4 h-4" />
                                          <span>Editar</span>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteActivity(activity.Id)}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition-theme"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          <span>Excluir</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div
                                  className="text-gray-700 dark:text-neutral-200 prose-sm max-w-none [&_strong]:dark:text-white [&_em]:dark:text-neutral-100 [&_h1]:dark:text-white [&_h2]:dark:text-white [&_h3]:dark:text-white"
                                  dangerouslySetInnerHTML={{ __html: activity.descricao }}
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Contact Info */}
            <div className="space-y-6">
              {/* Deal Summary Widget */}
              <DealSummaryWidget
                dealId={parseInt(id!)}
                contactName={deal.contato?.nome}
                contactPhone={deal.contato?.telefone}
              />

              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 border border-gray-300 dark:border-neutral-700 transition-theme">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-500" />
                    Contato
                  </h2>
                  {!editingContact ? (
                    canEditCRM && (
                      <button
                        onClick={() => setEditingContact(true)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-theme"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingContact(false)}
                        className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 p-2 rounded-full hover:bg-gray-50 dark:hover:bg-neutral-700 transition-theme"
                        disabled={savingChanges}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleUpdateContact}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-theme"
                        disabled={savingChanges}
                      >
                        {savingChanges ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {deal.contato ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 dark:text-neutral-500 mt-0.5" />
                      <div className="flex-1">
                        {editingContact ? (
                          <input
                            type="text"
                            value={editedContact?.nome}
                            onChange={(e) => setEditedContact(prev => prev ? {...prev, nome: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg transition-theme focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <>
                            <p className="font-medium text-gray-900 dark:text-neutral-100">{deal.contato.nome}</p>
                            <p className="text-xs text-gray-500 dark:text-neutral-400">Nome</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 dark:text-neutral-500 mt-0.5" />
                      <div className="flex-1">
                        {editingContact ? (
                          <input
                            type="email"
                            value={editedContact?.email}
                            onChange={(e) => setEditedContact(prev => prev ? {...prev, email: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg transition-theme focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <>
                            <p className="font-medium text-gray-900 dark:text-neutral-100">{deal.contato.Email || 'Não informado'}</p>
                            <p className="text-xs text-gray-500 dark:text-neutral-400">Email</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 dark:text-neutral-500 mt-0.5" />
                      <div className="flex-1">
                        {editingContact ? (
                          <input
                            type="tel"
                            value={editedContact?.telefone}
                            onChange={(e) => setEditedContact(prev => prev ? {...prev, telefone: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg transition-theme focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <>
                            <p className="font-medium text-gray-900 dark:text-neutral-100">{deal.contato.telefone || 'Não informado'}</p>
                            <p className="text-xs text-gray-500 dark:text-neutral-400">Telefone</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-neutral-400">
                    <User className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto mb-2" />
                    <p>Nenhum contato associado</p>
                    {canEditCRM && (
                      <button
                        onClick={() => setEditingContact(true)}
                        className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                      >
                        Adicionar contato
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 border border-gray-300 dark:border-neutral-700 transition-theme">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-purple-500" />
                    Campos personalizados
                  </h2>
                  {canEditCRM && (
                    <button
                      onClick={() => setAddingField(true)}
                      className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 transition-theme"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar campo
                    </button>
                  )}
                </div>
                {leadFields.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-neutral-700">
                    {leadFields.map((lf) => {
                      const field = customFields.find(
                        (f) => f.Id === lf.id_campo_personalizado
                      );
                      if (!field) return null;
                      const value = fieldValues[field.Id];
                      const editing = editingFieldId === field.Id;
                      return (
                        <div
                          key={field.Id}
                          className="py-4 first:pt-0 last:pb-0 flex justify-between items-start"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-neutral-200">{field.nome}</p>
                            {!editing ? (
                              <p className="mt-1 text-gray-900 dark:text-neutral-100">
                                {formatFieldValue(field, value)}
                              </p>
                            ) : (
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {renderFieldInput(field, value, (val) =>
                                  setFieldValues((prev) => ({
                                    ...prev,
                                    [field.Id]: val
                                  }))
                                )}
                                <button
                                  onClick={() => handleSaveField(field.Id)}
                                  disabled={savingFieldId === field.Id}
                                  className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-theme"
                                >
                                  {savingFieldId === field.Id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                  <span>Salvar</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setFieldValues((prev) => ({
                                      ...prev,
                                      [field.Id]: parseFieldValue(field, lf.valor)
                                    }));
                                    setEditingFieldId(null);
                                  }}
                                  className="px-3 py-1 text-sm rounded-lg bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-theme"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </div>
                          {!editing && canEditCRM && (
                            <button
                              onClick={() => setEditingFieldId(field.Id)}
                              className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-neutral-400 text-sm">
                    Ainda não há nenhum campo cadastrado vinculado ao lead.
                  </p>
                )}
                {addingField && (
                  <div className="mt-4 p-3 border border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700/50 rounded-lg space-y-2 transition-theme">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg transition-theme focus:ring-2 focus:ring-blue-500"
                      value={newFieldId ?? ''}
                      onChange={(e) =>
                        setNewFieldId(e.target.value ? Number(e.target.value) : null)
                      }
                    >
                      <option value="">Selecione um campo</option>
                      {customFields
                        .filter(
                          (f) =>
                            !leadFields.some(
                              (lf) => lf.id_campo_personalizado === f.Id
                            )
                        )
                        .map((f) => (
                          <option key={f.Id} value={f.Id}>
                            {f.nome}
                          </option>
                        ))}
                    </select>
                    {newFieldId && (
                      <div className="space-y-2">
                        {(() => {
                          const field = customFields.find((f) => f.Id === newFieldId);
                          return field
                            ? renderFieldInput(field, newFieldValue, (val) =>
                                setNewFieldValue(val)
                              )
                            : null;
                        })()}
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddField}
                            className="px-3 py-1 text-sm rounded-lg text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 transition-theme"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => {
                              setAddingField(false);
                              setNewFieldId(null);
                              setNewFieldValue(null);
                            }}
                            className="px-3 py-1 text-sm rounded-lg bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-theme"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!hideConversations && activeTab === 'conversas' && (
          <div className="flex justify-center">
            <div className="w-full md:w-[480px] bg-gray-100 dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-md border border-gray-300 dark:border-neutral-600 flex flex-col transition-theme" style={{ height: "600px" }}>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-4 flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold">{deal.contato?.nome?.charAt(0) || 'U'}</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium">{deal.contato?.nome || 'Usuário'}</p>
                  <p className="text-xs text-white/80">Histórico de conversa</p>
                </div>
              </div>

              <div
                className="flex-1 bg-[#e5ddd5] bg-opacity-30 p-4 overflow-y-auto flex flex-col gap-3"
                style={{
                  backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-light_a4be512e7195b6b733d9110b408f075d.png')",
                  height: "calc(600px - 64px)" // header fixo
                }}
                ref={messagesContainerRef}
              >
                {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div key={index} className="space-y-1">
                      <div
                        className={`flex ${message.key.fromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.key.fromMe
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-gray-800 dark:text-neutral-100'
                              : 'bg-white dark:bg-neutral-700 text-gray-800 dark:text-neutral-100'
                          }`}
                        >
                          {message.messageType === 'imageMessage' && message.message.mediaUrl && (
                            <img
                              src={message.message.mediaUrl}
                              alt="Imagem"
                              className="max-w-full h-auto rounded mb-1"
                            />
                          )}
                          {message.messageType === 'audioMessage' && message.message.mediaUrl && (
                            <audio controls className="max-w-full mb-1">
                              <source src={message.message.mediaUrl} type="audio/ogg" />
                              Seu navegador não suporta o elemento de áudio.
                            </audio>
                          )}
                          {message.messageType === 'conversation' && message.message.conversation && (
                            <div
                              className="text-sm whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: formatWhatsAppMessage(message.message.conversation)
                              }}
                            />
                          )}
                          <p className="text-right text-xs text-gray-500 dark:text-neutral-400 mt-1">
                            {formatMessageDateTime(message.data)}
                          </p>
                        </div>
                      </div>
                      {/* Linha informativa do remetente */}
                      <div
                        className={`flex ${message.key.fromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <p className="text-xs text-gray-400 dark:text-neutral-500 italic px-1">
                          💬 Enviada por: {getRemetente(message)} — {formatarDataHora(message)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-neutral-400 text-sm">
                    <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
                    <p>Nenhuma conversa ainda.</p>
                    <p>Este cliente ainda não interagiu.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agendamentos' && (
          <DealAppointmentsTab dealId={parseInt(id!)} />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                Tem certeza que deseja excluir?
              </h3>
              <p className="text-gray-500 dark:text-neutral-400 mt-1">
                Esta ação não pode ser desfeita e todos os dados relacionados a esta negociação serão perdidos.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-theme"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-theme transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmar Exclusão</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
      </div>
    </>
  );
}
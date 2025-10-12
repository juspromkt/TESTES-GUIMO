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
  Bot
} from 'lucide-react';
import type { Deal } from '../types/deal';
import type { Funil } from '../types/funil';
import type { Fonte } from '../types/fonte';
import type { Anuncio } from '../types/anuncio';
import type { CampoPersonalizado, CampoPersonalizadoValor } from '../types/campo';
import AnuncioCard from '../components/crm/AnuncioCard';
import Modal from '../components/Modal';
import DealAppointmentsTab from '../components/crm/DealAppointmentsTab';
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
      'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500';
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
    ...(hideConversations ? [] : [{ id: 'conversas', label: 'Conversas', icon: MessageSquare }]),
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
  }, []);

  useEffect(() => {
    if (id && availableTags.length > 0) {
      fetchDealTags();
    }
  }, [id, availableTags]);

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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose ? (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/crm')}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{deal.titulo}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
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
            {deal.contato?.telefone && (
              <button
                onClick={goToConversation}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Conversas
              </button>
            )}
            {canEditCRM && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Excluir
              </button>
            )}
          </div>
        </div>

        {success && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Basic Info & Funnel */}
            <div className="md:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Informações Básicas
                  </h2>
                  {!editingBasicInfo ? (
                    canEditCRM && (
                      <button
                        onClick={() => setEditingBasicInfo(true)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )
                  ) : (
                    <div className="flex gap-2">
                      {canEditCRM && (
                        <button
                          onClick={() => setEditingBasicInfo(false)}
                          className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-50"
                          disabled={savingChanges}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={handleUpdateBasicInfo}
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
                    <label className="block text-sm font-medium text-gray-500 mb-1">Título</label>
                    {editingBasicInfo ? (
                      <input
                        type="text"
                        value={editedDeal?.titulo}
                        onChange={(e) => setEditedDeal(prev => prev ? {...prev, titulo: e.target.value} : null)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900 font-medium">{deal.titulo}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Usuário Responsável</label>
                    {editingBasicInfo ? (
                      <select
                        value={selectedUserId || ''}
                        onChange={(e) => {
                          const userId = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedUserId(userId);
                          setEditedDeal(prev => prev ? {...prev, id_usuario: userId} : null);
                        }}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                          <span className="text-gray-500">Sem responsável</span>
                        )}
                      </div>
                    )}

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Fonte</label>
                    {editingBasicInfo ? (
                      <select
                        value={selectedFonteId || ''}
                        onChange={(e) => {
                          const fonteId = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedFonteId(fonteId);
                          setEditedDeal(prev => prev ? { ...prev, id_fonte: fonteId } : null);
                        }}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sem fonte</option>
                        {fontes.map(f => (
                          <option key={f.Id} value={f.Id}>
                            {f.source ? `${f.nome} (${f.source})` : f.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-gray-900 font-medium">
                        {fonte ? (fonte.source ? `${fonte.nome} (${fonte.source})` : fonte.nome) : 'Sem fonte'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Etiquetas</label>
                  {editingTags ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={selectedTagId || ''}
                          onChange={e => setSelectedTagId(e.target.value ? parseInt(e.target.value) : null)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Selecione</option>
                          {availableTags.map(tag => (
                            <option key={tag.Id} value={tag.Id}>{tag.nome}</option>
                          ))}
                        </select>
                        <button onClick={handleAddTag} disabled={savingTag} className="px-3 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">Adicionar</button>
                        <button type="button" onClick={() => setEditingTags(false)} className="px-3 py-2 bg-gray-200 rounded-lg">Concluir</button>
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
                      {dealTags.length === 0 && <span className="text-sm text-gray-500">Sem etiquetas</span>}
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

                {deal.id_anuncio && anuncio && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Anúncio</label>
                    <AnuncioCard anuncio={anuncio} />
                  </div>
                )}
              </div>

              {/* Funnel Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
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
                    <label className="block text-sm font-medium text-gray-500 mb-1">Funil</label>
                    {editingFunnel ? (
                      <select
                        value={selectedFunnelId || ''}
                        onChange={(e) => {
                          const funnelId = parseInt(e.target.value);
                          setSelectedFunnelId(funnelId);
                          setSelectedStageId(null);
                        }}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        <p className="text-gray-900 font-medium">
                          {currentFunnel?.nome || 'Não definido'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Estágio</label>
                    {editingFunnel ? (
                      <select
                        value={selectedStageId || ''}
                        onChange={(e) => setSelectedStageId(parseInt(e.target.value))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        <p className="text-gray-900 font-medium">
                          {currentStage?.nome || 'Não definido'}
                        </p>
                      </div>
                    )}
                  </div>
              </div>
            </div>

              {/* Summary Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
                <div className="flex justify-between items-center mb-4">
<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
  <Bot className="w-5 h-5 text-violet-500" />
  Resumo da negociação
  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
    BETA
  </span>
</h2>
<span className="block text-xs text-gray-500 mt-1 ml-7">
  Pode levar cerca de 1 minuto para gerar um resumo.
</span>
                  {summary ? (
                    <button
                      onClick={handleDeleteSummary}
                      className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                      disabled={deletingSummary}
                    >
                      {deletingSummary ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleCreateSummary}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                      disabled={creatingSummary}
                    >
                      {creatingSummary ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {loadingSummary ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : summary ? (
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">{summary}</pre>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum resumo disponível.</p>
                )}
                {summaryError && (
                  <p className="text-sm text-red-600 mt-2">{summaryError}</p>
                )}
              </div>
              {/* Activities Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    Atividades
                  </h2>
                </div>

                {/* New Activity Form */}
                {canEditCRM && (
                  <div className="mb-6 border-b border-gray-300 pb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Nova Atividade</h3>
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
                            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg mb-2"
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
                            className="bg-white rounded-lg"
                          />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={handleCreateActivity}
                          disabled={!newActivity.trim() || savingActivity}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                  <h3 className="text-sm font-medium text-gray-700">Histórico de Atividades</h3>
                  
                  {loadingActivities ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nenhuma atividade registrada</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => {
                        const activityUser = users.find(u => u.Id === activity.id_usuario);
                        
                        return (
                          <div key={activity.Id} className="border border-gray-300 rounded-lg p-4">
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
                                      className="bg-white rounded-lg"
                                    />
                                  )}
                                </div>
                                
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingActivity(null)}
                                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={handleUpdateActivity}
                                    disabled={savingActivity}
                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                      <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{activityUser?.nome || 'Usuário'}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(activity.CreatedAt)} às {formatTime(activity.CreatedAt)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {canEditCRM && (
                                    <div className="relative group">
                                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                      <div className="absolute right-0 mt-1 w-36 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-300 hidden group-hover:block z-10">
                                        <button
                                          onClick={() => setEditingActivity(activity)}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          <Edit className="w-4 h-4" />
                                          <span>Editar</span>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteActivity(activity.Id)}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          <span>Excluir</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div 
                                  className="text-gray-700 prose-sm max-w-none"
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
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-500" />
                    Contato
                  </h2>
                  {!editingContact ? (
                    canEditCRM && (
                      <button
                        onClick={() => setEditingContact(true)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingContact(false)}
                        className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-50"
                        disabled={savingChanges}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleUpdateContact}
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
                {deal.contato ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        {editingContact ? (
                          <input
                            type="text"
                            value={editedContact?.nome}
                            onChange={(e) => setEditedContact(prev => prev ? {...prev, nome: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <>
                            <p className="font-medium text-gray-900">{deal.contato.nome}</p>
                            <p className="text-xs text-gray-500">Nome</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        {editingContact ? (
                          <input
                            type="email"
                            value={editedContact?.email}
                            onChange={(e) => setEditedContact(prev => prev ? {...prev, email: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <>
                            <p className="font-medium text-gray-900">{deal.contato.Email || 'Não informado'}</p>
                            <p className="text-xs text-gray-500">Email</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        {editingContact ? (
                          <input
                            type="tel"
                            value={editedContact?.telefone}
                            onChange={(e) => setEditedContact(prev => prev ? {...prev, telefone: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <>
                            <p className="font-medium text-gray-900">{deal.contato.telefone || 'Não informado'}</p>
                            <p className="text-xs text-gray-500">Telefone</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    {!editingContact && (
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Ações Rápidas</h3>
                        <div className="flex flex-wrap gap-2">
                          
                          {deal.contato.Email && (
                            <a 
                              href={`mailto:${deal.contato.Email}`}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Email</span>
                            </a>
                          )}
                          
                          {deal.contato.telefone && (
                            <a 
                              href={`tel:${deal.contato.telefone.replace(/\D/g, '')}`}
                              className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Ligar</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>Nenhum contato associado</p>
                    {canEditCRM && (
                      <button
                        onClick={() => setEditingContact(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Adicionar contato
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-purple-500" />
                    Campos personalizados
                  </h2>
                  {canEditCRM && (
                    <button
                      onClick={() => setAddingField(true)}
                      className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar campo
                    </button>
                  )}
                </div>
                {leadFields.length > 0 ? (
                  <div className="divide-y divide-gray-200">
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
                            <p className="text-sm font-medium text-gray-700">{field.nome}</p>
                            {!editing ? (
                              <p className="mt-1 text-gray-900">
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
                                  className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
                                  className="px-3 py-1 text-sm rounded-lg bg-gray-200"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </div>
                          {!editing && canEditCRM && (
                            <button
                              onClick={() => setEditingFieldId(field.Id)}
                              className="text-blue-600 text-sm hover:underline"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Ainda não há nenhum campo cadastrado vinculado ao lead.
                  </p>
                )}
                {addingField && (
                  <div className="mt-4 p-3 border rounded-lg space-y-2">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="px-3 py-1 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => {
                              setAddingField(false);
                              setNewFieldId(null);
                              setNewFieldValue(null);
                            }}
                            className="px-3 py-1 text-sm rounded-lg bg-gray-200"
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
            <div className="w-full md:w-[480px] bg-gray-100 rounded-2xl overflow-hidden shadow-md border border-gray-300 flex flex-col" style={{ height: "600px" }}>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center">
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
                    <div
                      key={index}
                      className={`flex ${message.key.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.key.fromMe
                            ? 'bg-emerald-100 text-gray-800'
                            : 'bg-white text-gray-800'
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
                        <p className="text-right text-xs text-gray-500 mt-1">
                          {formatMessageDateTime(message.data)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm">
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
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tem certeza que deseja excluir?
              </h3>
              <p className="text-gray-500 mt-1">
                Esta ação não pode ser desfeita e todos os dados relacionados a esta negociação serão perdidos.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
  );
}
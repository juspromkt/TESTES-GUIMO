import React, { useEffect, useRef, useState } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Loader2,
  Edit2,
  Save,
  X,
  Upload,
  FileText
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface AgentFunctionAttribute {
  id: number;
  id_funcao: number;
  nome?: string | null;
  descricao?: string | null;
  isAtivo: boolean;
  numero?: string | null;
  id_usuario?: number | null;
  notificar_usuario_responsavel?: boolean | null;
}

type AgentFunctionType = 'REQUEST' | 'FILE' | 'NOTIFICACAO';

type NotificationRecipientType = 'numero' | 'usuario' | 'responsavel';

interface CRMUser {
  Id: number;
  nome: string;
}

interface StandardAttributeFormData {
  nome: string;
  descricao: string;
  isAtivo: boolean;
}

interface NotificationAttributeFormData {
  destinatarioTipo: '' | NotificationRecipientType;
  numero: string;
  id_usuario: string;
  notificar_usuario_responsavel: boolean;
  isAtivo: boolean;
}

const createEmptyStandardAttribute = (): StandardAttributeFormData => ({
  nome: '',
  descricao: '',
  isAtivo: true
});

const createEmptyNotificationAttribute = (): NotificationAttributeFormData => ({
  destinatarioTipo: '',
  numero: '',
  id_usuario: '',
  notificar_usuario_responsavel: false,
  isAtivo: true
});

const updateNotificationFormData = (
  current: NotificationAttributeFormData,
  field: keyof NotificationAttributeFormData,
  value: string | boolean
): NotificationAttributeFormData => {
  const updated: NotificationAttributeFormData = { ...current };

  if (field === 'destinatarioTipo') {
    const nextType = value as NotificationAttributeFormData['destinatarioTipo'];
    updated.destinatarioTipo = nextType;
    updated.notificar_usuario_responsavel = nextType === 'responsavel';
    if (nextType !== 'numero') {
      updated.numero = '';
    }
    if (nextType !== 'usuario') {
      updated.id_usuario = '';
    }
  } else if (field === 'numero') {
    updated.numero = String(value);
  } else if (field === 'id_usuario') {
    updated.id_usuario = String(value);
  } else if (field === 'isAtivo') {
    updated.isAtivo = Boolean(value);
  } else if (field === 'notificar_usuario_responsavel') {
    updated.notificar_usuario_responsavel = Boolean(value);
  }

  return updated;
};

const normalizeAttributes = (func: any): AgentFunctionAttribute[] => {
  if (!Array.isArray(func?.atributos)) {
    return [];
  }

  return func.atributos
    .filter((attr: any) => attr && typeof attr.id === 'number')
    .map((attr: any) => {
      let idUsuario: number | null = null;
      if (typeof attr.id_usuario === 'number' && Number.isFinite(attr.id_usuario)) {
        idUsuario = attr.id_usuario;
      } else if (typeof attr.id_usuario === 'string' && attr.id_usuario.trim() !== '') {
        const parsed = Number(attr.id_usuario);
        idUsuario = Number.isFinite(parsed) ? parsed : null;
      }

      const numero = typeof attr.numero === 'string' ? attr.numero.trim() : '';
      const rawNotify = attr.notificar_usuario_responsavel;
      const notifyResponsavel =
        typeof rawNotify === 'boolean'
          ? rawNotify
          : typeof rawNotify === 'number'
          ? rawNotify === 1
          : null;

      return {
        id: attr.id,
        id_funcao: typeof attr.id_funcao === 'number' ? attr.id_funcao : func.id,
        nome: typeof attr.nome === 'string' ? attr.nome : null,
        descricao: typeof attr.descricao === 'string' ? attr.descricao : null,
        isAtivo: attr.isAtivo !== false,
        numero: numero || null,
        id_usuario: idUsuario,
        notificar_usuario_responsavel: notifyResponsavel
      } as AgentFunctionAttribute;
    });
};

const MESSAGE_TAGS = [
  { label: 'Nome do lead', value: '{{nome}}' },
  { label: 'Telefone', value: '{{telefone}}' },
  { label: 'Resumo da conversa', value: '{{resumo}}' }
];

interface AgentFunction {
  id: number;
  nome: string;
  url: string;
  descricao: string;
  isAtivo: boolean;
  tipo: AgentFunctionType;
  mensagem?: string;
  atributos: AgentFunctionAttribute[];
}

interface AgentFunctionsSectionProps {
  token: string;
  idAgente: number;
  canEdit: boolean;
}

const AgentFunctionsSection: React.FC<AgentFunctionsSectionProps> = ({ token, idAgente, canEdit }) => {
  const [functions, setFunctions] = useState<AgentFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newFunction, setNewFunction] = useState({
    nome: '',
    url: '',
    descricao: '',
    isAtivo: true,
    tipo: 'REQUEST' as AgentFunctionType,
    mensagem: ''
  });
  const [newFunctionFile, setNewFunctionFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [standardAttributeInputs, setStandardAttributeInputs] = useState<Record<number, StandardAttributeFormData>>({});
  const [notificationAttributeInputs, setNotificationAttributeInputs] = useState<
    Record<number, NotificationAttributeFormData>
  >({});
  const [editingAttribute, setEditingAttribute] = useState<number | null>(null);
  const [editingAttributeMode, setEditingAttributeMode] = useState<'STANDARD' | 'NOTIFICATION' | null>(null);
  const [editingAttributeData, setEditingAttributeData] = useState<StandardAttributeFormData>(createEmptyStandardAttribute());
  const [editingNotificationAttributeData, setEditingNotificationAttributeData] = useState<NotificationAttributeFormData>(
    createEmptyNotificationAttribute()
  );
  const [editingFunction, setEditingFunction] = useState<number | null>(null);
  const [editingFunctionData, setEditingFunctionData] = useState<{
    nome: string;
    url: string;
    descricao: string;
    isAtivo: boolean;
    tipo: AgentFunctionType;
    mensagem: string;
  }>({
    nome: '',
    url: '',
    descricao: '',
    isAtivo: true,
    tipo: 'REQUEST',
    mensagem: ''
  });
  const [editingFunctionFile, setEditingFunctionFile] = useState<File | null>(null);
  const [uploadingEditFile, setUploadingEditFile] = useState(false);
  const [usuarios, setUsuarios] = useState<CRMUser[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const newMessageRef = useRef<HTMLTextAreaElement | null>(null);
  const editMessageRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    getRootProps: getNewFileRootProps,
    getInputProps: getNewFileInputProps
  } = useDropzone({
    onDrop: files => handleFileUpload(files, url => setNewFunction({ ...newFunction, url }), setNewFunctionFile, setUploadingFile),
    accept: {
      'text/csv': [],
      'application/pdf': [],
      'application/json': [],
      'text/plain': [],
      'application/vnd.ms-excel': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': []
    },
    multiple: false
  });

  const {
    getRootProps: getEditFileRootProps,
    getInputProps: getEditFileInputProps
  } = useDropzone({
    onDrop: files => handleFileUpload(files, url => setEditingFunctionData({ ...editingFunctionData, url }), setEditingFunctionFile, setUploadingEditFile),
    accept: {
      'text/csv': [],
      'application/pdf': [],
      'application/json': [],
      'text/plain': [],
      'application/vnd.ms-excel': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': []
    },
    multiple: false
  });

  useEffect(() => {
    fetchFunctions();
    fetchUsuarios();
  }, [idAgente]);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/get?id_agente=${idAgente}`, {
        headers: { token }
      });
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Tratar quando a API retorna null, undefined ou array vazio
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setFunctions([]);
      } else if (Array.isArray(data)) {
        // Filtrar objetos vazios e objetos que não têm ID válido
        const validFunctions = data
          .filter(func => {
            if (!func || typeof func !== 'object') return false;

            const hasRequiredBaseFields = func.id && func.nome && func.hasOwnProperty('descricao');

            if (!hasRequiredBaseFields) return false;

            if (func.tipo === 'NOTIFICACAO') {
              return true;
            }

            if (func.tipo === 'REQUEST' || func.tipo === 'FILE') {
              return Boolean(func.url);
            }

            return false;
          })
          .map(func => ({
            ...func,
            url: typeof func.url === 'string' ? func.url : '',
            tipo:
              func.tipo === 'FILE'
                ? 'FILE'
                : func.tipo === 'NOTIFICACAO'
                ? 'NOTIFICACAO'
                : 'REQUEST',
            mensagem: typeof func.mensagem === 'string' ? func.mensagem : '',
            atributos: normalizeAttributes(func)
          }));
        setFunctions(validFunctions);
      } else {
        setFunctions([]);
      }
    } catch (err) {
      console.error('Erro ao buscar funções', err);
      setError('Erro ao carregar funções. Tente novamente.');
      setFunctions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get', {
        headers: { token }
      });

      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        const validUsers = data
          .filter((user: any) => user && typeof user.Id === 'number')
          .map((user: any) => ({
            Id: user.Id,
            nome:
              typeof user.nome === 'string' && user.nome.trim().length > 0
                ? user.nome.trim()
                : `Usuário ${user.Id}`
          }));
        setUsuarios(validUsers);
      } else {
        setUsuarios([]);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários', err);
      setUsuarios([]);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const getUsuarioNome = (id?: number | null) => {
    if (!id) return '';
    const usuario = usuarios.find(user => user.Id === id);
    return usuario ? usuario.nome : `Usuário #${id}`;
  };

  const validateUrl = (url: string): boolean => {
    const trimmedUrl = url.trim();
    
    // Verifica se está vazio
    if (!trimmedUrl) return false;
    
    try {
      // Tenta criar uma URL válida
      const urlObj = new URL(trimmedUrl);
      
      // Verifica se o protocolo é http ou https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Verifica se tem hostname válido
      if (!urlObj.hostname || urlObj.hostname.length < 1) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  };

  const handleFileUpload = async (
    files: File[],
    setUrl: (url: string) => void,
    setFile: (file: File | null) => void,
    setUploading: (b: boolean) => void
  ) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/upload?id_agente=${idAgente}` , {
        method: 'POST',
        headers: { token },
        body: (() => { formData.append('id_agente', String(idAgente)); return formData; })()
      });
      if (!res.ok) throw new Error('upload');
      const { url } = await res.json();
      setUrl(url);
      setFile(file);
    } catch (err) {
      console.error('Erro ao fazer upload', err);
      showMessage('Falha no upload do arquivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const renderFileLink = (url: string) => {
    const name = url.split('/').pop()?.split('?')[0] || 'Arquivo';
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">
        {name}
      </a>
    );
  };

  const getFileName = (path: string) => path.split('/').pop()?.split('?')[0] || '';

  const getFileType = (name: string) => name.split('.').pop()?.toUpperCase() || 'ARQ';

  const validateAttributeName = (nome: string): boolean => {
    const trimmedName = nome.trim();
    
    // Verifica se está vazio
    if (!trimmedName) return false;
    
    // Verifica se contém apenas caracteres válidos para propriedades JSON/HTTP
    // Aceita: letras, números, underscore, hífen
    // Não aceita: espaços, caracteres especiais, acentos, etc.
    const validNameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
    
    if (!validNameRegex.test(trimmedName)) {
      return false;
    }
    
    // Verifica se não é uma palavra reservada do JavaScript/JSON
    const reservedWords = [
      'constructor', 'prototype', '__proto__', 'toString', 'valueOf', 
      'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
      'undefined', 'null', 'true', 'false', 'function', 'var', 'let', 'const'
    ];
    
    if (reservedWords.includes(trimmedName.toLowerCase())) {
      return false;
    }
    
    return true;
  };

  const validateFunctionData = (
    nome: string,
    url: string,
    descricao: string,
    tipo: AgentFunctionType,
    mensagem: string
  ): string | null => {
    if (!nome.trim()) return 'Nome da função é obrigatório';
    if (nome.trim().length < 3) return 'Nome da função deve ter pelo menos 3 caracteres';
    if (tipo === 'REQUEST') {
      if (!url.trim()) return 'URL é obrigatória';
      if (!validateUrl(url)) return 'URL inválida. Use uma URL completa como: https://exemplo.com/api';
    } else if (tipo === 'FILE') {
      if (!url.trim()) {
        return 'Faça o upload de um arquivo';
      }
    } else if (tipo === 'NOTIFICACAO') {
      if (!mensagem.trim()) return 'Mensagem de notificação é obrigatória';
      if (mensagem.trim().length < 5)
        return 'Mensagem de notificação deve ter pelo menos 5 caracteres para garantir um conteúdo mínimo';
    }
    if (!descricao.trim()) return 'Descrição da função é obrigatória';
    if (descricao.trim().length < 10) return 'Descrição deve ter pelo menos 10 caracteres para explicar bem o contexto';
    return null;
  };

  const validateAttributeData = (nome: string, descricao: string): string | null => {
    if (!nome.trim()) return 'Nome do atributo é obrigatório';
    if (nome.trim().length < 2) return 'Nome do atributo deve ter pelo menos 2 caracteres';
    if (!validateAttributeName(nome)) {
      return 'Nome do atributo inválido. Use apenas letras, números, _ e - (sem espaços ou acentos). Exemplo: "email_destinatario"';
    }
    if (!descricao.trim()) return 'Descrição do atributo é obrigatória';
    if (descricao.trim().length < 5) return 'Descrição deve ter pelo menos 5 caracteres';
    return null;
  };

  const showMessage = (message: string, type: 'error' | 'success') => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
  };

  const insertTagAtCursor = (
    ref: React.RefObject<HTMLTextAreaElement>,
    currentValue: string,
    updateValue: (value: string) => void,
    tag: string
  ) => {
    const textarea = ref.current;
    if (!textarea) {
      updateValue(`${currentValue}${tag}`);
      return;
    }

    const selectionStart = textarea.selectionStart ?? currentValue.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const newValue = `${currentValue.slice(0, selectionStart)}${tag}${currentValue.slice(selectionEnd)}`;
    updateValue(newValue);

    const cursorPosition = selectionStart + tag.length;
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = cursorPosition;
      textarea.selectionEnd = cursorPosition;
    }, 0);
  };

  const handleInsertNewMessageTag = (tag: string) => {
    insertTagAtCursor(
      newMessageRef,
      newFunction.mensagem,
      value => setNewFunction(prev => ({ ...prev, mensagem: value })),
      tag
    );
  };

  const handleInsertEditMessageTag = (tag: string) => {
    insertTagAtCursor(
      editMessageRef,
      editingFunctionData.mensagem,
      value => setEditingFunctionData(prev => ({ ...prev, mensagem: value })),
      tag
    );
  };

  const handleCreateFunction = async () => {
    const validationError = validateFunctionData(
      newFunction.nome,
      newFunction.url,
      newFunction.descricao,
      newFunction.tipo,
      newFunction.mensagem
    );
    if (validationError) {
      showMessage(validationError, 'error');
      return;
    }

    if (functions.length >= 5) {
      showMessage('Limite máximo de 5 funções atingido', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          token 
        },
        body: JSON.stringify({
          id_agente: idAgente,
          nome: newFunction.nome.trim(),
          url: newFunction.tipo === 'NOTIFICACAO' ? '' : newFunction.url.trim(),
          descricao: newFunction.descricao.trim(),
          isAtivo: newFunction.isAtivo,
          tipo: newFunction.tipo,
          ...(newFunction.tipo === 'NOTIFICACAO'
            ? { mensagem: newFunction.mensagem.trim() }
            : {})
        })
      });
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      
      setNewFunction({ nome: '', url: '', descricao: '', isAtivo: true, tipo: 'REQUEST', mensagem: '' });
      setNewFunctionFile(null);
      await fetchFunctions();
      showMessage('Função criada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao criar função:', err);
      showMessage('Erro ao criar função. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditFunction = (func: AgentFunction) => {
    setEditingFunction(func.id);
    setEditingFunctionData({
      nome: func.nome,
      url: func.url || '',
      descricao: func.descricao || '',
      isAtivo: func.isAtivo,
      tipo: func.tipo,
      mensagem: func.mensagem || ''
    });
    setEditingFunctionFile(null);
  };

  const handleUpdateFunction = async (func: AgentFunction) => {
    const validationError = validateFunctionData(
      editingFunctionData.nome,
      editingFunctionData.url,
      editingFunctionData.descricao,
      editingFunctionData.tipo,
      editingFunctionData.mensagem
    );
    if (validationError) {
      showMessage(validationError, 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          token 
        },
        body: JSON.stringify({
          id: func.id,
          nome: editingFunctionData.nome.trim(),
          url: editingFunctionData.tipo === 'NOTIFICACAO' ? '' : editingFunctionData.url.trim(),
          descricao: editingFunctionData.descricao.trim(),
          isAtivo: editingFunctionData.isAtivo,
          tipo: editingFunctionData.tipo,
          ...(editingFunctionData.tipo === 'NOTIFICACAO'
            ? { mensagem: editingFunctionData.mensagem.trim() }
            : {})
        })
      });
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      
      setEditingFunction(null);
      setEditingFunctionFile(null);
      await fetchFunctions();
      showMessage('Função atualizada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao atualizar função:', err);
      showMessage('Erro ao atualizar função. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFunction = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta função? Esta ação não pode ser desfeita.')) return;
    
    setSaving(true);
    try {
      const res = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/delete?id=${id}`, {
        method: 'DELETE',
        headers: { token }
      });
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      
      await fetchFunctions();
      showMessage('Função deletada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao deletar função:', err);
      showMessage('Erro ao deletar função. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStandardAttributeInputChange = (
    funcId: number,
    field: keyof StandardAttributeFormData,
    value: string | boolean
  ) => {
    setStandardAttributeInputs(prev => {
      const current = prev[funcId] ?? createEmptyStandardAttribute();
      const updated: StandardAttributeFormData =
        field === 'isAtivo'
          ? { ...current, isAtivo: Boolean(value) }
          : field === 'nome'
          ? { ...current, nome: String(value) }
          : { ...current, descricao: String(value) };

      return {
        ...prev,
        [funcId]: updated
      };
    });
  };

  const handleNotificationAttributeInputChange = (
    funcId: number,
    field: keyof NotificationAttributeFormData,
    value: string | boolean
  ) => {
    setNotificationAttributeInputs(prev => ({
      ...prev,
      [funcId]: updateNotificationFormData(prev[funcId] ?? createEmptyNotificationAttribute(), field, value)
    }));
  };

  const handleEditingNotificationAttributeChange = (
    field: keyof NotificationAttributeFormData,
    value: string | boolean
  ) => {
    setEditingNotificationAttributeData(prev => updateNotificationFormData(prev, field, value));
  };

  const handleCreateAttribute = async (func: AgentFunction) => {
    if (func.tipo === 'NOTIFICACAO') {
      const attr = notificationAttributeInputs[func.id] ?? createEmptyNotificationAttribute();

      if (func.atributos && func.atributos.length >= 10) {
        showMessage('Limite máximo de 10 destinatários por função de notificação atingido', 'error');
        return;
      }

      if (!attr.destinatarioTipo) {
        showMessage('Selecione quem deve receber a notificação', 'error');
        return;
      }

      const payload: {
        id_funcao: number;
        isAtivo: boolean;
        numero: string | null;
        id_usuario: number | null;
        notificar_usuario_responsavel: boolean;
      } = {
        id_funcao: func.id,
        isAtivo: attr.isAtivo,
        numero: null,
        id_usuario: null,
        notificar_usuario_responsavel: false
      };

      if (attr.destinatarioTipo === 'numero') {
        const numero = attr.numero.trim();
        if (!numero) {
          showMessage('Informe o número que deve receber a notificação', 'error');
          return;
        }
        payload.numero = numero;
      } else if (attr.destinatarioTipo === 'usuario') {
        const idUsuario = Number(attr.id_usuario);
        if (!idUsuario || !Number.isFinite(idUsuario)) {
          showMessage('Selecione o usuário que deve ser notificado', 'error');
          return;
        }
        payload.id_usuario = idUsuario;
      } else if (attr.destinatarioTipo === 'responsavel') {
        payload.notificar_usuario_responsavel = true;
      }

      setSaving(true);
      try {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/atributo/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({ ...payload, id_agente: idAgente })
        });

        if (!res.ok) {
          throw new Error(`Erro HTTP: ${res.status}`);
        }

        setNotificationAttributeInputs(prev => ({
          ...prev,
          [func.id]: createEmptyNotificationAttribute()
        }));
        await fetchFunctions();
        showMessage('Destinatário adicionado com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao criar atributo:', err);
        showMessage('Erro ao criar destinatário. Tente novamente.', 'error');
      } finally {
        setSaving(false);
      }

      return;
    }

    const attr = standardAttributeInputs[func.id] ?? createEmptyStandardAttribute();

    const validationError = validateAttributeData(attr.nome, attr.descricao);
    if (validationError) {
      showMessage(validationError, 'error');
      return;
    }

    if (func.atributos && func.atributos.length >= 5) {
      showMessage('Limite máximo de 5 atributos por função atingido', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/atributo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id_agente: idAgente,
          id_funcao: func.id,
          nome: attr.nome.trim(),
          descricao: attr.descricao.trim(),
          isAtivo: attr.isAtivo
        })
      });

      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }

      setStandardAttributeInputs(prev => ({
        ...prev,
        [func.id]: createEmptyStandardAttribute()
      }));
      await fetchFunctions();
      showMessage('Atributo criado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao criar atributo:', err);
      showMessage('Erro ao criar atributo. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditAttribute = (func: AgentFunction, attr: AgentFunctionAttribute) => {
    setEditingAttribute(attr.id);

    if (func.tipo === 'NOTIFICACAO') {
      setEditingAttributeMode('NOTIFICATION');
      setEditingAttributeData(createEmptyStandardAttribute());
      setEditingNotificationAttributeData({
        destinatarioTipo: attr.numero
          ? 'numero'
          : attr.id_usuario
          ? 'usuario'
          : attr.notificar_usuario_responsavel
          ? 'responsavel'
          : '',
        numero: attr.numero ?? '',
        id_usuario: attr.id_usuario ? String(attr.id_usuario) : '',
        notificar_usuario_responsavel: Boolean(attr.notificar_usuario_responsavel),
        isAtivo: attr.isAtivo
      });
    } else {
      setEditingAttributeMode('STANDARD');
      setEditingNotificationAttributeData(createEmptyNotificationAttribute());
      setEditingAttributeData({
        nome: attr.nome || '',
        descricao: attr.descricao || '',
        isAtivo: attr.isAtivo
      });
    }
  };

  const handleUpdateAttribute = async (func: AgentFunction, attr: AgentFunctionAttribute) => {
    if (func.tipo === 'NOTIFICACAO') {
      const editingData = editingNotificationAttributeData;

      if (!editingData.destinatarioTipo) {
        showMessage('Selecione quem deve receber a notificação', 'error');
        return;
      }

      const payload: {
        id: number;
        id_funcao: number;
        isAtivo: boolean;
        numero: string | null;
        id_usuario: number | null;
        notificar_usuario_responsavel: boolean;
      } = {
        id: attr.id,
        id_funcao: attr.id_funcao,
        isAtivo: editingData.isAtivo,
        numero: null,
        id_usuario: null,
        notificar_usuario_responsavel: false
      };

      if (editingData.destinatarioTipo === 'numero') {
        const numero = editingData.numero.trim();
        if (!numero) {
          showMessage('Informe o número que deve receber a notificação', 'error');
          return;
        }
        payload.numero = numero;
      } else if (editingData.destinatarioTipo === 'usuario') {
        const idUsuario = Number(editingData.id_usuario);
        if (!idUsuario || !Number.isFinite(idUsuario)) {
          showMessage('Selecione o usuário que deve ser notificado', 'error');
          return;
        }
        payload.id_usuario = idUsuario;
      } else if (editingData.destinatarioTipo === 'responsavel') {
        payload.notificar_usuario_responsavel = true;
      }

      setSaving(true);
      try {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/atributo/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error(`Erro HTTP: ${res.status}`);
        }

        handleCancelEditAttribute();
        await fetchFunctions();
        showMessage('Destinatário atualizado com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao atualizar atributo:', err);
        showMessage('Erro ao atualizar destinatário. Tente novamente.', 'error');
      } finally {
        setSaving(false);
      }

      return;
    }

    const validationError = validateAttributeData(editingAttributeData.nome, editingAttributeData.descricao);
    if (validationError) {
      showMessage(validationError, 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/atributo/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id: attr.id,
          id_funcao: attr.id_funcao,
          nome: editingAttributeData.nome.trim(),
          descricao: editingAttributeData.descricao.trim(),
          isAtivo: editingAttributeData.isAtivo
        })
      });

      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }

      handleCancelEditAttribute();
      await fetchFunctions();
      showMessage('Atributo atualizado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao atualizar atributo:', err);
      showMessage('Erro ao atualizar atributo. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAttribute = async (attribute: Pick<AgentFunctionAttribute, 'id' | 'id_funcao'>) => {
    if (!confirm('Tem certeza que deseja deletar este atributo? Esta ação não pode ser desfeita.')) return;

    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/atributo/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id_funcao: attribute.id_funcao,
          id_atributo: attribute.id
        })
      });

      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }

      await fetchFunctions();
      showMessage('Atributo deletado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao deletar atributo:', err);
      showMessage('Erro ao deletar atributo. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditFunction = () => {
    setEditingFunction(null);
    setEditingFunctionData({ nome: '', url: '', descricao: '', isAtivo: true, tipo: 'REQUEST', mensagem: '' });
    setEditingFunctionFile(null);
  };

  const handleCancelEditAttribute = () => {
    setEditingAttribute(null);
    setEditingAttributeMode(null);
    setEditingAttributeData(createEmptyStandardAttribute());
    setEditingNotificationAttributeData(createEmptyNotificationAttribute());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-gray-600">Carregando funções...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Funções do Agente
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                BETA
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie funções externas que o agente pode executar (máximo 5 funções; atributos variam por tipo)
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {canEdit && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Nova Função</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Função *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Enviar E-mail"
                    value={newFunction.nome}
                    onChange={e => setNewFunction({ ...newFunction, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={newFunction.tipo}
                    onChange={e => {
                      const selectedType = e.target.value as AgentFunctionType;
                      setNewFunction(prev => ({
                        ...prev,
                        tipo: selectedType,
                        url: selectedType === 'REQUEST' ? prev.url : '',
                        mensagem: prev.mensagem
                      }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="REQUEST">Função HTTP</option>
                    <option value="FILE">Leitura de Arquivo</option>
                    <option value="NOTIFICACAO">Notificação</option>
                  </select>
                </div>
              </div>
              {newFunction.tipo === 'REQUEST' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: https://api.exemplo.com/enviar-email"
                    value={newFunction.url}
                    onChange={e => setNewFunction({ ...newFunction, url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deve ser uma URL completa (ex: https://api.exemplo.com/endpoint)
                  </p>
                </div>
              )}
              {newFunction.tipo === 'FILE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo *</label>
                  <div
                    {...getNewFileRootProps()}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${uploadingFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
                  >
                    <input {...getNewFileInputProps()} />
                    {uploadingFile ? (
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Enviando...</span>
                      </div>
                    ) : newFunctionFile ? (
                      <div className="flex items-center gap-2 justify-center text-sm text-gray-700">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <div className="text-left">
                          <p className="font-medium">{getFileName(newFunctionFile.name)}</p>
                          <p className="text-xs text-gray-500">{getFileType(newFunctionFile.name)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Upload className="w-8 h-8 mb-2" />
                        <p className="text-sm">Arraste o arquivo aqui ou clique para selecionar</p>
                        <p className="text-xs text-gray-400 mt-1">csv, pdf, json, txt, xls, xlsx</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            {newFunction.tipo === 'NOTIFICACAO' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wide uppercase text-emerald-700">
                      Mensagem da Notificação
                    </p>
                    <p className="text-xs text-emerald-600">
                      Esse é o texto que será enviado quando a função for acionada.
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-white text-emerald-600 border border-emerald-200">
                    Obrigatório
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {MESSAGE_TAGS.map(tag => (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => handleInsertNewMessageTag(tag.value)}
                        className="px-3 py-1 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors"
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={newMessageRef}
                    rows={4}
                    placeholder="Lead qualificado! Nome: {{nome}}. Telefone: {{telefone}}. Resumo da conversa: {{resumo}}"                    
                    value={newFunction.mensagem}
                    onChange={e => setNewFunction({ ...newFunction, mensagem: e.target.value })}
                    className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-vertical bg-white"
                    maxLength={500}
                  />
                  <p className="text-xs text-emerald-700">
                    Utilize as tags acima para personalizar a mensagem com dados do lead.
                  </p>
                </div>
              </div>
            )}
            <div
              className={`rounded-xl p-4 border ${
                newFunction.tipo === 'NOTIFICACAO'
                  ? 'bg-slate-50 border-slate-200 shadow-sm'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Descrição do Contexto *
                </label>
                {newFunction.tipo === 'NOTIFICACAO' && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    Guia para a IA
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                placeholder="Ex: Use esta função quando o usuário solicitar envio de e-mails ou quando precisar notificar alguém por e-mail. A função enviará um e-mail com o conteúdo especificado para o destinatário informado."
                value={newFunction.descricao}
                onChange={e => setNewFunction({ ...newFunction, descricao: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-vertical bg-white"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-2">
                Explique quando e como a IA deve usar esta função (mínimo 10 caracteres)
              </p>
            </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newFunctionActive"
                  checked={newFunction.isAtivo}
                  onChange={e => setNewFunction({ ...newFunction, isAtivo: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="newFunctionActive" className="text-sm text-gray-700">
                  Função ativa
                </label>
              </div>
              <button
                onClick={handleCreateFunction}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Criando...' : 'Criar Função'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Funções Cadastradas ({functions.length}/5)
            </h3>
          </div>

          {functions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Não existem funções cadastradas</h4>
              <p className="text-gray-500 mb-4">
                As funções permitem que o agente execute ações externas automaticamente.
              </p>
              {canEdit && (
                <p className="text-sm text-gray-400">
                  Use o formulário acima para criar sua primeira função.
                </p>
              )}
            </div>
          ) : (
            functions.map(func => {
              const standardInput = standardAttributeInputs[func.id] ?? createEmptyStandardAttribute();
              const notificationInput = notificationAttributeInputs[func.id] ?? createEmptyNotificationAttribute();

              return (
                <div key={func.id} className="border border-gray-200 rounded-lg p-6">
                {editingFunction === func.id ? (
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-gray-900">Editando Função</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome da Função *
                        </label>
                        <input
                          type="text"
                          value={editingFunctionData.nome}
                          onChange={e => setEditingFunctionData({ 
                            ...editingFunctionData, 
                            nome: e.target.value 
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo *
                        </label>
                        <select
                          value={editingFunctionData.tipo}
                          onChange={e => {
                            const selectedType = e.target.value as AgentFunctionType;
                            setEditingFunctionData(prev => ({
                              ...prev,
                              tipo: selectedType,
                              url: selectedType === 'REQUEST' ? prev.url : '',
                              mensagem: prev.mensagem
                            }));
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="REQUEST">Função HTTP</option>
                          <option value="FILE">Leitura de Arquivo</option>
                          <option value="NOTIFICACAO">Notificação</option>
                        </select>
                      </div>
                    </div>
                    {editingFunctionData.tipo === 'REQUEST' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                        <input
                          type="text"
                          value={editingFunctionData.url}
                          onChange={e => setEditingFunctionData({ ...editingFunctionData, url: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Deve ser uma URL completa (ex: https://api.exemplo.com/endpoint)</p>
                      </div>
                    )}
                    {editingFunctionData.tipo === 'FILE' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo *</label>
                        <div
                          {...getEditFileRootProps()}
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${uploadingEditFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
                        >
                          <input {...getEditFileInputProps()} />
                          {uploadingEditFile ? (
                            <div className="flex items-center justify-center gap-2 text-gray-500">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Enviando...</span>
                            </div>
                          ) : editingFunctionFile ? (
                            <div className="flex items-center gap-2 justify-center text-sm text-gray-700">
                              <FileText className="w-5 h-5 text-emerald-600" />
                              <div className="text-left">
                                <p className="font-medium">{getFileName(editingFunctionFile.name)}</p>
                                <p className="text-xs text-gray-500">{getFileType(editingFunctionFile.name)}</p>
                              </div>
                            </div>
                          ) : editingFunctionData.url ? (
                            <div className="flex items-center gap-2 justify-center text-sm text-gray-700">
                              <FileText className="w-5 h-5 text-emerald-600" />
                              <div className="text-left">
                                <p className="font-medium">{getFileName(editingFunctionData.url)}</p>
                                <p className="text-xs text-gray-500">{getFileType(editingFunctionData.url)}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Upload className="w-8 h-8 mb-2" />
                              <p className="text-sm">Arraste o arquivo aqui ou clique para selecionar</p>
                              <p className="text-xs text-gray-400 mt-1">csv, pdf, json, txt, xls, xlsx</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {editingFunctionData.tipo === 'NOTIFICACAO' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-xs font-semibold tracking-wide uppercase text-emerald-700">
                              Mensagem da Notificação
                            </p>
                            <p className="text-xs text-emerald-600">
                              Conteúdo enviado ao lead quando esta função for ativada.
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-white text-emerald-600 border border-emerald-200">
                            Obrigatório
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {MESSAGE_TAGS.map(tag => (
                              <button
                                key={tag.value}
                                type="button"
                                onClick={() => handleInsertEditMessageTag(tag.value)}
                                className="px-3 py-1 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors"
                              >
                                {tag.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            ref={editMessageRef}
                            rows={4}
                            placeholder="Ex: Olá {{nome}}, aqui é o assistente virtual da Lumen. Percebi que ainda não conversamos sobre {{resumo}}. Pode me confirmar se o número {{telefone}} está correto?"
                            value={editingFunctionData.mensagem}
                            onChange={e =>
                              setEditingFunctionData(prev => ({ ...prev, mensagem: e.target.value }))
                            }
                            className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-vertical bg-white"
                            maxLength={500}
                          />
                          <p className="text-xs text-emerald-700">
                            Utilize as tags acima para personalizar a mensagem com dados do lead.
                          </p>
                        </div>
                      </div>
                    )}
                    <div
                      className={`rounded-xl p-4 border ${
                        editingFunctionData.tipo === 'NOTIFICACAO'
                          ? 'bg-slate-50 border-slate-200 shadow-sm'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Descrição do Contexto *
                        </label>
                        {editingFunctionData.tipo === 'NOTIFICACAO' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            Guia para a IA
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={editingFunctionData.descricao}
                        onChange={e => setEditingFunctionData({
                          ...editingFunctionData,
                          descricao: e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-vertical bg-white"
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Explique quando e como a IA deve usar esta função (mínimo 10 caracteres)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`editFunc-${func.id}`}
                        checked={editingFunctionData.isAtivo}
                        onChange={e => setEditingFunctionData({ 
                          ...editingFunctionData, 
                          isAtivo: e.target.checked 
                        })}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor={`editFunc-${func.id}`} className="text-sm text-gray-700">
                        Função ativa
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateFunction(func)}
                        disabled={saving}
                        className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar
                      </button>
                      <button
                        onClick={handleCancelEditFunction}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{func.nome}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          func.isAtivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {func.isAtivo ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {func.tipo === 'FILE'
                            ? 'Leitura de Arquivo'
                            : func.tipo === 'NOTIFICACAO'
                            ? 'Notificação'
                            : 'Função HTTP'}
                        </span>
                      </div>
                      {func.tipo === 'REQUEST' && (
                        <p className="text-sm text-gray-600 break-all">{func.url}</p>
                      )}
                      {func.tipo === 'FILE' && (
                        <div className="text-sm text-gray-600 mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <a
                              href={func.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 break-all hover:underline"
                            >
                              {getFileName(func.url)}
                            </a>
                            <span className="text-xs text-gray-500">{getFileType(func.url)}</span>
                          </div>
                        </div>
                      )}
                      {func.tipo === 'NOTIFICACAO' ? (
                        <div className="mt-3 space-y-3">
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                  Mensagem que será enviada
                                </p>
                                <p className="text-xs text-emerald-600">
                                  Texto disparado automaticamente quando a função é acionada.
                                </p>
                              </div>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-white text-emerald-600 border border-emerald-200">
                                Conteúdo
                              </span>
                            </div>
                            <p className="text-sm text-emerald-900 whitespace-pre-wrap bg-white/60 border border-emerald-100 rounded-lg px-3 py-2">
                              {func.mensagem || 'Mensagem não configurada.'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {MESSAGE_TAGS.map(tag => (
                                <span
                                  key={tag.value}
                                  className="px-3 py-1 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded-full"
                                >
                                  {tag.value}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Descrição da função para a IA
                              </p>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                Contexto
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">{func.descricao}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2 whitespace-pre-line">{func.descricao}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEditFunction(func)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                          title="Editar função"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFunction(func.id)}
                          disabled={saving}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full disabled:opacity-50 transition-colors"
                          title="Deletar função"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {func.tipo === 'REQUEST' && (
                    <>
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">
                          Atributos ({func.atributos?.length || 0}/5)
                        </h5>
                      </div>

                      {func.atributos && func.atributos.length > 0 ? (
                        <div className="space-y-3">
                          {func.atributos.map(attr => (
                            <div key={attr.id} className="bg-gray-50 rounded-lg p-4">
                              {editingAttribute === attr.id && editingAttributeMode === 'STANDARD' ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome *
                                      </label>
                                      <input
                                        type="text"
                                        value={editingAttributeData.nome}
                                        onChange={e =>
                                          setEditingAttributeData({
                                            ...editingAttributeData,
                                            nome: e.target.value
                                          })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        maxLength={100}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">
                                        Apenas letras, números, _ e - (sem espaços)
                                      </p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descrição *
                                      </label>
                                      <input
                                        type="text"
                                        value={editingAttributeData.descricao}
                                        onChange={e =>
                                          setEditingAttributeData({
                                            ...editingAttributeData,
                                            descricao: e.target.value
                                          })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        maxLength={255}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`editAttr-${attr.id}`}
                                      checked={editingAttributeData.isAtivo}
                                      onChange={e =>
                                        setEditingAttributeData({
                                          ...editingAttributeData,
                                          isAtivo: e.target.checked
                                        })
                                      }
                                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                    />
                                    <label htmlFor={`editAttr-${attr.id}`} className="text-sm text-gray-700">
                                      Atributo ativo
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleUpdateAttribute(func, attr)}
                                      disabled={saving}
                                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm transition-colors"
                                    >
                                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                      Salvar
                                    </button>
                                    <button
                                      onClick={handleCancelEditAttribute}
                                      className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium text-gray-800">{attr.nome}</p>
                                      <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          attr.isAtivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {attr.isAtivo ? 'Ativo' : 'Inativo'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{attr.descricao}</p>
                                  </div>
                                  {canEdit && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleStartEditAttribute(func, attr)}
                                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                                        title="Editar atributo"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAttribute({ id: attr.id, id_funcao: attr.id_funcao })}
                                        disabled={saving}
                                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full disabled:opacity-50 transition-colors"
                                        title="Deletar atributo"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Nenhum atributo cadastrado.</p>
                      )}

                      {canEdit && editingFunction !== func.id && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h6 className="text-sm font-medium text-gray-900 mb-3">Adicionar Novo Atributo</h6>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Nome *
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: email_destinatario"
                                  value={standardInput.nome}
                                  onChange={e => handleStandardAttributeInputChange(func.id, 'nome', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  maxLength={100}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Apenas letras, números, _ e - (sem espaços)
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Descrição *
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: E-mail do destinatário"
                                  value={standardInput.descricao}
                                  onChange={e => handleStandardAttributeInputChange(func.id, 'descricao', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  maxLength={255}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`newAttr-${func.id}`}
                                checked={standardInput.isAtivo}
                                onChange={e => handleStandardAttributeInputChange(func.id, 'isAtivo', e.target.checked)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                              />
                              <label htmlFor={`newAttr-${func.id}`} className="text-sm text-gray-700">
                                Atributo ativo
                              </label>
                            </div>
                            <button
                              onClick={() => handleCreateAttribute(func)}
                              disabled={saving}
                              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm transition-colors"
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              {saving ? 'Adicionando...' : 'Adicionar Atributo'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {func.tipo === 'NOTIFICACAO' && (
                    <>
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">
                          Destinatários ({func.atributos?.length || 0}/10)
                        </h5>
                      </div>

                      {func.atributos && func.atributos.length > 0 ? (
                        <div className="space-y-3">
                          {func.atributos.map(attr => {
                            const recipientTypeLabel = attr.numero
                              ? 'Número de telefone'
                              : attr.id_usuario
                              ? 'Usuário específico'
                              : attr.notificar_usuario_responsavel
                              ? 'Responsável pela negociação'
                              : 'Destino não configurado';
                            const recipientDescription = attr.numero
                              ? `Enviar notificação para ${attr.numero}`
                              : attr.id_usuario
                              ? `Notificar o usuário ${getUsuarioNome(attr.id_usuario)}`
                              : attr.notificar_usuario_responsavel
                              ? 'O responsável atual da negociação receberá esta notificação.'
                              : 'Defina quem deve receber esta notificação.';

                            return (
                              <div key={attr.id} className="bg-gray-50 rounded-lg p-4">
                                {editingAttribute === attr.id && editingAttributeMode === 'NOTIFICATION' ? (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quem deve ser notificado? *
                                      </label>
                                      <select
                                        value={editingNotificationAttributeData.destinatarioTipo}
                                        onChange={e =>
                                          handleEditingNotificationAttributeChange('destinatarioTipo', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                      >
                                        <option value="">Selecione uma opção</option>
                                        <option value="numero">Número de telefone</option>
                                        <option value="usuario">Usuário específico</option>
                                        <option value="responsavel">Responsável pela negociação</option>
                                      </select>
                                    </div>
                                    {editingNotificationAttributeData.destinatarioTipo === 'numero' && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Número de telefone *
                                        </label>
                                        <input
                                          type="text"
                                          value={editingNotificationAttributeData.numero}
                                          onChange={e =>
                                            handleEditingNotificationAttributeChange('numero', e.target.value)
                                          }
                                          placeholder="Ex: +55 11 91234-5678"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                          maxLength={60}
                                        />
                                      </div>
                                    )}
                                    {editingNotificationAttributeData.destinatarioTipo === 'usuario' && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Usuário *
                                        </label>
                                        <select
                                          value={editingNotificationAttributeData.id_usuario}
                                          onChange={e =>
                                            handleEditingNotificationAttributeChange('id_usuario', e.target.value)
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                          disabled={loadingUsuarios || usuarios.length === 0}
                                        >
                                          <option value="">Selecione um usuário</option>
                                          {usuarios.map(user => (
                                            <option key={user.Id} value={user.Id}>
                                              {user.nome} (#{user.Id})
                                            </option>
                                          ))}
                                        </select>
                                        {loadingUsuarios ? (
                                          <p className="text-xs text-gray-500 mt-1">Carregando usuários...</p>
                                        ) : usuarios.length === 0 ? (
                                          <p className="text-xs text-gray-500 mt-1">
                                            Nenhum usuário disponível para seleção.
                                          </p>
                                        ) : null}
                                      </div>
                                    )}
                                    {editingNotificationAttributeData.destinatarioTipo === 'responsavel' && (
                                      <p className="text-sm text-gray-600">
                                        O responsável atual da negociação receberá esta notificação automaticamente.
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`editNotificationAttr-${attr.id}`}
                                        checked={editingNotificationAttributeData.isAtivo}
                                        onChange={e =>
                                          handleEditingNotificationAttributeChange('isAtivo', e.target.checked)
                                        }
                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                      />
                                      <label htmlFor={`editNotificationAttr-${attr.id}`} className="text-sm text-gray-700">
                                        Notificação ativa
                                      </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleUpdateAttribute(func, attr)}
                                        disabled={saving}
                                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm transition-colors"
                                      >
                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Salvar
                                      </button>
                                      <button
                                        onClick={handleCancelEditAttribute}
                                        className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-gray-800">{recipientTypeLabel}</p>
                                        <span
                                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            attr.isAtivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                          }`}
                                        >
                                          {attr.isAtivo ? 'Ativo' : 'Inativo'}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600">{recipientDescription}</p>
                                    </div>
                                    {canEdit && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleStartEditAttribute(func, attr)}
                                          className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                                          title="Editar destinatário"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteAttribute({ id: attr.id, id_funcao: attr.id_funcao })}
                                          disabled={saving}
                                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full disabled:opacity-50 transition-colors"
                                          title="Deletar destinatário"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Nenhum destinatário configurado.</p>
                      )}

                      {canEdit && editingFunction !== func.id && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h6 className="text-sm font-medium text-gray-900 mb-3">Adicionar Novo Destinatário</h6>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quem deve ser notificado? *
                              </label>
                              <select
                                value={notificationInput.destinatarioTipo}
                                onChange={e =>
                                  handleNotificationAttributeInputChange(func.id, 'destinatarioTipo', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              >
                                <option value="">Selecione uma opção</option>
                                <option value="numero">Número de telefone</option>
                                <option value="usuario">Usuário específico</option>
                                <option value="responsavel">Responsável pela negociação</option>
                              </select>
                            </div>
                            {notificationInput.destinatarioTipo === 'numero' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Número de telefone *
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: +55 11 91234-5678"
                                  value={notificationInput.numero}
                                  onChange={e =>
                                    handleNotificationAttributeInputChange(func.id, 'numero', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  maxLength={60}
                                />
                              </div>
                            )}
                            {notificationInput.destinatarioTipo === 'usuario' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Usuário *
                                </label>
                                <select
                                  value={notificationInput.id_usuario}
                                  onChange={e =>
                                    handleNotificationAttributeInputChange(func.id, 'id_usuario', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  disabled={loadingUsuarios || usuarios.length === 0}
                                >
                                  <option value="">Selecione um usuário</option>
                                  {usuarios.map(user => (
                                    <option key={user.Id} value={user.Id}>
                                      {user.nome} (#{user.Id})
                                    </option>
                                  ))}
                                </select>
                                {loadingUsuarios ? (
                                  <p className="text-xs text-gray-500 mt-1">Carregando usuários...</p>
                                ) : usuarios.length === 0 ? (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Nenhum usuário disponível para seleção.
                                  </p>
                                ) : null}
                              </div>
                            )}
                            {notificationInput.destinatarioTipo === 'responsavel' && (
                              <p className="text-sm text-gray-600">
                                O responsável atual da negociação receberá esta notificação automaticamente.
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`newNotificationAttr-${func.id}`}
                                checked={notificationInput.isAtivo}
                                onChange={e =>
                                  handleNotificationAttributeInputChange(func.id, 'isAtivo', e.target.checked)
                                }
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                              />
                              <label htmlFor={`newNotificationAttr-${func.id}`} className="text-sm text-gray-700">
                                Notificação ativa
                              </label>
                            </div>
                            <button
                              onClick={() => handleCreateAttribute(func)}
                              disabled={saving}
                              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm transition-colors"
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              {saving ? 'Adicionando...' : 'Adicionar Destinatário'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentFunctionsSection;


import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Loader2, Pencil, Settings, Copy, Check, ChevronDown, ChevronUp, Eye, EyeOff, User as UserIcon, Mail, Phone, Shield, Key, AlertCircle, CheckCircle2, Info, Users2, Activity, MessageSquare, Bot, BarChart3, Calendar, Contact, Link, Send, Cog, X } from 'lucide-react';
import type { User, CreateUserPayload, UpdateUserPayload } from '../../types/user';
import SidePanel from '../SidePanel';
import Modal from '../Modal';
import { hasPermission } from '../../utils/permissions';

interface UserPermissions {
  id_usuario: number;
  can_view_dashboard_crm: boolean;
  can_view_dashboard_prospeccao: boolean;
  can_view_menu_chat: boolean;
  can_view_menu_agent: boolean;
  can_view_menu_crm: boolean;
  can_view_menu_schedule: boolean;
  can_view_menu_prospect: boolean;
  can_view_menu_contacts: boolean;
  can_view_menu_connection: boolean;
  can_view_menu_settings: boolean;
  can_edit_agent: boolean;
  can_edit_crm: boolean;
  can_edit_schedule: boolean;
  can_edit_prospect: boolean;
  can_edit_contacts: boolean;
  can_edit_connection: boolean;
  can_edit_settings: boolean;
  can_view_all_leads: boolean;
  can_view_assigned_leads: boolean;
  can_view_prospeccao_busca: boolean;
  can_view_prospeccao_dd: boolean;
}

interface UsersSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

export default function UsersSection({ isActive, canEdit }: UsersSectionProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateUserPayload>({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    tipo: 'USER'
  });
  const [submitting, setSubmitting] = useState(false);
  const [togglingUser, setTogglingUser] = useState<number | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateUserPayload | null>(null);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [resetModalError, setResetModalError] = useState('');
  const [hasCopiedPassword, setHasCopiedPassword] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ code: '+55', country: 'BR', name: 'Brasil', flag: '🇧🇷' });
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);
  const [assinaturaAtiva, setAssinaturaAtiva] = useState(false);
  const [loadingAssinatura, setLoadingAssinatura] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'reset'>('edit');
  const [isAssinaturaPanelOpen, setIsAssinaturaPanelOpen] = useState(false);

  const countries = [
    { code: '+55', country: 'BR', name: 'Brasil', flag: '🇧🇷' },
    { code: '+1', country: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
    { code: '+54', country: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: '+56', country: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: '+57', country: 'CO', name: 'Colômbia', flag: '🇨🇴' },
    { code: '+51', country: 'PE', name: 'Peru', flag: '🇵🇪' },
    { code: '+52', country: 'MX', name: 'México', flag: '🇲🇽' },
    { code: '+351', country: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: '+34', country: 'ES', name: 'Espanha', flag: '🇪🇸' },
  ];

  let token: string | null = null;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      token = parsedUser?.token ?? null;
    }
  } catch (error) {
    console.error("Erro ao ler o token do usuário:", error);
    token = null;
  }

  useEffect(() => {
    if (isActive) {
      fetchUsers();
      fetchAssinatura();
    }
  }, [isActive]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


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
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssinatura = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/configuracoes/chat/assinatura/get', {
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar configuração de assinatura');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setAssinaturaAtiva(Boolean(data[0].isAssinatura));
      }
    } catch (err) {
      console.error('Erro ao carregar configuração de assinatura:', err);
    }
  };

  const toggleAssinatura = async () => {
    if (!canEdit) return;

    setLoadingAssinatura(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/configuracoes/chat/assinatura', {
        method: 'POST',
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar configuração');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setAssinaturaAtiva(Boolean(data[0].isAssinatura));
        setSuccess('Configuração de assinatura atualizada com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Erro ao atualizar configuração:', err);
      setError('Erro ao atualizar configuração de assinatura');
    } finally {
      setLoadingAssinatura(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Concatena o código do país com o número de telefone (sem o símbolo +)
      const countryCode = selectedCountry.code.replace('+', ''); // Remove o +
      const fullPhoneNumber = formData.telefone
        ? `${countryCode}${formData.telefone}`
        : '';

      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          ...formData,
          telefone: fullPhoneNumber,
          tipo: formData.tipo
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar usuário');
      }

      await fetchUsers();
      setIsModalOpen(false);
      setFormData({
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        tipo: 'USER'
      });
      setSuccess('Usuário criado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      setError('Erro ao criar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    setTogglingUser(userId);

    // Atualização otimista da UI
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.Id === userId
          ? { ...user, isAtivo: !user.isAtivo }
          : user
      )
    );

    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospectai/usuario/desativar?id=${userId}`, {
        method: 'PUT',
        headers: { token }
      });

      if (!response.ok) {
        // Reverte a mudança em caso de erro
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.Id === userId
              ? { ...user, isAtivo: !user.isAtivo }
              : user
          )
        );
        throw new Error('Erro ao alterar status do usuário');
      }

      // Atualiza do servidor após sucesso
      await fetchUsers();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      setError('Erro ao alterar status do usuário');
      setTimeout(() => setError(''), 3000);
    } finally {
      setTogglingUser(null);
    }
  };

  const fetchUserPermissions = async (userId: number) => {
    setLoadingPermissions(true);
    try {
      const url = `https://n8n.lumendigital.com.br/webhook/prospecta/usuarios/permissoes/get?id=${userId}`;
      const response = await fetch(url, {
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar permissões do usuário');
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setUserPermissions(data[0]);
      } else {
        // Create default permissions object if none exists
        const defaultPermissions = {
          id_usuario: userId,
          can_view_dashboard_crm: false,
          can_view_dashboard_prospeccao: false,
          can_view_menu_chat: false,
          can_view_menu_agent: false,
          can_view_menu_crm: false,
          can_view_menu_schedule: false,
          can_view_menu_prospect: false,
          can_view_menu_contacts: false,
          can_view_menu_connection: false,
          can_view_menu_settings: false,
          can_edit_agent: false,
          can_edit_crm: false,
          can_edit_schedule: false,
          can_edit_prospect: false,
          can_edit_contacts: false,
          can_edit_connection: false,
          can_edit_settings: false,
          can_view_all_leads: false,
          can_view_assigned_leads: false,
          can_view_prospeccao_busca: false,
          can_view_prospeccao_dd: false
        };
        setUserPermissions(defaultPermissions);
      }
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
      setError('Erro ao carregar permissões do usuário');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!userPermissions || !selectedUser) return;
    
    setSavingPermissions(true);
    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/usuarios/permissoes?id=${selectedUser.Id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          ...userPermissions,
          id_usuario: undefined // Remove id_usuario from body as it's in the query
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar permissões');
      }
      
      setSuccess('Permissões atualizadas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setIsPermissionsModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar permissões:', err);
      setError('Erro ao salvar permissões do usuário');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    fetchUserPermissions(user.Id);
    setIsPermissionsModalOpen(true);
  };

  const handlePermissionChange = (key: keyof UserPermissions, value: boolean) => {
    if (!userPermissions) return;

    setUserPermissions({
      ...userPermissions,
      [key]: value
    });
  };

  // Qual opção está ativa: 'all' ou 'assigned'
  const leadVisibility: 'all' | 'assigned' =
    userPermissions?.can_view_all_leads
      ? 'all'
      : userPermissions?.can_view_assigned_leads
      ? 'assigned'
      : 'all'; // default seguro

  // Troca mutuamente exclusiva
  const setLeadVisibility = (value: 'all' | 'assigned') => {
    if (!userPermissions) return;
    setUserPermissions({
      ...userPermissions,
      can_view_all_leads: value === 'all',
      can_view_assigned_leads: value === 'assigned',
    });
  };

  // Open unified user panel
  const handleOpenUserPanel = (user: User, tab: 'edit' | 'reset' = 'edit') => {
    setError('');
    setSuccess('');
    setSelectedUser(user);
    setActiveTab(tab);

    // Prepare edit form data
    let phoneNumber = user.telefone ?? '';
    let detectedCountry = countries[0];

    if (phoneNumber) {
      for (const country of countries) {
        const codeWithoutPlus = country.code.replace('+', '');
        if (phoneNumber.startsWith(codeWithoutPlus)) {
          detectedCountry = country;
          phoneNumber = phoneNumber.substring(codeWithoutPlus.length);
          break;
        }
      }
    }

    setSelectedCountry(detectedCountry);
    setEditFormData({
      id: user.Id,
      nome: user.nome,
      telefone: phoneNumber,
      tipo: user.tipo
    });

    // Reset password states
    setResetPassword(null);
    setResetModalError('');
    setHasCopiedPassword(false);

    setIsUserPanelOpen(true);
  };

  const handleCloseUserPanel = () => {
    setIsUserPanelOpen(false);
    setSelectedUser(null);
    setEditFormData(null);
    setUserPermissions(null);
    setResetPassword(null);
    setResetModalError('');
    setHasCopiedPassword(false);
    setActiveTab('edit');
  };

  const handleOpenEditUser = (user: User) => {
    setError('');
    setSuccess('');

    // Extrai o código do país do telefone se existir
    let phoneNumber = user.telefone ?? '';
    let detectedCountry = countries[0]; // Brasil por padrão

    if (phoneNumber) {
      // Tenta encontrar o código do país no início do número (sem o símbolo +)
      for (const country of countries) {
        const codeWithoutPlus = country.code.replace('+', ''); // Remove o + para comparação
        if (phoneNumber.startsWith(codeWithoutPlus)) {
          detectedCountry = country;
          phoneNumber = phoneNumber.substring(codeWithoutPlus.length); // Remove o código do país
          break;
        }
      }
    }

    setSelectedCountry(detectedCountry);
    setEditFormData({
      id: user.Id,
      nome: user.nome,
      telefone: phoneNumber,
      tipo: user.tipo
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editFormData) return;

    setUpdatingUser(true);
    setError('');
    setSuccess('');

    try {
      // Concatena o código do país com o número de telefone (sem o símbolo +)
      const countryCode = selectedCountry.code.replace('+', ''); // Remove o +
      const fullPhoneNumber = editFormData.telefone
        ? `${countryCode}${editFormData.telefone}`
        : '';

      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify({
          id: editFormData.id,
          nome: editFormData.nome,
          telefone: fullPhoneNumber,
          tipo: editFormData.tipo,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar usuário');
      }

      await fetchUsers();
      setIsEditModalOpen(false);
      setEditFormData(null);
      setSuccess('Usuário atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      setError('Erro ao atualizar usuário');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleOpenResetModal = (user: User) => {
    setError('');
    setSuccess('');
    setResetModalUser(user);
    setResetPassword(null);
    setResetModalError('');
    setHasCopiedPassword(false);
  };

  const handleCloseResetModal = () => {
    setResetModalUser(null);
    setResetPassword(null);
    setResetModalError('');
    setHasCopiedPassword(false);
    setIsResetConfirming(false);
  };

  const handleConfirmResetPassword = async () => {
    const userToReset = resetModalUser || selectedUser;
    if (!userToReset) return;

    setIsResetConfirming(true);
    setError('');
    setSuccess('');
    setResetModalError('');
    setHasCopiedPassword(false);

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify({ id_cliente: userToReset.Id }),
      });

      if (!response.ok) {
        throw new Error('Erro ao resetar senha');
      }

      const data = await response.json();
      const novaSenha = Array.isArray(data) && data.length > 0 ? data[0]?.senha : '';

      if (!novaSenha) {
        throw new Error('Resposta inválida ao resetar a senha');
      }

      setResetPassword(novaSenha);
      setSuccess('Senha resetada com sucesso!');
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      console.error('Erro ao resetar senha do usuário:', err);
      setResetModalError('Erro ao resetar senha do usuário. Tente novamente.');
    } finally {
      setIsResetConfirming(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!resetPassword) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resetPassword);
        setHasCopiedPassword(true);
        setTimeout(() => setHasCopiedPassword(false), 2000);
      } else {
        throw new Error('Clipboard API indisponível');
      }
    } catch (error) {
      console.error('Erro ao copiar senha:', error);
      setResetModalError('Não foi possível copiar a senha. Copie manualmente.');
    }
  };

  const getTypeStyle = (tipo: string) => {
    switch (tipo) {
      case 'MASTER':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'USER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isActive) return null;

  // Separa usuários ativos e inativos
  const activeUsers = users.filter(user => user.isAtivo);
  const inactiveUsers = users.filter(user => !user.isAtivo);

 return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Usuários</h2>

          {/* Botão de informação */}
          <div className="relative group">
            <button
              className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-400 transition-colors"
              title=""
            >
              ?
            </button>

            {/* Tooltip */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 p-3 bg-gray-800 dark:bg-neutral-700 text-white dark:text-neutral-100 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg z-10">
              A <strong>gestão de usuários</strong> permite que você adicione, edite e gerencie os usuários que têm acesso ao sistema.
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAssinaturaPanelOpen(true)}
              className="flex items-center gap-2 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <Pencil size={18} />
              Assinatura de Mensagens
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg px-4 py-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
              Novo Usuário
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-neutral-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 border-b-2 border-gray-200 dark:border-neutral-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                Tipo
              </th>
              {canEdit && (
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-100 dark:divide-neutral-700">
            {activeUsers.map((user) => (
              <tr
                key={user.Id}
                className="hover:bg-blue-50/50 dark:hover:bg-neutral-700/50 transition-all duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{user.nome}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600 dark:text-neutral-400">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600 dark:text-neutral-400">{user.telefone || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getTypeStyle(user.tipo)} shadow-sm`}>
                    {user.tipo}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleOpenUserPanel(user, 'edit')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all duration-200 shadow-sm"
                        title="Editar usuário"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleEditPermissions(user)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-all duration-200 shadow-sm"
                        title="Gerenciar permissões"
                      >
                        <Shield className="w-4 h-4" />
                        Permissões
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {activeUsers.map((user) => (
          <div
            key={user.Id}
            onClick={() => handleOpenUserPanel(user)}
            className="bg-white dark:bg-neutral-800 rounded-lg shadow border border-gray-200 dark:border-neutral-700 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
          >
            {/* Header with Name */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">{user.nome}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getTypeStyle(user.tipo)}`}>
                  {user.tipo}
                </span>
              </div>
            </div>

            {/* Info Fields */}
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Email</span>
                <p className="text-sm text-gray-900 dark:text-neutral-100 break-all">{user.email}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Telefone</span>
                <p className="text-sm text-gray-900 dark:text-neutral-100">{user.telefone || '-'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seção de Usuários Inativos */}
      {inactiveUsers.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 transition-colors"
          >
            {showInactive ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              Usuários Inativos ({inactiveUsers.length})
            </span>
          </button>

          {showInactive && (
            <>
              {/* Desktop Table View - Inactive Users */}
              <div className="hidden md:block mt-4 bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-neutral-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 border-b-2 border-gray-200 dark:border-neutral-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-100 dark:divide-neutral-700">
                    {inactiveUsers.map((user) => (
                      <tr
                        key={user.Id}
                        onClick={() => handleOpenUserPanel(user)}
                        className="hover:bg-blue-50/50 dark:hover:bg-neutral-700/50 opacity-60 cursor-pointer transition-all duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {user.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{user.nome}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-neutral-400">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-neutral-400">{user.telefone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getTypeStyle(user.tipo)} shadow-sm`}>
                            {user.tipo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Inactive Users */}
              <div className="md:hidden mt-4 space-y-4">
                {inactiveUsers.map((user) => (
                  <div
                    key={user.Id}
                    onClick={() => handleOpenUserPanel(user)}
                    className="bg-white dark:bg-neutral-800 rounded-lg shadow border border-gray-200 dark:border-neutral-700 p-4 opacity-60 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {/* Header with Name */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">{user.nome}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getTypeStyle(user.tipo)}`}>
                          {user.tipo}
                        </span>
                      </div>
                    </div>

                    {/* Info Fields */}
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Email</span>
                        <p className="text-sm text-gray-900 dark:text-neutral-100 break-all">{user.email}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Telefone</span>
                        <p className="text-sm text-gray-900 dark:text-neutral-100">{user.telefone || '-'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Unified User Management SidePanel with Tabs */}
      <SidePanel
        isOpen={isUserPanelOpen}
        onClose={handleCloseUserPanel}
        title={selectedUser ? `Gerenciar Usuário: ${selectedUser.nome}` : 'Gerenciar Usuário'}
        width="40%"
      >
        <div className="px-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-neutral-800 rounded-lg">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-all rounded-md ${
              activeTab === 'edit'
                ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-white/50 dark:hover:bg-neutral-700/50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Editar Usuário
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-all rounded-md ${
              activeTab === 'reset'
                ? 'bg-white dark:bg-neutral-700 text-orange-600 dark:text-orange-400 shadow-md'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-white/50 dark:hover:bg-neutral-700/50'
            }`}
          >
            <Key className="w-4 h-4" />
            Reset de Senha
          </button>
        </div>

        {/* Tab Content - Edit User */}
        {activeTab === 'edit' && editFormData && (
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">Informações do Usuário</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Atualize os dados cadastrais do usuário. As alterações serão salvas imediatamente.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-5">
              {/* Status Toggle */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                      <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                      Status do Usuário
                    </label>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">
                      {selectedUser?.isAtivo
                        ? 'Este usuário está ativo e pode acessar o sistema'
                        : 'Este usuário está inativo e não pode acessar o sistema'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={selectedUser?.isAtivo || false}
                      onChange={canEdit ? () => selectedUser && handleToggleStatus(selectedUser.Id) : undefined}
                      disabled={!canEdit || togglingUser === selectedUser?.Id}
                    />
                    <div className="w-14 h-7 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-neutral-600 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600 dark:peer-checked:bg-green-500"></div>
                  </label>
                </div>
                {togglingUser === selectedUser?.Id && (
                  <div className="mt-3 flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Atualizando status...</span>
                  </div>
                )}
              </div>
              {/* Nome Field */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
                <label htmlFor="edit-nome" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
                  <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Nome do Usuário
                </label>
                <input
                  type="text"
                  id="edit-nome"
                  value={editFormData.nome}
                  onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all"
                  placeholder="Ex: Dr. João da Silva"
                  required
                  disabled={!canEdit}
                />
              </div>

              {/* Telefone Field */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
                <label htmlFor="edit-telefone" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
                  <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                  Telefone
                </label>
                <div className="flex gap-2">
                  <div className="relative" ref={countryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => canEdit && setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="h-[42px] w-[120px] pl-3 pr-2 py-2 flex items-center gap-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!canEdit}
                    >
                      <span className="text-2xl">{selectedCountry.flag}</span>
                      <span className="text-sm text-gray-900 dark:text-neutral-100">{selectedCountry.code}</span>
                      <ChevronDown className="w-4 h-4 ml-auto text-gray-400 dark:text-neutral-500" />
                    </button>

                    {isCountryDropdownOpen && canEdit && (
                      <div className="absolute top-full left-0 mt-1 w-[240px] max-h-[300px] overflow-y-auto bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg z-50">
                        {countries.map((country) => (
                          <button
                            key={country.country}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country);
                              setIsCountryDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-600 text-left transition-colors"
                          >
                            <span className="text-2xl">{country.flag}</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">{country.name}</div>
                              <div className="text-xs text-gray-500 dark:text-neutral-400">{country.code}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="tel"
                    id="edit-telefone"
                    value={editFormData.telefone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        telefone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="(11) 98888-8888"
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500 transition-all"
                    required
                    disabled={!canEdit}
                  />
                </div>
              </div>

              {/* Tipo Field */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
                <label htmlFor="edit-tipo" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Tipo de Usuário
                </label>
                <select
                  id="edit-tipo"
                  value={editFormData.tipo}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, tipo: e.target.value as UpdateUserPayload['tipo'] })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all"
                  required
                  disabled={!canEdit}
                >
                  <option value="USER">Usuário Padrão</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                <p className="mt-2 text-xs text-gray-500 dark:text-neutral-400">
                  {editFormData.tipo === 'ADMIN' ? '⚡ Administradores têm acesso total ao sistema' : '👤 Usuários padrão têm acesso limitado'}
                </p>
              </div>

              {/* Action Buttons */}
              {canEdit && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={handleCloseUserPanel}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updatingUser}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {updatingUser ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {!canEdit && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Você não tem permissão para editar usuários.
                  </p>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Tab Content - Reset Password */}
        {activeTab === 'reset' && selectedUser && (
          <div className="space-y-6">
            {resetModalError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{resetModalError}</p>
              </div>
            )}

            {!resetPassword ? (
              <>
                {/* Warning Card */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <Key className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
                        Resetar Senha
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">
                        Você está prestes a resetar a senha do usuário{' '}
                        <span className="font-bold text-orange-700 dark:text-orange-300">{selectedUser.nome}</span>.
                      </p>
                      <div className="mt-4 bg-white dark:bg-neutral-800 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                        <p className="text-xs font-medium text-gray-900 dark:text-neutral-100 mb-2">⚠️ Atenção:</p>
                        <ul className="text-xs text-gray-700 dark:text-neutral-300 space-y-1.5 list-disc list-inside">
                          <li>Uma nova senha aleatória será gerada automaticamente</li>
                          <li>A senha atual do usuário será invalidada imediatamente</li>
                          <li>Você deverá compartilhar a nova senha com o usuário</li>
                          <li>Recomende que o usuário altere a senha após o primeiro acesso</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {canEdit ? (
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseUserPanel}
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                      disabled={isResetConfirming}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmResetPassword}
                      className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-700 dark:to-red-700 text-white hover:from-orange-700 hover:to-red-700 dark:hover:from-orange-600 dark:hover:to-red-600 disabled:opacity-60 flex items-center gap-2 font-medium shadow-sm transition-all"
                      disabled={isResetConfirming}
                    >
                      {isResetConfirming ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Resetando...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Confirmar Reset</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Você não tem permissão para resetar senhas.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                        Senha Resetada com Sucesso!
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed mb-4">
                        A nova senha foi gerada. Compartilhe-a com o usuário e recomende que seja alterada no primeiro acesso.
                      </p>

                      {/* Password Display */}
                      <div className="bg-white dark:bg-neutral-800 rounded-lg border-2 border-green-200 dark:border-green-700 overflow-hidden">
                        <div className="bg-green-100 dark:bg-green-900/50 px-4 py-2 border-b border-green-200 dark:border-green-700">
                          <p className="text-xs font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                            <Key className="w-3.5 h-3.5" />
                            Nova Senha Temporária
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            <code className="flex-1 font-mono text-xl font-bold text-gray-900 dark:text-neutral-100 tracking-wider break-all bg-gray-50 dark:bg-neutral-700 px-4 py-3 rounded-lg border border-gray-200 dark:border-neutral-600">
                              {resetPassword}
                            </code>
                            <button
                              type="button"
                              onClick={handleCopyPassword}
                              className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-gradient-to-b from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all shadow-sm"
                            >
                              {hasCopiedPassword ? (
                                <>
                                  <Check className="w-5 h-5" />
                                  <span className="text-xs font-medium">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-5 h-5" />
                                  <span className="text-xs font-medium">Copiar</span>
                                </>
                              )}
                            </button>
                          </div>
                          {hasCopiedPassword && (
                            <div className="mt-3 flex items-center gap-2 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                              <CheckCircle2 className="w-4 h-4" />
                              <p className="text-xs font-medium">Senha copiada para a área de transferência</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCloseUserPanel}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-medium shadow-sm transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </SidePanel>

      {/* Permissions SidePanel - Separate panel for permissions */}
      <SidePanel
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          setSelectedUser(null);
          setUserPermissions(null);
        }}
        title={selectedUser ? `Permissões: ${selectedUser.nome}` : 'Permissões'}
        width="45%"
      >
        {loadingPermissions ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : userPermissions && (
          <div className="px-6 py-4 space-y-6">
            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Gerenciamento de Permissões
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Configure as permissões de acesso e visualização para <strong>{selectedUser?.nome}</strong>.
                </p>
              </div>
            </div>

            {/* === VISIBILIDADE DE MENUS === */}
            <section className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">Visibilidade de Menus</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Controle quais menus este usuário pode visualizar</p>
              </div>
              <div className="p-4 space-y-2">
                {[
                  ['can_view_menu_chat', 'Conversas', MessageSquare],
                  ['can_view_menu_agent', 'Agente de IA', Bot],
                  ['can_view_menu_crm', 'CRM', BarChart3],
                  ['can_view_menu_schedule', 'Agendamentos', Calendar],
                  ['can_view_menu_contacts', 'Contatos', Contact],
                  ['can_view_menu_connection', 'Conexão', Link],
                  ['can_view_menu_prospect', 'Envios em Massa', Send],
                  ['can_view_menu_settings', 'Configurações', Cog],
                ].map(([key, label, Icon]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-neutral-100">{label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(userPermissions as any)?.[key] || false}
                        onChange={(e) =>
                          handlePermissionChange(key as keyof UserPermissions, e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-neutral-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* === PERMISSÕES DE EDIÇÃO === */}
            <section className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">Permissões de Edição</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Defina quais seções este usuário pode editar</p>
              </div>
              <div className="p-4 space-y-2">
                {[
                  ['can_edit_agent', 'Editar Agente de IA', Bot],
                  ['can_edit_crm', 'Editar CRM', BarChart3],
                  ['can_edit_schedule', 'Editar Agendamentos', Calendar],
                  ['can_edit_contacts', 'Editar Contatos', Contact],
                  ['can_edit_connection', 'Editar Conexão', Link],
                  ['can_edit_settings', 'Editar Configurações', Cog],
                ].map(([key, label, Icon]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-neutral-100">{label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(userPermissions as any)?.[key] || false}
                        onChange={(e) =>
                          handlePermissionChange(key as keyof UserPermissions, e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-neutral-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* === VISIBILIDADE DE LEADS === */}
            <section className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">Visibilidade de Leads</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Escolha quais leads este usuário pode visualizar</p>
              </div>
              <div className="p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setLeadVisibility('all')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    leadVisibility === 'all'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700/30 hover:bg-gray-100 dark:hover:bg-neutral-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      leadVisibility === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-neutral-600 text-gray-500 dark:text-neutral-400'
                    }`}>
                      <Users2 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${
                        leadVisibility === 'all'
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-700 dark:text-neutral-300'
                      }`}>
                        Ver Todos os Leads
                      </p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Acesso completo a todos os leads do sistema
                      </p>
                    </div>
                  </div>
                  {leadVisibility === 'all' && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setLeadVisibility('assigned')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    leadVisibility === 'assigned'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700/30 hover:bg-gray-100 dark:hover:bg-neutral-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      leadVisibility === 'assigned'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-neutral-600 text-gray-500 dark:text-neutral-400'
                    }`}>
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${
                        leadVisibility === 'assigned'
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-700 dark:text-neutral-300'
                      }`}>
                        Ver Apenas Leads Atribuídos
                      </p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Visualiza somente os leads que foram atribuídos a ele
                      </p>
                    </div>
                  </div>
                  {leadVisibility === 'assigned' && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              </div>
            </section>

            {/* === BOTÕES === */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setIsPermissionsModalOpen(false);
                  setSelectedUser(null);
                  setUserPermissions(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={savingPermissions}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {savingPermissions ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar Permissões</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </SidePanel>

      {/* Create User Modal - Separate from user management */}
      {canEdit && (
        <SidePanel
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setFormData({
              nome: '',
              email: '',
              senha: '',
              telefone: '',
              tipo: 'USER'
            });
            setError('');
          }}
          title="Criar Novo Usuário"
          width="40%"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Nome
              </label>
              <input
                type="text"
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="senha"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Telefone
              </label>
              <div className="flex gap-2">
                <div className="relative" ref={countryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="h-[42px] w-[120px] pl-3 pr-2 py-2 flex items-center gap-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors"
                  >
                    <span className="text-2xl">{selectedCountry.flag}</span>
                    <span className="text-sm text-gray-900 dark:text-neutral-100">{selectedCountry.code}</span>
                    <ChevronDown className="w-4 h-4 ml-auto text-gray-400 dark:text-neutral-500" />
                  </button>

                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[240px] max-h-[300px] overflow-y-auto bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg z-50">
                      {countries.map((country) => (
                        <button
                          key={country.country}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setIsCountryDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-600 text-left transition-colors"
                        >
                          <span className="text-2xl">{country.flag}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">{country.name}</div>
                            <div className="text-xs text-gray-500 dark:text-neutral-400">{country.code}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="tel"
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value.replace(/\D/g, "") })}
                  placeholder="(11) 98888-8888"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Tipo
              </label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as CreateUserPayload['tipo'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                required
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({
                    nome: '',
                    email: '',
                    senha: '',
                    telefone: '',
                    tipo: 'USER'
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando...</span>
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </button>
            </div>
          </form>
        </SidePanel>
      )}

      {/* SidePanel para Assinatura de Mensagens */}
      {isAssinaturaPanelOpen && (
        <SidePanel
          isOpen={isAssinaturaPanelOpen}
          onClose={() => setIsAssinaturaPanelOpen(false)}
          title="Assinatura de Mensagens"
          width="40%"
        >
          <div className="px-6 py-4 space-y-6">
            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    O que é a Assinatura de Mensagens?
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    Quando ativada, o nome do usuário será automaticamente exibido no início de cada mensagem enviada, identificando quem está atendendo o cliente.
                  </p>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-gray-200 dark:border-neutral-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-2">
                    Status Atual
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${assinaturaAtiva ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <p className={`text-sm font-medium ${assinaturaAtiva ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-neutral-400'}`}>
                      {assinaturaAtiva ? 'Ativada para todos os usuários' : 'Desativada'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={assinaturaAtiva}
                    onChange={toggleAssinatura}
                    disabled={!canEdit || loadingAssinatura}
                  />
                  <div className={`w-16 h-8 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 dark:after:border-neutral-600 after:border after:rounded-full after:h-[26px] after:w-[26px] after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 shadow-sm ${(!canEdit || loadingAssinatura) ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>

              {loadingAssinatura && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700 text-sm text-gray-600 dark:text-neutral-400">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Atualizando configuração...</span>
                </div>
              )}
            </div>

            {/* Examples Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-neutral-700 to-transparent"></div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wide">
                  Exemplos
                </h4>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-neutral-700 to-transparent"></div>
              </div>

              {/* With Signature */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-green-200 dark:border-green-800/50 overflow-hidden shadow-sm">
                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-green-200 dark:border-green-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wide">Com Assinatura</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-neutral-900/50 dark:to-neutral-900/30 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300 dark:border-neutral-600">
                      <div className="w-1 h-8 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        João Silva
                      </p>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-neutral-100 leading-relaxed">
                      Olá! Como posso ajudá-lo?
                    </p>
                  </div>
                </div>
              </div>

              {/* Without Signature */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                <div className="bg-gray-50 dark:bg-neutral-900/30 px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-400 dark:bg-neutral-600 flex items-center justify-center shadow-sm">
                      <X className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-gray-600 dark:text-neutral-400 uppercase tracking-wide">Sem Assinatura</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-neutral-900/50 dark:to-neutral-900/30 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
                    <p className="text-sm text-gray-900 dark:text-neutral-100 leading-relaxed">
                      Olá! Como posso ajudá-lo?
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Note */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border-2 border-amber-300 dark:border-amber-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500 dark:bg-amber-600 rounded-lg flex items-center justify-center shadow-md">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Importante
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed mb-2">
                    Esta configuração é aplicada <span className="font-semibold">globalmente para todos os usuários</span> do sistema. Quando ativada, todas as mensagens enviadas incluirão a assinatura do usuário.
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 italic">
                    A possibilidade de ativar/desativar por usuário individual será implementada em breve.
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsAssinaturaPanelOpen(false)}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border-2 border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 hover:border-gray-400 dark:hover:border-neutral-500 transition-all shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </SidePanel>
      )}
    </div>
  );
}

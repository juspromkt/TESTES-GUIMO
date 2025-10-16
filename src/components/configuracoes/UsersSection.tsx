import React, { useState, useEffect } from 'react';
import { Users, Plus, Loader2, Pencil, Settings, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { User, CreateUserPayload, UpdateUserPayload } from '../../types/user';
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

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (isActive) {
      fetchUsers();
    }
  }, [isActive]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          ...formData,
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
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/usuarios/permissoes/get?id=${userId}`, {
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
        setUserPermissions({
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
        });
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

  const handleOpenEditUser = (user: User) => {
    setError('');
    setSuccess('');
    setEditFormData({
      id: user.Id,
      nome: user.nome,
      telefone: user.telefone ?? '',
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
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify({
          id: editFormData.id,
          nome: editFormData.nome,
          telefone: editFormData.telefone,
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
    if (!resetModalUser) return;

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
        body: JSON.stringify({ id_cliente: resetModalUser.Id }),
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg px-4 py-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} />
            Novo Usuário
          </button>
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

      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-neutral-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
          <thead className="bg-gray-50 dark:bg-neutral-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                Status
              </th>
              {canEdit && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
            {activeUsers.map((user) => (
              <tr key={user.Id} className="hover:bg-gray-50 dark:hover:bg-neutral-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">{user.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-neutral-400">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-neutral-400">{user.telefone || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeStyle(user.tipo)}`}>
                    {user.tipo}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={user.isAtivo}
                      onChange={canEdit ? () => handleToggleStatus(user.Id) : undefined}
                      disabled={!canEdit || togglingUser === user.Id}
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
                  </label>
                </td>
                {canEdit && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleOpenResetModal(user)}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                        title="Resetar senha"
                      >
                        Resetar senha
                      </button>
                      <button
                        onClick={() => handleOpenEditUser(user)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="Editar usuário"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditPermissions(user)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="Editar permissões"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
            <div className="mt-4 bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-neutral-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                <thead className="bg-gray-50 dark:bg-neutral-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                  {inactiveUsers.map((user) => (
                    <tr key={user.Id} className="hover:bg-gray-50 dark:hover:bg-neutral-700 opacity-60">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">{user.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-neutral-400">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-neutral-400">{user.telefone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeStyle(user.tipo)}`}>
                          {user.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={user.isAtivo}
                            onChange={canEdit ? () => handleToggleStatus(user.Id) : undefined}
                            disabled={!canEdit || togglingUser === user.Id}
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
                        </label>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleOpenResetModal(user)}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                              title="Resetar senha"
                            >
                              Resetar senha
                            </button>
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="Editar usuário"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEditPermissions(user)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="Editar permissões"
                            >
                              <Settings className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetModalUser}
        onClose={handleCloseResetModal}
        title={resetPassword ? `Senha resetada: ${resetModalUser?.nome}` : `Resetar senha: ${resetModalUser?.nome ?? ''}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          {resetModalError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
              {resetModalError}
            </div>
          )}

          {!resetPassword ? (
            <>
              <p className="text-gray-700 dark:text-neutral-300">
                Tem certeza de que deseja resetar a senha do usuário{' '}
                <span className="font-semibold">{resetModalUser?.nome}</span>? Uma nova senha será gerada e você deverá
                compartilhá-la com o usuário.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                  disabled={isResetConfirming}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetPassword}
                  className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60 flex items-center gap-2"
                  disabled={isResetConfirming}
                >
                  {isResetConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resetando...</span>
                    </>
                  ) : (
                    'Confirmar reset'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-gray-700 dark:text-neutral-300">
                  A senha foi resetada com sucesso. Envie a nova senha para o usuário ou peça para que ele altere após o login.
                </p>
                <div className="flex items-center justify-between gap-3 bg-gray-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg px-4 py-3">
                  <span className="font-mono text-lg text-gray-900 dark:text-neutral-100 break-all">{resetPassword}</span>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    {hasCopiedPassword ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                {hasCopiedPassword && (
                  <p className="text-sm text-green-600 dark:text-green-400">Senha copiada para a área de transferência.</p>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Fechar
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Create User Modal */}
      {canEdit && (
        <Modal
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
              <input
                type="password"
                id="senha"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Telefone
              </label>
<input
  type="tel"
  id="telefone"
  value={formData.telefone}
  onChange={(e) => setFormData({ ...formData, telefone: e.target.value.replace(/\D/g, "") })}
  placeholder="+55 (11) 98888-8888 — apenas números"
  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-sm"
  required
/>

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
        </Modal>
      )}

      {/* Edit User Modal */}
      {canEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditFormData(null);
          }}
          title={`Editar Usuário${editFormData ? `: ${editFormData.nome}` : ''}`}
        >
          {editFormData && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label htmlFor="edit-nome" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="edit-nome"
                  value={editFormData.nome}
                  onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-telefone" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Telefone
                </label>
<input
  type="tel"
  id="edit-telefone"
  value={editFormData.telefone}
  onChange={(e) =>
    setEditFormData({
      ...editFormData,
      telefone: e.target.value.replace(/\D/g, ""), // mantém apenas números
    })
  }
  placeholder="+55 (11) 98888-8888 — apenas números"
  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-sm"
  required
/>

              </div>

              <div>
                <label htmlFor="edit-tipo" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Tipo
                </label>
                <select
                  id="edit-tipo"
                  value={editFormData.tipo}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, tipo: e.target.value as UpdateUserPayload['tipo'] })
                  }
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
                    setIsEditModalOpen(false);
                    setEditFormData(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingUser}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md disabled:opacity-50"
                >
                  {updatingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Edit Permissions Modal */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          setSelectedUser(null);
          setUserPermissions(null);
        }}
        title={`Editar Permissões: ${selectedUser?.nome}`}
        maxWidth="lg"
      >
        {loadingPermissions ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
<div className="p-6 space-y-8 bg-gray-50 dark:bg-neutral-900 rounded-b-xl max-h-[75vh] overflow-y-auto">


  {/* === VISIBILIDADE DE MENUS === */}
  <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-300 dark:border-neutral-700 p-5">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
        🧭
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">Visibilidade de Menus</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        ['can_view_menu_chat', 'Conversas'],
        ['can_view_menu_agent', 'Agente de IA'],
        ['can_view_menu_crm', 'CRM'],
        ['can_view_menu_schedule', 'Agendamentos'],
        ['can_view_menu_contacts', 'Contatos'],
        ['can_view_menu_connection', 'Conexão'],
        ['can_view_menu_prospect', 'Envios em Massa'],
        ['can_view_menu_settings', 'Configurações'],
      ].map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={(userPermissions as any)?.[key] || false}
            onChange={(e) =>
              handlePermissionChange(key as keyof UserPermissions, e.target.checked)
            }
            className="accent-purple-600 dark:accent-purple-500 w-4 h-4"
          />
          {label}
        </label>
      ))}
    </div>
  </section>

  {/* === PERMISSÕES DE EDIÇÃO === */}
  <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-300 dark:border-neutral-700 p-5">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
        ✏️
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">Permissões de Edição</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        ['can_edit_agent', 'Editar Agente de IA'],
        ['can_edit_crm', 'Editar CRM'],
        ['can_edit_schedule', 'Editar Agendamentos'],
        ['can_edit_contacts', 'Editar Contatos'],
        ['can_edit_connection', 'Editar Conexão'],
        ['can_edit_settings', 'Editar Configurações'],
      ].map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={(userPermissions as any)?.[key] || false}
            onChange={(e) =>
              handlePermissionChange(key as keyof UserPermissions, e.target.checked)
            }
            className="accent-emerald-600 dark:accent-emerald-500 w-4 h-4"
          />
          {label}
        </label>
      ))}
    </div>
  </section>

  {/* === VISIBILIDADE DE LEADS === */}
  <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-300 dark:border-neutral-700 p-5">
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
      👥
    </div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">Visibilidade de Leads</h3>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
      <input
        type="radio"
        name="leadVisibility"
        className="accent-amber-600 dark:accent-amber-500 w-4 h-4"
        checked={leadVisibility === 'all'}
        onChange={() => setLeadVisibility('all')}
      />
      Ver Todos os Leads
    </label>

    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
      <input
        type="radio"
        name="leadVisibility"
        className="accent-amber-600 dark:accent-amber-500 w-4 h-4"
        checked={leadVisibility === 'assigned'}
        onChange={() => setLeadVisibility('assigned')}
      />
      Ver Apenas Leads Atribuídos
    </label>
  </div>
</section>


  {/* === BOTÕES === */}
  <div className="flex justify-end gap-3 pt-4 border-t border-gray-300 dark:border-neutral-700">
    <button
      type="button"
      onClick={() => {
        setIsPermissionsModalOpen(false);
        setSelectedUser(null);
        setUserPermissions(null);
      }}
      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-md"
    >
      Cancelar
    </button>
    <button
      onClick={handleSavePermissions}
      disabled={savingPermissions}
      className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md disabled:opacity-50"
    >
      {savingPermissions ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Salvando...</span>
        </>
      ) : (
        'Salvar Permissões'
      )}
    </button>
  </div>
</div>



        )}
      </Modal>
    </div>
  );
}
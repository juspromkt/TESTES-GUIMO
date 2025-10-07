import React, { useState, useEffect } from 'react';
import { Users, Plus, Loader2, Pencil, Settings, Copy, Check } from 'lucide-react';
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
    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospectai/usuario/desativar?id=${userId}`, {
        method: 'PUT',
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status do usuário');
      }

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

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Usuários</h2>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {canEdit && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.Id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.telefone || '-'}</div>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </td>
                {canEdit && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleOpenResetModal(user)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        title="Resetar senha"
                      >
                        Resetar senha
                      </button>
                      <button
                        onClick={() => handleOpenEditUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar usuário"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditPermissions(user)}
                        className="text-blue-600 hover:text-blue-900"
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

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetModalUser}
        onClose={handleCloseResetModal}
        title={resetPassword ? `Senha resetada: ${resetModalUser?.nome}` : `Resetar senha: ${resetModalUser?.nome ?? ''}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          {resetModalError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {resetModalError}
            </div>
          )}

          {!resetPassword ? (
            <>
              <p className="text-gray-700">
                Tem certeza de que deseja resetar a senha do usuário{' '}
                <span className="font-semibold">{resetModalUser?.nome}</span>? Uma nova senha será gerada e você deverá
                compartilhá-la com o usuário.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isResetConfirming}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetPassword}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
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
                <p className="text-gray-700">
                  A senha foi resetada com sucesso. Envie a nova senha para o usuário ou peça para que ele altere após o login.
                </p>
                <div className="flex items-center justify-between gap-3 bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                  <span className="font-mono text-lg text-gray-900 break-all">{resetPassword}</span>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
                  <p className="text-sm text-green-600">Senha copiada para a área de transferência.</p>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                id="senha"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as CreateUserPayload['tipo'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
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
                <label htmlFor="edit-nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="edit-nome"
                  value={editFormData.nome}
                  onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-telefone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="edit-telefone"
                  value={editFormData.telefone}
                  onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-tipo" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  id="edit-tipo"
                  value={editFormData.tipo}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, tipo: e.target.value as UpdateUserPayload['tipo'] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingUser}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
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
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Dashboard Permissions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Permissões de Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_dashboard_crm || false}
                    onChange={(e) => handlePermissionChange('can_view_dashboard_crm', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Ver Dashboard CRM</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_dashboard_prospeccao || false}
                    onChange={(e) => handlePermissionChange('can_view_dashboard_prospeccao', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Ver Dashboard Prospecção</span>
                </label>
              </div>
            </div>

            {/* Menu Visibility Permissions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Visibilidade de Menus</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_menu_chat || false}
                    onChange={(e) => handlePermissionChange('can_view_menu_chat', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Menu Chat</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_menu_agent || false}
                    onChange={(e) => handlePermissionChange('can_view_menu_agent', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Menu Agente de IA</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_menu_crm || false}
                    onChange={(e) => handlePermissionChange('can_view_menu_crm', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Menu CRM</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_menu_schedule || false}
                    onChange={(e) => handlePermissionChange('can_view_menu_schedule', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Menu Agendamentos</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_menu_prospect || false}
                    onChange={(e) => handlePermissionChange('can_view_menu_prospect', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Menu Prospectar</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_menu_contacts || false}
                    onChange={(e) => handlePermissionChange('can_view_menu_contacts', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Menu Contatos</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_menu_connection || false}
                    onChange={(e) => handlePermissionChange('can_view_menu_connection', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Menu Conexão</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_menu_settings || false}
                    onChange={(e) => handlePermissionChange('can_view_menu_settings', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Menu Configurações</span>
                </label>
              </div>
            </div>

            {/* Edit Permissions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Permissões de Edição</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_edit_agent || false}
                    onChange={(e) => handlePermissionChange('can_edit_agent', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Editar Agente de IA</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_edit_crm || false}
                    onChange={(e) => handlePermissionChange('can_edit_crm', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Editar CRM</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_edit_schedule || false}
                    onChange={(e) => handlePermissionChange('can_edit_schedule', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Editar Agendamentos</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_edit_prospect || false}
                    onChange={(e) => handlePermissionChange('can_edit_prospect', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Editar Prospecção</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_edit_contacts || false}
                    onChange={(e) => handlePermissionChange('can_edit_contacts', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Editar Contatos</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_edit_connection || false}
                    onChange={(e) => handlePermissionChange('can_edit_connection', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Editar Conexão</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_edit_settings || false}
                    onChange={(e) => handlePermissionChange('can_edit_settings', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Editar Configurações</span>
                </label>
              </div>
            </div>

            {/* Lead Visibility Permissions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Visibilidade de Leads</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_all_leads || false}
                    onChange={(e) => handlePermissionChange('can_view_all_leads', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Ver Todos os Leads</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_assigned_leads || false}
                    onChange={(e) => handlePermissionChange('can_view_assigned_leads', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Ver Apenas Leads Atribuídos</span>
                </label>
              </div>
            </div>

            {/* Prospeccao Permissions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Permissões de Prospecção</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_prospeccao_busca || false}
                    onChange={(e) => handlePermissionChange('can_view_prospeccao_busca', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Menu Prospecção</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userPermissions?.can_view_prospeccao_dd || false}
                    onChange={(e) => handlePermissionChange('can_view_prospeccao_dd', e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Menu Disparo Direto</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsPermissionsModalOpen(false);
                  setSelectedUser(null);
                  setUserPermissions(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={savingPermissions}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
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
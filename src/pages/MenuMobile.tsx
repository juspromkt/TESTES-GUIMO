import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Lock,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Check,
  Eye,
  EyeOff,
  MessageCircle
} from 'lucide-react';
import type { LoginResponse } from '../types/auth';

interface LinkedAccount {
  id_cliente?: number;
  nome_cliente?: string;
  cliente_ativo?: boolean;
  id_usuario?: number;
  nome_usuario?: string;
  usuario_ativo?: boolean;
}

type StoredUser = LoginResponse & {
  id_cliente?: number;
  nome_cliente?: string;
  email?: string;
  telefone?: string;
};

export default function MenuMobile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [currentAccountKey, setCurrentAccountKey] = useState<string>('');
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    console.log('[MenuMobile] useEffect - userData:', userData);
    if (userData) {
      const parsedUser: StoredUser = JSON.parse(userData);
      console.log('[MenuMobile] parsedUser:', parsedUser);
      setUser(parsedUser);

      // Gera chave da conta atual
      const clienteId = parsedUser.id_cliente;
      const usuarioId = parsedUser.id_usuario;
      if (clienteId && usuarioId) {
        setCurrentAccountKey(`${clienteId}-${usuarioId}`);
      }

      // Busca dados completos do usuário (email e telefone) apenas se não existirem
      console.log('[MenuMobile] Verificando email/telefone:', {
        email: parsedUser.email,
        telefone: parsedUser.telefone,
        precisaBuscar: !parsedUser.email || !parsedUser.telefone
      });
      if (!parsedUser.email || !parsedUser.telefone) {
        fetchUserDetails(parsedUser.token, parsedUser.id_usuario);
      }
    }

    // Detecta tema atual
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const fetchUserDetails = async (token: string, userId: number) => {
    console.log('[MenuMobile] Buscando detalhes do usuário, userId:', userId);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get', {
        headers: { token }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[MenuMobile] Resposta da API:', data);
        const users = Array.isArray(data) ? data : [];

        // Encontra o usuário atual na lista
        const currentUser = users.find((u: any) => u.Id === userId);
        console.log('[MenuMobile] Usuário encontrado:', currentUser);

        if (currentUser) {
          // Atualiza o user com email e telefone
          setUser(prev => {
            if (!prev) return null;

            const updatedUser = {
              ...prev,
              email: currentUser.email,
              telefone: currentUser.telefone
            };

            console.log('[MenuMobile] User atualizado:', updatedUser);

            // Salva no localStorage para não precisar buscar novamente
            try {
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } catch (e) {
              console.error('Erro ao salvar user no localStorage:', e);
            }

            return updatedUser;
          });
        } else {
          console.warn('[MenuMobile] Usuário não encontrado na lista. userId:', userId);
        }
      } else {
        console.error('[MenuMobile] Erro na resposta:', response.status);
      }
    } catch (error) {
      console.error('[MenuMobile] Erro ao buscar detalhes do usuário:', error);
    }
  };

  const fetchLinkedAccounts = useCallback(async () => {
    if (!user?.token) return;

    setLoadingAccounts(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/contas/vinculadas/get', {
        headers: { token: user.token }
      });

      if (response.ok) {
        const data = await response.json();
        const accounts = Array.isArray(data) ? data : [];
        // Define todas as contas (incluindo a atual)
        setLinkedAccounts(accounts);
      }
    } catch (error) {
      console.error('Erro ao buscar contas vinculadas:', error);
    } finally {
      setLoadingAccounts(false);
    }
  }, [user?.token]);

  // Carrega contas vinculadas quando o modal de workspace é aberto
  useEffect(() => {
    if (showWorkspaceModal) {
      fetchLinkedAccounts();
    }
  }, [showWorkspaceModal, fetchLinkedAccounts]);

  const handleAccountSwitch = async (account: LinkedAccount) => {
    if (!user?.token) return;

    if (account.id_cliente === undefined || account.id_usuario === undefined) {
      alert('Conta selecionada não possui informações completas para troca.');
      return;
    }

    if (account.cliente_ativo === false || account.usuario_ativo === false) {
      alert('Esta conta está inativa e não pode ser acessada.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/contas/vinculadas/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': user.token
        },
        body: JSON.stringify({
          id_cliente: account.id_cliente,
          id_usuario: account.id_usuario
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'sucess') {
        // Atualiza o user no localStorage
        localStorage.setItem('user', JSON.stringify(data));
        setShowWorkspaceModal(false);

        // Redireciona para o dashboard
        window.location.href = '/dashboard';
      } else {
        alert(data.status || 'Erro ao trocar de conta');
      }
    } catch (error) {
      console.error('Erro ao trocar de conta:', error);
      alert('Erro ao trocar de conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showWorkspaceModal && user?.token) {
      fetchLinkedAccounts();
    }
  }, [showWorkspaceModal, user?.token]);

  const handleToggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/app/login');
  };

  const handleChangePassword = async () => {
    if (!user?.token) return;

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/user/mudar-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': user.token
        },
        body: JSON.stringify({
          senhaAtual: currentPassword,
          novaSenha: newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'sucess') {
        setSuccess('Senha alterada com sucesso! Você será redirecionado para fazer login novamente.');
        setTimeout(() => {
          localStorage.clear();
          navigate('/');
        }, 2000);
      } else {
        setError(data.status || 'Erro ao alterar senha');
      }
    } catch {
      setError('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 transition-theme">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Perfil do Usuário */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {user?.nome_usuario || 'Usuário'}
              </h2>
              {user?.email && (
                <p className="text-sm text-gray-600 dark:text-neutral-400 truncate">
                  {user.email}
                </p>
              )}
              {user?.telefone && (
                <p className="text-xs text-gray-500 dark:text-neutral-500 truncate">
                  {user.telefone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Workspace */}
        <button
          onClick={() => setShowWorkspaceModal(true)}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                Workspace
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {user?.nome_cliente || 'Trocar de workspace'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Alterar Senha */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                Alterar Senha
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Trocar sua senha de acesso
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Tema */}
        <button
          onClick={handleToggleTheme}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                Tema
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {isDarkMode ? 'Modo escuro' : 'Modo claro'}
              </p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </div>
        </button>

        {/* Suporte */}
        <a
          href="https://wa.me/553892590370"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-green-500 dark:hover:border-green-500 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                Suporte
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Fale conosco pelo WhatsApp
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </a>

        {/* Sair */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-xl border border-red-200 dark:border-red-900/50 hover:border-red-500 dark:hover:border-red-500 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Sair
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Desconectar da conta
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </button>
      </div>

      {/* Modal Alterar Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                Alterar Senha
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-neutral-100"
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-neutral-100"
                    placeholder="Digite a nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-neutral-100"
                    placeholder="Confirme a nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setSuccess('');
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-700 dark:text-neutral-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Alterando...' : 'Alterar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Workspace */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                Trocar Workspace
              </h2>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                Selecione o workspace desejado
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : linkedAccounts.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-400 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-neutral-400">
                    Nenhuma conta vinculada disponível
                  </p>
                </div>
              ) : linkedAccounts.length === 1 ? (
                <div className="text-center py-8 px-4">
                  <Building2 className="w-16 h-16 text-gray-400 dark:text-neutral-600 mx-auto mb-4" />
                  <p className="text-base font-medium text-gray-900 dark:text-white mb-2">
                    Você não tem mais workspaces
                  </p>
                  <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
                    Se quiser solicitar acesso a outro workspace, entre em contato com o suporte.
                  </p>
                  <a
                    href="https://wa.me/553892590370"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Falar com Suporte
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedAccounts.map((account) => {
                    const accountKey = `${account.id_cliente}-${account.id_usuario}`;
                    // Verifica se é a conta atual comparando id_usuario (o mais confiável)
                    const isSelected = account.id_usuario === user?.id_usuario &&
                                      (currentAccountKey === accountKey || !currentAccountKey);
                    return (
                      <button
                        key={accountKey}
                        onClick={() => !isSelected && handleAccountSwitch(account)}
                        disabled={loading || isSelected}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-neutral-800'
                        } ${loading && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3 flex-1 text-left">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/40'
                              : 'bg-gray-100 dark:bg-neutral-700'
                          }`}>
                            <Building2 className={`w-5 h-5 ${
                              isSelected
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-neutral-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${
                                isSelected
                                  ? 'text-blue-900 dark:text-blue-100'
                                  : 'text-gray-900 dark:text-neutral-100'
                              }`}>
                                {account.nome_cliente || 'Conta sem nome'}
                              </p>
                              {isSelected && (
                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                  Atual
                                </span>
                              )}
                            </div>
                            {account.nome_usuario && (
                              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                                {account.nome_usuario}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700 p-4">
              <button
                onClick={() => setShowWorkspaceModal(false)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-700 dark:text-neutral-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Sair da conta
            </h2>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">
              Tem certeza que deseja sair da sua conta?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-700 dark:text-neutral-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

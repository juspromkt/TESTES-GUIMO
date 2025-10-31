import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, User as UserIcon, Phone, Mail, Calendar, X, Copy, Check } from 'lucide-react';
import type { Contato } from '../types/contato';

export default function ContatosMobile() {
  const location = useLocation();
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContato, setSelectedContato] = useState<Contato | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  // Força reload sempre que entrar na página - executado no mount
  useEffect(() => {
    console.log('[ContatosMobile] Montado - pathname:', location.pathname);
    console.log('[ContatosMobile] Token disponível:', !!token);

    fetchContatos();

    return () => {
      console.log('[ContatosMobile] Desmontado');
    };
  }, []); // Dependências vazias - executa só no mount/unmount

  // Monitora mudanças de rota para recarregar quando voltar
  useEffect(() => {
    if (location.pathname === '/app/contatos') {
      console.log('[ContatosMobile] Rota /app/contatos detectada - recarregando');
      fetchContatos();
    }
  }, [location.pathname]);

  // Listener para atualizar quando mensagem for enviada
  useEffect(() => {
    const handleChatUpdate = () => {
      console.log('[ContatosMobile] Chat atualizado - recarregando contatos');
      fetchContatos();
    };

    window.addEventListener('chat:last_message_updated', handleChatUpdate);
    window.addEventListener('chat:update', handleChatUpdate);

    return () => {
      window.removeEventListener('chat:last_message_updated', handleChatUpdate);
      window.removeEventListener('chat:update', handleChatUpdate);
    };
  }, []);

  const fetchContatos = async () => {
    console.log('[ContatosMobile] fetchContatos iniciado');
    console.log('[ContatosMobile] Token sendo usado:', token);

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/contato/get', {
        headers: { token }
      });

      console.log('[ContatosMobile] Response status:', response.status);
      console.log('[ContatosMobile] Response ok:', response.ok);

      if (!response.ok) {
        console.error('[ContatosMobile] Resposta não OK');
        throw new Error('Erro ao carregar contatos');
      }

      const data = await response.json();
      console.log('[ContatosMobile] Dados recebidos:', data);
      console.log('[ContatosMobile] Tipo de dados:', typeof data);
      console.log('[ContatosMobile] É array?:', Array.isArray(data));
      console.log('[ContatosMobile] Quantidade de contatos:', Array.isArray(data) ? data.length : 0);

      setContatos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[ContatosMobile] Erro ao carregar contatos:', err);
      setContatos([]);
    } finally {
      console.log('[ContatosMobile] Finalizando loading');
      setLoading(false);
    }
  };

  const filteredContatos = contatos.filter(contato => {
    const query = searchQuery.toLowerCase();
    return (
      contato.nome?.toLowerCase().includes(query) ||
      contato.Email?.toLowerCase().includes(query) ||
      contato.telefone?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contatos</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredContatos.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-400 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-neutral-400">
              {searchQuery ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContatos.map((contato) => (
              <div
                key={contato.Id}
                onClick={() => setSelectedContato(contato)}
                className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 active:scale-98 transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate mb-1">
                      {contato.nome || 'Sem nome'}
                    </h3>
                    {contato.telefone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{contato.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Contato */}
      {selectedContato && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Detalhes do Contato
              </h2>
              <button
                onClick={() => setSelectedContato(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Avatar e Nome */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-3">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedContato.nome || 'Sem nome'}
                </h3>
              </div>

              {/* Informações */}
              <div className="space-y-4">
                {/* Email */}
                {selectedContato.Email && (
                  <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 mb-2">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">E-mail</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-900 dark:text-white break-all">
                        {selectedContato.Email}
                      </span>
                      <button
                        onClick={() => handleCopy(selectedContato.Email!, 'email')}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors flex-shrink-0"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Telefone */}
                {selectedContato.telefone && (
                  <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 mb-2">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">Telefone</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-900 dark:text-white">
                        {selectedContato.telefone}
                      </span>
                      <button
                        onClick={() => handleCopy(selectedContato.telefone!, 'telefone')}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors flex-shrink-0"
                      >
                        {copiedField === 'telefone' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Data de criação */}
                {selectedContato.createdAt && (
                  <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Data de criação</span>
                    </div>
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(selectedContato.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { X, Loader2, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (remoteJid: string, name: string) => void;
}

export function NewChatModal({ isOpen, onClose, onSuccess }: NewChatModalProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumbers = (number: string) => {
    if (!number) return { numero: null };

    const apenasNumeros = (str: string) => String(str).replace(/\D/g, '');
    let numero = apenasNumeros(number);

    // Remove o zero à esquerda do DDD, se existir
    if (numero.length >= 11 && numero.startsWith('0')) {
      numero = numero.slice(1);
    }

    // ✅ Lógica correta para diferenciar DDI x DDD
    if (numero.startsWith('55') && numero.length > 11) {
      // Já está com DDI
      // Exemplo: 5562998765432 -> não faz nada
    } else if (numero.length === 11) {
      // Nacional sem DDI
      numero = '55' + numero;
    } else if (numero.length === 10) {
      // Nacional fixo sem DDI
      numero = '55' + numero;
    }

    const ddd = numero.slice(2, 4);
    const dddInt = parseInt(ddd, 10);

    // Remove o 9 para fixos (ex.: telefone do RS com DDD 55)
    const numeroFormatado =
      dddInt >= 11 && dddInt <= 29
        ? numero
        : numero.replace(/^(55\d{2})9(\d{8})$/, '$1$2');

    return { numero: numeroFormatado };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !telefone.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    // Validar telefone (apenas números)
    const cleanPhone = telefone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      toast.error('Telefone inválido. Digite um telefone com DDD (10-13 dígitos)');
      return;
    }

    setLoading(true);

    try {
      const user = localStorage.getItem('user');
      const token = user ? JSON.parse(user).token : null;

      if (!token) {
        toast.error('Token não encontrado');
        return;
      }

      // Formatar número usando a função de formatação
      const { numero: formattedPhone } = formatPhoneNumbers(cleanPhone);

      if (!formattedPhone) {
        toast.error('Erro ao formatar telefone');
        return;
      }

      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/contato/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token,
          },
          body: JSON.stringify({
            nome: nome.trim(),
            telefone: formattedPhone,
            createdAt: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[NewChatModal] Contato criado:', data);

      // Dispara evento para atualizar lista de contatos
      window.dispatchEvent(new Event('contacts_updated'));

      toast.success('Contato criado com sucesso!');

      // Formatar remoteJid com número formatado
      const remoteJid = `${formattedPhone}@s.whatsapp.net`;

      // Fechar modal e abrir conversa
      onSuccess(remoteJid, nome.trim());
      handleClose();
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast.error('Erro ao criar contato. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNome('');
    setTelefone('');
    setLoading(false);
    onClose();
  };

  const formatPhoneInput = (value: string) => {
    // Remove tudo exceto números
    const cleaned = value.replace(/\D/g, '');

    // Formata: +55 (11) 91234-5678
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2)}`;
    } else if (cleaned.length <= 9) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4)}`;
    } else {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9, 13)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setTelefone(formatted);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={loading ? undefined : handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nova Conversa</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="nome"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Nome do Contato
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome..."
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="telefone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Telefone (com DDD)
            </label>
            <input
              id="telefone"
              type="text"
              value={telefone}
              onChange={handlePhoneChange}
              placeholder="+55 (11) 91234-5678"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Formato: +55 (DDD) 91234-5678
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar e Abrir Conversa'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

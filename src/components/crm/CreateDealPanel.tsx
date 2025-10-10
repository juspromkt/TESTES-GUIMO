import React, { useState } from 'react';
import { Plus, Loader2, X, Check } from 'lucide-react';
import type { Funil } from '../../types/funil';
import type { Fonte } from '../../types/fonte';
import type { Contato } from '../../types/contato';
import type { User } from '../../types/user';
import SearchableSelect from './SearchableSelect';
import Modal from '../Modal';

interface CreateDealPanelProps {
  isOpen: boolean;
  onClose: () => void;
  funis: Funil[];
  fontes: Fonte[];
  contatos: Contato[];
  users: User[];
  onCreateDeal: (dealData: any) => Promise<void>;
  onCreateContact: (
    contactData: { nome: string; Email: string; telefone: string }
  ) => Promise<number | null>;
}

export default function CreateDealPanel({
  isOpen,
  onClose,
  funis,
  fontes,
  contatos,
  users,
  onCreateDeal,
  onCreateContact
}: CreateDealPanelProps) {
  const [formData, setFormData] = useState({
    id_funil: null as number | null,
    id_contato: null as number | null,
    id_fonte: null as number | null,
    id_usuario: null as number | null,
    titulo: '',
    descricao: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    nome: '',
    Email: '',
    telefone: ''
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const formatPhoneNumbers = (number: string) => {
    if (!number) return null;
    const apenasNumeros = (str: string) => String(str).replace(/\D/g, '');
    let numero = apenasNumeros(number);
    if (numero.length >= 11 && numero.startsWith('0')) {
      numero = numero.slice(1);
    }
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }
    const ddd = numero.slice(2, 4);
    const dddInt = parseInt(ddd, 10);
    let numeroFormatado;
    if (dddInt >= 11 && dddInt <= 29) {
      numeroFormatado = numero;
    } else {
      numeroFormatado = numero.replace(/^(55\d{2})9(\d{8})$/, '$1$2');
    }
    return numeroFormatado;
  };

  const funilOptions = funis.map(f => ({ id: f.id, label: f.nome }));
  const contatoOptions = contatos.map(c => ({ id: c.Id, label: c.nome }));
  const fonteOptions = fontes.map(f => ({ id: f.Id, label: f.source ? `${f.nome} (${f.source})` : f.nome }));
  const userOptions = users.map(u => ({ id: u.Id, label: u.nome }));

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 🔹 Agora só exige o contato, o funil é opcional
  if (!formData.id_contato) return;

  setSubmitting(true);
  setError(null);

  try {
    // Prepara os dados da negociação
    const payload: any = {
      id_funil: formData.id_funil || null, // permite null
      id_contato: formData.id_contato,
      titulo: formData.titulo,
      descricao: formData.descricao,
    };

    if (formData.id_fonte) payload.id_fonte = formData.id_fonte;
    if (formData.id_usuario) payload.id_usuario = formData.id_usuario;

    // Chama o método do CRM.tsx
    await onCreateDeal(payload);

    // Reseta e fecha o painel
    resetForm();
    onClose();
  } catch (err) {
    setError('Erro ao criar negociação');
  } finally {
    setSubmitting(false);
  }
};


  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactError(null);
    try {
      const formatted = formatPhoneNumbers(contactForm.telefone);
      const newId = await onCreateContact({
        ...contactForm,
        telefone: formatted || ''
      });
      if (newId) {
        setFormData({ ...formData, id_contato: newId });
      }
      setContactForm({ nome: '', Email: '', telefone: '' });
      setIsContactModalOpen(false);
    } catch (err) {
      setContactError('Erro ao criar contato');
    } finally {
      setContactSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id_funil: null,
      id_contato: null,
      id_fonte: null,
      id_usuario: null,
      titulo: '',
      descricao: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Nova Negociação</h2>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados da negociação</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funil
                </label>
                <SearchableSelect
                  options={funilOptions}
                  value={formData.id_funil}
                  onChange={(id) => setFormData({ ...formData, id_funil: id })}
                  placeholder="Selecione um funil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contato
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={contatoOptions}
                      value={formData.id_contato}
                      onChange={(id) => setFormData({ ...formData, id_contato: id })}
                      placeholder="Selecione um contato"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fonte
                </label>
                <SearchableSelect
                  options={fonteOptions}
                  value={formData.id_fonte}
                  onChange={(id) => setFormData({ ...formData, id_fonte: id })}
                  placeholder="Selecione uma fonte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuário Responsável
                </label>
                <SearchableSelect
                  options={userOptions}
                  value={formData.id_usuario}
                  onChange={(id) => setFormData({ ...formData, id_usuario: id })}
                  placeholder="Selecione um usuário"
                />
              </div>
            </div>

            <div className="border-t pt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Negociação
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: Projeto de Marketing Digital"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="border-t pt-6">
              <button
  type="submit"
  disabled={submitting || !formData.id_contato}
  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
>

                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando negociação...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Criar Negociação
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isContactModalOpen && (
        <Modal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          title="Novo Contato"
        >
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                id="nome"
                value={contactForm.nome}
                onChange={(e) => setContactForm({ ...contactForm, nome: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite o nome do contato..."
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={contactForm.Email}
                onChange={(e) => setContactForm({ ...contactForm, Email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite o email do contato..."
              />
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                id="telefone"
                value={contactForm.telefone}
                onChange={(e) => setContactForm({ ...contactForm, telefone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite o telefone do contato..."
              />
            </div>

            {contactError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {contactError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={contactSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {contactSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Salvar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
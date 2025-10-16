import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
}

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  width = '100%',
  maxWidth = 'md',
  height = 'auto',
  maxHeight = '85vh',
}: ModalProps) => {
  if (!isOpen) return null;

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      case '4xl':
        return 'max-w-4xl';
      case '5xl':
        return 'max-w-5xl';
      case '6xl':
        return 'max-w-6xl';
      case '7xl':
        return 'max-w-7xl';
      default:
        return maxWidth.startsWith('max-w-') ? maxWidth : `max-w-${maxWidth}`;
    }
  };

  const modalContent = (
    <>
      {/* Fundo escurecido */}
      <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-[9998] transition-theme" />

      {/* Conteúdo do modal */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          // Fecha o modal se clicar fora do conteúdo
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={`bg-white dark:bg-neutral-800 rounded-xl shadow-2xl transform transition-all duration-200 scale-100 ${getMaxWidthClass()} overflow-hidden flex flex-col transition-theme border border-gray-200 dark:border-neutral-700`}
          style={{
            width:
              typeof width === 'string' && !width.includes('w-')
                ? width
                : undefined,
            maxWidth:
              typeof maxWidth === 'string' && !maxWidth.includes('max-w-')
                ? maxWidth
                : undefined,
            height:
              typeof height === 'string' && !height.includes('h-')
                ? height
                : undefined,
            maxHeight:
              typeof maxHeight === 'string' && !maxHeight.includes('max-h-')
                ? maxHeight
                : undefined,
          }}
          onClick={(e) => e.stopPropagation()} // 🔒 impede fechamento ao clicar dentro
        >
          {/* Cabeçalho */}
          <div className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-neutral-700 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm transition-theme">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-neutral-100">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corpo */}
          <div className="overflow-y-auto px-6 py-4 bg-white dark:bg-neutral-800 transition-theme">{children}</div>
        </div>
      </div>
    </>
  );

  // Renderiza fora da hierarquia principal, direto no body
  return createPortal(modalContent, document.body);
};

export default Modal;

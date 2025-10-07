import React from 'react';
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
  width = "100%",
  maxWidth = "md",
  height = "auto",
  maxHeight = "85vh"
}: ModalProps) => {
  if (!isOpen) return null;

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '3xl': return 'max-w-3xl';
      case '4xl': return 'max-w-4xl';
      case '5xl': return 'max-w-5xl';
      case '6xl': return 'max-w-6xl';
      case '7xl': return 'max-w-7xl';
      default: return maxWidth.startsWith('max-w-') ? maxWidth : `max-w-${maxWidth}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-lg ${getMaxWidthClass()} w-${width} overflow-hidden flex flex-col`}
        style={{ 
          width: typeof width === 'string' && !width.includes('w-') ? width : undefined,
          maxWidth: typeof maxWidth === 'string' && !maxWidth.includes('max-w-') ? maxWidth : undefined,
          height: typeof height === 'string' && !height.includes('h-') ? height : undefined,
          maxHeight: typeof maxHeight === 'string' && !maxHeight.includes('max-h-') ? maxHeight : undefined
        }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
<div className="overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
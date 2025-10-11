import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ContactSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ContactSidebar({ isOpen, onToggle }: ContactSidebarProps) {
  return (
    <div
      className={`
        fixed right-0 top-0 h-full 
        bg-white border-l border-gray-200 shadow-lg 
        transition-all duration-500 ease-in-out
        flex flex-col
        ${isOpen ? "w-[420px] opacity-100" : "w-0 opacity-0 overflow-hidden"}
      `}
    >
      {/* Header da sidebar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 tracking-tight">
          Informações do Lead
        </h2>

        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isOpen ? (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl border border-gray-100 p-4 bg-gray-50 text-gray-500 text-sm">
          <p>🧱 Aqui entra o conteúdo do lead (nome, telefone, e-mail etc.)</p>
          <p>💡 Mais tarde adicionaremos as abas e botões de ações.</p>
        </div>
      </div>
    </div>
  );
}

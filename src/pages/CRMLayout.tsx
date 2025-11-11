import React from "react";

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface CRMLayoutProps {
  sections: Section[];
  activeSection: string;
  setActiveSection: (id: string) => void;
  children: React.ReactNode;
  headerControls?: React.ReactNode;
}

export default function CRMLayout({
  sections,
  activeSection,
  setActiveSection,
  children,
  headerControls,
}: CRMLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header horizontal ultra-compacto */}
      <div className="flex-none bg-white dark:bg-gray-900 px-3 pt-0 pb-1.5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-3">
          {/* Navegação */}
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1.5">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded text-base font-medium transition-all ${
                      isActive
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Seção direita: Controles do CRM */}
          {headerControls && (
            <div className="flex items-center gap-2 flex-1 justify-end">
              {headerControls}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo - ocupa toda altura restante */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

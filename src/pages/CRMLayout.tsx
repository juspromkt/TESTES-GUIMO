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
}

export default function CRMLayout({
  sections,
  activeSection,
  setActiveSection,
  children,
}: CRMLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Sidebar - Escondida no mobile, visível no desktop */}
      <aside className="hidden lg:block w-64 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-300 dark:border-neutral-700 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">
          CRM e Relacionamento
        </h2>
        <nav className="flex flex-col gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-neutral-500"
                  }`}
                />
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

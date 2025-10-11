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
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-64 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
                    ? "bg-green-100 text-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-green-600" : "text-gray-400"
                  }`}
                />
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1">{children}</div>
    </div>
  );
}

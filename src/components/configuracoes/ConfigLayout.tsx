import React from "react";
import { LucideIcon } from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
}

interface ConfigLayoutProps {
  title: string;
  description: string;
  sections: Section[];
  activeSection: string;
  setActiveSection: (id: string) => void;
  children: React.ReactNode;
}

export default function ConfigLayout({
  title,
  description,
  sections,
  activeSection,
  setActiveSection,
  children,
}: ConfigLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Configurações
          </h2>

          <nav className="space-y-2">
            {sections
              .filter((section) => section.show)
              .map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[15px] font-medium transition-all ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? "text-indigo-600" : "text-gray-500"
                      }`}
                    />
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-300 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

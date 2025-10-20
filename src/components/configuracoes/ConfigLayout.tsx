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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-4 sm:p-6 transition-theme">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-300 dark:border-neutral-700 p-6 transition-theme">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-100 mb-6">
            {title}
          </h2>

          <nav className="space-y-2">
            {sections
              .filter((section) => section.show)
              .map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                const isAcademy = section.id === 'academy';

                // Estilos especiais para Guimoo Academy
                if (isAcademy) {
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[15px] font-bold transition-all relative overflow-hidden ${
                        isActive
                          ? "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                          : "bg-gradient-to-r from-yellow-100 via-amber-100 to-orange-100 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 text-amber-700 dark:text-amber-400 hover:from-yellow-200 hover:via-amber-200 hover:to-orange-200 dark:hover:from-yellow-900/30 dark:hover:via-amber-900/30 dark:hover:to-orange-900/30"
                      }`}
                    >
                      {/* Sparkle effect */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      )}
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          isActive ? "text-white" : "text-amber-600 dark:text-amber-400"
                        }`}
                      />
                      <span className="truncate relative z-10">{section.label}</span>
                    </button>
                  );
                }

                // Estilos padrão para outras seções
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[15px] font-medium transition-all ${
                      isActive
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-sm"
                        : "text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-neutral-500"
                      }`}
                    />
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-300 dark:border-neutral-700 p-8 transition-theme">
          {children}
        </main>
      </div>
    </div>
  );
}

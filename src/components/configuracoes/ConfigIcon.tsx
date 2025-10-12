import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ConfigIconProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default function ConfigIcon({ icon: Icon, label, isActive, onClick }: ConfigIconProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50'
          : 'border-gray-300 bg-white hover:border-blue-500 hover:shadow-md'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <span className="font-medium text-gray-900">{label}</span>
      </div>
    </button>
  );
}
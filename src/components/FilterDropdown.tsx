import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

export default function FilterDropdown({ isOpen, onClose, children, triggerRef }: FilterDropdownProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />
      {/* Dropdown */}
      <div
        className="fixed z-[9999] bg-white border-2 border-gray-200 rounded-2xl shadow-2xl"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          minWidth: '288px'
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

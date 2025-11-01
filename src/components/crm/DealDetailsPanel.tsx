import DealDetails from "../../pages/DealDetails";
import React from "react";

interface DealDetailsPanelProps {
  dealId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function DealDetailsPanel({ dealId, isOpen, onClose }: DealDetailsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[90%] md:w-[70%] lg:w-[50%] xl:w-[40%] bg-white dark:bg-neutral-900 shadow-2xl z-50 overflow-y-auto">
        <DealDetails dealId={dealId} hideConversations onClose={onClose} />
      </div>
    </>
  );
}
import React from 'react';

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}> = ({ isOpen, onClose, onConfirm, title, children, confirmText = 'Confirmar', confirmVariant = 'danger' }) => {
  if (!isOpen) return null;

  const confirmButtonClasses = {
    danger: "text-[#FF3B30] hover:bg-[#FF3B30]/10",
    primary: "text-[#0071E3] hover:bg-[#0071E3]/10",
  };
  const buttonClass = confirmButtonClasses[confirmVariant] || confirmButtonClasses.danger;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div 
        className="glass apple-card p-0 w-full max-w-[320px] mx-4 animate-fade-in-slide-up border-none overflow-hidden text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
            <h2 id="modal-title" className="text-lg font-bold text-[var(--apple-text)] mb-2">{title}</h2>
            <div className="text-[13px] font-medium text-[var(--apple-text)] opacity-70 leading-relaxed">
            {children}
            </div>
        </div>
        <div className="flex border-t border-[var(--apple-border)]">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 text-[17px] font-medium text-[var(--apple-accent)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-r border-[var(--apple-border)]"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 py-4 text-[17px] font-bold ${buttonClass} transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;


import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  zIndex?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-4xl',
  zIndex = 'z-50' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-auto animate-in fade-in zoom-in duration-200 border-4 border-slate-200`}>
        {title && (
          <div className="px-10 pt-8 flex justify-between items-center border-b-2 border-slate-100 pb-6">
            <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-950 text-4xl font-light transition-colors">&times;</button>
          </div>
        )}
        <div className="p-10">
          {!title && (
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-950 text-4xl font-light z-10 transition-colors"
            >
              &times;
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

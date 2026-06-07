import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, title = 'Delete Confirmation', message, itemName,
}) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-2xl p-6 ${
        dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-white border border-gray-200 shadow-xl'
      }`}>
        <button onClick={onClose} className={`absolute top-4 right-4 p-1.5 rounded-lg ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-400'}`}>
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            dark ? 'bg-red-500/10' : 'bg-red-50'
          }`}>
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>

          <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          <p className={`text-sm mb-6 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
            {message || `Are you sure you want to delete ${itemName ? `"${itemName}"` : 'this item'}? This action cannot be undone.`}
          </p>

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

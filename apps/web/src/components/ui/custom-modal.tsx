'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AlertCircle, CheckCircle, HelpCircle, X } from 'lucide-react';

type ModalType = 'alert' | 'confirm' | 'prompt';

interface ModalOptions {
  type: ModalType;
  title?: string;
  message: string;
  defaultValue?: string;
  resolve: (value: any) => void;
}

interface CustomModalContextType {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
}

const CustomModalContext = createContext<CustomModalContextType | undefined>(undefined);

export const useCustomModal = () => {
  const context = useContext(CustomModalContext);
  if (!context) {
    throw new Error('useCustomModal must be used within a CustomModalProvider');
  }
  return context;
};

export function CustomModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalOptions | null>(null);
  const [inputValue, setInputValue] = useState('');

  const showAlert = useCallback((message: string, title?: string): Promise<void> => {
    return new Promise((resolve) => {
      setModal({ type: 'alert', message, title, resolve });
    });
  }, []);

  const showConfirm = useCallback((message: string, title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({ type: 'confirm', message, title, resolve });
    });
  }, []);

  const showPrompt = useCallback((message: string, defaultValue = '', title?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setInputValue(defaultValue);
      setModal({ type: 'prompt', message, defaultValue, title, resolve });
    });
  }, []);

  const handleClose = (value: any) => {
    if (modal) {
      modal.resolve(value);
      setModal(null);
    }
  };

  // Экспортируем глобально для удобства в не-React файлах или для быстрой миграции, 
  // если мы сможем настроить window.customConfirm (но нужен async/await)
  if (typeof window !== 'undefined') {
    (window as any).customAlert = showAlert;
    (window as any).customConfirm = showConfirm;
    (window as any).customPrompt = showPrompt;
  }

  return (
    <CustomModalContext.Provider value={{ alert: showAlert, confirm: showConfirm, prompt: showPrompt }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 rounded-full p-2 flex-shrink-0 ${
                  modal.type === 'alert' ? 'bg-indigo-500/10 text-indigo-400' :
                  modal.type === 'confirm' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-fuchsia-500/10 text-fuchsia-400'
                }`}>
                  {modal.type === 'alert' && <AlertCircle size={24} />}
                  {modal.type === 'confirm' && <HelpCircle size={24} />}
                  {modal.type === 'prompt' && <HelpCircle size={24} />}
                </div>
                <div className="flex-1 w-full">
                  <h3 className="text-lg font-semibold text-white mb-2 leading-tight">
                    {modal.title || (
                      modal.type === 'alert' ? 'Уведомление' :
                      modal.type === 'confirm' ? 'Подтверждение' :
                      'Ввод данных'
                    )}
                  </h3>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{modal.message}</p>
                  
                  {modal.type === 'prompt' && (
                    <div className="mt-4">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleClose(inputValue);
                          if (e.key === 'Escape') handleClose(null);
                        }}
                        autoFocus
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-5 py-4 bg-slate-950/50 flex items-center justify-end gap-3 border-t border-slate-800">
              {modal.type === 'alert' && (
                <button
                  onClick={() => handleClose(undefined)}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                >
                  ОК
                </button>
              )}
              
              {modal.type === 'confirm' && (
                <>
                  <button
                    onClick={() => handleClose(false)}
                    className="px-5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => handleClose(true)}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                  >
                    Да
                  </button>
                </>
              )}

              {modal.type === 'prompt' && (
                <>
                  <button
                    onClick={() => handleClose(null)}
                    className="px-5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => handleClose(inputValue)}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                  >
                    ОК
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </CustomModalContext.Provider>
  );
}

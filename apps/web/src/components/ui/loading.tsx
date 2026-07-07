import React from 'react';

interface LoadingProps {
  text?: string;
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ text = 'Загрузка...', fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        {/* Внешнее кольцо с неоновым свечением */}
        <div className="absolute inset-0 rounded-full border-4 border-violet-500/10 border-t-violet-500 animate-spin" />
        {/* Внутреннее светящееся ядро */}
        <div className="absolute inset-3 rounded-full border-4 border-fuchsia-500/10 border-b-fuchsia-500 animate-spin-reverse animate-pulse" />
      </div>
      {text && (
        <p className="text-sm font-medium tracking-wide text-violet-300 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-50">
        {/* Фоновые размытия */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full filter blur-[100px] pointer-events-none" />
        {content}
      </div>
    );
  }

  return content;
};

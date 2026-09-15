import React from 'react';
import { Sliders, HelpCircle, Sparkles, Building2 } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenGuide }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-lg tracking-wider shadow-sm font-sans">
            APM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-sans">
                Sélection des Experts & Prise de Décision
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Grille Officielle APM
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Traitement des candidatures selon la singularité de l’offre et l’ancrage terrain PME
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={onOpenGuide}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Rappel des 5 critères</span>
            <span className="sm:hidden">Critères</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Pondération Grille</span>
          </button>
        </div>
      </div>
    </header>
  );
};

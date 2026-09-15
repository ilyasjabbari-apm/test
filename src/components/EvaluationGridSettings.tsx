import React from 'react';
import { CriteriaWeights, PresetProfile } from '../types';
import { PRESET_PROFILES, CRITERIA_METADATA } from '../utils/scoring';
import { Sliders, RotateCcw, ShieldCheck } from 'lucide-react';

interface EvaluationGridSettingsProps {
  weights: CriteriaWeights;
  onWeightsChange: (newWeights: CriteriaWeights) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const EvaluationGridSettings: React.FC<EvaluationGridSettingsProps> = ({
  weights,
  onWeightsChange,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const total =
    weights.singulariteOffre +
    weights.prioriteProspective +
    weights.parcoursAcademique +
    weights.legitimiteInfluence +
    weights.experienceTerrainPME;

  const handleSliderChange = (key: keyof CriteriaWeights, value: number) => {
    onWeightsChange({
      ...weights,
      [key]: value,
    });
  };

  const applyPreset = (preset: PresetProfile) => {
    onWeightsChange(preset.weights);
  };

  const resetToDefault = () => {
    onWeightsChange(PRESET_PROFILES[0].weights);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Pondération de la Grille d'Évaluation APM
              </h3>
              <p className="text-xs text-slate-500">
                Ajustez l'importance relative de chaque critère selon les priorités du comité
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
            Profils types de pondération :
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_PROFILES.map((preset) => {
              const isSelected =
                JSON.stringify(weights) === JSON.stringify(preset.weights);
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 text-amber-950 ring-2 ring-amber-200 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-900 mb-0.5">{preset.name}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2">
                    {preset.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders for the 5 criteria */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Coefficients individuels (sur 100%)
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                total === 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Somme : {total}% {total !== 100 && '(normalisation auto)'}
            </span>
          </div>

          {/* Section 1: Offre */}
          <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-100 space-y-3">
            <span className="text-xs font-bold text-sky-900 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-700" /> Critères propres à l’offre
            </span>

            {CRITERIA_METADATA.slice(0, 2).map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <span className="font-bold text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200">
                    {weights[item.key as keyof CriteriaWeights]}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={weights[item.key as keyof CriteriaWeights]}
                  onChange={(e) =>
                    handleSliderChange(item.key as keyof CriteriaWeights, Number(e.target.value))
                  }
                  className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Section 2: Expert */}
          <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-100 space-y-3">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Critères propres à l’expert
            </span>

            {CRITERIA_METADATA.slice(2, 5).map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <span className="font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                    {weights[item.key as keyof CriteriaWeights]}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={weights[item.key as keyof CriteriaWeights]}
                  onChange={(e) =>
                    handleSliderChange(item.key as keyof CriteriaWeights, Number(e.target.value))
                  }
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser grille standard
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-md transition-colors"
          >
            Appliquer & Recalculer les scores
          </button>
        </div>
      </div>
    </div>
  );
};

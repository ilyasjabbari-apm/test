import React from 'react';
import { ExpertCandidate } from '../types';
import { CheckCircle2, HelpCircle, Bookmark, XCircle, TrendingUp, Users, Target } from 'lucide-react';

interface StatsBannerProps {
  candidates: ExpertCandidate[];
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ candidates }) => {
  const total = candidates.length;
  if (total === 0) return null;

  const retenus = candidates.filter((c) => c.decision === 'RETENU').length;
  const auditions = candidates.filter((c) => c.decision === 'AUDITION').length;
  const reserves = candidates.filter((c) => c.decision === 'RESERVE').length;
  const refuses = candidates.filter((c) => c.decision === 'REFUSE').length;

  const avgGlobal = Math.round(
    candidates.reduce((acc, c) => acc + c.scoreGlobal, 0) / total
  );
  const avgSingularite = (
    candidates.reduce((acc, c) => acc + c.scores.singulariteOffre, 0) / total
  ).toFixed(1);
  const avgProspective = (
    candidates.reduce((acc, c) => acc + c.scores.prioriteProspective, 0) / total
  ).toFixed(1);
  const avgTerrainPME = (
    candidates.reduce((acc, c) => acc + c.scores.experienceTerrainPME, 0) / total
  ).toFixed(1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      {/* Total Candidatures */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Candidatures</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-extrabold text-slate-900">{total}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">Dossiers analysés</div>
      </div>

      {/* Retenus */}
      <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200/80 shadow-2xs">
        <div className="flex items-center justify-between text-emerald-700 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Retenus</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-extrabold text-emerald-800">
          {retenus}{' '}
          <span className="text-xs font-semibold text-emerald-600">
            ({Math.round((retenus / total) * 100)}%)
          </span>
        </div>
        <div className="text-[11px] text-emerald-700 mt-0.5">Catalogue officiel APM</div>
      </div>

      {/* Auditions */}
      <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200/80 shadow-2xs">
        <div className="flex items-center justify-between text-amber-700 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Audition Comité</span>
          <HelpCircle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-extrabold text-amber-800">
          {auditions}{' '}
          <span className="text-xs font-semibold text-amber-600">
            ({Math.round((auditions / total) * 100)}%)
          </span>
        </div>
        <div className="text-[11px] text-amber-700 mt-0.5">Grand oral à planifier</div>
      </div>

      {/* En Réserve */}
      <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-200/80 shadow-2xs">
        <div className="flex items-center justify-between text-indigo-700 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">En Réserve</span>
          <Bookmark className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-2xl font-extrabold text-indigo-800">
          {reserves}{' '}
          <span className="text-xs font-semibold text-indigo-600">
            ({Math.round((reserves / total) * 100)}%)
          </span>
        </div>
        <div className="text-[11px] text-indigo-700 mt-0.5">Veille & calibration</div>
      </div>

      {/* Non Retenus */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-600 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Non Retenus</span>
          <XCircle className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-extrabold text-slate-700">
          {refuses}{' '}
          <span className="text-xs font-semibold text-slate-500">
            ({Math.round((refuses / total) * 100)}%)
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">Hors cible ou saturé</div>
      </div>

      {/* Baromètre Qualité APM */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white shadow-2xs">
        <div className="flex items-center justify-between text-slate-300 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Moy. Terrain PME</span>
          <Target className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-extrabold text-white">
          {avgTerrainPME}
          <span className="text-xs font-normal text-slate-400">/10</span>
        </div>
        <div className="text-[11px] text-slate-300 mt-0.5">
          Score Global : <span className="font-bold text-amber-300">{avgGlobal}/100</span>
        </div>
      </div>
    </div>
  );
};

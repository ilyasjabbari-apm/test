import React, { useState } from 'react';
import { ExpertCandidate, DecisionStatus } from '../types';
import { Sparkles, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface DecisionMatrixProps {
  candidates: ExpertCandidate[];
  onSelectCandidate: (candidate: ExpertCandidate) => void;
  selectedCandidateId?: string;
}

export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({
  candidates,
  onSelectCandidate,
  selectedCandidateId,
}) => {
  const [hoveredCandidate, setHoveredCandidate] = useState<ExpertCandidate | null>(null);
  const [filterDecision, setFilterDecision] = useState<string>('ALL');

  const filteredCandidates = candidates.filter((c) => {
    if (filterDecision === 'ALL') return true;
    return c.decision === filterDecision;
  });

  // Coordinates mapping (0 to 10 to SVG coordinates)
  const padding = 50;
  const width = 680;
  const height = 460;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const getX = (val: number) => padding + (Math.max(0, Math.min(10, val)) / 10) * plotWidth;
  const getY = (val: number) => height - padding - (Math.max(0, Math.min(10, val)) / 10) * plotHeight;

  const thresholdX = getX(6.5);
  const thresholdY = getY(6.5);

  const getBadgeColor = (status: DecisionStatus) => {
    switch (status) {
      case 'RETENU':
        return { bg: '#10b981', ring: '#059669', label: 'Retenu' };
      case 'AUDITION':
        return { bg: '#f59e0b', ring: '#d97706', label: 'Audition' };
      case 'RESERVE':
        return { bg: '#6366f1', ring: '#4f46e5', label: 'En Réserve' };
      case 'REFUSE':
        return { bg: '#94a3b8', ring: '#64748b', label: 'Non Retenu' };
      default:
        return { bg: '#cbd5e1', ring: '#94a3b8', label: 'En attente' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight font-sans">
              Matrice Stratégique de Sélection APM
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold bg-sky-50 text-sky-800 rounded-md border border-sky-200">
              Double Filtre : Offre vs Ancrage Terrain
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Croisement entre la singularité prospective de l’offre (axe horizontal) et l’ancrage terrain / légitimité PME (axe vertical).
          </p>
        </div>

        {/* Status filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterDecision('ALL')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filterDecision === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous ({candidates.length})
          </button>
          <button
            onClick={() => setFilterDecision('RETENU')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1 transition-all ${
              filterDecision === 'RETENU'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Retenus ({candidates.filter((c) => c.decision === 'RETENU').length})
          </button>
          <button
            onClick={() => setFilterDecision('AUDITION')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1 transition-all ${
              filterDecision === 'AUDITION'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Auditions ({candidates.filter((c) => c.decision === 'AUDITION').length})
          </button>
          <button
            onClick={() => setFilterDecision('RESERVE')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1 transition-all ${
              filterDecision === 'RESERVE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            Réserves ({candidates.filter((c) => c.decision === 'RESERVE').length})
          </button>
          <button
            onClick={() => setFilterDecision('REFUSE')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1 transition-all ${
              filterDecision === 'REFUSE'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <XCircle className="w-3 h-3" />
            Refusés ({candidates.filter((c) => c.decision === 'REFUSE').length})
          </button>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto bg-slate-50/50 rounded-xl border border-slate-200/80 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-4xl mx-auto block select-none">
          {/* Quadrant Backgrounds */}
          {/* Top Right: Pépites APM */}
          <rect
            x={thresholdX}
            y={padding}
            width={width - padding - thresholdX}
            height={thresholdY - padding}
            fill="#ecfdf5"
            fillOpacity="0.75"
          />
          {/* Top Left: Experts Reconnus à challenger */}
          <rect
            x={padding}
            y={padding}
            width={thresholdX - padding}
            height={thresholdY - padding}
            fill="#fffbeb"
            fillOpacity="0.6"
          />
          {/* Bottom Right: Thématiques Prospectives avec Expert à valider */}
          <rect
            x={thresholdX}
            y={thresholdY}
            width={width - padding - thresholdX}
            height={height - padding - thresholdY}
            fill="#eef2ff"
            fillOpacity="0.6"
          />
          {/* Bottom Left: Hors Cible */}
          <rect
            x={padding}
            y={thresholdY}
            width={thresholdX - padding}
            height={height - padding - thresholdY}
            fill="#f8fafc"
            fillOpacity="0.8"
          />

          {/* Threshold Lines */}
          <line
            x1={thresholdX}
            y1={padding}
            x2={thresholdX}
            y2={height - padding}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <line
            x1={padding}
            y1={thresholdY}
            x2={width - padding}
            y2={thresholdY}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Quadrant Watermark Titles */}
          <text
            x={width - padding - 14}
            y={padding + 22}
            textAnchor="end"
            className="text-[13px] font-bold fill-emerald-800"
          >
            ★ PÉPITES APM (Intégration Catalogue)
          </text>
          <text
            x={width - padding - 14}
            y={padding + 38}
            textAnchor="end"
            className="text-[10.5px] fill-emerald-700 font-medium"
          >
            Haute singularité & Fort ancrage dirigeant PME
          </text>

          <text
            x={padding + 14}
            y={padding + 22}
            textAnchor="start"
            className="text-[13px] font-bold fill-amber-800"
          >
            EXPERTS D'AUTORITÉ (Offre à repositionner)
          </text>
          <text
            x={padding + 14}
            y={padding + 38}
            textAnchor="start"
            className="text-[10.5px] fill-amber-700 font-medium"
          >
            Légitimité forte / Stimuler la singularité & la prospective
          </text>

          <text
            x={width - padding - 14}
            y={height - padding - 28}
            textAnchor="end"
            className="text-[13px] font-bold fill-indigo-800"
          >
            SUJETS PROSPECTIFS (Audition Pédagogie)
          </text>
          <text
            x={width - padding - 14}
            y={height - padding - 14}
            textAnchor="end"
            className="text-[10.5px] fill-indigo-700 font-medium"
          >
            Offre innovante / Tester la posture avec des patrons de PME
          </text>

          <text
            x={padding + 14}
            y={height - padding - 28}
            textAnchor="start"
            className="text-[13px] font-bold fill-slate-500"
          >
            HORS CIBLE OU NON MATURE
          </text>
          <text
            x={padding + 14}
            y={height - padding - 14}
            textAnchor="start"
            className="text-[10.5px] fill-slate-500 font-medium"
          >
            Offre banalisée et manque d'ancrage PME
          </text>

          {/* Axes Grid & Lines */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#475569"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#475569"
            strokeWidth="2"
          />

          {/* X Axis Labels */}
          {[0, 2, 4, 6, 8, 10].map((val) => (
            <g key={`x-${val}`}>
              <line
                x1={getX(val)}
                y1={height - padding}
                x2={getX(val)}
                y2={height - padding + 5}
                stroke="#64748b"
                strokeWidth="1.5"
              />
              <text
                x={getX(val)}
                y={height - padding + 18}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-slate-600"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Y Axis Labels */}
          {[0, 2, 4, 6, 8, 10].map((val) => (
            <g key={`y-${val}`}>
              <line
                x1={padding - 5}
                y1={getY(val)}
                x2={padding}
                y2={getY(val)}
                stroke="#64748b"
                strokeWidth="1.5"
              />
              <text
                x={padding - 10}
                y={getY(val) + 3}
                textAnchor="end"
                className="text-[10px] font-semibold fill-slate-600"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Axis Titles */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            className="text-xs font-bold fill-slate-800 tracking-wide uppercase"
          >
            → Score de l'Offre (Singularité & Priorité Prospective) / 10
          </text>

          <text
            x={18}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90 18 ${height / 2})`}
            className="text-xs font-bold fill-slate-800 tracking-wide uppercase"
          >
            → Légitimité Expert & Ancrage Terrain PME / 10
          </text>

          {/* Candidate Data Dots */}
          {filteredCandidates.map((candidate) => {
            const x = getX(candidate.scoreOffre);
            // Y is weighted average of Terrain PME and Expert legitimacy
            const y = getY(candidate.scores.experienceTerrainPME);
            const isSelected = candidate.id === selectedCandidateId;
            const isHovered = candidate.id === hoveredCandidate?.id;
            const badge = getBadgeColor(candidate.decision);

            return (
              <g
                key={candidate.id}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectCandidate(candidate)}
                onMouseEnter={() => setHoveredCandidate(candidate)}
                onMouseLeave={() => setHoveredCandidate(null)}
              >
                {/* Outer halo when selected or hovered */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 16 : 14}
                    fill={badge.bg}
                    fillOpacity="0.25"
                    stroke={badge.ring}
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                )}

                {/* Main Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 9 : 7.5}
                  fill={badge.bg}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="filter drop-shadow-xs"
                />

                {/* Label near circle — only shown for selected/hovered dot to
                    keep the matrix readable once dozens of candidates are plotted */}
                {(isSelected || isHovered) && (
                  <text
                    x={x + 10}
                    y={y - 8}
                    className="text-[11px] font-bold fill-slate-900 pointer-events-none drop-shadow-xs"
                  >
                    {candidate.prenom ? `${candidate.prenom[0]}. ` : ''}{candidate.nom}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {hoveredCandidate && (
          <div
            className="absolute top-4 right-4 z-20 bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl backdrop-blur-xs border border-slate-700 max-w-xs pointer-events-none transition-all duration-150"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-bold text-sm text-amber-300 truncate">
                {hoveredCandidate.prenom} {hoveredCandidate.nom}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                  hoveredCandidate.decision === 'RETENU'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : hoveredCandidate.decision === 'AUDITION'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : hoveredCandidate.decision === 'RESERVE'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {hoveredCandidate.decision}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium line-clamp-2 mb-2">
              « {hoveredCandidate.titreIntervention} »
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] border-t border-slate-800 pt-2 text-slate-300">
              <div>
                Singularité : <span className="font-bold text-white">{hoveredCandidate.scores.singulariteOffre}/10</span>
              </div>
              <div>
                Prospective : <span className="font-bold text-white">{hoveredCandidate.scores.prioriteProspective}/10</span>
              </div>
              <div>
                Terrain PME : <span className="font-bold text-emerald-400">{hoveredCandidate.scores.experienceTerrainPME}/10</span>
              </div>
              <div>
                Global : <span className="font-bold text-amber-400">{hoveredCandidate.scoreGlobal}/100</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

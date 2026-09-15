import React from 'react';
import { CriteriaScores } from '../types';

interface RadarChartProps {
  scores: CriteriaScores;
  averageScores?: CriteriaScores;
  size?: number;
}

const CRITERIA_CONFIG = [
  { key: 'singulariteOffre' as const, label: 'Singularité Offre', short: 'Singularité' },
  { key: 'prioriteProspective' as const, label: 'Priorité Prospective', short: 'Prospective' },
  { key: 'parcoursAcademique' as const, label: 'Parcours Académique', short: 'Académique' },
  { key: 'legitimiteInfluence' as const, label: 'Légitimité & Influence', short: 'Influence' },
  { key: 'experienceTerrainPME' as const, label: 'Terrain & Monde PME', short: 'Terrain PME' },
];

export const RadarChart: React.FC<RadarChartProps> = ({
  scores,
  averageScores,
  size = 280,
}) => {
  const center = size / 2;
  const radius = (size - 70) / 2;
  const numAxes = CRITERIA_CONFIG.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Compute point for an axis at a given value (0 to 10)
  const getPoint = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (Math.max(0, Math.min(10, value)) / 10) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Generate candidate polygon
  const candidatePoints = CRITERIA_CONFIG.map((c, i) => getPoint(scores[c.key], i));
  const candidatePath =
    candidatePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Generate average polygon if provided
  let averagePath = '';
  if (averageScores) {
    const avgPoints = CRITERIA_CONFIG.map((c, i) => getPoint(averageScores[c.key], i));
    averagePath =
      avgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  }

  // Concentric levels (2, 4, 6, 8, 10)
  const levels = [2, 4, 6, 8, 10];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible select-none">
        {/* Concentric grid rings */}
        {levels.map((lvl) => {
          const r = (lvl / 10) * radius;
          return (
            <circle
              key={lvl}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={lvl === 10 ? '1.5' : '1'}
              strokeDasharray={lvl === 10 ? 'none' : '3 3'}
            />
          );
        })}

        {/* Axes lines */}
        {CRITERIA_CONFIG.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const outerX = center + radius * Math.cos(angle);
          const outerY = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outerX}
              y2={outerY}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Average benchmark polygon (if present) */}
        {averagePath && (
          <path
            d={averagePath}
            fill="#94a3b8"
            fillOpacity="0.12"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}

        {/* Candidate polygon */}
        <path
          d={candidatePath}
          fill="#0284c7"
          fillOpacity="0.25"
          stroke="#0284c7"
          strokeWidth="2.5"
          className="transition-all duration-300"
        />

        {/* Data points */}
        {candidatePoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="#0369a1" stroke="#ffffff" strokeWidth="2" />
          </g>
        ))}

        {/* Axis Labels & Values */}
        {CRITERIA_CONFIG.map((c, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelDist = radius + 24;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);
          const val = scores[c.key];

          let textAnchor = 'middle';
          if (Math.cos(angle) > 0.3) textAnchor = 'start';
          if (Math.cos(angle) < -0.3) textAnchor = 'end';

          return (
            <text
              key={c.key}
              x={lx}
              y={ly}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              className="text-[11px] font-semibold fill-slate-700"
            >
              {c.short} <tspan className="font-bold fill-sky-700">({val.toFixed(1)})</tspan>
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-600 inline-block"></span>
          <span className="font-medium">Candidat</span>
        </div>
        {averageScores && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-500 inline-block"></span>
            <span>Moyenne cohorte</span>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ExpertCandidate, DecisionStatus } from '../types';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Eye,
  SlidersHorizontal,
  Bot,
  ArrowUpDown,
} from 'lucide-react';

interface ExpertTableProps {
  candidates: ExpertCandidate[];
  onSelectCandidate: (candidate: ExpertCandidate) => void;
  onUpdateStatus: (id: string, newStatus: DecisionStatus) => void;
}

type SortField = 'scoreGlobal' | 'singularite' | 'prospective' | 'terrainPME' | 'nom';

export const ExpertTable: React.FC<ExpertTableProps> = ({
  candidates,
  onSelectCandidate,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('scoreGlobal');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter
  const filtered = candidates.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.decision === statusFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !query ||
      c.nom.toLowerCase().includes(query) ||
      c.prenom.toLowerCase().includes(query) ||
      c.titreIntervention.toLowerCase().includes(query) ||
      (c.theme && c.theme.toLowerCase().includes(query)) ||
      c.descriptifOffre.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    switch (sortField) {
      case 'scoreGlobal':
        diff = a.scoreGlobal - b.scoreGlobal;
        break;
      case 'singularite':
        diff = a.scores.singulariteOffre - b.scores.singulariteOffre;
        break;
      case 'prospective':
        diff = a.scores.prioriteProspective - b.scores.prioriteProspective;
        break;
      case 'terrainPME':
        diff = a.scores.experienceTerrainPME - b.scores.experienceTerrainPME;
        break;
      case 'nom':
        diff = a.nom.localeCompare(b.nom);
        break;
    }
    return sortAsc ? diff : -diff;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getDecisionBadge = (status: DecisionStatus) => {
    switch (status) {
      case 'RETENU':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Retenu APM
          </span>
        );
      case 'AUDITION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            À Auditionner
          </span>
        );
      case 'RESERVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3 text-indigo-600" />
            En Réserve
          </span>
        );
      case 'REFUSE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3 h-3 text-slate-500" />
            Non Retenu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-500">
            À traiter
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, sujet, thématique ou mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `Tous (${candidates.length})` },
            { id: 'RETENU', label: `Retenus (${candidates.filter((c) => c.decision === 'RETENU').length})` },
            { id: 'AUDITION', label: `Auditions (${candidates.filter((c) => c.decision === 'AUDITION').length})` },
            { id: 'RESERVE', label: `Réserves (${candidates.filter((c) => c.decision === 'RESERVE').length})` },
            { id: 'REFUSE', label: `Refusés (${candidates.filter((c) => c.decision === 'REFUSE').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-12 text-center">N°</th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => toggleSort('nom')}>
                <div className="flex items-center gap-1">
                  Expert & Thématique
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[240px]">Titre de l'Intervention</th>
              <th className="py-3 px-3 text-center cursor-pointer" onClick={() => toggleSort('singularite')}>
                <div className="flex items-center justify-center gap-1">
                  Singularité
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center cursor-pointer" onClick={() => toggleSort('prospective')}>
                <div className="flex items-center justify-center gap-1">
                  Prospective
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center cursor-pointer" onClick={() => toggleSort('terrainPME')}>
                <div className="flex items-center justify-center gap-1">
                  Terrain PME
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center cursor-pointer" onClick={() => toggleSort('scoreGlobal')}>
                <div className="flex items-center justify-center gap-1">
                  Score Global
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Décision APM</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                  Aucun dossier ne correspond à vos critères de recherche.
                </td>
              </tr>
            ) : (
              sorted.map((expert, idx) => (
                <tr
                  key={expert.id}
                  className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                  onClick={() => onSelectCandidate(expert)}
                >
                  <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-amber-800 text-sm transition-colors">
                      {expert.prenom} {expert.nom}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium line-clamp-1">
                      {expert.theme || 'Expertise APM'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800 line-clamp-2 leading-relaxed">
                      {expert.titreIntervention}
                    </div>
                    {expert.evalueParIA && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200">
                        <Bot className="w-2.5 h-2.5" /> IA Évalué
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        expert.scores.singulariteOffre >= 8
                          ? 'bg-sky-50 text-sky-800'
                          : expert.scores.singulariteOffre >= 6
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {expert.scores.singulariteOffre.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        expert.scores.prioriteProspective >= 8
                          ? 'bg-sky-50 text-sky-800'
                          : expert.scores.prioriteProspective >= 6
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {expert.scores.prioriteProspective.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        expert.scores.experienceTerrainPME >= 8
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : expert.scores.experienceTerrainPME >= 6
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {expert.scores.experienceTerrainPME.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="font-extrabold text-slate-900 text-sm">
                      {expert.scoreGlobal}
                      <span className="text-[10px] font-normal text-slate-400">/100</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    {getDecisionBadge(expert.decision)}
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectCandidate(expert)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-semibold rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Fiche
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

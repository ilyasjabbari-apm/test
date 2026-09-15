import React, { useState } from 'react';
import { ExpertCandidate, CriteriaScores, CriteriaWeights, DecisionStatus } from '../types';
import { RadarChart } from './RadarChart';
import { calculateCandidateScores } from '../utils/scoring';
import {
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  Bot,
  Lightbulb,
} from 'lucide-react';

interface ExpertDetailModalProps {
  candidate: ExpertCandidate | null;
  cohortAverage?: CriteriaScores;
  weights: CriteriaWeights;
  onClose: () => void;
  onUpdateCandidate: (updated: ExpertCandidate) => void;
}

export const ExpertDetailModal: React.FC<ExpertDetailModalProps> = ({
  candidate,
  cohortAverage,
  weights,
  onClose,
  onUpdateCandidate,
}) => {
  if (!candidate) return null;

  const [currentScores, setCurrentScores] = useState<CriteriaScores>({ ...candidate.scores });
  const [decision, setDecision] = useState<DecisionStatus>(candidate.decision);
  const [comments, setComments] = useState<string>(candidate.commentairesComite || '');
  const [isAiEvaluating, setIsAiEvaluating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Re-calculate scores live
  const calculated = calculateCandidateScores(currentScores, weights);

  const handleScoreChange = (key: keyof CriteriaScores, val: number) => {
    const updated = {
      ...currentScores,
      [key]: Math.min(10, Math.max(0, val)),
    };
    setCurrentScores(updated);
  };

  const handleSave = () => {
    const updated: ExpertCandidate = {
      ...candidate,
      scores: currentScores,
      scoreGlobal: calculated.scoreGlobal,
      scoreOffre: calculated.scoreOffre,
      scoreExpert: calculated.scoreExpert,
      decision,
      decisionManuelle: true,
      commentairesComite: comments,
    };
    onUpdateCandidate(updated);
    onClose();
  };

  // AI Evaluation call to backend Express with multi-model resilience
  const runAiEvaluation = async () => {
    setIsAiEvaluating(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const res = await fetch('/api/evaluate-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: `${candidate.prenom} ${candidate.nom}`,
          titreIntervention: candidate.titreIntervention,
          descriptifOffre: candidate.descriptifOffre,
          parcoursAcademique: candidate.parcoursAcademique,
          notorieteInfluence: candidate.notorieteInfluence,
          experienceTerrainPME: candidate.experienceTerrainPME,
          notesAdditionnelles: comments,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de l'évaluation par l'IA");
      }

      const evalData = data.evaluation;
      if (evalData.scores) {
        setCurrentScores({
          singulariteOffre: evalData.scores.singulariteOffre ?? currentScores.singulariteOffre,
          prioriteProspective: evalData.scores.prioriteProspective ?? currentScores.prioriteProspective,
          parcoursAcademique: evalData.scores.parcoursAcademique ?? currentScores.parcoursAcademique,
          legitimiteInfluence: evalData.scores.legitimiteInfluence ?? currentScores.legitimiteInfluence,
          experienceTerrainPME: evalData.scores.experienceTerrainPME ?? currentScores.experienceTerrainPME,
        });
      }

      if (evalData.decision) {
        if (evalData.decision === 'RETENU') setDecision('RETENU');
        else if (evalData.decision === 'AUDITION_COMITE' || evalData.decision === 'AUDITION') setDecision('AUDITION');
        else if (evalData.decision === 'A_RESERVE' || evalData.decision === 'RESERVE') setDecision('RESERVE');
        else if (evalData.decision === 'REFUSE') setDecision('REFUSE');
      }

      const updatedCandidate: ExpertCandidate = {
        ...candidate,
        scores: evalData.scores ? { ...currentScores, ...evalData.scores } : currentScores,
        justification: evalData.justificationDecision,
        pointsForts: evalData.pointsForts || candidate.pointsForts,
        pointsVigilance: evalData.pointsVigilance || candidate.pointsVigilance,
        commentairesComite: evalData.conseilPourClubAPM
          ? `${comments ? comments + '\n\n' : ''}[Recommandation IA APM] : ${evalData.conseilPourClubAPM}`
          : comments,
        evalueParIA: true,
      };

      setComments(updatedCandidate.commentairesComite || '');
      onUpdateCandidate(updatedCandidate);

      const sourceLabel =
        data.modelUsed?.includes('flash')
          ? `Analyse IA réussie (${data.modelUsed})`
          : "Analyse décisionnelle APM finalisée avec succès";
      setAiSuccessMessage(sourceLabel);
    } catch (err: any) {
      console.error(err);
      setAiError(
        err.message?.includes('503') || err.message?.includes('high demand')
          ? "Forte affluence temporaire sur les serveurs IA. Une nouvelle tentative a été préparée."
          : (err.message || "Impossible d'effectuer l'audit IA.")
      );
    } finally {
      setIsAiEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono font-semibold border border-slate-700">
                {candidate.id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {candidate.theme || 'Thématique Générale'}
              </span>
              {candidate.evalueParIA && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> Audit IA APM
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">
              {candidate.prenom} {candidate.nom}
            </h2>
            <p className="text-xs text-amber-300/90 font-medium mt-0.5 line-clamp-1">
              « {candidate.titreIntervention} »
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Score Global
              </div>
              <div className="text-2xl font-black text-amber-400">
                {calculated.scoreGlobal}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs sm:text-sm">
          {/* AI Banner Callout */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-sm">
                  Audit IA de Décision APM (Gemini Multi-Modèles & Secours)
                </h4>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  Analyse automatisée avec bascule résiliente contre les saturations réseau. Évalue la singularité et l'ancrage terrain PME.
                </p>
              </div>
            </div>

            <button
              onClick={runAiEvaluation}
              disabled={isAiEvaluating}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isAiEvaluating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  Lancer l'audit IA
                </>
              )}
            </button>
          </div>

          {aiSuccessMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {aiSuccessMessage}
              </span>
              <button
                onClick={() => setAiSuccessMessage(null)}
                className="text-slate-400 hover:text-slate-700 text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {aiError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aiError}</span>
              </div>
              <button
                onClick={runAiEvaluation}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shrink-0"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Grid: Left Column (Dossier & Criteria) | Right Column (Radar & Decision) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Dossier info & live sliders (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Descriptif Offre */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                  <Lightbulb className="w-4 h-4 text-sky-600" />
                  Descriptif de l'Offre & Pitch de l'Expertise
                </div>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {candidate.descriptifOffre}
                </p>
              </div>

              {/* Profil Expert Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Parcours & Recherche
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-snug">
                    {candidate.parcoursAcademique}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Share2 className="w-3.5 h-3.5 text-purple-600" />
                    Influence & Notoriété
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-snug">
                    {candidate.notorieteInfluence}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                    Terrain & Monde PME
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-snug">
                    {candidate.experienceTerrainPME}
                  </p>
                </div>
              </div>

              {/* Notation Grid interactive sliders */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    Grille de Notation APM (Ajustable en direct)
                  </h4>
                  <span className="text-xs text-slate-500">Notes de 0 à 10</span>
                </div>

                {/* Critères Offre */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                    Critères propres à l'offre :
                  </div>

                  {/* Singularité */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">1. Singularité dans l’offre</span>
                      <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {currentScores.singulariteOffre.toFixed(1)} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={currentScores.singulariteOffre}
                      onChange={(e) => handleScoreChange('singulariteOffre', parseFloat(e.target.value))}
                      className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Prospective */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">2. Priorité dans l’offre prospective</span>
                      <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {currentScores.prioriteProspective.toFixed(1)} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={currentScores.prioriteProspective}
                      onChange={(e) => handleScoreChange('prioriteProspective', parseFloat(e.target.value))}
                      className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Critères Expert */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Critères propres à l'expert :
                  </div>

                  {/* Parcours Académique */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">3. Parcours académique / Recherche</span>
                      <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {currentScores.parcoursAcademique.toFixed(1)} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={currentScores.parcoursAcademique}
                      onChange={(e) => handleScoreChange('parcoursAcademique', parseFloat(e.target.value))}
                      className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Légitimité / Influence */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">4. Légitimité / Influence médiatique</span>
                      <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {currentScores.legitimiteInfluence.toFixed(1)} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={currentScores.legitimiteInfluence}
                      onChange={(e) => handleScoreChange('legitimiteInfluence', parseFloat(e.target.value))}
                      className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Expérience Terrain PME */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">5. Terrain & Connaissance monde PME</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {currentScores.experienceTerrainPME.toFixed(1)} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={currentScores.experienceTerrainPME}
                      onChange={(e) => handleScoreChange('experienceTerrainPME', parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Radar, Diagnostic & Decision Selector (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Radar Chart */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Radar d'Évaluation Multicritère
                </span>
                <RadarChart scores={currentScores} averageScores={cohortAverage} size={250} />

                {/* Sub-scores summary pills */}
                <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-900">
                    <div className="text-[10px] uppercase font-semibold text-sky-700">Sous-Score Offre</div>
                    <div className="text-base font-extrabold">{calculated.scoreOffre}/10</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-900">
                    <div className="text-[10px] uppercase font-semibold text-amber-700">Sous-Score Expert</div>
                    <div className="text-base font-extrabold">{calculated.scoreExpert}/10</div>
                  </div>
                </div>
              </div>

              {/* Points Forts & Vigilance */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Points Forts APM
                  </h5>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    {(candidate.pointsForts || ['Expertise pertinente pour les clubs']).map((pf, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{pf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Points de Vigilance
                  </h5>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    {(calculated.alerts.length > 0
                      ? calculated.alerts
                      : candidate.pointsVigilance || ['À évaluer en situation']
                    ).map((pv, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-amber-900">
                        <span className="text-amber-600 font-bold">!</span>
                        <span>{pv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Decision Selector & Committee Notes */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Décision Finale APM :
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Algorithme : <strong className="text-slate-700">{calculated.recommendedDecision}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDecision('RETENU')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      decision === 'RETENU'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Retenu
                  </button>

                  <button
                    onClick={() => setDecision('AUDITION')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      decision === 'AUDITION'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Audition
                  </button>

                  <button
                    onClick={() => setDecision('RESERVE')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      decision === 'RESERVE'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> En Réserve
                  </button>

                  <button
                    onClick={() => setDecision('REFUSE')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      decision === 'REFUSE'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Non Retenu
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Avis & Commentaires du Comité de Sélection :
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Synthèse des échanges en commission de sélection APM..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Fermer sans enregistrer
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
};

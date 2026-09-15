import React, { useState, useMemo } from 'react';
import { ExpertCandidate, CriteriaWeights, CriteriaScores, DecisionStatus } from './types';
import { INITIAL_EXPERTS } from './data/sampleExperts';
import { DEFAULT_WEIGHTS, calculateCandidateScores } from './utils/scoring';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { ExcelImportExport } from './components/ExcelImportExport';
import { DecisionMatrix } from './components/DecisionMatrix';
import { ExpertTable } from './components/ExpertTable';
import { ExpertDetailModal } from './components/ExpertDetailModal';
import { EvaluationGridSettings } from './components/EvaluationGridSettings';
import { CriteriaGuideModal } from './components/CriteriaGuideModal';
import { Grid, Table, BarChart3, Layers, Compass, Sparkles } from 'lucide-react';

export default function App() {
  const [candidates, setCandidates] = useState<ExpertCandidate[]>(INITIAL_EXPERTS);
  const [weights, setWeights] = useState<CriteriaWeights>(DEFAULT_WEIGHTS);
  const [selectedCandidate, setSelectedCandidate] = useState<ExpertCandidate | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeView, setActiveView] = useState<'matrix' | 'table'>('matrix');

  // Recalculate candidates whenever weights change
  const handleWeightsChange = (newWeights: CriteriaWeights) => {
    setWeights(newWeights);
    setCandidates((prev) =>
      prev.map((c) => {
        const calc = calculateCandidateScores(c.scores, newWeights);
        return {
          ...c,
          scoreGlobal: calc.scoreGlobal,
          scoreOffre: calc.scoreOffre,
          scoreExpert: calc.scoreExpert,
          // Preserve manual decision if user explicitly set it, else update recommended
          decision: c.decisionManuelle ? c.decision : calc.recommendedDecision,
        };
      })
    );
  };

  // Cohort average criteria scores for the radar benchmark
  const cohortAverage: CriteriaScores = useMemo(() => {
    if (candidates.length === 0) {
      return {
        singulariteOffre: 6,
        prioriteProspective: 6,
        parcoursAcademique: 6,
        legitimiteInfluence: 6,
        experienceTerrainPME: 6,
      };
    }

    const sum = candidates.reduce(
      (acc, c) => ({
        singulariteOffre: acc.singulariteOffre + c.scores.singulariteOffre,
        prioriteProspective: acc.prioriteProspective + c.scores.prioriteProspective,
        parcoursAcademique: acc.parcoursAcademique + c.scores.parcoursAcademique,
        legitimiteInfluence: acc.legitimiteInfluence + c.scores.legitimiteInfluence,
        experienceTerrainPME: acc.experienceTerrainPME + c.scores.experienceTerrainPME,
      }),
      {
        singulariteOffre: 0,
        prioriteProspective: 0,
        parcoursAcademique: 0,
        legitimiteInfluence: 0,
        experienceTerrainPME: 0,
      }
    );

    const count = candidates.length;
    return {
      singulariteOffre: Number((sum.singulariteOffre / count).toFixed(1)),
      prioriteProspective: Number((sum.prioriteProspective / count).toFixed(1)),
      parcoursAcademique: Number((sum.parcoursAcademique / count).toFixed(1)),
      legitimiteInfluence: Number((sum.legitimiteInfluence / count).toFixed(1)),
      experienceTerrainPME: Number((sum.experienceTerrainPME / count).toFixed(1)),
    };
  }, [candidates]);

  // Candidate update handler (from modal or table)
  const handleUpdateCandidate = (updated: ExpertCandidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedCandidate && selectedCandidate.id === updated.id) {
      setSelectedCandidate(updated);
    }
  };

  // Quick status update from table
  const handleUpdateStatus = (id: string, newStatus: DecisionStatus) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, decision: newStatus, decisionManuelle: true } : c
      )
    );
  };

  // Import success from Excel file
  const handleImportSuccess = (imported: ExpertCandidate[]) => {
    // Re-score imported candidates with current weights
    const scored = imported.map((c) => {
      const calc = calculateCandidateScores(c.scores, weights);
      return {
        ...c,
        scoreGlobal: calc.scoreGlobal,
        scoreOffre: calc.scoreOffre,
        scoreExpert: calc.scoreExpert,
        decision: calc.recommendedDecision,
      };
    });
    setCandidates(scored);
  };

  // Reset to initial cohort
  const handleResetCohort = () => {
    setCandidates(INITIAL_EXPERTS);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Excel Import / Export Toolbar */}
        <ExcelImportExport
          candidates={candidates}
          onImportSuccess={handleImportSuccess}
          onResetCohort={handleResetCohort}
        />

        {/* Executive Stats Banner */}
        <StatsBanner candidates={candidates} />

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('matrix')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeView === 'matrix'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Grid className="w-4 h-4" />
              Matrice Décisionnelle Stratégique
            </button>

            <button
              onClick={() => setActiveView('table')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeView === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Table className="w-4 h-4" />
              Classement & Liste Détaillée ({candidates.length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span>Pondération active :</span>
            <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Singularité 25% | Prospective 25% | PME 25%
            </span>
          </div>
        </div>

        {/* Views */}
        {activeView === 'matrix' ? (
          <div className="space-y-6">
            <DecisionMatrix
              candidates={candidates}
              onSelectCandidate={(c) => setSelectedCandidate(c)}
              selectedCandidateId={selectedCandidate?.id}
            />

            {/* Quick table below matrix */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Synthèse Rapide des Candidats
                </h3>
                <span className="text-xs text-slate-500">
                  Cliquez sur un expert pour ouvrir son dossier d'arbitrage
                </span>
              </div>
              <ExpertTable
                candidates={candidates}
                onSelectCandidate={(c) => setSelectedCandidate(c)}
                onUpdateStatus={handleUpdateStatus}
              />
            </div>
          </div>
        ) : (
          <ExpertTable
            candidates={candidates}
            onSelectCandidate={(c) => setSelectedCandidate(c)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>
          Outil d'aide à la décision pour le Comité de Sélection des Experts APM • Conforme à la grille
          d'évaluation : Singularité de l'offre, Priorité prospective, Parcours académique, Notoriété & Ancrage terrain PME.
        </p>
      </footer>

      {/* Modals */}
      {selectedCandidate && (
        <ExpertDetailModal
          candidate={selectedCandidate}
          cohortAverage={cohortAverage}
          weights={weights}
          onClose={() => setSelectedCandidate(null)}
          onUpdateCandidate={handleUpdateCandidate}
        />
      )}

      <EvaluationGridSettings
        weights={weights}
        onWeightsChange={handleWeightsChange}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <CriteriaGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}

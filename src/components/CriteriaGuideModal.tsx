import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Target, Award, Users, Compass } from 'lucide-react';

interface CriteriaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CriteriaGuideModal: React.FC<CriteriaGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-sans">
                Guide Officiel d'Évaluation des Experts APM
              </h3>
              <p className="text-xs text-slate-500">
                Les 5 critères fondamentaux d'arbitrage pour le comité de sélection
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

        <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1: Offre */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sky-900 font-bold uppercase tracking-wider text-xs bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
              <ShieldCheck className="w-4 h-4 text-sky-700" />
              1. Critères propres à l’offre
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/30 space-y-1.5">
                <h4 className="font-bold text-sky-950 text-sm">
                  • Singularité dans l’offre
                </h4>
                <p className="text-xs text-slate-600">
                  L’intervention doit apporter un regard neuf, non conventionnel et marquant. Elle rompt avec le « déjà-vu » des conférences d’entreprise standards.
                </p>
                <div className="text-[11px] font-medium text-sky-800 pt-1">
                  <strong>Indicateur clé :</strong> Apport méthodologique ou angle inédit, pas de réchauffé managérial.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/30 space-y-1.5">
                <h4 className="font-bold text-sky-950 text-sm">
                  • Priorité dans l’offre prospective
                </h4>
                <p className="text-xs text-slate-600">
                  L’offre éclaire les transformations critiques à 5-10 ans : ruptures technologiques (IA, quantique), mutations géopolitiques, transition écologique, nouveaux modèles de valeur.
                </p>
                <div className="text-[11px] font-medium text-sky-800 pt-1">
                  <strong>Indicateur clé :</strong> Anticipe les décisions stratégiques vitales pour les dirigeants de demain.
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Expert */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold uppercase tracking-wider text-xs bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <Award className="w-4 h-4 text-amber-700" />
              2. Critères propres à l’expert
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 space-y-1.5">
                <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                  • Parcours académique & Recherche
                </h4>
                <p className="text-xs text-slate-600">
                  Niveau d’études supérieures (Doctorat, Grandes Écoles, Master), rigueur d’analyse et publications reconnues par la communauté des pairs.
                </p>
                <div className="text-[11px] font-medium text-amber-800 pt-1">
                  <strong>Attendu :</strong> Solidité conceptuelle sans dérive jargonneuse.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 space-y-1.5">
                <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                  • Légitimité & Influence médiatique
                </h4>
                <p className="text-xs text-slate-600">
                  Notoriété publique, auteur d’ouvrages de référence, prises de parole médiatiques remarquées, autorité intellectuelle installée.
                </p>
                <div className="text-[11px] font-medium text-amber-800 pt-1">
                  <strong>Attendu :</strong> Crédibilité immédiate et capacité d'entraînement.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                <h4 className="font-bold text-emerald-950 text-xs sm:text-sm">
                  • Terrain & Monde PME (Critère Majeur)
                </h4>
                <p className="text-xs text-slate-600">
                  Expérience opérationnelle vécue, immersion en entreprise, compréhension intime des défis des patrons de PME (trésorerie, RH, gouvernance).
                </p>
                <div className="text-[11px] font-medium text-emerald-800 pt-1">
                  <strong>Règle APM :</strong> Posture d’écoute et d’échange pragmatique d'égal à égal.
                </div>
              </div>
            </div>
          </div>

          {/* Règle décisionnelle APM */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
            <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Les 4 Statuts de Décision de la Commission
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 pt-1">
              <div>
                <strong className="text-emerald-400">1. Retenu au Catalogue :</strong> Score &gt; 72%, forte singularité ET expérience terrain PME irréprochable.
              </div>
              <div>
                <strong className="text-amber-400">2. Audition / Grand Oral :</strong> Profil intéressant mais posture club ou dimension prospective à valider.
              </div>
              <div>
                <strong className="text-indigo-400">3. En Réserve Prospective :</strong> Sujet d'anticipation ou profil prometteur à faire mûrir.
              </div>
              <div>
                <strong className="text-slate-400">4. Non Retenu :</strong> Manque de relief de l'offre ou déconnexion avec les dirigeants de PME.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};

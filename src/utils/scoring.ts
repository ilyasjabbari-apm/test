import { CriteriaScores, CriteriaWeights, DecisionStatus, PresetProfile } from '../types';

export const DEFAULT_WEIGHTS: CriteriaWeights = {
  singulariteOffre: 25,
  prioriteProspective: 25,
  parcoursAcademique: 15,
  legitimiteInfluence: 10,
  experienceTerrainPME: 25,
};

export const PRESET_PROFILES: PresetProfile[] = [
  {
    id: 'apm-equilibre',
    name: 'Standard APM Équilibré',
    description: 'Pondération historique valorisant autant la singularité prospective de l’offre que l’ancrage terrain PME.',
    weights: {
      singulariteOffre: 25,
      prioriteProspective: 25,
      parcoursAcademique: 15,
      legitimiteInfluence: 10,
      experienceTerrainPME: 25,
    },
  },
  {
    id: 'apm-prospective',
    name: 'Priorité Ruptures & Prospective',
    description: 'Accent renforcé sur les thèmes d’anticipation stratégique, de prospective et d’originalité radicale.',
    weights: {
      singulariteOffre: 30,
      prioriteProspective: 35,
      parcoursAcademique: 10,
      legitimiteInfluence: 10,
      experienceTerrainPME: 15,
    },
  },
  {
    id: 'apm-pragmatisme-pme',
    name: 'Focus Ancrage & Pratique Dirigeant PME',
    description: 'Exigence maximale sur le vécu d’entreprise, la posture humble et la compréhension des enjeux de dirigeants.',
    weights: {
      singulariteOffre: 20,
      prioriteProspective: 15,
      parcoursAcademique: 10,
      legitimiteInfluence: 15,
      experienceTerrainPME: 40,
    },
  },
  {
    id: 'apm-academique-notoriete',
    name: 'Grandes Signatures & Recherche',
    description: 'Recherche d’intervenants de référence avec publications reconnues et forte visibilité médiatique.',
    weights: {
      singulariteOffre: 20,
      prioriteProspective: 20,
      parcoursAcademique: 30,
      legitimiteInfluence: 20,
      experienceTerrainPME: 10,
    },
  },
];

export function calculateCandidateScores(
  scores: CriteriaScores,
  weights: CriteriaWeights = DEFAULT_WEIGHTS
): {
  scoreGlobal: number;
  scoreOffre: number;
  scoreExpert: number;
  recommendedDecision: DecisionStatus;
  alerts: string[];
} {
  const totalWeight =
    weights.singulariteOffre +
    weights.prioriteProspective +
    weights.parcoursAcademique +
    weights.legitimiteInfluence +
    weights.experienceTerrainPME;

  const normalized = totalWeight > 0 ? totalWeight : 100;

  // Calcul score Global sur 100
  const rawGlobal =
    scores.singulariteOffre * weights.singulariteOffre +
    scores.prioriteProspective * weights.prioriteProspective +
    scores.parcoursAcademique * weights.parcoursAcademique +
    scores.legitimiteInfluence * weights.legitimiteInfluence +
    scores.experienceTerrainPME * weights.experienceTerrainPME;

  const scoreGlobal = Math.round((rawGlobal / normalized) * 10); // ramené sur 100 (notes sur 10 * 10)

  // Sous-score Offre (ramené sur 10)
  const weightOffre = weights.singulariteOffre + weights.prioriteProspective;
  const scoreOffre =
    weightOffre > 0
      ? Number(
          (
            (scores.singulariteOffre * weights.singulariteOffre +
              scores.prioriteProspective * weights.prioriteProspective) /
            weightOffre
          ).toFixed(1)
        )
      : Number(((scores.singulariteOffre + scores.prioriteProspective) / 2).toFixed(1));

  // Sous-score Expert (ramené sur 10)
  const weightExpert =
    weights.parcoursAcademique + weights.legitimiteInfluence + weights.experienceTerrainPME;
  const scoreExpert =
    weightExpert > 0
      ? Number(
          (
            (scores.parcoursAcademique * weights.parcoursAcademique +
              scores.legitimiteInfluence * weights.legitimiteInfluence +
              scores.experienceTerrainPME * weights.experienceTerrainPME) /
            weightExpert
          ).toFixed(1)
        )
      : Number(
          (
            (scores.parcoursAcademique +
              scores.legitimiteInfluence +
              scores.experienceTerrainPME) /
            3
          ).toFixed(1)
        );

  // Alertes de cohérence APM
  const alerts: string[] = [];
  if (scores.experienceTerrainPME < 4.5) {
    alerts.push('Vigilance PME : Ancrage terrain jugé insuffisant pour les adhérents APM.');
  }
  if (scores.singulariteOffre < 5) {
    alerts.push('Offre banalisée : Sujet ou approche déjà largement représentés en club.');
  }
  if (scores.prioriteProspective >= 8.5 && scores.experienceTerrainPME < 5) {
    alerts.push('Sujet hautement prospectif mais expert à tester en conditions réelles PME.');
  }

  // Détermination de la recommandation de décision
  let recommendedDecision: DecisionStatus = 'REFUSE';

  if (scoreGlobal >= 72 && scores.experienceTerrainPME >= 5.5 && scores.singulariteOffre >= 6) {
    recommendedDecision = 'RETENU';
  } else if (scoreGlobal >= 60 && scores.experienceTerrainPME >= 4.5) {
    recommendedDecision = 'AUDITION';
  } else if (scores.prioriteProspective >= 7.5 || scoreGlobal >= 50) {
    recommendedDecision = 'RESERVE';
  } else {
    recommendedDecision = 'REFUSE';
  }

  return {
    scoreGlobal,
    scoreOffre,
    scoreExpert,
    recommendedDecision,
    alerts,
  };
}

export const CRITERIA_METADATA = [
  {
    key: 'singulariteOffre' as const,
    category: 'Critères propres à l’offre',
    label: 'Singularité dans l’offre',
    shortLabel: 'Singularité Offre',
    description: 'Originalité, différenciation de l’approche, rupture avec les poncifs.',
    benchmark: 'Angle unique, apport méthodologique inédit pour un dirigeant.',
  },
  {
    key: 'prioriteProspective' as const,
    category: 'Critères propres à l’offre',
    label: 'Priorité dans l’offre prospective',
    shortLabel: 'Priorité Prospective',
    description: 'Anticipation des ruptures stratégiques, technologiques, managériales et écologiques à 5-10 ans.',
    benchmark: 'Répond aux défis de transition et de vision stratégique des PME.',
  },
  {
    key: 'parcoursAcademique' as const,
    category: 'Critères propres à l’expert',
    label: 'Parcours académique / niveau d’étude / Recherche',
    shortLabel: 'Parcours & Recherche',
    description: 'Niveau d’études supérieures (Grandes écoles, Doctorat), publications et rigueur intellectuelle.',
    benchmark: 'Bases théoriques solides et capacité de conceptualisation prouvée.',
  },
  {
    key: 'legitimiteInfluence' as const,
    category: 'Critères propres à l’expert',
    label: 'Légitimité / influence : Connu, légitimité médiatique',
    shortLabel: 'Influence & Médias',
    description: 'Notoriété publique, ouvrages de référence, visibilité médiatique, reconnaissance par ses pairs.',
    benchmark: 'Crédibilité immédiate auprès d’un public de dirigeants exigeants.',
  },
  {
    key: 'experienceTerrainPME' as const,
    category: 'Critères propres à l’expert',
    label: 'Expérience opérationnelle / terrain + Connaissance monde PME',
    shortLabel: 'Terrain & Monde PME',
    description: 'Pratique concrète, ancrage terrain, capacité à échanger au même niveau que les patrons de PME.',
    benchmark: 'Compréhension viscérale de la vie de PME (trésorerie, équipes, gouvernance).',
  },
];

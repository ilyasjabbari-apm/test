export type DecisionStatus = 'RETENU' | 'AUDITION' | 'RESERVE' | 'REFUSE' | 'A_TRAITER';

export interface CriteriaScores {
  // Critères propres à l'offre
  singulariteOffre: number; // 0-10
  prioriteProspective: number; // 0-10

  // Critères propres à l'expert
  parcoursAcademique: number; // 0-10
  legitimiteInfluence: number; // 0-10
  experienceTerrainPME: number; // 0-10
}

export interface CriteriaWeights {
  singulariteOffre: number; // e.g. 25%
  prioriteProspective: number; // e.g. 25%
  parcoursAcademique: number; // e.g. 15%
  legitimiteInfluence: number; // e.g. 10%
  experienceTerrainPME: number; // e.g. 25%
}

export interface ExpertCandidate {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  titreIntervention: string;
  theme?: string;
  descriptifOffre: string;
  parcoursAcademique: string;
  notorieteInfluence: string;
  experienceTerrainPME: string;
  lienProfil?: string;

  // Scores calculés ou évalués
  scores: CriteriaScores;
  scoreGlobal: number; // 0-100
  scoreOffre: number; // 0-10
  scoreExpert: number; // 0-10
  decision: DecisionStatus;
  decisionManuelle?: boolean;

  // Feedback & comité
  justification?: string;
  pointsForts?: string[];
  pointsVigilance?: string[];
  commentairesComite?: string;
  evalueParIA?: boolean;
  dateCandidature?: string;
}

export interface PresetProfile {
  id: string;
  name: string;
  description: string;
  weights: CriteriaWeights;
}

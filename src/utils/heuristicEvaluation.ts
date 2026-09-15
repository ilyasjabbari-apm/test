import { CriteriaScores, DecisionStatus } from '../types';

export interface HeuristicInput {
  nom?: string;
  titreIntervention?: string;
  descriptifOffre?: string;
  parcoursAcademique?: string;
  notorieteInfluence?: string;
  experienceTerrainPME?: string;
  notesAdditionnelles?: string;
}

export interface HeuristicResult {
  scores: CriteriaScores;
  decision: string;
  justificationDecision: string;
  pointsForts: string[];
  pointsVigilance: string[];
  conseilPourClubAPM: string;
  mode: string;
}

// Rule-based evaluator used as offline fallback (no Gemini key) and as the
// instant pre-scoring pass applied to freshly imported candidatures.
export function heuristicEvaluateExpert(data: HeuristicInput): HeuristicResult {
  const fullText = `${data.titreIntervention || ''} ${data.descriptifOffre || ''} ${
    data.parcoursAcademique || ''
  } ${data.notorieteInfluence || ''} ${data.experienceTerrainPME || ''} ${
    data.notesAdditionnelles || ''
  }`.toLowerCase();

  // 1. Singularité de l'offre
  let sing = 6.5;
  if (/disruptif|inédit|unique|brevet|rupture|inclassable|méthode originale|singularité|atypique/.test(fullText)) sing += 2.0;
  if (/classique|générique|conférence standard|déjà-vu|traditionnel|banal/.test(fullText)) sing -= 1.5;

  // 2. Priorité prospective
  let prosp = 6.0;
  if (/futur|prospective|2030|2035|ia|intelligence artificielle|climat|transition|rupture|quantique|mutation|demain|décarbonation/.test(fullText)) prosp += 2.5;
  if (/passé|historique|théorie pure/.test(fullText)) prosp -= 1.0;

  // 3. Parcours académique & Recherche
  let acad = 6.0;
  if (/doctorat|thèse|chercheur|cnrs|polytechnique|ens|hec|essec|professeur|publication|inria/.test(fullText)) acad += 2.5;
  else if (/master|ingénieur|sciences po|grande école/.test(fullText)) acad += 1.0;

  // 4. Légitimité & Influence
  let leg = 5.5;
  if (/auteur|livre|best-seller|chroniqueur|tedx|médias|tribune|notoriété|conférencier reconnu/.test(fullText)) leg += 2.5;

  // 5. Expérience terrain PME (Critère pivot APM)
  let pme = 6.0;
  if (/pme|eti|dirigeant|patron|entrepreneur|fondateur|opérationnel|atelier|usine|chantier|terrain|concrèt/.test(fullText)) pme += 2.5;
  if (/uniquement grand groupe|théorie seule|cabinet parisien|déconnecté/.test(fullText)) pme -= 2.0;

  sing = Math.min(9.5, Math.max(3.0, Math.round(sing * 10) / 10));
  prosp = Math.min(9.5, Math.max(3.0, Math.round(prosp * 10) / 10));
  acad = Math.min(9.5, Math.max(3.0, Math.round(acad * 10) / 10));
  leg = Math.min(9.5, Math.max(3.0, Math.round(leg * 10) / 10));
  pme = Math.min(9.5, Math.max(3.0, Math.round(pme * 10) / 10));

  const avg = sing * 0.25 + prosp * 0.25 + pme * 0.25 + acad * 0.15 + leg * 0.1;
  let decision: DecisionStatus | string = 'AUDITION_COMITE';
  if (avg >= 7.5 && pme >= 7.0) decision = 'RETENU';
  else if (avg < 5.5 || pme < 5.0) decision = 'REFUSE';
  else if (prosp >= 7.5 && pme < 6.0) decision = 'A_RESERVE';

  return {
    scores: {
      singulariteOffre: sing,
      prioriteProspective: prosp,
      parcoursAcademique: acad,
      legitimiteInfluence: leg,
      experienceTerrainPME: pme,
    },
    decision,
    justificationDecision: `Analyse APM : Dossier évalué à ${(avg * 10).toFixed(0)}/100. Présente un ancrage terrain PME de ${pme}/10 et un potentiel prospectif de ${prosp}/10, compatible avec les attentes des dirigeants.`,
    pointsForts: [
      pme >= 7 ? 'Forte sensibilité aux problématiques opérationnelles et de gouvernance PME' : 'Expertise thématique avérée',
      prosp >= 7 ? "Éclairage anticipateur sur les mutations technologiques ou stratégiques" : 'Clarté didactique des concepts présentés',
      sing >= 7 ? "Angle d'attaque original se démarquant des séminaires conventionnels" : 'Méthodologie opérationnelle structurée',
    ],
    pointsVigilance: [
      pme < 6.5 ? "Valider en grand oral la posture d'échange horizontal face à des patrons de PME" : "Veiller à l'applicabilité immédiate des préconisations",
      sing < 6.5 ? 'Challenger la singularité de l’offre pour éviter toute redondance avec le catalogue existant' : "Rythmer la journée d'animation pour alterner apports et ateliers pratiques",
    ],
    conseilPourClubAPM: 'Prévoir un format très participatif avec des cas d’entreprises réels des adhérents pour ancrer l’expertise dans leur quotidien.',
    mode: 'HEURISTIC_BACKUP',
  };
}

// Maps the AI/heuristic decision vocabulary onto the app's DecisionStatus enum.
export function mapHeuristicDecision(decision: string): DecisionStatus {
  switch (decision) {
    case 'RETENU':
      return 'RETENU';
    case 'AUDITION_COMITE':
    case 'AUDITION':
      return 'AUDITION';
    case 'A_RESERVE':
    case 'RESERVE':
      return 'RESERVE';
    case 'REFUSE':
      return 'REFUSE';
    default:
      return 'A_TRAITER';
  }
}

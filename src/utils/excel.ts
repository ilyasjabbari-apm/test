import * as XLSX from 'xlsx';
import { ExpertCandidate } from '../types';
import { calculateCandidateScores, DEFAULT_WEIGHTS } from './scoring';
import { heuristicEvaluateExpert, mapHeuristicDecision } from './heuristicEvaluation';

// The real-world APM export (one tab per mois de candidature) does not have
// reliable column headers: labels are sometimes missing, and two different
// form-export formats are even mixed within the same tab (an older manual
// layout "Nom, Prénom, ..." and a newer Hubspot layout "ID, Prénom, Nom,
// ..."). Instead of matching header names, each cell is recognized by what
// it looks like (an email, a phone number, a date, a free-text field...).

function isEmail(v: unknown): boolean {
  return typeof v === 'string' && /\S+@\S+\.\S+/.test(v);
}

function isDateLike(v: unknown): boolean {
  if (v instanceof Date) return true;
  return typeof v === 'string' && /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v.trim());
}

function isPhoneLike(v: unknown): boolean {
  if (typeof v !== 'string' && typeof v !== 'number') return false;
  const s = String(v).trim().replace(/[\s.\-()]/g, '');
  return /^\+?\d{7,15}$/.test(s);
}

function isIdLike(v: unknown): boolean {
  // Long pure-digit record identifiers (Hubspot export), as opposed to a
  // human-dialable phone number.
  return typeof v === 'string' && /^\d{10,}$/.test(v.trim());
}

function isCiviliteLike(v: unknown): boolean {
  return typeof v === 'string' && /^(m|mme|mr|mrs|monsieur|madame)\.?$/i.test(v.trim());
}

function isCountryCodeLike(v: unknown): boolean {
  return typeof v === 'string' && /^[A-Z]{2,3}$/.test(v.trim());
}

function isTagLike(v: unknown): boolean {
  return (
    typeof v === 'string' &&
    /^(en attente|candidat( en attente)?|expert|membre|valid[ée]?|refus[ée]?|accept[ée]?)$/i.test(v.trim())
  );
}

function isDecisionHint(v: unknown): boolean {
  return typeof v === 'string' && /^(go|no go|pas de besoin|vivier|-)\s*$/i.test(v.trim());
}

function isUrlLike(v: unknown): boolean {
  return typeof v === 'string' && /^https?:\/\//i.test(v.trim());
}

function looksLikeName(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (s.length < 2 || s.length > 60) return false;
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(s)) return false;
  if (
    isEmail(s) ||
    isDateLike(s) ||
    isCiviliteLike(s) ||
    isCountryCodeLike(s) ||
    isTagLike(s) ||
    isDecisionHint(s) ||
    isIdLike(s)
  ) {
    return false;
  }
  return true;
}

function formatDateValue(v: unknown): string {
  if (v instanceof Date) return v.toISOString().split('T')[0];
  return String(v).trim();
}

interface ExtractedRow {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  titre: string;
  bio: string;
  dateStr: string;
  decisionHint: string;
}

const MAX_BIO_LENGTH = 3000;

function extractCandidateRow(cells: unknown[]): ExtractedRow | null {
  let nom = '';
  let prenom = '';
  let startIdx = 0;

  if (isIdLike(cells[0]) && looksLikeName(cells[1]) && looksLikeName(cells[2])) {
    // Newer export layout: ID de fiche, Prénom, Nom, ...
    prenom = (cells[1] as string).trim();
    nom = (cells[2] as string).trim();
    startIdx = 3;
  } else if (looksLikeName(cells[0]) && looksLikeName(cells[1])) {
    // Older export layout: Nom, Prénom, ...
    nom = (cells[0] as string).trim();
    prenom = (cells[1] as string).trim();
    startIdx = 2;
  } else {
    return null;
  }

  let email = '';
  let telephone = '';
  let dateStr = '';
  let decisionHint = '';
  const textFields: string[] = [];

  for (let i = startIdx; i < cells.length; i++) {
    const v = cells[i];
    if (v === null || v === undefined || v === '') continue;

    if (!email && isEmail(v)) {
      email = String(v).trim();
      continue;
    }
    if (!dateStr && isDateLike(v)) {
      dateStr = formatDateValue(v);
      continue;
    }
    if (!telephone && isPhoneLike(v)) {
      telephone = String(v).trim();
      continue;
    }
    if (isCiviliteLike(v) || isCountryCodeLike(v) || isTagLike(v) || isUrlLike(v)) {
      continue; // metadata / CV link, not useful for scoring or display
    }
    if (!decisionHint && isDecisionHint(v)) {
      decisionHint = String(v).trim().toLowerCase();
      continue;
    }

    const s = String(v).trim();
    if (s) textFields.push(s);
  }

  const bio = textFields.join(' ').slice(0, MAX_BIO_LENGTH);
  const titre = textFields[0] ? textFields[0].slice(0, 90) : '';

  return { nom, prenom, email, telephone, titre, bio, dateStr, decisionHint };
}

export async function parseExcelFile(file: File): Promise<ExpertCandidate[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });

  if (workbook.SheetNames.length === 0) {
    throw new Error('Le fichier Excel ne contient aucune feuille de calcul.');
  }

  const parsedCandidates: ExpertCandidate[] = [];
  let counter = 0;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: null, raw: true });

    for (const cells of rows) {
      if (!Array.isArray(cells) || cells.every((c) => c === null || c === '')) continue;

      const extracted = extractCandidateRow(cells);
      if (!extracted) continue;

      // Require both a real bio/expertise text AND a structural signal
      // (email, phone or date) to reject header rows and plain mailing
      // lists that carry a name but no actual candidature content.
      const hasStructuralSignal = Boolean(extracted.email || extracted.telephone || extracted.dateStr);
      if (extracted.bio.length < 10 || !hasStructuralSignal) continue;

      counter += 1;
      const heuristic = heuristicEvaluateExpert({
        nom: `${extracted.prenom} ${extracted.nom}`,
        titreIntervention: extracted.titre,
        descriptifOffre: extracted.bio,
      });

      const calc = calculateCandidateScores(heuristic.scores, DEFAULT_WEIGHTS);

      parsedCandidates.push({
        id: `EXP-${Date.now().toString().slice(-4)}-${counter}`,
        nom: extracted.nom,
        prenom: extracted.prenom,
        email: extracted.email,
        telephone: extracted.telephone,
        titreIntervention: extracted.titre || 'Expertise APM',
        theme: sheetName,
        descriptifOffre: extracted.bio,
        parcoursAcademique: "Non détaillé séparément dans le fichier — voir le descriptif de l'offre ci-dessus.",
        notorieteInfluence: "Non détaillé séparément dans le fichier — voir le descriptif de l'offre ci-dessus.",
        experienceTerrainPME: "Non détaillé séparément dans le fichier — voir le descriptif de l'offre ci-dessus.",
        scores: heuristic.scores,
        scoreGlobal: calc.scoreGlobal,
        scoreOffre: calc.scoreOffre,
        scoreExpert: calc.scoreExpert,
        decision: mapHeuristicDecision(heuristic.decision),
        decisionManuelle: false,
        justification: `${heuristic.justificationDecision} (Pré-évaluation automatique à partir du texte de candidature — à affiner via l'audit IA.)`,
        pointsForts: heuristic.pointsForts,
        pointsVigilance: heuristic.pointsVigilance,
        commentairesComite: extracted.decisionHint
          ? `Suivi initial APM (${sheetName}) : ${extracted.decisionHint}`
          : '',
        evalueParIA: false,
        dateCandidature: extracted.dateStr || new Date().toISOString().split('T')[0],
      });
    }
  }

  if (parsedCandidates.length === 0) {
    throw new Error(
      "Aucune candidature exploitable n'a été trouvée dans ce fichier (nom, prénom et description d'expertise requis)."
    );
  }

  return parsedCandidates;
}

export function exportExpertsToExcel(experts: ExpertCandidate[], filename = 'Selection_Experts_APM.xlsx') {
  const exportData = experts.map((e, idx) => ({
    'N°': idx + 1,
    'Identifiant': e.id,
    'Nom': e.nom,
    'Prénom': e.prenom,
    'Email': e.email || '',
    'Téléphone': e.telephone || '',
    'Titre de l’intervention': e.titreIntervention,
    'Thématique': e.theme || '',

    // Décision & Scores
    'Décision APM': e.decision,
    'Score Global (/100)': e.scoreGlobal,
    'Score Offre (/10)': e.scoreOffre,
    'Score Expert (/10)': e.scoreExpert,

    // Critères Offre
    '1. Singularité dans l’offre (/10)': e.scores.singulariteOffre,
    '2. Priorité prospective (/10)': e.scores.prioriteProspective,

    // Critères Expert
    '3. Parcours académique & Recherche (/10)': e.scores.parcoursAcademique,
    '4. Légitimité & Influence médiatique (/10)': e.scores.legitimiteInfluence,
    '5. Expérience terrain & Connaissance PME (/10)': e.scores.experienceTerrainPME,

    // Éléments qualitatifs
    'Synthèse de l’offre': e.descriptifOffre,
    'Parcours académique': e.parcoursAcademique,
    'Influence & Notoriété': e.notorieteInfluence,
    'Légitimité terrain PME': e.experienceTerrainPME,
    'Avis & Justification APM': e.justification || '',
    'Points Forts': (e.pointsForts || []).join(' | '),
    'Points de Vigilance': (e.pointsVigilance || []).join(' | '),
    'Commentaires du Comité': e.commentairesComite || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Column width hints
  worksheet['!cols'] = [
    { wch: 4 },  // N°
    { wch: 14 }, // ID
    { wch: 16 }, // Nom
    { wch: 14 }, // Prenom
    { wch: 22 }, // Email
    { wch: 14 }, // Tel
    { wch: 35 }, // Titre
    { wch: 20 }, // Thematique
    { wch: 16 }, // Decision
    { wch: 14 }, // Score Global
    { wch: 12 }, // Score Offre
    { wch: 12 }, // Score Expert
    { wch: 18 }, // Crit 1
    { wch: 18 }, // Crit 2
    { wch: 18 }, // Crit 3
    { wch: 18 }, // Crit 4
    { wch: 18 }, // Crit 5
    { wch: 40 }, // Descriptif
    { wch: 30 }, // Parcours
    { wch: 30 }, // Notoriete
    { wch: 30 }, // Terrain
    { wch: 35 }, // Avis
    { wch: 30 }, // Points forts
    { wch: 30 }, // Vigilance
    { wch: 30 }, // Comite
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidatures APM Évaluées');

  XLSX.writeFile(workbook, filename);
}

export function downloadApmExcelTemplate() {
  const templateRows = [
    {
      'Nom': 'Dupont',
      'Prénom': 'Claire',
      'Email': 'claire.dupont@exemple.fr',
      'Téléphone': '06 12 34 56 78',
      'Titre Intervention': 'Pivoter vers l’économie circulaire sans détruire ses marges en PME',
      'Thème': 'Stratégie & RSE',
      'Descriptif Offre': 'Atelier pratique de 3h avec retours d’expérience de 10 PME industrielles ayant réduit de 30% leur facture matière première.',
      'Parcours Académique': 'Ingénieure Mines Paris, Master Management de la Transition.',
      'Notoriété & Influence': 'Auteure de l’ouvrage « L’Usine Durable », conférencière TEDx, 15k abonnés LinkedIn.',
      'Expérience Terrain PME': '10 ans dirigeante associée d’une PME de 45 salariés dans la métallurgie.',
      'Singularité Offre (/10)': 8.5,
      'Priorité Prospective (/10)': 8.0,
      'Parcours Académique (/10)': 7.5,
      'Légitimité & Influence (/10)': 7.0,
      'Expérience Terrain PME (/10)': 9.0,
      'Commentaires': 'Candidature spontanée via recommandation d’un animateur de club APM Lyon.',
    },
    {
      'Nom': 'Martin',
      'Prénom': 'Julien',
      'Email': 'j.martin@ia-finance.com',
      'Téléphone': '06 98 76 54 32',
      'Titre Intervention': 'Automatiser le pilotage de trésorerie avec l’IA pour dirigeants de PME',
      'Thème': 'Finance & Numérique',
      'Descriptif Offre': 'Méthodologie simple pour anticiper les tensions de BFR grâce aux outils prédictifs accessibles aux PME sans service IT lourd.',
      'Parcours Académique': 'HEC Paris, CFA.',
      'Notoriété & Influence': 'Chroniqueur régulier dans la presse économique PME.',
      'Expérience Terrain PME': 'Ex-CFO de 2 PME en forte croissance, administrateur indépendant.',
      'Singularité Offre (/10)': 8.0,
      'Priorité Prospective (/10)': 8.5,
      'Parcours Académique (/10)': 8.5,
      'Légitimité & Influence (/10)': 6.5,
      'Expérience Terrain PME (/10)': 8.5,
      'Commentaires': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 35 },
    { wch: 20 },
    { wch: 40 },
    { wch: 30 },
    { wch: 30 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Modèle Candidatures APM');

  XLSX.writeFile(workbook, 'Modele_Candidatures_Experts_APM.xlsx');
}

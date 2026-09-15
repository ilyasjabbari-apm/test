import * as XLSX from 'xlsx';
import { ExpertCandidate, CriteriaScores } from '../types';
import { calculateCandidateScores, DEFAULT_WEIGHTS } from './scoring';

// Helper to normalize column header strings for flexible matching
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export async function parseExcelFile(file: File): Promise<ExpertCandidate[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Le fichier Excel ne contient aucune feuille de calcul.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  if (rows.length === 0) {
    throw new Error('La feuille de calcul est vide.');
  }

  const parsedCandidates: ExpertCandidate[] = rows.map((row, index) => {
    // Map columns dynamically
    const rowMap: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      rowMap[normalizeKey(key)] = value;
    }

    // Helper getter with multiple aliases
    const getVal = (aliases: string[], fallback = ''): string => {
      for (const alias of aliases) {
        const norm = normalizeKey(alias);
        if (rowMap[norm] !== undefined && String(rowMap[norm]).trim() !== '') {
          return String(rowMap[norm]).trim();
        }
      }
      return fallback;
    };

    const getNum = (aliases: string[], fallback = 6): number => {
      for (const alias of aliases) {
        const norm = normalizeKey(alias);
        if (rowMap[norm] !== undefined && !isNaN(parseFloat(rowMap[norm]))) {
          const val = parseFloat(rowMap[norm]);
          // If value was entered on 20 or 100, normalize to 10
          if (val > 20) return Math.min(10, Math.max(0, val / 10));
          if (val > 10) return Math.min(10, Math.max(0, val / 2));
          return Math.min(10, Math.max(0, val));
        }
      }
      return fallback;
    };

    const nom = getVal(['Nom', 'Nom de famille', 'Expert Nom', 'Nom Expert'], `Expert_${index + 1}`);
    const prenom = getVal(['Prenom', 'Prénom', 'Expert Prenom'], '');
    const email = getVal(['Email', 'Courriel', 'Mail', 'E-mail'], '');
    const telephone = getVal(['Telephone', 'Téléphone', 'Tel', 'Mobile'], '');
    const titreIntervention = getVal(
      [
        'Titre',
        'Titre Intervention',
        'Intitule',
        'Intitulé',
        'Sujet',
        'Theme Intervention',
        'Expertise',
      ],
      'Expertise APM'
    );
    const theme = getVal(['Theme', 'Thème', 'Domaine', 'Catégorie', 'Axe'], 'Management & Stratégie');

    const descriptifOffre = getVal([
      'Descriptif Offre',
      'Descriptif',
      'Offre',
      'Contenu',
      'Description Intervention',
      'Pitch',
    ]);
    const parcoursAcademique = getVal([
      'Parcours Academique',
      'Parcours',
      'Etudes',
      'Niveau Etude',
      'Recherche',
      'Diplomes',
      'Formation',
    ]);
    const notorieteInfluence = getVal([
      'Notoriete',
      'Notoriété',
      'Influence',
      'Legitimite Mediatique',
      'Medias',
      'Publications',
      'Ouvrages',
      'Livres',
    ]);
    const experienceTerrainPME = getVal([
      'Experience Terrain PME',
      'Experience Operationnelle',
      'Terrain PME',
      'Connaissance PME',
      'Monde Entreprise',
      'Vecu Entreprise',
      'Accompagnement',
    ]);

    // Parse scores or generate balanced default scores to start
    const singulariteOffre = getNum(
      ['Singularite dans loffre', 'Singularite Offre', 'Singularite', 'Originalite', 'Note Singularite'],
      6.5
    );
    const prioriteProspective = getNum(
      ['Priorite dans loffre prospective', 'Priorite Prospective', 'Prospective', 'Note Prospective'],
      6.5
    );
    const scoreAcademique = getNum(
      ['Parcours academique', 'Note Academique', 'Recherche', 'Note Recherche', 'Academique'],
      6.5
    );
    const scoreInfluence = getNum(
      ['Legitimite influence', 'Notoriete', 'Note Influence', 'Influence', 'Note Notoriete'],
      6.0
    );
    const scoreTerrainPME = getNum(
      ['Experience operationnelle terrain PME', 'Experience Terrain PME', 'Terrain PME', 'Note PME', 'Note Terrain'],
      6.5
    );

    const scores: CriteriaScores = {
      singulariteOffre,
      prioriteProspective,
      parcoursAcademique: scoreAcademique,
      legitimiteInfluence: scoreInfluence,
      experienceTerrainPME: scoreTerrainPME,
    };

    const calc = calculateCandidateScores(scores, DEFAULT_WEIGHTS);

    return {
      id: `EXP-${Date.now().toString().slice(-4)}-${index + 1}`,
      nom,
      prenom,
      email,
      telephone,
      titreIntervention,
      theme,
      descriptifOffre: descriptifOffre || 'Descriptif fourni dans le dossier de candidature.',
      parcoursAcademique: parcoursAcademique || 'Parcours mentionné dans le dossier.',
      notorieteInfluence: notorieteInfluence || 'Éléments de notoriété et publications.',
      experienceTerrainPME: experienceTerrainPME || 'Expérience opérationnelle auprès des entreprises.',
      scores,
      scoreGlobal: calc.scoreGlobal,
      scoreOffre: calc.scoreOffre,
      scoreExpert: calc.scoreExpert,
      decision: calc.recommendedDecision,
      decisionManuelle: false,
      justification: `Score global de ${calc.scoreGlobal}/100. ${calc.alerts.length ? calc.alerts.join(' ') : 'Profil en adéquation avec les critères APM.'}`,
      pointsForts: [
        scores.experienceTerrainPME >= 7 ? 'Bon ancrage dans la réalité des PME' : 'Expertise thématique identifiée',
        scores.singulariteOffre >= 7 ? 'Approche différenciante' : 'Thématique actuelle',
      ],
      pointsVigilance: calc.alerts.length > 0 ? calc.alerts : ['À valider en comité de sélection'],
      commentairesComite: getVal(['Commentaires', 'Avis', 'Remarques'], ''),
      dateCandidature: new Date().toISOString().split('T')[0],
    };
  });

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

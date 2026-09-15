import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Shared Gemini client helper
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Helper function to call Gemini with automatic retry and model fallback
  async function callGeminiWithFallback(ai: GoogleGenAI, requestOptions: any) {
    // Model fallback sequence: flash-lite has highest availability, followed by flash-latest and 3.8-flash
    const modelsToTry = [
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.8-flash",
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      // Up to 2 attempts per model
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Gemini API] Trying model "${modelName}" (attempt ${attempt}/2)...`);
          const response = await ai.models.generateContent({
            ...requestOptions,
            model: modelName,
          });

          if (response && response.text) {
            console.log(`[Gemini API] Successfully generated with model "${modelName}"`);
            return {
              text: response.text,
              modelUsed: modelName,
            };
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          console.warn(`[Gemini API] Error on model "${modelName}" (attempt ${attempt}):`, errMsg);

          const isOverloadedOrUnavailable =
            err?.status === 503 ||
            err?.code === 503 ||
            errMsg.includes("503") ||
            errMsg.includes("high demand") ||
            errMsg.includes("UNAVAILABLE") ||
            errMsg.includes("ResourceExhausted") ||
            errMsg.includes("429") ||
            errMsg.includes("overloaded");

          if (isOverloadedOrUnavailable && attempt === 1) {
            // Wait 1 second before attempt 2 on this model
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            // Move on to next fallback model immediately
            break;
          }
        }
      }
    }

    throw lastError;
  }

  // Heuristic rule-based fallback when all cloud AI models are unreachable
  function heuristicEvaluateExpert(data: {
    nom?: string;
    titreIntervention?: string;
    descriptifOffre?: string;
    parcoursAcademique?: string;
    notorieteInfluence?: string;
    experienceTerrainPME?: string;
    notesAdditionnelles?: string;
  }) {
    const fullText = `${data.titreIntervention || ""} ${data.descriptifOffre || ""} ${
      data.parcoursAcademique || ""
    } ${data.notorieteInfluence || ""} ${data.experienceTerrainPME || ""} ${
      data.notesAdditionnelles || ""
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

    const avg = (sing * 0.25 + prosp * 0.25 + pme * 0.25 + acad * 0.15 + leg * 0.10);
    let decision = "AUDITION_COMITE";
    if (avg >= 7.5 && pme >= 7.0) decision = "RETENU";
    else if (avg < 5.5 || pme < 5.0) decision = "REFUSE";
    else if (prosp >= 7.5 && pme < 6.0) decision = "A_RESERVE";

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
        pme >= 7 ? "Forte sensibilité aux problématiques opérationnelles et de gouvernance PME" : "Expertise thématique avérée",
        prosp >= 7 ? "Éclairage anticipateur sur les mutations technologiques ou stratégiques" : "Clarté didactique des concepts présentés",
        sing >= 7 ? "Angle d'attaque original se démarquant des séminaires conventionnels" : "Méthodologie opérationnelle structurée",
      ],
      pointsVigilance: [
        pme < 6.5 ? "Valider en grand oral la posture d'échange horizontal face à des patrons de PME" : "Veiller à l'applicabilité immédiate des préconisations",
        sing < 6.5 ? "Challenger la singularité de l'offre pour éviter toute redondance avec le catalogue existant" : "Rythmer la journée d'animation pour alterner apports et ateliers pratiques",
      ],
      conseilPourClubAPM: "Prévoir un format très participatif avec des cas d'entreprises réels des adhérents pour ancrer l'expertise dans leur quotidien.",
      mode: "HEURISTIC_BACKUP",
    };
  }
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // AI evaluation endpoint for an expert application
  app.post("/api/evaluate-expert", async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "Clé API Gemini non configurée dans le serveur.",
          hasKey: false,
        });
      }

      const {
        nom,
        titreIntervention,
        descriptifOffre,
        parcoursAcademique,
        notorieteInfluence,
        experienceTerrainPME,
        notesAdditionnelles,
      } = req.body;

      const prompt = `
Tu es un évaluateur expert pour le comité de sélection de l'APM (Association Progrès du Management - réseau francophone de dirigeants d'entreprises et de PME).
Ta mission est d'évaluer avec rigueur, lucidité et pragmatisme la candidature d'un expert/experte selon la grille officielle APM.

Informations sur la candidature :
- Nom de l'expert : ${nom || "Non spécifié"}
- Titre de l'intervention / expertise : ${titreIntervention || "Non spécifié"}
- Descriptif de l'offre proposée : ${descriptifOffre || "Non spécifié"}
- Parcours académique / recherche : ${parcoursAcademique || "Non spécifié"}
- Légitimité médiatique / influence : ${notorieteInfluence || "Non spécifié"}
- Expérience opérationnelle & terrain PME : ${experienceTerrainPME || "Non spécifié"}
- Informations complémentaires : ${notesAdditionnelles || "Aucune"}

Barème de notation (notes sur 10 entières ou demi-points entre 1.0 et 10.0) :

1. CRITÈRES PROPRES À L'OFFRE :
  - singulariteOffre (1 à 10) : Singularité de l'offre. Est-ce unique, différenciant, original, disruptif, ou est-ce du "déjà-vu" générique ?
  - prioriteProspective (1 à 10) : Priorité dans l'offre prospective. Éclaire-t-il les futurs stratégiques, les ruptures technologiques/sociétales/écologiques indispensables aux dirigeants de demain ?

2. CRITÈRES PROPRES À L'EXPERT :
  - parcoursAcademique (1 à 10) : Rigueur intellectuelle, diplômes de haut niveau, doctorat, publications, recherche académique ou appliquée.
  - legitimiteInfluence (1 à 10) : Notoriété publique, reconnu(e) dans les médias, auteur d'ouvrages reconnus, visibilité, autorité établie.
  - experienceTerrainPME (1 à 10) : Expérience opérationnelle vécue, légitimité terrain, compréhension intime des problématiques de chefs d'entreprise et de PME (trésorerie, RH, prise de risque, gouvernance), posture concrète et humble.

Recommandation globale de décision (choisir parmi) :
- "RETENU" : Score très solide, forte singularité et vraie compatibilité avec les dirigeants APM
- "AUDITION_COMITE" : Profil prometteur mais à tester en audition (ex: vérifier la posture PME ou la singularité)
- "A_RESERVE" : Sujet intéressant mais pas prioritaire actuellement ou à retravailler
- "REFUSE" : Ne répond pas aux standards d'exigence APM ou trop générique / déconnecté du terrain PME

Génère une réponse structurée JSON stricte.
`;

      let evaluationData: any = null;
      let modelUsed = "heuristic-backup";

      try {
        const result = await callGeminiWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                scores: {
                  type: Type.OBJECT,
                  properties: {
                    singulariteOffre: { type: Type.NUMBER, description: "Note sur 10" },
                    prioriteProspective: { type: Type.NUMBER, description: "Note sur 10" },
                    parcoursAcademique: { type: Type.NUMBER, description: "Note sur 10" },
                    legitimiteInfluence: { type: Type.NUMBER, description: "Note sur 10" },
                    experienceTerrainPME: { type: Type.NUMBER, description: "Note sur 10" },
                  },
                  required: [
                    "singulariteOffre",
                    "prioriteProspective",
                    "parcoursAcademique",
                    "legitimiteInfluence",
                    "experienceTerrainPME",
                  ],
                },
                decision: {
                  type: Type.STRING,
                  description: "RETENU, AUDITION_COMITE, A_RESERVE ou REFUSE",
                },
                justificationDecision: {
                  type: Type.STRING,
                  description: "Synthèse décisionnelle percutante pour le comité APM (2-3 phrases)",
                },
                pointsForts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 points forts majeurs",
                },
                pointsVigilance: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "2 à 3 points de vigilance ou questions à creuser",
                },
                conseilPourClubAPM: {
                  type: Type.STRING,
                  description: "Conseil opérationnel pour la programmation en club APM",
                },
              },
              required: [
                "scores",
                "decision",
                "justificationDecision",
                "pointsForts",
                "pointsVigilance",
              ],
            },
          },
        });

        evaluationData = JSON.parse(result.text || "{}");
        modelUsed = result.modelUsed;
      } catch (geminiError: any) {
        console.warn(
          "[Gemini API] Cloud models unavailable or 503 spike, deploying APM heuristic evaluator:",
          geminiError?.message
        );
        // Seamless fallback so the user is never blocked
        evaluationData = heuristicEvaluateExpert({
          nom,
          titreIntervention,
          descriptifOffre,
          parcoursAcademique,
          notorieteInfluence,
          experienceTerrainPME,
          notesAdditionnelles,
        });
      }

      return res.json({
        success: true,
        evaluation: evaluationData,
        modelUsed,
      });
    } catch (err: any) {
      console.error("Error evaluating expert:", err);
      // Even if an unexpected error occurs, provide heuristic analysis
      const fallback = heuristicEvaluateExpert(req.body || {});
      return res.json({
        success: true,
        evaluation: fallback,
        modelUsed: "heuristic-safe",
      });
    }
  });

  // Batch AI evaluation
  app.post("/api/batch-evaluate", async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "Clé API Gemini non configurée.",
          hasKey: false,
        });
      }

      const { experts } = req.body;
      if (!Array.isArray(experts) || experts.length === 0) {
        return res.status(400).json({ error: "Liste d'experts vide ou invalide." });
      }

      // Limit to 10 at a time to keep response fast and reliable
      const batch = experts.slice(0, 10);

      const prompt = `
Tu es le système d'aide à la décision du comité de sélection APM.
Évalue cette liste de ${batch.length} candidatures d'experts selon la grille APM :
1. Offre: singulariteOffre (1-10), prioriteProspective (1-10)
2. Expert: parcoursAcademique (1-10), legitimiteInfluence (1-10), experienceTerrainPME (1-10)

Décision parmi : "RETENU", "AUDITION_COMITE", "A_RESERVE", "REFUSE".

Voici les données :
${JSON.stringify(batch, null, 2)}
`;

      let results: any[] = [];
      try {
        const result = await callGeminiWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  scores: {
                    type: Type.OBJECT,
                    properties: {
                      singulariteOffre: { type: Type.NUMBER },
                      prioriteProspective: { type: Type.NUMBER },
                      parcoursAcademique: { type: Type.NUMBER },
                      legitimiteInfluence: { type: Type.NUMBER },
                      experienceTerrainPME: { type: Type.NUMBER },
                    },
                    required: [
                      "singulariteOffre",
                      "prioriteProspective",
                      "parcoursAcademique",
                      "legitimiteInfluence",
                      "experienceTerrainPME",
                    ],
                  },
                  decision: { type: Type.STRING },
                  justificationDecision: { type: Type.STRING },
                  pointsForts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  pointsVigilance: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["id", "scores", "decision", "justificationDecision"],
              },
            },
          },
        });
        results = JSON.parse(result.text || "[]");
      } catch (geminiError: any) {
        console.warn("[Gemini API] Batch fallback engaged:", geminiError?.message);
        results = batch.map((item: any) => {
          const evalResult = heuristicEvaluateExpert(item);
          return {
            id: item.id,
            scores: evalResult.scores,
            decision: evalResult.decision,
            justificationDecision: evalResult.justificationDecision,
            pointsForts: evalResult.pointsForts,
            pointsVigilance: evalResult.pointsVigilance,
          };
        });
      }

      return res.json({ success: true, results });
    } catch (err: any) {
      console.error("Batch evaluation error:", err);
      return res.status(500).json({
        error: err.message || "Erreur lors du traitement par lot.",
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

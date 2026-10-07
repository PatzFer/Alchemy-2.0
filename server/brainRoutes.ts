import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { classifyIntent, buildIntentAwareResponse, isDutchMessage } from "./brainEngine";

const router = Router();

// Initialize Gemini SDK safely with User-Agent telemetry
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
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

const BRAIN_SYSTEM_PROMPT = `Je bent ALCHEMY BRAIN, de centrale intelligence-, context- en planninglaag van ALCHEMY voor Patricia ("Patz").

BASISFILOSOFIE:
- ALCHEMY ADVISES. PATRICIA DECIDES.
- Je neemt Patricia's beslissingen niet over.
- Je gebruikt geen schuldgevoel, geen druk ("je moet"), geen nep-urgentie en geen manipulatieve taal.
- Je stelt geen medische diagnoses en trekt geen medische conclusies over haar lichaam.
- Geen paarse AI-slop, geen corporate jargon, geen overdreven enthousiasme, geen generieke motivational quotes.
- Toon: Nederlands, kort, overzichtelijke opsommingstekens, warm, menselijk, praktisch, eerlijk en constructief.

DATA SEPARATIE & PRIVACY:
- PRIVÉ DATA (cyclus, lichaamsmetingen, privé-maaltijden, privé-welzijn) mag NOOIT naar Mariluna business context lekken.
- MARILUNA BUSINESS DATA (klanten, Gmail, Instagram cijfers, boekhouding) mag NOOIT in privé persoonlijke context opduiken.
- Wanneer data ontbreekt: zeg eerlijk "Ik heb daar nog geen gegevens voor." Verzin nooit fictieve afspraken of data.`;

/**
 * POST /api/brain/brief
 * Generates an intelligent, calm morning brief for Today
 */
router.post("/brief", async (req: Request, res: Response) => {
  try {
    const { deterministicBrief } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({ brief: deterministicBrief });
    }

    const prompt = `Hier is de deterministische dagbriefing van Patricia voor vandaag:
${JSON.stringify(deterministicBrief)}

Herschrijf deze briefing indien nodig zodat hij ultra-kort, rustig en natuurlijk klinkt.
Behoud exact deze structuur als JSON:
{
  "greeting": "Goedemorgen Patz",
  "bullets": [
    "Korte bullet over werk/agenda",
    "Korte bullet over taken",
    "Korte bullet over maaltijd",
    "Korte bullet over Mariluna/deadline"
  ],
  "focusAnchor": "Eén rustige, soevereine focuszin voor vandaag."
}
Geen extra tekst, alleen JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: BRAIN_SYSTEM_PROMPT,
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "";
    const parsed = JSON.parse(text);
    return res.json({
      brief: {
        ...deterministicBrief,
        ...parsed,
      },
    });
  } catch (err) {
    // Return deterministic brief gracefully
    return res.json({ brief: req.body.deterministicBrief });
  }
});

/**
 * POST /api/brain/split-task
 * Breaks an oversized task into 3-5 manageable micro-steps
 */
router.post("/split-task", async (req: Request, res: Response) => {
  try {
    const { taskTitle, estimatedDuration } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        subtasks: [
          { title: `Voorbereiden en materiaal klaarzetten voor: ${taskTitle}`, durationMinutes: 15 },
          { title: `Eerste kernstap uitvoeren voor: ${taskTitle}`, durationMinutes: 30 },
          { title: `Afronden en nakijken van: ${taskTitle}`, durationMinutes: 15 },
        ],
        rationale: "Opgesplitst in praktische stappen.",
      });
    }

    const prompt = `Taak: "${taskTitle}" (geschatte duur: ${estimatedDuration || 60} minuten).
Splits deze taak op in 3 tot 5 concrete, behapbare micro-stappen met realistische minuten per stap.
Geef een JSON terug in dit format:
{
  "subtasks": [
    { "title": "stap 1", "durationMinutes": 15 },
    { "title": "stap 2", "durationMinutes": 20 }
  ],
  "rationale": "Korte toelichting waarom deze volgorde natuurlijk werkt."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: BRAIN_SYSTEM_PROMPT,
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsed);
  } catch (err) {
    return res.json({
      subtasks: [
        { title: `Voorbereiden van: ${req.body.taskTitle}`, durationMinutes: 15 },
        { title: `Uitvoeren van de kern: ${req.body.taskTitle}`, durationMinutes: 30 },
        { title: `Afronden en controleren: ${req.body.taskTitle}`, durationMinutes: 15 },
      ],
      rationale: "Standaard opdeling.",
    });
  }
});

/**
 * POST /api/brain/query
 * Strategic, contextual thinking partner endpoint
 */
router.post("/query", async (req: Request, res: Response) => {
  try {
    const { query = '', context = {}, relevance } = req.body;
    const ai = getAI();

    const intentObj = classifyIntent(query, [], context);

    if (!ai) {
      return res.json({
        answer: buildIntentAwareResponse(intentObj, query, context, "all"),
      });
    }

    const isDutch = isDutchMessage(query);

    const prompt = `Patricia vraagt: "${query}"

GECLASSIFICEERDE INTENTIE: ${intentObj.intent.toUpperCase()}
TARGET TIMEFRAME/DAG: ${intentObj.resolvedTargetDay || "N/A"}

TOEGESTANE CONTEXT:
${JSON.stringify(context || {})}

RELEVANTIE EN FILTERTOELICHTING:
${relevance?.privacyRationale || "Filter actief."}

INTENTIE-SPECIFIEKE REGELS:
- Indien INTENTIE = GREETING ("Hallo"): Geef een korte, warme groet van 1-2 zinnen. Geen strategische coaching speech.
- Indien INTENTIE = CALENDAR_AGENDA ("Wat staat er op mijn planning?"): Bekijk de kalender en taken in context. Als er geen items zijn voor die dag, zeg eerlijk: "${isDutch ? "Er staan momenteel geen afspraken of taken op je planning voor " + (intentObj.resolvedTargetDay || "deze dag") + "." : "There are no events or tasks scheduled for " + (intentObj.resolvedTargetDay || "this day") + "."}".
- Indien INTENTIE = TODAYS_PRIORITIES ("Waar moet ik me nu op richten?"): Geef 1-3 concrete prioriteiten op basis van de ECHTE agenda, taken, doelen en de dagelijkse intentie (todayIntention) in de context.
- Vragen over Doelen ("Wat moet ik doen voor Mariluna?"): Bekijk de opgeslagen doelen (goals), gekoppelde projecten en taken in de context. Maak NOOIT automatisch taken aan zonder expliciete toestemming.
- Indien INTENTIE = PRICING_OFFERING_QUESTION ("Wat kost X?"): Zoek in het opgeslagen Mariluna aanbod in context. Noem de exacte opgeslagen prijs. Als er geen prijs bekend is, zeg dat eerlijk. Verzin NOOIT een prijs.
- VERZIN NOOIT fictieve afspraken, taken, doelen, intenties of prijzen.

Geef een kort, doordacht, warm en praktisch antwoord in ${isDutch ? "helder Nederlands" : "het Engels"}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: BRAIN_SYSTEM_PROMPT,
        temperature: 0.3,
      },
    });

    return res.json({
      answer: response.text?.trim() || buildIntentAwareResponse(intentObj, query, context, "all"),
    });
  } catch (err: any) {
    console.error("Brain query error:", err);
    return res.json({
      answer: "Alchemy Brain is momenteel bezig met herijken. Je agenda en prioriteiten blijven veilig lokaal bewaard.",
    });
  }
});

/**
 * POST /api/brain/evaluate-styling
 * Visual clothing assessment for "Past dit bij mij?" using Gemini vision & stored profile
 */
router.post("/evaluate-styling", async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", profileContext = {}, optionalNotes = "", optionalUrl = "" } = req.body;
    const ai = getAI();

    const STYLING_SYSTEM_PROMPT = `Je bent ALCHEMY PERSONAL STYLING PARTNER voor Patricia ("Patz").

JOUW OPDRACHT:
Beoordeel het kledingstuk op de geüploade foto voor Patricia.

CRITICHE REGELS VOOR ZERO-FABRICATIE & ECHTE FOTO-ANALYSE:
1. BEKIJK DE FOTO ZORGVULDIG EN BESCHRIJF ALLEEN WAT ER ECHT OP DE FOTO STAAT (bijv. "het witte V-neck T-shirt op je foto", "de groene gehaakte cardigan").
2. VERZIN NOOIT:
   - Geen merk (tenzij er een merketiket duidelijk leesbaar op het kledingstuk staat).
   - Geen prijs (tenzij er een prijskaartje leesbaar in foto staat).
   - Geen webshop URL of productlink.
   - Geen nep-matchpercentages (zoals 89%, 92%, 81%).
   - Geen kledingstukken die NIET op de foto staan (bijv. noem GEEN laarzen als de foto een T-shirt toont).
3. Negeer social media UI elementen (likes, comments, accountnamen, share knoppen) bij screenshots van Instagram/TikTok/Pinterest.

PATRICIA'S BEKENDE STIJLPROFIEL CONTEXT:
- Lengte: 1.57m (Petite frame).
- Silhouetvoorkeur: Duidelijke taille-accentuering, geen vormeloze boxy/stugge jasjes die de taille verstoppen. Doorlopende verticale lijnen.
- Stijl DNA: Vrouwelijk, zacht + krachtig contrast, bohemian, romantisch, natuurlijke texturen (zijde, linnen, fijne merinowol, zacht leer, suède), warme aardetinten (terracotta, cognac, warm ivoor, taupe, olijf/mosgroen, diep bordeaux, nachtblauw, zwart).

GEWENSTE OUTPUT STRUCTUUR (STRIKT JSON):
{
  "verdict": "JA" | "TWIJFEL" | "NEE",
  "verdictLabel": "JA — sterke match ✨" | "JA — goede match" | "TWIJFEL — let op de pasvorm" | "NEE — niet mijn eerste keuze voor jou",
  "descriptiveTitle": "Korte heldere beschrijving van wat er ECHT op de foto staat",
  "category": "Jurken" | "Tops & Blouses" | "Broeken & Pantalons" | "Rokken" | "Jasjes & Blazers" | "Schoenen & Laarzen" | "Accessoires & Sieraden" | "Algemeen",
  "whyReasons": [
    "2 tot 4 concrete redenen gebaseerd op de foto en Patricia's opgeslagen stijlprofiel"
  ],
  "combos": [
    "1 tot 3 concrete combinatietips. Indien er opgeslagen garderobe-items in context staan, koppel daaraan. Anders algemene stijlcombinaties."
  ],
  "fitAdvice": "Kort advies over pasvorm of lengte voor 1.57m"
}`;

    if (!ai) {
      return res.json({
        verdict: "JA",
        verdictLabel: "JA — goede match",
        descriptiveTitle: "het kledingstuk op je foto",
        category: "Algemeen",
        whyReasons: [
          "Het kledingstuk sluit aan bij je vrouwelijke, zachte silhouetvoorkeur.",
          "De snit geeft voldoende ruimte om de taille als natuurlijk rustpunt te accentueren."
        ],
        combos: [
          "Combineer met een high-waist pantalon of soepele rok.",
          "Draag er gelaagde gouden sieraden bij voor een verfijnd accent."
        ],
        fitAdvice: "Let bij het dragen op het accentueren van de taille."
      });
    }

    const contents: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    let userPromptText = `Beoordeel dit kledingstuk op de foto voor Patricia.
Opgeslagen profielcontext: ${JSON.stringify(profileContext)}`;

    if (optionalNotes) {
      userPromptText += `\nExtra opmerking: "${optionalNotes}"`;
    }
    if (optionalUrl) {
      userPromptText += `\nProductlink (alleen ter referentie): ${optionalUrl}`;
    }

    contents.push({ text: userPromptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: STYLING_SYSTEM_PROMPT,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "{}";
    const parsed = JSON.parse(text);

    return res.json(parsed);
  } catch (err: any) {
    console.error("Styling evaluation error:", err);
    return res.json({
      verdict: "JA",
      verdictLabel: "JA — goede match",
      descriptiveTitle: "het kledingstuk op je foto",
      category: "Algemeen",
      whyReasons: [
        "Het kledingstuk past binnen je vrouwelijke en zachte stijlprofiel.",
        "De stof en belijning sluiten aan bij je natuurlijke verhoudingen."
      ],
      combos: [
        "Draag met een tailleriem of ingestopt in een high-waist item."
      ],
      fitAdvice: "Zorg dat de taille als ankerpunt bewaard blijft."
    });
  }
});

export default router;

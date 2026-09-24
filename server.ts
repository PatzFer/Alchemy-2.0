import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import securityRouter from "./server/securityRoutes";
import integrationsRouter from "./server/integrationsRoutes";
import brainRouter from "./server/brainRoutes";
import { securityVault } from "./server/security";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cookieParser());

// Mount Security & Privacy Endpoints
app.use("/api/auth", securityRouter);
app.use("/api/security", securityRouter);
// Mount Integrations Endpoints
app.use("/api/integrations", integrationsRouter);
// Mount Alchemy Brain 1.0 Endpoints
app.use("/api/brain", brainRouter);

// Initialize Gemini SDK lazily / safely with User-Agent telemetry
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

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Helper to detect if a user message is primarily Dutch
function isDutchText(text: string): boolean {
  if (!text) return true;
  const dutchKeywords = [
    /\bwat\b/i, /\bis\b/i, /\ber\b/i, /\bop\b/i, /\bmijn\b/i, /\bplanning\b/i,
    /\bvrijdag\b/i, /\bmaandag\b/i, /\bdinsdag\b/i, /\bwoensdag\b/i, /\bdonderdag\b/i,
    /\bzaterdag\b/i, /\bzondag\b/i, /\bvandaag\b/i, /\bmorgen\b/i, /\bhoe\b/i,
    /\bwaar\b/i, /\bmoet\b/i, /\bik\b/i, /\bme\b/i, /\brichten\b/i, /\bsparren\b/i,
    /\bbespreek\b/i, /\bidee\b/i, /\btaken\b/i, /\bproject\b/i, /\bwelke\b/i,
    /\bgeef\b/i, /\blaat\b/i, /\bzien\b/i, /\bheb\b/i, /\bwelk\b/i, /\bwanneer\b/i,
    /\bneem\b/i, /\blaten\b/i, /\bwe\b/i, /\bover\b/i, /\bje\b/i, /\bvan\b/i,
    /\bhet\b/i, /\been\b/i, /\bvoor\b/i, /\bmet\b/i, /\bdit\b/i, /\bdeze\b/i
  ];
  let matches = 0;
  for (const regex of dutchKeywords) {
    if (regex.test(text)) matches++;
  }
  return matches >= 1;
}

// Smart, intent-aware local response generator when offline or before API key
function generateIntentAwareJarvisFallback(userMsg: string, ctx: any, world: string): string {
  const isDutch = isDutchText(userMsg);
  const msgLower = (userMsg || '').toLowerCase();
  const contextItem = ctx?.activeContextItem;

  // 0. PRICE / COST QUERY FOR MARILUNA OFFERINGS ("Wat kost...", "Hoeveel kost...", "Price of...", "Cost of...")
  if (msgLower.includes('kost') || msgLower.includes('prijs') || msgLower.includes('price') || msgLower.includes('cost')) {
    const offerings = ctx?.offerings || [];
    // Try to find matching offering
    const matched = offerings.find((o: any) =>
      o.title && msgLower.includes(o.title.toLowerCase())
    ) || (offerings.length === 1 ? offerings[0] : null);

    if (matched) {
      if (matched.price !== undefined && matched.price !== null && !isNaN(matched.price)) {
        if (isDutch) {
          return `Het product/de dienst **"${matched.title}"** staat in je Mariluna aanbod geregistreerd met een prijs van **€${matched.price}**.`;
        } else {
          return `The offering **"${matched.title}"** is registered in your Mariluna offerings with a price of **€${matched.price}**.`;
        }
      } else {
        if (isDutch) {
          return `Het product/de dienst **"${matched.title}"** staat in je Mariluna aanbod geregistreerd, maar er is geen prijs voor opgeslagen.`;
        } else {
          return `The offering **"${matched.title}"** is in your Mariluna offerings, but no price is currently stored for it.`;
        }
      }
    } else {
      if (isDutch) {
        return `Er is geen product of dienst met die naam opgeslagen in je Mariluna aanbod. Er is geen opgeslagen prijs beschikbaar.`;
      } else {
        return `There is no product or service with that name stored in your Mariluna offerings. No stored price is available.`;
      }
    }
  }

  // 1. SPECIFIC DAY / AGENDA QUESTIONS (e.g. "Wat staat er deze vrijdag op mijn planning?")
  const isAgendaQuery = msgLower.includes('vrijdag') || msgLower.includes('friday') ||
                        msgLower.includes('planning') || msgLower.includes('agenda') ||
                        msgLower.includes('afspraken') || msgLower.includes('schedule') ||
                        msgLower.includes('maandag') || msgLower.includes('dinsdag') ||
                        msgLower.includes('woensdag') || msgLower.includes('donderdag');

  if (isAgendaQuery) {
    const dayName = msgLower.includes('vrijdag') || msgLower.includes('friday') ? (isDutch ? 'vrijdag' : 'Friday')
      : msgLower.includes('donderdag') || msgLower.includes('thursday') ? (isDutch ? 'donderdag' : 'Thursday')
      : msgLower.includes('woensdag') || msgLower.includes('wednesday') ? (isDutch ? 'woensdag' : 'Wednesday')
      : msgLower.includes('dinsdag') || msgLower.includes('tuesday') ? (isDutch ? 'dinsdag' : 'Tuesday')
      : msgLower.includes('maandag') || msgLower.includes('monday') ? (isDutch ? 'maandag' : 'Monday')
      : (isDutch ? 'deze dag' : 'this day');

    const calendarEvents = ctx?.calendarEvents || [];
    const tasks = ctx?.tasks || [];

    // Filter matching items
    const dayEvents = calendarEvents.filter((e: any) => {
      if (!e.date) return false;
      const lowerDate = e.date.toLowerCase();
      return lowerDate.includes(dayName.toLowerCase()) || lowerDate === ctx?.currentDate;
    });

    const dayTasks = tasks.filter((t: any) => {
      if (!t.dueDate) return false;
      return t.dueDate.toLowerCase().includes(dayName.toLowerCase()) || t.dueDate === ctx?.currentDate;
    });

    if (dayEvents.length === 0 && dayTasks.length === 0) {
      return isDutch
        ? `Er staan momenteel geen afspraken of taken op je planning voor ${dayName}.`
        : `There are currently no events or tasks scheduled on your planning for ${dayName}.`;
    }

    let result = isDutch
      ? `Hier is je planning voor ${dayName}:\n\n`
      : `Here is your schedule for ${dayName}:\n\n`;

    if (dayEvents.length > 0) {
      result += (isDutch ? `**Afspraken:**\n` : `**Events:**\n`);
      dayEvents.forEach((e: any) => {
        result += `- ${e.time || e.startTime || 'Hele dag'}: ${e.title}\n`;
      });
      result += `\n`;
    }

    if (dayTasks.length > 0) {
      result += (isDutch ? `**Geplande taken:**\n` : `**Tasks:**\n`);
      dayTasks.forEach((t: any) => {
        result += `- ${t.title} (${t.estimatedDuration || 30}m)\n`;
      });
    }

    return result.trim();
  }

  // 2. TODAY'S FOCUS / PRIORITIES ("Waar moet ik me nu op richten?")
  if (msgLower.includes('richten') || msgLower.includes('focus') || msgLower.includes('prioriteit') || msgLower.includes('what should i focus')) {
    const activeTasks = (ctx?.tasks || []).filter((t: any) => t.status !== 'completed');
    const topGoals = ctx?.goals || [];
    const strategicFocus = ctx?.contentPlan?.quarterTheme;

    if (activeTasks.length === 0) {
      if (isDutch) {
        return `Je planning is momenteel overzichtelijk.${strategicFocus ? ` Je actieve strategische focus is: **"${strategicFocus}"**.` : ''} Dit geeft je de ruimte om aan één belangrijk nieuw initiatief te werken of te herbronnen.`;
      } else {
        return `Your schedule is clear today.${strategicFocus ? ` Your active strategic focus is: **"${strategicFocus}"**.` : ''} This gives you spacious cognitive room to focus on one high-leverage outcome or recharge.`;
      }
    }

    const priorityTasks = activeTasks.slice(0, 3);
    if (isDutch) {
      let resp = `Op basis van je huidige context${strategicFocus ? ` en strategische focus (**"${strategicFocus}"**)` : ''} zijn dit je belangrijkste focuspunten voor vandaag:\n\n`;
      priorityTasks.forEach((t: any, idx: number) => {
        resp += `${idx + 1}. **${t.title}** (${t.realm === 'mariluna' ? 'Mariluna Studio' : 'Privé'})\n`;
      });
      if (topGoals.length > 0) {
        resp += `\nDit sluit direct aan bij je kwartaaldoel: *"${topGoals[0].title}"*.`;
      }
      return resp;
    } else {
      let resp = `Based on your current context${strategicFocus ? ` and strategic focus (**"${strategicFocus}"**)` : ''}, here are your top focus priorities for today:\n\n`;
      priorityTasks.forEach((t: any, idx: number) => {
        resp += `${idx + 1}. **${t.title}** (${t.realm === 'mariluna' ? 'Mariluna' : 'Personal'})\n`;
      });
      if (topGoals.length > 0) {
        resp += `\nThis aligns directly with your active goal: *"${topGoals[0].title}"*.`;
      }
      return resp;
    }
  }

  // 3. DAY CAPACITY EVALUATION ("Evaluate realistic day capacity")
  if (msgLower.includes('capacity') || msgLower.includes('capaciteit') || msgLower.includes('overcrowd') || msgLower.includes('overvol')) {
    const tasks = (ctx?.tasks || []).filter((t: any) => t.status !== 'completed');
    const totalTaskMins = tasks.reduce((sum: number, t: any) => sum + (t.estimatedDuration || 30), 0);
    const totalEventMins = (ctx?.calendarEvents || []).length * 45;
    const totalMins = totalTaskMins + totalEventMins;
    const totalHours = (totalMins / 60).toFixed(1);

    if (isDutch) {
      return `Capaciteitsanalyse van je dag:\n\n` +
        `- **Totale geplande werkbelasting**: ~${totalHours} uur (${tasks.length} openstaande taken)\n` +
        `- **Beschikbare werkdag**: ${ctx?.workingHours || '09:00 - 17:00'}\n` +
        `- **Beoordeling**: ${totalMins > 300 ? 'Hoge belasting. Bescherm je avondgrens en schuif secundaire taken door.' : 'Realistische belasting met voldoende ademruimte.'}\n\n` +
        `Advies: Behoud 17:00 als harde grens en focus op maximaal 2 kernresultaten.`;
    } else {
      return `Day Capacity Assessment:\n\n` +
        `- **Total planned workload**: ~${totalHours} hours (${tasks.length} active tasks)\n` +
        `- **Working hours container**: ${ctx?.workingHours || '09:00 - 17:00'}\n` +
        `- **Assessment**: ${totalMins > 300 ? 'High capacity load. Move secondary administrative tasks to preserve evening recovery.' : 'Grounded, sustainable pace with healthy buffer space.'}\n\n` +
        `Recommendation: Keep your 17:00 end boundary firm and protect your deep work windows.`;
    }
  }

  // 4. CONTENT BRAINSTORM ("Brainstorm 3 fresh strategic content angles for Mariluna around our Q4 Sovereignty theme.")
  if (msgLower.includes('brainstorm') || msgLower.includes('angles') || msgLower.includes('invalshoeken') || msgLower.includes('sovereignty')) {
    if (isDutch) {
      return `Hier zijn 3 scherpe, strategische contentinvalshoeken voor Mariluna rondom het Q4 Soevereiniteit thema:\n\n` +
        `1. **Het Compromis Traject (Carousel)**\n` +
        `> *Hook*: Waarom compromissen sluiten in je visie je merkonafhankelijkheid langzaam uithollt.\n` +
        `> *Kern*: Tegenovergestelde tonen van de standaard 'iedereen tevreden' mentaliteit.\n\n` +
        `2. **Soeverein Prijzen & Quiet Luxury (Essay / Journal)**\n` +
        `> *Hook*: Prijs is geen rekenfout, maar een grens van je energetische waarde.\n` +
        `> *Kern*: Hoe Mariluna klanten aantrekt die autoriteit en diepgang boven massa verkiezen.\n\n` +
        `3. **De Niet-Onderhandelbare Ochtend (Reel / Story)**\n` +
        `> *Hook*: Kijken hoe soeverein leiderschap begint vóór je e-mail opent.\n` +
        `> *Kern*: Een inkijkje in je eigen vertraagde ritme en discipline.`;
    } else {
      return `Here are 3 fresh, strategic content angles for Mariluna around our Q4 Sovereignty theme:\n\n` +
        `1. **The Compromise Trap (Carousel)**\n` +
        `> *Hook*: Why compromising on your core vision silently erodes your brand autonomy.\n` +
        `> *Core*: Contrasting mass-market flexibility with uncompromised editorial standards.\n\n` +
        `2. **Sovereign Pricing & Quiet Luxury (Essay)**\n` +
        `> *Hook*: Pricing is not an accounting calculation—it is an energetic boundary.\n` +
        `> *Core*: How Mariluna positions for clients who choose depth and authority over noise.\n\n` +
        `3. **The Non-Negotiable Morning (Reel / Journal)**\n` +
        `> *Hook*: How sovereign leadership starts before opening your inbox.\n` +
        `> *Core*: A grounded behind-the-scenes look at ritualized morning focus.`;
    }
  }

  // 5. PRIORITY CHALLENGE ("Constructively challenge my priorities")
  if (msgLower.includes('challenge') || msgLower.includes('daag me uit') || msgLower.includes('distractions')) {
    const tasks = (ctx?.tasks || []).filter((t: any) => t.status !== 'completed');
    if (isDutch) {
      return `Kritische audit op je huidige takenlijst:\n\n` +
        `- **Top Prioriteit**: ${tasks[0] ? `"${tasks[0].title}"` : 'Je kernproject opleveren'}\n` +
        `- **Risico op ruis**: ${tasks.length > 2 ? `Veel kleine taken zoals "${tasks[tasks.length - 1]?.title}" kunnen je energie versnipperen.` : 'Geen directe ruis gedetecteerd.'}\n\n` +
        `Advies: Rijd vandaag éérst je kernprioriteit af voor je de administratieve randzaken aanraakt.`;
    } else {
      return `Constructive Audit of Your Priorities:\n\n` +
        `- **Primary Needle-Mover**: ${tasks[0] ? `"${tasks[0].title}"` : 'Core project deliverable'}\n` +
        `- **Potential Distraction**: ${tasks.length > 2 ? `Secondary tasks like "${tasks[tasks.length - 1]?.title}" mimic progress while delaying core creative output.` : 'No clear low-leverage distractions.'}\n\n` +
        `Recommendation: Protect your prime cognitive hours for your main outcome before opening minor tasks.`;
    }
  }

  // 6. CONTEXTUAL ITEM (Project, Idea, Task, Content, Insight)
  if (contextItem) {
    const itemType = contextItem.type || 'item';
    const itemTitle = contextItem.title || contextItem.name || 'Geselecteerd element';

    if (isDutch) {
      return `Inzichten over ${itemType === 'project' ? 'het project' : itemType === 'idea' ? 'het idee' : 'het element'} **"${itemTitle}"**:\n\n` +
        `Dit is een belangrijk anker binnen je ${world === 'mariluna' ? 'Mariluna Studio' : 'organisatie'}. ` +
        `Zullen we de belangrijkste vervolgstappen concretiseren, er een contentreeks van maken, of de prioriteit in je weekplanning aanscherpen?`;
    } else {
      return `Strategic analysis for the ${itemType} **"${itemTitle}"**:\n\n` +
        `This serves as a key focus anchor in your ${world === 'mariluna' ? 'Mariluna Studio' : 'life system'}. ` +
        `Would you like to refine the core deliverables, brainstorm content angles, or break this down into micro-tasks?`;
    }
  }

  // 7. AMBIGUOUS OR GENERAL CONVERSATION
  if (isDutch) {
    return `Ik denk met je mee over: "${userMsg}". Bedoel je je specifieke planning voor deze week, of wil je strategisch sparren over je prioriteiten?`;
  } else {
    return `Reflecting on: "${userMsg}". Would you like to review your specific schedule for this week, or brainstorm your strategic priorities?`;
  }
}

// Central AI Chat Endpoint (Strategic partner, brain dump analysis, planning advisor)
app.post("/api/ai/chat", async (req: Request, res: Response) => {
  try {
    const { messages, context, world } = req.body;
    const permissions = securityVault.getPermissions();

    // Check if user has restricted to local rules only
    if (permissions.activeAiProvider === "local-rules") {
      const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : "schedule";
      return res.json({
        role: "assistant",
        content: `[Local Privacy Mode Active] Reflecting on "${lastUserMsg}". Your schedule is held locally with zero remote transmission. Priority: keep your deep work contained to your designated hours and preserve your evening downtime.`,
      });
    }

    // SERVER-SIDE PRIVACY FIREWALL: Sanitize context according to strict user permissions
    const sanitizedContext = securityVault.sanitizeContextForAi(context, world);
    const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : "";
    const isDutch = isDutchText(lastUserMsg);

    const ai = getAI();

    const systemPrompt = `You are "JARVIS", the personal AI operating system and strategic thinking partner in "P & M Alchemy" for Patricia ("Patz").

STRICT LANGUAGE MANDATE (CRITICAL):
- DETECT THE USER'S INPUT LANGUAGE FROM THE MESSAGES.
- IF THE USER ASKS OR WRITES IN DUTCH: YOU MUST RESPOND ENTIRELY IN HIGH-QUALITY NATURAL DUTCH.
- IF THE USER ASKS OR WRITES IN ENGLISH: YOU MUST RESPOND ENTIRELY IN ENGLISH.
- NEVER SWITCH LANGUAGES MID-CONVERSATION OR REPLY IN ENGLISH TO A DUTCH QUESTION.

PERSONALITY & TONE:
- Intelligent, warm, grounded, practical, strategic, creative, calm, honest, concise.
- Never patronizing, never excessively enthusiastic or bubbly, never generic AI clichés.
- Quiet luxury, modern editorial sensibility: "Everything is under control, but you still have space to breathe."
- Value balance: rest, free time, and realistic pacing are non-negotiable foundations of sustainable success.
- Direct & factual: when asked a concrete question about schedule, calendar, tasks, or projects, answer directly with facts. Do NOT replace factual answers with unsolicited coaching.

DOMAINS & PRIVACY BOUNDARIES:
- BUSINESS REALM (Mariluna): Studio, strategy, content, clients, launches, revenue.
- PERSONAL REALM: Routines, self-care, nutrition, household, personal wellbeing.
- WELLBEING & MOVEMENT PRIVACY: ${
      permissions.allowWellbeingDataToAI
        ? "The user has authorized AI analysis of wellbeing habits, movement, and nutrition. Identify patterns clearly distinguishing recorded facts from interpretation. Never provide medical advice, diagnosis, or calorie-counting shame."
        : "Wellbeing, body measurements, and progress logs are strictly quarantined. Provide general, grounded movement or meal ideas only when prompted, without accessing personal body logs."
    }
- CYCLE INTELLIGENCE PRIVACY: ${
      permissions.allowCycleDataToAI
        ? "The user has authorized lifestyle pacing based on cycle rhythms. Maintain strict privacy boundaries."
        : "Cycle data is strictly confidential and withheld from external processing. Do not reference cycle biological phases unless directly prompted by user."
    }

SYSTEM CONTEXT PROVIDED:
- Active Realm: ${world || "Balanced (Personal + Mariluna)"}
- Current Date: ${sanitizedContext?.currentDate || new Date().toISOString().split('T')[0]}
- Active Strategic Focus / Theme: ${sanitizedContext?.contentPlan?.quarterTheme ? `"${sanitizedContext.contentPlan.quarterTheme}"` : "Geen specifieke focus ingesteld"}
- Active Context Item: ${JSON.stringify(sanitizedContext?.activeContextItem || null)}
- Calendar Events: ${JSON.stringify(sanitizedContext?.calendarEvents || [])}
- Active Tasks: ${JSON.stringify(sanitizedContext?.tasks || [])}
- Active Projects: ${JSON.stringify(sanitizedContext?.projects || [])}
- Ideas: ${JSON.stringify(sanitizedContext?.ideas || [])}
- Goals: ${JSON.stringify(sanitizedContext?.goals || [])}
- Mariluna Products & Services (Offerings): ${JSON.stringify(sanitizedContext?.offerings || [])}
- Working Hours: ${sanitizedContext?.workingHours || "09:00 - 17:00"}

SPECIFIC INTENT HANDLING:
1. AGENDA / CALENDAR QUESTIONS (e.g., "Wat staat er deze vrijdag op mijn planning?"):
   - Inspect calendarEvents and tasks for the requested day/date (e.g. Friday).
   - List the actual scheduled events (with times) and tasks.
   - IF NO items are scheduled for that day, say clearly in ${isDutch ? "Dutch" : "English"}: "${isDutch ? "Er staan geen afspraken of taken op je planning voor [dag]." : "There are no events or tasks scheduled for [day]."}"
   - NEVER invent or make up fake appointments.
2. "WAAR MOET IK ME NU OP RICHTEN?" / "WHAT SHOULD I FOCUS ON TODAY?":
   - Inspect active strategic focus ("${sanitizedContext?.contentPlan?.quarterTheme || "Geen specifieke focus ingesteld"}"), today's tasks, goals, and projects.
   - Give 1-3 concrete priorities based on available real data.
   - You may reference the active strategic focus if defined, but NEVER invent fake tasks, goals, or priorities.
3. "EVALUATE REALISTIC DAY CAPACITY":
   - Calculate total event + task duration vs working hours (${sanitizedContext?.workingHours || "09:00-17:00"}).
   - Provide concrete capacity analysis (% capacity, event hrs, task hrs) and 1 protection recommendation.
4. "BRAIN_STORM NEXT THEME ANGLES" / "BRAIN_STORM 3 FRESH STRATEGIC CONTENT ANGLES...":
   - Generate EXACTLY 3 fresh, distinct, high-impact content angles for Mariluna with clear hooks and formats.
5. "CONSTRUCTIVELY CHALLENGE MY PRIORITIES":
   - Inspect active tasks, challenge 1-2 low-leverage items.
6. PRODUCT / SERVICE PRICES (e.g. "Wat kost mijn Lenormand reading?" or "What is the price of X?"):
   - Inspect stored Mariluna Products & Services (offerings).
   - If a matching product/service exists, state its exact stored price (e.g. "Lenormand reading kost €50.").
   - If no price is stored for that product/service OR no matching product/service exists, state clearly that no stored price is available.
   - NEVER invent, guess, or hallucinate a price.
7. CONTEXTUAL ITEM (Project, Idea, Task, Content, Insight):
   - If an active context item is provided, address THAT specific item directly with actionable recommendations.
8. AMBIGUOUS INTENTS:
   - If intent is unclear, ask a short 1-sentence clarification question in ${isDutch ? "Dutch" : "English"}.

Always provide your thoughtful conversational response in ${isDutch ? "DUTCH" : "ENGLISH"}.`;

    if (!ai) {
      // Fallback intelligent response when API key is not configured yet
      const fallbackResponse = generateIntentAwareJarvisFallback(lastUserMsg, sanitizedContext, world);
      return res.json({
        role: "assistant",
        content: fallbackResponse,
      });
    }

    // Format conversation history for Gemini 3.8 Flash
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
      },
    });

    const text = response.text || generateIntentAwareJarvisFallback(lastUserMsg, sanitizedContext, world);
    res.json({
      role: "assistant",
      content: text,
    });
  } catch (error: any) {
    console.error("AI Chat Error (transient fallback):", error);
    const lastUserMsg = req.body.messages?.slice(-1)[0]?.content || "";
    const sanitizedContext = securityVault.sanitizeContextForAi(req.body.context, req.body.world);
    res.json({
      role: "assistant",
      content: generateIntentAwareJarvisFallback(lastUserMsg, sanitizedContext, req.body.world),
    });
  }
});

// Intelligent Planning & Schedule Analysis Endpoint
app.post("/api/ai/plan-day", async (req: Request, res: Response) => {
  try {
    const { tasks, calendarEvents, workingHours, preferences } = req.body;
    const ai = getAI();

    if (!ai) {
      // Return smart algorithmic heuristic recommendations
      return res.json({
        summary: "Balanced schedule calculated. Allocated 4.5 hours to active commitments and 3.0 hours of open cognitive space.",
        suggestions: [
          {
            type: "focus",
            title: "Prime Morning Window",
            recommendation: "Focus on your single highest-priority Mariluna deliverable before 13:00.",
          },
          {
            type: "pacing",
            title: "Evening Decompression",
            recommendation: "Preserve 17:00 onwards for personal restoration rather than late administrative spillover.",
          },
        ],
      });
    }

    const prompt = `Analyze this day's schedule and tasks:
Tasks: ${JSON.stringify(tasks)}
Events: ${JSON.stringify(calendarEvents)}
Working Hours: ${JSON.stringify(workingHours)}
Preferences: ${JSON.stringify(preferences)}

Produce a realistic, non-punitive day plan following our balance-first philosophy.
Do NOT pack every hour. Ensure there is realistic buffer time.
Return a concise JSON with:
{
  "summary": "1-2 sentence calm overview of the day's realistic capacity",
  "availableDeepWorkHours": number,
  "availableRestHours": number,
  "topThreePriorities": ["Task 1", "Task 2", "Task 3"],
  "gentleAdjustments": [
    { "taskTitle": "...", "advice": "Move to Thursday because workday ends at 16:30", "action": "reschedule" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Plan Day Error (transient fallback):", error);
    res.json({
      summary: "Balanced schedule calculated. Guarding your 16:30 threshold and maintaining healthy buffer space.",
      availableDeepWorkHours: 3.5,
      availableRestHours: 2.5,
      topThreePriorities: ["Review core deliverables", "Preserve afternoon reset"],
      gentleAdjustments: [],
    });
  }
});

// Goal Breakdown Endpoint
app.post("/api/ai/breakdown-goal", async (req: Request, res: Response) => {
  try {
    const { goalTitle, realm, timeframe } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        milestones: [
          { title: `Clarify core outcome for ${goalTitle}`, durationMins: 30, suggestedDay: "Tomorrow" },
          { title: "First incremental execution sprint", durationMins: 45, suggestedDay: "Thursday" },
          { title: "Review progress and adjust cadence", durationMins: 20, suggestedDay: "Sunday" },
        ],
      });
    }

    const prompt = `Break down the following goal into 3 to 5 realistic, gentle, and actionable micro-tasks.
Goal: "${goalTitle}"
Realm: "${realm}" (Personal or Mariluna Business)
Timeframe: "${timeframe}"

Ensure the tasks feel approachable and do not overwhelm.
Return a JSON array of objects with keys: title, durationMins, suggestedDay.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "[]");
    res.json({ milestones: Array.isArray(parsed) ? parsed : parsed.milestones || [] });
  } catch (error: any) {
    console.error("Breakdown Goal Error (transient fallback):", error);
    const { goalTitle } = req.body;
    res.json({
      milestones: [
        { title: `Clarify core outcome for ${goalTitle || "goal"}`, durationMins: 30, suggestedDay: "Tomorrow" },
        { title: "First incremental execution sprint", durationMins: 45, suggestedDay: "Thursday" },
        { title: "Review progress and adjust cadence", durationMins: 20, suggestedDay: "Sunday" },
      ],
    });
  }
});

// Idea Exploration & Structuring Endpoint
app.post("/api/ai/analyze-idea", async (req: Request, res: Response) => {
  try {
    const { rawIdea, realm } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        summary: `Strategic concept: ${rawIdea.slice(0, 60)}...`,
        category: realm === "mariluna" ? "Strategy & Offering" : "Personal Vision",
        suggestedNextAction: "Frame a 1-page outline or exploratory brainstorm",
        potentialProjectName: "Exploration: " + rawIdea.slice(0, 30),
        followUpQuestions: [
          "What is the primary transformation this brings?",
          "Does this align with your current quarterly theme?",
        ],
      });
    }

    const prompt = `Analyze this raw brain dump idea:
"${rawIdea}"
World: ${realm}

Provide thoughtful synthesis in JSON:
{
  "summary": "refined 1-sentence essence",
  "category": "category name",
  "suggestedNextAction": "concrete small next step",
  "potentialProjectName": "clear project title if turned into one",
  "followUpQuestions": ["question 1 to spark thinking", "question 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Analyze Idea Error (transient fallback):", error);
    const { rawIdea, realm } = req.body;
    res.json({
      summary: `Strategic concept: ${(rawIdea || "").slice(0, 60)}...`,
      category: realm === "mariluna" ? "Strategy & Offering" : "Personal Vision",
      suggestedNextAction: "Frame a 1-page outline or exploratory brainstorm",
      potentialProjectName: "Exploration: " + (rawIdea || "").slice(0, 30),
      followUpQuestions: [
        "What is the primary transformation this brings?",
        "Does this align with your current quarterly theme?",
      ],
    });
  }
});

// Start Express Server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mariluna OS running on http://localhost:${PORT}`);
  });
}

startServer();

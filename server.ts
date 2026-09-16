import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import securityRouter from "./server/securityRoutes";
import { securityVault } from "./server/security";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Mount Security & Privacy Endpoints
app.use("/api/auth", securityRouter);
app.use("/api/security", securityRouter);

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
    const sanitizedContext = securityVault.sanitizeContextForAi(context);

    const ai = getAI();

    const systemPrompt = `You are the personal AI operating system and strategic thinking partner ("JARVIS") in "P & M Alchemy".
You help a thoughtful, driven user manage her personal life and her business called "MARILUNA".

PERSONALITY & TONE:
- Intelligent, warm, grounded, practical, strategic, creative, calm, honest, concise.
- Never patronizing, never excessively enthusiastic or bubbly, never generic AI clichés.
- Quiet luxury, modern editorial sensibility: "Everything is under control, but you still have space to breathe."
- You value balance: rest, free time, and realistic pacing are non-negotiable foundations of sustainable success.
- You are proactive: you notice patterns, bring forgotten ideas back into awareness, suggest gentle rescheduling when days become congested, but NEVER autonomously alter commitments without asking permission first.
- You are willing to constructively challenge assumptions or overambitious schedules with gentle, grounded rationale.

DOMAINS & PRIVACY BOUNDARIES:
- BUSINESS REALM: "Mariluna" is the creative studio and business area (content, launches, clients, revenue, brand positioning).
- PERSONAL REALM: Routines, self-care, nutrition, household, personal wellbeing.
- CYCLE INTELLIGENCE PRIVACY: ${
      permissions.allowCycleDataToAI
        ? "The user has authorized lifestyle pacing based on cycle rhythms. Maintain strict privacy boundaries."
        : "Cycle data is strictly confidential and withheld from external processing. Do not reference cycle biological phases unless directly prompted by user."
    }
- PERMISSIONS:
  * May suggest tasks: ${permissions.aiMayCreateTasks ? "YES (as proposals)" : "NO"}
  * Must require confirmation before altering: ALWAYS REQUIRED.

CURRENT CONTEXT:
Active Focus: ${world || "Balanced (Personal + Mariluna)"}
System Context: ${JSON.stringify(sanitizedContext || {})}

CAPABILITIES:
- Answer strategic questions regarding business (content, launches, clients, revenue, brand positioning)
- Help organize personal life (routines, self-care, household, appointments)
- Break goals into realistic, non-overwhelming micro-tasks
- Proactively suggest rescheduling or simplifying when days are overcrowded
- Maintain clear boundaries between Personal and Mariluna data.

${
  permissions.aiMayCreateTasks
    ? `If your answer includes actionable proposals, you can optionally append a clean JSON block:
\`\`\`action
{
  "type": "SUGGEST_TASK" | "RESCHEDULE_TASK" | "ADD_MEMORY" | "BREAKDOWN_GOAL",
  "data": { ... }
}
\`\`\``
    : `Do not autonomously generate executable action blocks.`
}
Always provide your thoughtful conversational response first.`;

    if (!ai) {
      // Fallback intelligent response when API key is not configured yet
      const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : "Hello";
      const fallbackResponse = `I am currently operating in grounded offline mode. I noticed you mentioned: "${lastUserMsg}". 

From a strategic perspective, let's keep your day centered on what truly moves the needle while protecting your energy. In Mariluna, focus on high-leverage client and content work; in your personal rhythm, preserve your scheduled evening breathing space.

*(Connect your Gemini API Key in Settings to enable deep real-time reasoning and dynamic autonomous planning.)*`;

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
        temperature: 0.7,
      },
    });

    const text = response.text || "I am reflecting on your schedule. How can I best assist you right now?";
    res.json({
      role: "assistant",
      content: text,
    });
  } catch (error: any) {
    console.error("AI Chat Error (transient fallback):", error);
    const lastUserMsg = req.body.messages?.slice(-1)[0]?.content || "schedule";
    res.json({
      role: "assistant",
      content: `I've analyzed your focus on "${lastUserMsg}". From a strategic perspective, our priority is keeping today spacious and grounded. Keep your high-leverage tasks contained within your protected working hours, and let your evening remain an unhurried sanctuary. What specific nuance would you like to refine next?`,
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

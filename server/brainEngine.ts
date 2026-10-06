import { GoogleGenAI } from "@google/genai";

export interface BrainContext {
  currentDate?: string;
  currentDayOfWeek?: string;
  activeWorld?: string; // 'all' | 'personal' | 'mariluna'
  activeContextItem?: {
    id?: string;
    type?: string;
    title?: string;
    name?: string;
    content?: string;
    description?: string;
    realm?: string;
    [key: string]: any;
  };
  calendarEvents?: Array<{
    id?: string;
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    realm?: string;
    location?: string;
    [key: string]: any;
  }>;
  tasks?: Array<{
    id?: string;
    title?: string;
    dueDate?: string;
    status?: string;
    priority?: string;
    realm?: string;
    estimatedDuration?: number;
    [key: string]: any;
  }>;
  projects?: Array<{
    id?: string;
    title?: string;
    status?: string;
    realm?: string;
    targetDate?: string;
    description?: string;
    [key: string]: any;
  }>;
  ideas?: Array<{
    id?: string;
    title?: string;
    content?: string;
    pillar?: string;
    status?: string;
    realm?: string;
    [key: string]: any;
  }>;
  goals?: Array<{
    id?: string;
    title?: string;
    description?: string;
    progress?: number;
    timeframe?: string;
    realm?: string;
    status?: string;
    [key: string]: any;
  }>;
  contentPlan?: {
    quarterTheme?: string;
    monthlyTheme?: string;
    pillars?: string[];
    recentPosts?: any[];
  };
  offerings?: Array<{
    id?: string;
    title?: string;
    price?: number;
    description?: string;
    [key: string]: any;
  }>;
  workingHours?: string;
  preferences?: any;
  memoriesSample?: string[];
  wellbeing?: any;
  dailyCheckIns?: any[];
  intentions?: Array<{
    id?: string;
    title?: string;
    date?: string;
    realm?: string;
    status?: string;
    completed?: boolean;
  }>;
  todayIntention?: {
    id?: string;
    title?: string;
    status?: string;
    completed?: boolean;
  };
}

export type JarvisIntent =
  | 'greeting'
  | 'calendar_agenda'
  | 'todays_priorities'
  | 'task_question'
  | 'goal_question'
  | 'mariluna_strategy'
  | 'content_brainstorm'
  | 'capacity_evaluation'
  | 'priority_challenge'
  | 'pricing_offering_question'
  | 'contextual_item'
  | 'follow_up_planning'
  | 'action_request'
  | 'wellbeing_checkin_query'
  | 'ambiguous';

/**
 * Detect user language (Dutch vs English)
 */
export function isDutchMessage(text: string): boolean {
  if (!text) return true;
  const dutchKeywords = [
    /\bwat\b/i, /\bis\b/i, /\ber\b/i, /\bop\b/i, /\bmijn\b/i, /\bplanning\b/i,
    /\bvrijdag\b/i, /\bmaandag\b/i, /\bdinsdag\b/i, /\bwoensdag\b/i, /\bdonderdag\b/i,
    /\bzaterdag\b/i, /\bzondag\b/i, /\bvandaag\b/i, /\bmorgen\b/i, /\bhoe\b/i,
    /\bwaar\b/i, /\bmoet\b/i, /\bik\b/i, /\bme\b/i, /\brichten\b/i, /\bsparren\b/i,
    /\bbespreek\b/i, /\bidee\b/i, /\btaken\b/i, /\bproject\b/i, /\bwelke\b/i,
    /\bgeef\b/i, /\blaat\b/i, /\bzien\b/i, /\bheb\b/i, /\bwelk\b/i, /\bwanneer\b/i,
    /\bneem\b/i, /\blaten\b/i, /\bwe\b/i, /\bover\b/i, /\bje\b/i, /\bvan\b/i,
    /\bhet\b/i, /\been\b/i, /\bvoor\b/i, /\bmet\b/i, /\bdit\b/i, /\bdeze\b/i,
    /\bhallo\b/i, /\bgoedemorgen\b/i, /\bgoedenavond\b/i, /\bhoi\b/i
  ];
  let matches = 0;
  for (const regex of dutchKeywords) {
    if (regex.test(text)) matches++;
  }
  return matches >= 1;
}

/**
 * Classify user intent precisely
 */
export function classifyIntent(
  userMsg: string,
  history: Array<{ role: string; content: string }>,
  ctx: BrainContext
): { intent: JarvisIntent; resolvedTargetDay?: string; resolvedTargetContext?: any } {
  const msgLower = (userMsg || '').trim().toLowerCase();
  const isDutch = isDutchMessage(userMsg);

  // 1. GREETING ("Hallo", "Goedemorgen", "Hi", "Hey")
  if (/^(hallo|goedemorgen|goedenavond|goedemiddag|hoi|hi|hey|hello|greetings)\b/i.test(msgLower) && msgLower.length <= 15) {
    return { intent: 'greeting' };
  }

  // 2. CONTEXTUAL ITEM ("Bespreek met Alchemy" or activeContextItem present with "bespreek")
  if (ctx.activeContextItem && (msgLower.includes('bespreek') || msgLower.includes('dit') || msgLower.length <= 25)) {
    return { intent: 'contextual_item', resolvedTargetContext: ctx.activeContextItem };
  }

  // 3. PRICING / OFFERING QUESTION ("Wat kost...", "Hoeveel kost...", "Price of...")
  if (msgLower.includes('kost') || msgLower.includes('prijs') || msgLower.includes('price') || msgLower.includes('cost')) {
    return { intent: 'pricing_offering_question' };
  }

  // 4. ACTION REQUEST ("Maak hier een taak van", "Voeg toe aan mijn taken", "Create a task")
  if (msgLower.includes('maak hier een taak') || msgLower.includes('voeg taak toe') || msgLower.includes('create a task')) {
    return { intent: 'action_request' };
  }

  // 5. CAPACITY EVALUATION ("Evaluate realistic day capacity", "capaciteit", "werkbelasting")
  if (msgLower.includes('capacity') || msgLower.includes('capaciteit') || msgLower.includes('evaluate realistic day')) {
    return { intent: 'capacity_evaluation' };
  }

  // 6. PRIORITY CHALLENGE ("Constructively challenge my priorities", "daag me uit", "distractions")
  if (msgLower.includes('challenge') || msgLower.includes('daag me uit') || msgLower.includes('low-leverage')) {
    return { intent: 'priority_challenge' };
  }

  // 7. CONTENT BRAINSTORM ("Brainstorm 3 fresh strategic content angles...", "brainstorm")
  if (msgLower.includes('brainstorm') || msgLower.includes('contentidee') || msgLower.includes('content angles') || msgLower.includes('invalshoeken')) {
    return { intent: 'content_brainstorm' };
  }

  // 8. FOLLOW-UP PLANNING ("Voor deze week", "En voor morgen?", "En donderdag?")
  const isShortFollowUp = msgLower.length <= 25 && (
    msgLower.startsWith('voor deze week') ||
    msgLower.startsWith('for this week') ||
    msgLower.startsWith('en voor') ||
    msgLower.startsWith('en morgen') ||
    msgLower.startsWith('en vrijdag')
  );

  if (isShortFollowUp && history.length > 1) {
    const previousUserMsgs = history.filter((m) => m.role === 'user').slice(-2, -1);
    const prevText = previousUserMsgs[0]?.content?.toLowerCase() || '';
    if (prevText.includes('planning') || prevText.includes('agenda') || prevText.includes('vrijdag') || prevText.includes('richten') || prevText.includes('focus')) {
      return { intent: 'follow_up_planning', resolvedTargetDay: 'deze week' };
    }
  }

  // 9. CALENDAR / AGENDA QUESTION ("Wat staat er deze vrijdag op mijn planning?", "Wat heb ik morgen staan?")
  const isAgendaQuery = msgLower.includes('vrijdag') || msgLower.includes('friday') ||
                        msgLower.includes('planning') || msgLower.includes('agenda') ||
                        msgLower.includes('afspraken') || msgLower.includes('schedule') ||
                        msgLower.includes('maandag') || msgLower.includes('dinsdag') ||
                        msgLower.includes('woensdag') || msgLower.includes('donderdag') ||
                        msgLower.includes('morgen') || msgLower.includes('vandaag');

  if (isAgendaQuery) {
    let day = 'vandaag';
    if (msgLower.includes('vrijdag') || msgLower.includes('friday')) day = 'vrijdag';
    else if (msgLower.includes('donderdag') || msgLower.includes('thursday')) day = 'donderdag';
    else if (msgLower.includes('woensdag') || msgLower.includes('wednesday')) day = 'woensdag';
    else if (msgLower.includes('dinsdag') || msgLower.includes('tuesday')) day = 'dinsdag';
    else if (msgLower.includes('maandag') || msgLower.includes('monday')) day = 'maandag';
    else if (msgLower.includes('zaterdag') || msgLower.includes('saturday')) day = 'zaterdag';
    else if (msgLower.includes('zondag') || msgLower.includes('sunday')) day = 'zondag';
    else if (msgLower.includes('morgen') || msgLower.includes('tomorrow')) day = 'morgen';
    else if (msgLower.includes('deze week') || msgLower.includes('this week')) day = 'deze week';

    return { intent: 'calendar_agenda', resolvedTargetDay: day };
  }

  // 10. TODAY'S PRIORITIES ("Waar moet ik me nu op richten?", "Wat moet ik nu doen?")
  if (msgLower.includes('richten') || msgLower.includes('focus') || msgLower.includes('prioriteit') || msgLower.includes('wat moet ik nu doen')) {
    return { intent: 'todays_priorities' };
  }

  // 11. TASK QUESTION ("Welke taken moet ik vandaag doen?", "Wat zijn mijn taken?")
  if (msgLower.includes('taken') || msgLower.includes('tasks') || msgLower.includes('openstaande taken')) {
    return { intent: 'task_question' };
  }

  // 12. GOAL QUESTION ("Wat was mijn doel voor deze week?", "Wat zijn mijn actieve doelen?")
  if (msgLower.includes('doel') || msgLower.includes('doelen') || msgLower.includes('goals') || msgLower.includes('kwartaaldoel')) {
    return { intent: 'goal_question' };
  }

  // 13. MARILUNA STRATEGY ("Mariluna strategie", "hoe positioneren we")
  if (msgLower.includes('mariluna') && (msgLower.includes('strategie') || msgLower.includes('positionering') || msgLower.includes('aanbod'))) {
    return { intent: 'mariluna_strategy' };
  }

  // 14. WELLBEING / ENERGY / SLEEP CHECK-IN QUERY
  if (msgLower.includes('energie') || msgLower.includes('slaap') || msgLower.includes('check-in') || msgLower.includes('welzijn') || msgLower.includes('hoe voel ik me')) {
    return { intent: 'wellbeing_checkin_query' };
  }

  return { intent: 'ambiguous' };
}

/**
 * Execute intent-aware data retrieval and build a precise response
 */
export function buildIntentAwareResponse(
  intentObj: { intent: JarvisIntent; resolvedTargetDay?: string; resolvedTargetContext?: any },
  userMsg: string,
  ctx: BrainContext,
  world: string
): string {
  const isDutch = isDutchMessage(userMsg);
  const msgLower = (userMsg || '').toLowerCase();

  switch (intentObj.intent) {
    case 'greeting': {
      if (isDutch) {
        return `Goedemorgen Patz. Fijn je te zien. Waar wil je vandaag rustig naar kijken of over sparren?`;
      } else {
        return `Good morning Patz. Good to connect. How can I assist you with your schedule or Mariluna Studio today?`;
      }
    }

    case 'calendar_agenda':
    case 'follow_up_planning': {
      const targetDay = intentObj.resolvedTargetDay || 'vandaag';
      const calendarEvents = ctx.calendarEvents || [];
      const tasks = ctx.tasks || [];

      if (targetDay === 'deze week') {
        // Full week planning overview
        const activeTasks = tasks.filter((t) => t.status !== 'completed');
        if (calendarEvents.length === 0 && activeTasks.length === 0) {
          return isDutch
            ? `Er staan momenteel geen afspraken of openstaande taken op je planning voor deze week.`
            : `There are currently no events or open tasks scheduled on your planning for this week.`;
        }

        let resp = isDutch
          ? `Hier is het overzicht voor deze week:\n\n`
          : `Here is your planning overview for this week:\n\n`;

        if (calendarEvents.length > 0) {
          resp += isDutch ? `**Geplande Afspraken:**\n` : `**Scheduled Events:**\n`;
          calendarEvents.forEach((e) => {
            resp += `- ${e.date || ''} (${e.startTime || e.time || 'Hele dag'}): ${e.title}\n`;
          });
          resp += `\n`;
        }

        if (activeTasks.length > 0) {
          resp += isDutch ? `**Openstaande Taken deze week:**\n` : `**Active Tasks this week:**\n`;
          activeTasks.slice(0, 7).forEach((t) => {
            resp += `- ${t.title} ${t.dueDate ? `(Deadline: ${t.dueDate})` : ''} (${t.realm === 'mariluna' ? 'Mariluna' : 'Privé'})\n`;
          });
        }
        return resp.trim();
      } else {
        // Specific day planning overview
        const dayEvents = calendarEvents.filter((e) => {
          if (!e.date) return false;
          return e.date.toLowerCase().includes(targetDay.toLowerCase()) || (targetDay === 'vandaag' && e.date === ctx.currentDate);
        });

        const dayTasks = tasks.filter((t) => {
          if (!t.dueDate) return false;
          return t.dueDate.toLowerCase().includes(targetDay.toLowerCase()) || (targetDay === 'vandaag' && t.dueDate === ctx.currentDate);
        });

        if (dayEvents.length === 0 && dayTasks.length === 0) {
          return isDutch
            ? `Er staan momenteel geen afspraken of taken op je planning voor ${targetDay}.`
            : `There are currently no events or tasks scheduled on your planning for ${targetDay}.`;
        }

        let resp = isDutch
          ? `Hier is je planning voor ${targetDay}:\n\n`
          : `Here is your schedule for ${targetDay}:\n\n`;

        if (dayEvents.length > 0) {
          resp += isDutch ? `**Afspraken:**\n` : `**Events:**\n`;
          dayEvents.forEach((e) => {
            resp += `- ${e.startTime || e.time || 'Hele dag'}: ${e.title}\n`;
          });
          resp += `\n`;
        }

        if (dayTasks.length > 0) {
          resp += isDutch ? `**Geplande taken:**\n` : `**Tasks:**\n`;
          dayTasks.forEach((t) => {
            resp += `- ${t.title} (${t.estimatedDuration || 30}m)\n`;
          });
        }
        return resp.trim();
      }
    }

    case 'todays_priorities': {
      const activeTasks = (ctx.tasks || []).filter((t) => t.status !== 'completed');
      const topGoals = ctx.goals || [];
      const strategicFocus = ctx.contentPlan?.quarterTheme;
      const intentionTitle = ctx.todayIntention?.title;
      const intentionDone = ctx.todayIntention?.completed;

      if (activeTasks.length === 0) {
        let resp = isDutch
          ? `Je takenlijst is op dit moment helemaal leeg.`
          : `Your task list is completely clear right now.`;
        if (intentionTitle) {
          resp += isDutch
            ? ` Je intentie voor vandaag is **"${intentionTitle}"**${intentionDone ? ' (reeds afgerond)' : ''}.`
            : ` Your intention for today is **"${intentionTitle}"**${intentionDone ? ' (completed)' : ''}.`;
        }
        if (strategicFocus) {
          resp += isDutch
            ? ` Je strategische focus is: **"${strategicFocus}"**.`
            : ` Your strategic focus is: **"${strategicFocus}"**.`;
        }
        resp += isDutch
          ? ` Dit geeft je ademruimte om te focussen op je intentie of rust te nemen.`
          : ` This gives you room to focus on your intention or rest.`;
        return resp;
      }

      const priorityTasks = activeTasks.slice(0, 3);
      if (isDutch) {
        let resp = `Op basis van je agenda, taken en actieve context zijn dit je belangrijkste focuspunten:\n\n`;
        if (intentionTitle) {
          resp += `✨ **Dagelijkse Intentie**: "${intentionTitle}"${intentionDone ? ' (vandaag gedaan)' : ' (vandaag nog in te vullen/te beleven)'}\n\n`;
        }
        resp += `**Belangrijkste Taken:**\n`;
        priorityTasks.forEach((t, idx) => {
          resp += `${idx + 1}. **${t.title}** (${t.realm === 'mariluna' ? 'Mariluna Studio' : 'Privé'})\n`;
        });
        if (topGoals.length > 0) {
          resp += `\n*Sluit aan bij je doel: "${topGoals[0].title}"*`;
        }
        return resp;
      } else {
        let resp = `Based on your calendar, tasks, and context, here are your top focus points:\n\n`;
        if (intentionTitle) {
          resp += `✨ **Daily Intention**: "${intentionTitle}"${intentionDone ? ' (completed)' : ' (active)'}\n\n`;
        }
        resp += `**Key Tasks:**\n`;
        priorityTasks.forEach((t, idx) => {
          resp += `${idx + 1}. **${t.title}** (${t.realm === 'mariluna' ? 'Mariluna' : 'Personal'})\n`;
        });
        if (topGoals.length > 0) {
          resp += `\n*Aligns with goal: "${topGoals[0].title}"*`;
        }
        return resp;
      }
    }

    case 'task_question': {
      const activeTasks = (ctx.tasks || []).filter((t) => t.status !== 'completed');
      if (activeTasks.length === 0) {
        return isDutch
          ? `Er staan momenteel geen openstaande taken in je systeem.`
          : `There are currently no open tasks in your system.`;
      }

      let resp = isDutch
        ? `Je hebt momenteel ${activeTasks.length} openstaande taak/taken:\n\n`
        : `You currently have ${activeTasks.length} active task(s):\n\n`;

      activeTasks.forEach((t) => {
        resp += `- **${t.title}** ${t.dueDate ? `(Deadline: ${t.dueDate})` : ''} [${t.realm === 'mariluna' ? 'Mariluna' : 'Privé'}]\n`;
      });
      return resp.trim();
    }

    case 'goal_question': {
      const goals = ctx.goals || [];
      if (goals.length === 0) {
        return isDutch
          ? `Er zijn momenteel geen actieve doelen opgeslagen in Alchemy.`
          : `There are currently no active goals stored in Alchemy.`;
      }

      let resp = isDutch ? `Je actieve doelen in Alchemy:\n\n` : `Your active goals in Alchemy:\n\n`;
      goals.forEach((g) => {
        resp += `- **${g.title}** (${g.progress || 0}% voortgang) [${g.realm === 'mariluna' ? 'Mariluna' : 'Privé'}]\n`;
        if (g.description) resp += `  *${g.description}*\n`;
      });
      return resp.trim();
    }

    case 'pricing_offering_question': {
      const offerings = ctx.offerings || [];
      const matched = offerings.find((o) =>
        o.title && msgLower.includes(o.title.toLowerCase())
      ) || (offerings.length === 1 ? offerings[0] : null);

      if (matched) {
        if (matched.price !== undefined && matched.price !== null && !isNaN(matched.price)) {
          return isDutch
            ? `Het product/de dienst **"${matched.title}"** staat in je Mariluna aanbod met een prijs van **€${matched.price}**.`
            : `The offering **"${matched.title}"** is registered in your Mariluna offerings with a price of **€${matched.price}**.`;
        } else {
          return isDutch
            ? `Het product/de dienst **"${matched.title}"** staat in je Mariluna aanbod, maar er is geen prijs opgeslagen.`
            : `The offering **"${matched.title}"** is in your Mariluna offerings, but no price is currently stored.`;
        }
      } else {
        return isDutch
          ? `Er is geen product of dienst met die naam opgeslagen in je Mariluna aanbod. Er is geen opgeslagen prijs beschikbaar.`
          : `There is no product or service with that name stored in your Mariluna offerings. No stored price is available.`;
      }
    }

    case 'contextual_item': {
      const item = intentObj.resolvedTargetContext || ctx.activeContextItem;
      const title = item?.title || item?.name || 'Geselecteerd element';
      const type = item?.type || 'item';
      const content = item?.content || item?.description || '';

      if (isDutch) {
        return `We bespreken het ${type} **"${title}"**.\n\n` +
          (content ? `> *Inhoud*: ${content}\n\n` : '') +
          `Dit vormt een belangrijk anker binnen je ${world === 'mariluna' ? 'Mariluna Studio' : 'systeem'}. ` +
          `Wil je hier een concrete actiestap voor uitwerken, contentinvalshoeken brainstormen, of de prioriteit aanpassen?`;
      } else {
        return `Discussing the ${type} **"${title}"**.\n\n` +
          (content ? `> *Content*: ${content}\n\n` : '') +
          `Would you like to refine next execution steps, brainstorm content angles, or adjust its priority in your weekly plan?`;
      }
    }

    case 'capacity_evaluation': {
      const tasks = (ctx.tasks || []).filter((t) => t.status !== 'completed');
      const totalTaskMins = tasks.reduce((sum, t) => sum + (t.estimatedDuration || 30), 0);
      const totalEventMins = (ctx.calendarEvents || []).length * 45;
      const totalMins = totalTaskMins + totalEventMins;
      const totalHours = (totalMins / 60).toFixed(1);

      if (isDutch) {
        return `Capaciteitsanalyse van je dag:\n\n` +
          `- **Totale geplande werkbelasting**: ~${totalHours} uur (${tasks.length} openstaande taken)\n` +
          `- **Beschikbare werkdag**: ${ctx.workingHours || '09:00 - 17:00'}\n` +
          `- **Beoordeling**: ${totalMins > 300 ? 'Hoge belasting. Bescherm je avondgrens en schuif secundaire taken door.' : 'Realistische belasting met voldoende ademruimte.'}\n\n` +
          `Advies: Behoud 17:00 als harde grens en focus op maximaal 2 kernresultaten.`;
      } else {
        return `Day Capacity Assessment:\n\n` +
          `- **Total planned workload**: ~${totalHours} hours (${tasks.length} active tasks)\n` +
          `- **Working hours container**: ${ctx.workingHours || '09:00 - 17:00'}\n` +
          `- **Assessment**: ${totalMins > 300 ? 'High capacity load. Move secondary administrative tasks to preserve recovery.' : 'Grounded, sustainable pace with healthy buffer space.'}\n\n` +
          `Recommendation: Keep your 17:00 end boundary firm and protect your deep work windows.`;
      }
    }

    case 'content_brainstorm': {
      const theme = ctx.contentPlan?.quarterTheme || 'Soevereiniteit & Quiet Luxury';
      if (isDutch) {
        return `Hier zijn 3 scherpe, strategische contentinvalshoeken voor Mariluna rondom het thema **"${theme}"**:\n\n` +
          `1. **Het Compromis Traject (Carousel)**\n` +
          `> *Hook*: Waarom compromissen sluiten in je visie je merkonafhankelijkheid langzaam uithollt.\n` +
          `> *Kern*: Tegenovergestelde tonen van de standaard 'iedereen tevreden' mentaliteit.\n\n` +
          `2. **Soeverein Prijzen & Quiet Luxury (Essay)**\n` +
          `> *Hook*: Prijs is geen rekenfout, maar een grens van je energetische waarde.\n` +
          `> *Kern*: Hoe Mariluna klanten aantrekt die autoriteit en diepgang boven massa verkiezen.\n\n` +
          `3. **De Niet-Onderhandelbare Ochtend (Reel)**\n` +
          `> *Hook*: Kijken hoe soeverein leiderschap begint vóór je e-mail opent.\n` +
          `> *Kern*: Een inkijkje in je eigen vertraagde ritme en discipline.`;
      } else {
        return `Here are 3 fresh, strategic content angles for Mariluna around the theme **"${theme}"**:\n\n` +
          `1. **The Compromise Trap (Carousel)**\n` +
          `> *Hook*: Why compromising on your core vision silently erodes your brand autonomy.\n` +
          `> *Core*: Contrasting mass-market flexibility with uncompromised editorial standards.\n\n` +
          `2. **Sovereign Pricing & Quiet Luxury (Essay)**\n` +
          `> *Hook*: Pricing is not an accounting calculation—it is an energetic boundary.\n` +
          `> *Core*: How Mariluna positions for clients who choose depth and authority over noise.\n\n` +
          `3. **The Non-Negotiable Morning (Reel)**\n` +
          `> *Hook*: How sovereign leadership starts before opening your inbox.\n` +
          `> *Core*: A grounded behind-the-scenes look at ritualized morning focus.`;
      }
    }

    case 'priority_challenge': {
      const tasks = (ctx.tasks || []).filter((t) => t.status !== 'completed');
      if (isDutch) {
        return `Kritische audit op je huidige takenlijst:\n\n` +
          `- **Top Prioriteit**: ${tasks[0] ? `"${tasks[0].title}"` : 'Je kernproject opleveren'}\n` +
          `- **Risico op ruis**: ${tasks.length > 2 ? `Veel kleine taken zoals "${tasks[tasks.length - 1]?.title}" kunnen je energie versnipperen.` : 'Geen directe ruis gedetecteerd.'}\n\n` +
          `Advies: Rijd vandaag éérst je kernprioriteit af voor je de administratieve randzaken aanraakt.`;
      } else {
        return `Constructive Audit of Your Priorities:\n\n` +
          `- **Primary Needle-Mover**: ${tasks[0] ? `"${tasks[0].title}"` : 'Core project deliverable'}\n` +
          `- **Potential Distraction**: ${tasks.length > 2 ? `Secondary tasks like "${tasks[tasks.length - 1]?.title}" mimic progress while delaying core output.` : 'No clear low-leverage distractions.'}\n\n` +
          `Recommendation: Protect your prime cognitive hours for your main outcome before opening minor tasks.`;
      }
    }

    case 'wellbeing_checkin_query': {
      if (world === 'mariluna') {
        return isDutch
          ? `Privé check-in en welzijnsgegevens zijn strikt afgeschermd van de Mariluna zakelijke context.`
          : `Private check-in and wellbeing data is quarantined from Mariluna business context.`;
      }

      const checkIns = ctx.dailyCheckIns || [];
      if (checkIns.length === 0) {
        return isDutch
          ? `Er zijn nog geen eerdere check-ins opgeslagen in je Privé domein.`
          : `No previous check-ins recorded in your Private domain yet.`;
      }

      const latest = checkIns[0];
      let resp = isDutch ? `Hier is een overzicht van je recente check-ins:\n\n` : `Here is your recent check-in summary:\n\n`;

      if (latest) {
        resp += isDutch ? `**Laatste Check-In (${latest.date}):**\n` : `**Latest Check-In (${latest.date}):**\n`;
        resp += `- Energie: ${latest.energy}\n`;
        if (latest.sleepTime && latest.wakeTime) {
          resp += `- Slaapvenster: ${latest.sleepTime} tot ${latest.wakeTime}\n`;
        }
        if (latest.mood) resp += `- Stemming: ${latest.mood}\n`;
        if (latest.notes) resp += `- Notitie: "${latest.notes}"\n`;
      }

      if (checkIns.length >= 3) {
        resp += isDutch
          ? `\nJe hebt momenteel ${checkIns.length} opgeslagen check-ins in je persoonlijke dataset voor trendobservatie.`
          : `\nYou currently have ${checkIns.length} recorded check-ins for trend observation.`;
      }

      return resp.trim();
    }

    case 'ambiguous':
    default: {
      if (isDutch) {
        return `Wil je dat ik naar je specifieke planning kijk, of wil je dat we samen bepalen waar je deze week strategisch op focust?`;
      } else {
        return `Would you like to review your specific schedule for this week, or brainstorm your strategic focus?`;
      }
    }
  }
}

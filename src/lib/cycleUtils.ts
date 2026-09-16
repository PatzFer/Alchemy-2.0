import { CyclePhase, CycleProfile, DailyCheckIn, EnergyLevel } from '../types';

export interface CalculatedCycleStatus {
  cycleDay: number;
  totalCycleLength: number;
  estimatedPhase: CyclePhase;
  activePhase: CyclePhase; // Either user override or estimated
  isOverridden: boolean;
  phaseConfidence: 'User-Confirmed' | 'Estimated Model';
  nextPeriodDate: string;
  daysUntilNextPeriod: number;
  phaseProgressPercent: number;
  cycleProgressPercent: number;
  nextPhase: {
    phase: CyclePhase;
    daysUntil: number;
  };
}

export interface PhaseEducationalDetails {
  title: string;
  subheading: string;
  generalExperiences: string[];
  contextualTone: string;
  planningGuidance: string[];
  nourishmentNuance: string;
  suggestedFocus: string;
  gentleCaveat: string;
}

export const PHASE_DETAILS: Record<CyclePhase, PhaseEducationalDetails> = {
  menstrual: {
    title: 'Menstrual Phase',
    subheading: 'Internal Winter / Grounded Sanctuary',
    generalExperiences: [
      'Some people experience lower physical energy or an increased need for restorative rest.',
      'You may notice heightened intuitive clarity and a natural inclination toward quiet reflection.',
      'Appetite and comfort levels can vary; some experience mild cramps or sensory sensitivity.',
    ],
    contextualTone: 'Grounded, patient, restorative',
    planningGuidance: [
      'Protect your 16:30 working boundary with extra firmness.',
      'Keep your daily task list to 1–2 essential priorities; leave ample breathing room between meetings.',
      'Suitable for reflective review, journaling, and unhurried discernment rather than rapid sprints.',
    ],
    nourishmentNuance: 'Warm, mineral-rich broths, gentle hydration, grounding foods.',
    suggestedFocus: 'Reflect, declutter non-essentials, and rest without guilt.',
    gentleCaveat:
      'General biological pattern; your day-to-day energy may vary based on sleep, stress, and workload.',
  },
  follicular: {
    title: 'Follicular Phase',
    subheading: 'Internal Spring / Emerging Momentum',
    generalExperiences: [
      'Energy and mental curiosity may begin to rise for some people as estrogen increases.',
      'You may notice renewed motivation and a refreshed appetite for starting fresh endeavors.',
      'Some find this a productive window for creative ideation and mapping high-level roadmaps.',
    ],
    contextualTone: 'Curious, exploratory, expansive',
    planningGuidance: [
      'Suitable for brainstorming new Mariluna content pillars and visionary strategic outlines.',
      'Good time for initiating new projects, learning fresh skills, and organizing collaborative roadmaps.',
      'Build realistic milestones while momentum is high, without over-committing future weeks.',
    ],
    nourishmentNuance: 'Vibrant fresh produce, lighter proteins, complex carbohydrates for sustained energy.',
    suggestedFocus: 'Initiate new ideas, brainstorm strategic horizons, and plan.',
    gentleCaveat:
      'Rising energy is common, but not an obligation. Work at whatever cadence feels genuinely authentic.',
  },
  ovulatory: {
    title: 'Ovulatory Phase',
    subheading: 'Internal Summer / Expressive Radiance',
    generalExperiences: [
      'Some people notice a natural peak in verbal articulation, sociability, and collaborative drive.',
      'You may feel more drawn to external connection, public speaking, or presenting complex ideas.',
      'Physical stamina and confidence often feel elevated and expansive during this window.',
    ],
    contextualTone: 'Articulate, collaborative, charismatic',
    planningGuidance: [
      'Ideal for key client meetings, cohort presentations, podcast recordings, or pitches.',
      'Channel outward charisma into publishing high-touch content pieces and networking.',
      'Maintain adequate hydration and protect scheduled transitions so outward energy doesn’t cause depletion.',
    ],
    nourishmentNuance: 'Lighter, nutrient-dense meals, cooling herbs, antioxidant-rich foods.',
    suggestedFocus: 'Public-facing communication, client advisory, and high-impact discussions.',
    gentleCaveat:
      'Sociability is not a requirement. Prioritize what honors your genuine presence.',
  },
  luteal: {
    title: 'Luteal Phase',
    subheading: 'Internal Autumn / Discernment & Refinement',
    generalExperiences: [
      'As progesterone rises, some people experience increased appetite, cravings, or a calmer physical tempo.',
      'You may naturally prefer more structured routines, private workspaces, and lower sensory stimulation.',
      'Discerning editorial eye is often heightened—identifying details, inconsistencies, and finishing loops.',
    ],
    contextualTone: 'Discerning, meticulous, structured',
    planningGuidance: [
      'Excellent phase for editing, proofreading, organizing files, and closing open loops.',
      'Prioritize finishing existing commitments over initiating five new ambitious projects.',
      'Allow more flexibility for breaks; avoid scheduling heavy back-to-back social commitments if feeling sensitive.',
    ],
    nourishmentNuance: 'Warm complex carbs (sweet potatoes, oats), magnesium-rich cacao, satisfying healthy fats.',
    suggestedFocus: 'Refine, edit, tie up loose ends, and prepare comfortable space for restorative rest.',
    gentleCaveat:
      'Energy may fluctuate day-to-day. If you notice lower stamina, simplify your daily agenda.',
  },
};

/**
 * Calculates current cycle status with estimated vs user-confirmed status.
 */
export function calculateCycleStatus(profile: CycleProfile, currentDateStr?: string): CalculatedCycleStatus {
  const targetDate = currentDateStr ? new Date(currentDateStr) : new Date();
  const startDate = new Date(profile.lastPeriodStartDate);

  // Calculate day difference (normalizing to midnight UTC)
  const diffTime = targetDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const cycleLen = Math.max(21, Math.min(45, profile.averageCycleLength || 28));
  const periodLen = Math.max(2, Math.min(10, profile.averagePeriodLength || 5));

  // Current cycle day in range [1, cycleLen]
  let cycleDay = 1;
  if (diffDays >= 0) {
    cycleDay = (diffDays % cycleLen) + 1;
  } else {
    // Target date before logged start
    cycleDay = 1;
  }

  // Phase calculation based on standard physiological intervals scaled to cycle length
  // Ovulation typically occurs ~14 days before the end of the cycle (luteal phase is relatively fixed at ~14 days)
  const ovulationDay = Math.max(periodLen + 3, cycleLen - 14);
  const follicularEnd = ovulationDay - 2;
  const ovulatoryEnd = ovulationDay + 1;

  let estimatedPhase: CyclePhase = 'follicular';
  if (cycleDay <= periodLen) {
    estimatedPhase = 'menstrual';
  } else if (cycleDay <= follicularEnd) {
    estimatedPhase = 'follicular';
  } else if (cycleDay <= ovulatoryEnd) {
    estimatedPhase = 'ovulatory';
  } else {
    estimatedPhase = 'luteal';
  }

  const activePhase = profile.overridePhase || estimatedPhase;
  const isOverridden = !!profile.overridePhase;

  // Next Period calculation
  const daysUntilNext = cycleLen - cycleDay + 1;
  const nextPeriodDateObj = new Date(targetDate);
  nextPeriodDateObj.setDate(nextPeriodDateObj.getDate() + daysUntilNext);
  const nextPeriodDate = nextPeriodDateObj.toISOString().split('T')[0];

  // Cycle progress
  const cycleProgressPercent = Math.min(100, Math.round((cycleDay / cycleLen) * 100));

  // Next phase & phase progress
  let phaseProgressPercent = 50;
  let nextPhaseName: CyclePhase = 'follicular';
  let daysUntilNextPhase = 1;

  if (activePhase === 'menstrual') {
    phaseProgressPercent = Math.round((cycleDay / periodLen) * 100);
    nextPhaseName = 'follicular';
    daysUntilNextPhase = Math.max(1, periodLen - cycleDay + 1);
  } else if (activePhase === 'follicular') {
    const dur = follicularEnd - periodLen;
    const progress = cycleDay - periodLen;
    phaseProgressPercent = Math.round((progress / dur) * 100);
    nextPhaseName = 'ovulatory';
    daysUntilNextPhase = Math.max(1, follicularEnd - cycleDay + 1);
  } else if (activePhase === 'ovulatory') {
    const dur = ovulatoryEnd - follicularEnd;
    const progress = cycleDay - follicularEnd;
    phaseProgressPercent = Math.round((progress / dur) * 100);
    nextPhaseName = 'luteal';
    daysUntilNextPhase = Math.max(1, ovulatoryEnd - cycleDay + 1);
  } else {
    const dur = cycleLen - ovulatoryEnd;
    const progress = cycleDay - ovulatoryEnd;
    phaseProgressPercent = Math.round((progress / dur) * 100);
    nextPhaseName = 'menstrual';
    daysUntilNextPhase = Math.max(1, cycleLen - cycleDay + 1);
  }

  return {
    cycleDay,
    totalCycleLength: cycleLen,
    estimatedPhase,
    activePhase,
    isOverridden,
    phaseConfidence: profile.overridePhase
      ? 'User-Confirmed'
      : diffDays <= cycleLen
      ? 'User-Confirmed'
      : 'Estimated Model',
    nextPeriodDate,
    daysUntilNextPeriod: daysUntilNext,
    phaseProgressPercent: Math.min(100, Math.max(5, phaseProgressPercent)),
    cycleProgressPercent,
    nextPhase: {
      phase: nextPhaseName,
      daysUntil: daysUntilNextPhase,
    },
  };
}

export interface WeeklyCycleInsight {
  headline: string;
  estimatedPhase: CyclePhase;
  phaseLabel: string;
  whatYouMightNotice: string;
  whatCouldBeUseful: string;
  whatToPrioritize: string;
  whatToAvoid: string;
  practicalSuggestions: string[];
}

/**
 * Generates the concise "Your Week" Cycle Insight section.
 */
export function getWeeklyCycleInsight(status: CalculatedCycleStatus): WeeklyCycleInsight {
  const phase = status.activePhase;

  switch (phase) {
    case 'menstrual':
      return {
        headline: 'Menstrual Phase — Restorative Baseline',
        estimatedPhase: 'menstrual',
        phaseLabel: 'Menstrual Phase',
        whatYouMightNotice:
          'Lower physical stamina, intermittent fatigue, or a desire for quiet sanctuary and fewer social obligations.',
        whatCouldBeUseful:
          'Protecting your 16:30 working boundary, keeping evenings unhurried, and allowing longer morning warmups.',
        whatToPrioritize:
          'Core essential deliverables only (1–2 per day), reflective review, and gentle somatic movement.',
        whatToAvoid:
          'Packing back-to-back presentations, high-friction negotiations, or demanding rapid-turnaround deadlines.',
        practicalSuggestions: [
          'Schedule 15-minute buffers before and after any client advisory sessions.',
          'Prepare comforting herbal infusions and reserve Friday evening for restorative rest.',
        ],
      };

    case 'follicular':
      return {
        headline: 'Follicular Phase — Creative Momentum',
        estimatedPhase: 'follicular',
        phaseLabel: 'Follicular Phase',
        whatYouMightNotice:
          'Rising mental clarity, natural curiosity, and an appetite for mapping new initiatives and exploring ideas.',
        whatCouldBeUseful:
          'Initiating high-leverage studio projects, structuring your quarterly editorial pipeline, and scheduling deep work blocks.',
        whatToPrioritize:
          'Brainstorming, drafting new essays/offerings, outlining client strategies, and engaging new concepts.',
        whatToAvoid:
          'Prematurely committing to too many long-term recurring tasks while feeling enthusiastic.',
        practicalSuggestions: [
          'Dedicate a 90-minute morning block on Wednesday to visionary content drafting.',
          'Take walking brainstorming sessions to channel creative ideas.',
        ],
      };

    case 'ovulatory':
      return {
        headline: 'Ovulatory Phase — Articulate Presence',
        estimatedPhase: 'ovulatory',
        phaseLabel: 'Ovulatory Phase',
        whatYouMightNotice:
          'Heightened communicative confidence, social ease, and energy for collaborative connection.',
        whatCouldBeUseful:
          'Delivering live cohort sessions, client advisory reviews, recording podcast or audio pieces, and networking.',
        whatToPrioritize:
          'High-touch conversations, outward-facing communications, and decisive strategic decisions.',
        whatToAvoid:
          'Over-committing every free hour to meetings simply because energy feels abundant right now.',
        practicalSuggestions: [
          'Host strategic client alignment calls during this window.',
          'Record voice notes or video snippets for Mariluna while articulation feels effortless.',
        ],
      };

    case 'luteal':
      return {
        headline: 'Luteal Phase — Discerning Refinement',
        estimatedPhase: 'luteal',
        phaseLabel: 'Luteal Phase',
        whatYouMightNotice:
          'Heightened editorial sensitivity, increased appetite, and a preference for structured, calm workspaces.',
        whatCouldBeUseful:
          'Organizing digital folders, editing existing drafts, wrapping up invoices, and enjoying comforting meals.',
        whatToPrioritize:
          'Finishing open loops and polishing existing work over initiating five brand new ambitious projects.',
        whatToAvoid:
          'Unnecessary sensory overstimulation, crowded social gatherings, or harsh self-critique.',
        practicalSuggestions: [
          'Focus on refining and proofreading your masterclass and newsletter materials.',
          'Keep nourishing, warm snacks on hand and avoid cutting short your sleep schedule.',
        ],
      };
  }
}

/**
 * Synthesizes Cycle Intelligence with User-Reported Energy.
 * CRITICAL RULE: User's reported energy ALWAYS takes precedence over cycle predictions.
 */
export function synthesizeEnergyAndCycleGuidance(
  status: CalculatedCycleStatus,
  todayCheckIn?: DailyCheckIn
): {
  headline: string;
  guidanceText: string;
  recommendedTaskCap: number;
  bufferMinutes: number;
  energySource: 'User-Reported' | 'Cycle Baseline';
} {
  if (todayCheckIn && todayCheckIn.energy) {
    const energy = todayCheckIn.energy;
    switch (energy) {
      case 'very_low':
        return {
          headline: 'Preserve Energy (User Reported: Very Low)',
          guidanceText:
            'You reported very low energy today. This takes precedence over all cycle estimates. Defer non-critical tasks, protect your 16:30 stop strictly, and take gentle rest.',
          recommendedTaskCap: 1,
          bufferMinutes: 25,
          energySource: 'User-Reported',
        };
      case 'low':
        return {
          headline: 'Gentle Cadence (User Reported: Low)',
          guidanceText:
            'Honoring your low energy report. Prioritize 1 or 2 essential items and decline unsolicited demands today.',
          recommendedTaskCap: 2,
          bufferMinutes: 20,
          energySource: 'User-Reported',
        };
      case 'normal':
        return {
          headline: 'Balanced Rhythm (User Reported: Normal)',
          guidanceText:
            'Steady, sustainable energy reported. Proceed with planned deep work blocks while maintaining calm buffers.',
          recommendedTaskCap: 3,
          bufferMinutes: 15,
          energySource: 'User-Reported',
        };
      case 'good':
      case 'high':
        return {
          headline: 'Expansive Capacity (User Reported: High)',
          guidanceText:
            'High vitality reported today. Excellent for key strategic focus, while still honoring your evening me-time threshold.',
          recommendedTaskCap: 4,
          bufferMinutes: 10,
          energySource: 'User-Reported',
        };
    }
  }

  // Fallback to gentle cycle-phase suggestion
  switch (status.activePhase) {
    case 'menstrual':
      return {
        headline: 'Restorative Tempo (Estimated Menstrual)',
        guidanceText:
          'Estimated menstrual window: Suggesting a gentle daily volume with 1–2 key focal points and generous buffers.',
        recommendedTaskCap: 2,
        bufferMinutes: 20,
        energySource: 'Cycle Baseline',
      };
    case 'follicular':
      return {
        headline: 'Emerging Momentum (Estimated Follicular)',
        guidanceText:
          'Estimated follicular window: Favorable for strategic ideation and initiating projects with spacious pacing.',
        recommendedTaskCap: 3,
        bufferMinutes: 15,
        energySource: 'Cycle Baseline',
      };
    case 'ovulatory':
      return {
        headline: 'Expressive Presence (Estimated Ovulatory)',
        guidanceText:
          'Estimated ovulatory window: Well-suited for communicative impact, client sessions, and expressive tasks.',
        recommendedTaskCap: 3,
        bufferMinutes: 15,
        energySource: 'Cycle Baseline',
      };
    case 'luteal':
      return {
        headline: 'Grounded Completion (Estimated Luteal)',
        guidanceText:
          'Estimated luteal window: Favorable for finishing open loops, organizing, and resisting unnecessary commitments.',
        recommendedTaskCap: 2,
        bufferMinutes: 20,
        energySource: 'Cycle Baseline',
      };
  }
}

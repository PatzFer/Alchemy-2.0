import { Language } from '../types';

export interface Translations {
  // Navigation
  nav_today: string;
  nav_tasks: string;
  nav_calendar: string;
  nav_goals: string;
  nav_ideas: string;
  nav_wellbeing: string;
  nav_cycle: string;
  nav_mylife: string;
  nav_mariluna: string;
  nav_settings: string;
  nav_security: string;
  nav_foundation: string;

  // Realms
  world_all: string;
  world_personal: string;
  world_mariluna: string;

  // Common Actions
  action_save: string;
  action_cancel: string;
  action_delete: string;
  action_edit: string;
  action_back: string;
  action_continue: string;
  action_skip: string;
  action_skip_for_now: string;
  action_begin_setup: string;
  action_create_my_alchemy: string;
  action_completed: string;
  action_add: string;
  action_close: string;
  action_lock_session: string;

  // Greetings & Today
  greeting_morning: string;
  greeting_afternoon: string;
  greeting_evening: string;
  today_focus_title: string;
  today_focus_max: string;
  today_add_focus: string;
  today_all_tasks: string;
  today_no_tasks: string;
  today_no_tasks_sub: string;
  today_daily_checkin_title: string;
  today_daily_checkin_sub: string;
  today_checkin_done: string;
  today_next_commitment: string;
  today_no_commitments: string;
  today_rhythm_day: string;
  today_rhythm_phase: string;
  today_rhythm_energy: string;

  // Empty states
  empty_no_plans: string;
  empty_add_first_task: string;
  empty_set_goal: string;
  empty_nothing_tracked: string;

  // Setup Wizard
  setup_welcome_title: string;
  setup_welcome_tagline: string;
  setup_welcome_subtext: string;
  setup_step_indicator: string;
  setup_completed_title: string;
  setup_completed_sub: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  nl: {
    // Navigation
    nav_today: 'Vandaag',
    nav_tasks: 'Taken',
    nav_calendar: 'Agenda',
    nav_goals: 'Doelen',
    nav_ideas: 'Ideeën',
    nav_wellbeing: 'Welzijn',
    nav_cycle: 'Cyclus',
    nav_mylife: 'Leven',
    nav_mariluna: 'Mariluna',
    nav_settings: 'Instellingen',
    nav_security: 'Beveiliging',
    nav_foundation: 'Fundament',

    // Realms
    world_all: 'Gebalanceerd',
    world_personal: 'Persoonlijk',
    world_mariluna: 'Mariluna',

    // Common Actions
    action_save: 'Opslaan',
    action_cancel: 'Annuleren',
    action_delete: 'Verwijderen',
    action_edit: 'Bewerken',
    action_back: 'Terug',
    action_continue: 'Verder',
    action_skip: 'Overslaan',
    action_skip_for_now: 'Nu overslaan',
    action_begin_setup: 'Start configuratie',
    action_create_my_alchemy: 'Creëer mijn Alchemy',
    action_completed: 'Voltooid',
    action_add: 'Toevoegen',
    action_close: 'Sluiten',
    action_lock_session: 'Sessie vergrendelen',

    // Greetings & Today
    greeting_morning: 'Goedemorgen',
    greeting_afternoon: 'Goedemiddag',
    greeting_evening: 'Goedenavond',
    today_focus_title: 'Focus voor vandaag',
    today_focus_max: '(Max 3)',
    today_add_focus: 'Focus toevoegen',
    today_all_tasks: 'Alle taken →',
    today_no_tasks: 'Geen prioriteiten vastgelegd voor vandaag.',
    today_no_tasks_sub: 'Geniet van de natuurlijke ruimte, of voeg een bewuste taak toe.',
    today_daily_checkin_title: 'Dagelijkse check-in',
    today_daily_checkin_sub: 'Registreer hoe je je voelt in 30 seconden',
    today_checkin_done: 'Vandaag ingecheckt',
    today_next_commitment: 'Eerstvolgende afspraak',
    today_no_commitments: 'Geen afspraken gepland voor vandaag.',
    today_rhythm_day: 'Dag',
    today_rhythm_phase: 'Fase',
    today_rhythm_energy: 'Energie',

    // Empty states
    empty_no_plans: 'Nog geen plannen vastgelegd.',
    empty_add_first_task: 'Voeg je eerste taak toe',
    empty_set_goal: 'Stel een doel in wanneer je er klaar voor bent',
    empty_nothing_tracked: 'Nog niets vastgelegd',

    // Setup Wizard
    setup_welcome_title: 'WELKOM BIJ ALCHEMY',
    setup_welcome_tagline: 'Laten we het systeem bouwen rond jouw leven.',
    setup_welcome_subtext: 'Alchemy past zich aan jou aan — niet andersom.',
    setup_step_indicator: 'Stap',
    setup_completed_title: 'ALCHEMY IS GEREED',
    setup_completed_sub: 'Jouw systeem is afgestemd op jouw leven.',
  },
  en: {
    // Navigation
    nav_today: 'Today',
    nav_tasks: 'Tasks',
    nav_calendar: 'Calendar',
    nav_goals: 'Goals',
    nav_ideas: 'Ideas',
    nav_wellbeing: 'Wellbeing',
    nav_cycle: 'Cycle',
    nav_mylife: 'My Life',
    nav_mariluna: 'Mariluna',
    nav_settings: 'Settings',
    nav_security: 'Security',
    nav_foundation: 'Foundation',

    // Realms
    world_all: 'Balanced',
    world_personal: 'Personal',
    world_mariluna: 'Mariluna',

    // Common Actions
    action_save: 'Save',
    action_cancel: 'Cancel',
    action_delete: 'Delete',
    action_edit: 'Edit',
    action_back: 'Back',
    action_continue: 'Continue',
    action_skip: 'Skip',
    action_skip_for_now: 'Skip for now',
    action_begin_setup: 'Begin setup',
    action_create_my_alchemy: 'Create my Alchemy',
    action_completed: 'Completed',
    action_add: 'Add',
    action_close: 'Close',
    action_lock_session: 'Lock session',

    // Greetings & Today
    greeting_morning: 'Good morning',
    greeting_afternoon: 'Good afternoon',
    greeting_evening: 'Good evening',
    today_focus_title: "Today's Focus",
    today_focus_max: '(Max 3)',
    today_add_focus: 'Add Focus',
    today_all_tasks: 'All Tasks →',
    today_no_tasks: 'No high-leverage priorities assigned for today.',
    today_no_tasks_sub: 'Enjoy the natural spaciousness, or choose one intentional task.',
    today_daily_checkin_title: 'Daily Check-In',
    today_daily_checkin_sub: 'Log how you feel in 30 seconds',
    today_checkin_done: 'Checked in today',
    today_next_commitment: 'Next Commitment',
    today_no_commitments: 'No scheduled appointments for today.',
    today_rhythm_day: 'Day',
    today_rhythm_phase: 'Phase',
    today_rhythm_energy: 'Energy',

    // Empty states
    empty_no_plans: 'No plans yet.',
    empty_add_first_task: 'Add your first task',
    empty_set_goal: "Set a goal when you're ready",
    empty_nothing_tracked: 'Nothing tracked yet',

    // Setup Wizard
    setup_welcome_title: 'WELCOME TO ALCHEMY',
    setup_welcome_tagline: "Let's build the system around your life.",
    setup_welcome_subtext: 'Alchemy adapts to you — not the other way around.',
    setup_step_indicator: 'Step',
    setup_completed_title: 'ALCHEMY IS READY',
    setup_completed_sub: 'Your system has been configured around your life.',
  },
};

/**
 * Returns translated string for key in specified or default ('nl') language
 */
export function t(key: keyof Translations, lang: Language = 'nl'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.nl;
  return dict[key] || TRANSLATIONS.nl[key] || key;
}

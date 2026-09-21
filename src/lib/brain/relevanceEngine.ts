import { ContextPrivacyScope } from './types';

export interface RelevanceFilterResult {
  scope: ContextPrivacyScope;
  relevantDomains: string[];
  excludedDomains: string[];
  privacyRationale: string;
}

/**
 * RELEVANCE ENGINE
 * 
 * Determines which context slices should be passed to the AI request,
 * and explicitly enforces privacy boundaries and data separation.
 */
export function determineRelevance(
  moduleOrQuery: string,
  userPrompt?: string
): RelevanceFilterResult {
  const queryLower = (userPrompt || moduleOrQuery).toLowerCase();

  // Scenario 1: Food / Cooking / Meals
  if (
    queryLower.includes('koken') ||
    queryLower.includes('eten') ||
    queryLower.includes('maaltijd') ||
    queryLower.includes('dinner') ||
    queryLower.includes('recept') ||
    moduleOrQuery === 'meals'
  ) {
    return {
      scope: 'meals',
      relevantDomains: [
        'Foundation Food Profile (Uitsluitingen & Favorieten)',
        'Keukenvoorraad & Pantry',
        'Google Agenda (Beschikbare kooktijd)',
        'Dinergezelschap (Solo vs. samen met Jeroen)',
        'Recente maaltijdgeschiedenis',
      ],
      excludedDomains: [
        'Mariluna Boekhouding & Cijfers',
        'Mariluna Klanten & Gmail',
        'Instagram Statistieken',
        'Persoonlijke Lichaamsmaten',
        'Cyclus Biologie',
        'Kleding Styling',
      ],
      privacyRationale: 'Maaltijdplanning vereist uitsluitend culinaire voorkeuren en tijdsruimte. Zakelijke en medische data zijn strikt uitgesloten.',
    };
  }

  // Scenario 2: Mariluna Content / Instagram / Marketing
  if (
    queryLower.includes('instagram') ||
    queryLower.includes('content') ||
    queryLower.includes('post') ||
    queryLower.includes('mariluna') ||
    queryLower.includes('klant') ||
    queryLower.includes('aanbod') ||
    moduleOrQuery === 'mariluna' ||
    moduleOrQuery === 'content'
  ) {
    return {
      scope: 'mariluna',
      relevantDomains: [
        'Mariluna Content Planner & Pijlers',
        'Actieve Mariluna Projecten & Doelen',
        'Brainstorm Notities',
        'Instagram Posts (Alleen-lezen historie)',
        'Zakelijke Diensten & Aanbod',
      ],
      excludedDomains: [
        'Cyclus Rhythms & Gezondheid',
        'Lichaamsmetingen & Gewicht',
        'Privé Dagelijkse Check-ins',
        'Persoonlijke Maaltijden & Voeding',
        'Persoonlijke Styling & Kleding',
      ],
      privacyRationale: 'Mariluna zakelijke context is strikt gescheiden van Patricia’s persoonlijke gezondheid, cyclus en privé-leven.',
    };
  }

  // Scenario 3: Movement / Workout
  if (
    queryLower.includes('wandelen') ||
    queryLower.includes('bewegen') ||
    queryLower.includes('workout') ||
    queryLower.includes('pilates') ||
    queryLower.includes('zwemmen') ||
    moduleOrQuery === 'movement'
  ) {
    return {
      scope: 'movement',
      relevantDomains: [
        'Beschikbare tijd in agenda',
        'Aanwezig materiaal (Pilates ring, weerstandsbanden, dumbbells 1–3 kg)',
        'Recente bewegingssessies',
        'Vandaag gerapporteerde energie',
        'Health Connect stappen (feitelijk)',
      ],
      excludedDomains: [
        'Mariluna Financiën & Klanten',
        'Zakelijke E-mails',
        'Medische records of diagnoses',
        'Schuldgevoel / Verplichte prestatiedoelen',
      ],
      privacyRationale: 'Beweging is een milde, niet-oordelende ondersteuning van welzijn, vrij van prestatiedruk en zakelijke ruis.',
    };
  }

  // Scenario 4: Personal Styling
  if (
    queryLower.includes('kleding') ||
    queryLower.includes('outfit') ||
    queryLower.includes('kleur') ||
    queryLower.includes('stijl') ||
    queryLower.includes('garderobe') ||
    moduleOrQuery === 'styling'
  ) {
    return {
      scope: 'styling',
      relevantDomains: [
        'Foundation Personal Styling Profile (Style DNA, Kleuren, Proporties)',
        'Garderobe Feedback & Evaluaties',
        'Agenda afspraken (Formeel vs. ontspannen context)',
        'Filosofie: "Clothing is architecture. The body is not the problem."',
      ],
      excludedDomains: [
        'Mariluna Bedrijfsdata',
        'Gmail Inbox',
        'Rigide maattabellen of lichaamsafkeuring',
      ],
      privacyRationale: 'Styling respecteert esthetiek en architectuur zonder zakelijke vermenging.',
    };
  }

  // Default: Today / Balanced General Context
  return {
    scope: 'balanced',
    relevantDomains: [
      'Patz Identiteit & Waarden',
      'Vandaag Agenda & Afspraken',
      'Actuele Taken & Prioriteiten',
      'Dinerstatus voor vanavond',
      'Aankomende deadlines deze week',
    ],
    excludedDomains: [
      'Gedetailleerde medische data',
      'Volledige Gmail mailbox dump',
      'Persoonlijke lichaamsfoto’s',
    ],
    privacyRationale: 'Algemene dagplanning combineert relevante afspraken en taken met strikte bescherming van intieme privégegevens.',
  };
}

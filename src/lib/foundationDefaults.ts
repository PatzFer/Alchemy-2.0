import {
  FoundationData,
  WorkContext,
  FoundationGoalItem,
  LifeProfile,
  Goal,
  CycleProfile,
  WellbeingState,
  Language,
  FoundationPatzIdentity,
  FoundationAstrology,
  FoundationCommunication,
  FoundationLifeWork,
  FoundationPlanning,
  FoundationFoodProfile,
  FoundationPersonalStyling,
  GarmentEvaluation,
  StyleLearnedFeedback,
} from '../types';

export const DEFAULT_PATZ_IDENTITY: FoundationPatzIdentity = {
  name: 'Patricia',
  preferredName: 'Patz / Patricia',
  age: 32,
  heightMeters: 1.57,
  location: 'België',
  primaryLanguage: 'nl',
  bornIn: 'Portugal',
  heritage: 'Portugees',
  portugalConnectionNotes:
    'Portugal is een wezenlijk onderdeel van Patricia’s identiteit, cultuur, achtergrond en emotionele verbondenheid. Geen simpel vakantieland of generieke keukenkeuze. Alchemy houdt waar zinvol rekening met Portugese cultuur, tradities, esthetiek, levensritme en taal als betekenisvolle persoonlijke context.',
};

export const DEFAULT_ASTROLOGY: FoundationAstrology = {
  sunSign: 'Weegschaal / Libra',
  frameworkRole:
    'Persoonlijk en spiritueel referentiekader. Alchemy mag astrologie meenemen wanneer Patricia daarom vraagt of wanneer de context passend is. Altijd strikt onderscheid maken tussen wetenschappelijk bewijs, interpretatie en spiritueel/traditioneel perspectief. Nooit presenteren als medisch, psychologisch of deterministisch feit.',
  notes:
    'Zon in Weegschaal: natuurlijk oog voor esthetiek, proportie, harmonie in de leefomgeving en evenwicht tussen rust en ambitie.',
};

export const DEFAULT_COMMUNICATION: FoundationCommunication = {
  primaryLanguage: 'nl',
  preferredTone: 'Warm, menselijk, direct, eerlijk, geaard en zonder corporate AI-filler',
  shortAnswers: true,
  preferBulletPoints: true,
  practicalAndDirect: true,
  doNotOverExplain: true,
  gentleCorrection: true,
  constructiveChallenge: true,
  avoidCorporateRobotic: true,
  avoidGenericAiFiller: true,
  supportiveNotPatronising: true,
  epistemologyNotes:
    'Maak altijd een helder onderscheid tussen gevestigd wetenschappelijk bewijs, aannemelijke interpretatie en spirituele of traditionele wijsheid.',
};

export const DEFAULT_LIFE_WORK: FoundationLifeWork = {
  workdays: ['tuesday', 'wednesday', 'friday'],
  workHoursStart: '08:00',
  workHoursEnd: '16:30',
  businessName: 'Mariluna',
  businessDescription: 'Creatieve studio en onderneming van Patricia.',
  protectedPersonalTime:
    'Bescherm realistische tijd voor Mariluna, privéleven, rust, relaties, hobby’s en herstel. Niet elk vrij moment hoeft productief te worden.',
  pacingPhilosophy:
    'Gedoseerde productiviteit: diepgaand werk concentreren binnen beschermde werkuren en de avonden en weekenden bewaren als rustig heiligdom.',
  recurringCommitments: [
    'Dinsdag 08:00–16:30 Vaste werkdag',
    'Woensdag 08:00–16:30 Vaste werkdag & pilates/kracht',
    'Vrijdag 08:00–16:30 Vaste werkdag & weekafronding',
  ],
  personalRoutines: [
    'Ochtendmoment met warme drank en rustig ontwaken',
    'Avondontprikkeling zonder schermen en zachte verlichting',
  ],
};

export const DEFAULT_PLANNING: FoundationPlanning = {
  helpSeeWhatMatters: true,
  helpPrioritize: true,
  avoidUnrealisticPlanning: true,
  breakLargeProjectsIntoActions: true,
  rememberImportantThings: true,
  noticeConflicts: true,
  suggestRealisticTiming: true,
  keepSpaceForPersonalLife: true,
  connectAreasIntelligently: true,
  respectAutonomy: true,
  avoidProductivityTrap: true,
};

export const DEFAULT_FOOD_PROFILE: FoundationFoodProfile = {
  cuisineHierarchy: {
    primary: 'Portugees (wezenlijke culinaire identiteit en vaste waarde)',
    secondary: 'Zuid-Europees & Mediterraan (Italiaans, Spaans, Grieks, Zuid-Frans)',
    tertiary: 'Belgisch / Vlaams & milde Europese klassiekers',
  },
  likes: [
    'Portugese keuken',
    'Italiaanse keuken',
    'Spaanse & Griekse gerechten',
    'Zuid-Franse & Belgische klassiekers',
    'Vlees & gevogelte',
    'Vis & schaaldieren (met uitzondering van kabeljauw)',
    'Pasta',
    'Witte rijst',
    'Aardappelen',
    'Risotto',
    'Wraps',
    'Voedzame soepen',
    'Zelfgemaakte warme sauzen',
    'Gegaarde groenten',
    'Fijn verwerkte of gepureerde groenten',
    'Slowcooker maaltijden',
  ],
  dislikes: [
    'Geen fruit',
    'Geen rauwe groenten',
    'Groenten bij voorkeur gestoofd, gepureerd of fijngesneden',
    'Geen yoghurt',
    'Geen smoothies',
    'Geen komkommer',
    'Geen havermout als voorkeursvoedsel',
    'Geen noten in bereide maaltijden',
    'Geen linzen als voorkeursvoedsel',
    'GEEN COUSCOUS (nooit standaard suggereren of opnemen)',
    'GEEN QUINOA (nooit standaard suggereren of opnemen)',
  ],
  noCouscousRule: true,
  noQuinoaRule: true,
  noRawVegetablesRule: true,
  allergies: [],
  intolerances: ['Kabeljauw (vermijden/niet geliefd)'],
  kitchenNotes:
    'Doel: geleidelijk gewichtsverlies, spierbehoud, 80-100g eiwit per dag, normale smakelijke gerechten, geen crashdiëten, geen schuldgevoelens rondom eten. Couscous en quinoa strikt uitgesloten.',
};

export const DEFAULT_PERSONAL_STYLING: FoundationPersonalStyling = {
  profileVersion: '1.0',
  silhouetteLabel: 'WAIST-DEFINED / LOWER-BODY-DOMINANT CURVED SILHOUETTE',
  heightMeters: 1.57,
  antiRigidDisclaimer:
    'Rigide lichaamstype-labels (peer, appel, zandloper, rechthoek) mogen niet worden gebruikt als enig stijlkader. Patricia is een uniek getailleerd silhouet met rondingen in het onderlichaam; kledingval, proportie, tailleharmonie en tactiliteit zijn leidend.',
  bodyProportionsProfile: {
    torsoProportion: 'Compacte romp met een duidelijke, hooggelegen natuurlijke taille-insnoering.',
    legLineEmphasis: 'Verlenging van de beenlijn via high-waist of mid-rise snitten en ononderbroken verticale lijnen.',
    waistDefinition: 'Taille-accentuering brengt direct harmonie en voorkomt een vierkante of vormeloze uitstraling.',
    hipFlow: 'Stoffen moeten vloeiend langs heupen en dijen vallen zonder te knellen of horizontaal op te bollen.',
  },
  bodyArchitecture:
    'Petite lengte (1.57 m) met vrouwelijke, zachte welvingen in heup en dij. Cruciaal: vermijd zoomranden die exact stoppen op het breedste heuppunt. Kleding is visuele architectuur: natuurlijke taille als rustpunt, proportionele verticale lengte, en doordachte volumeplaatsing.',
  styleDNA: {
    essence: 'Vrouwelijk, romantisch en bohemien met een magnetisch spanningsveld tussen zacht en krachtig, romantisch en donker, natuurlijk en glamoureus.',
    coreKeywords: ['feminine', 'romantic', 'bohemian'],
    strongAccents: ['dark feminine', 'witchy', 'western', 'vintage', 'rock/grunge', 'sensual/elegant'],
    styleTensions: [
      'soft + strong',
      'romantic + dark',
      'natural + glamorous',
      'feminine + wild',
      'vintage + modern',
      'sexy + mysterious',
    ],
    styleDirections: [
      'boho',
      'romantic western',
      'boho country',
      'dark romantic',
      'witchy',
      '90s grunge/rock',
      '70s',
      'vintage feminine',
      'Parisian feminine',
      'Italian feminine/sensual',
      'feminine rock',
      'western feminine',
      'dark bohemian',
      'elegant sensual',
    ],
    signatureElements: [
      'Lange vloeiende maxi- en midijurken met gedefinieerde taille',
      'High-waist pantalon of wikkelrok met soepelvallende stof',
      'Kanten blouse of top met open hals/sleutelbeen en subtiel decolleté',
      'Zacht leren jasje of suède jack met western- of vintage flair',
      'Brede tailleriem met karaktervolle vintage gesp',
      'Karaktervolle laarzen (western boots of verfijnd zwart leer)',
      'Statement accessoires, fedora hoed of gelaagde gouden colliers',
    ],
    preferredFabrics: [
      'Hoogwaardig zacht linnen & soepele viscose/zijde',
      'Tactiel zacht suède & natuurlijk soepel leer',
      'Verfijnd kant & subtiele transparantie',
      'Fijne merino- en kasjmierwol',
      'Zacht denim & vloeiend satijn',
    ],
    unfavorableElements: [
      'Vormeloze oversized boxy kleding zonder taillering of intentie',
      'Stugge stoffen die horizontaal uitstaan op de heuplijn',
      'Tops of zomen die abrupt stoppen op het breedste heuppunt',
      'Synthetische harde glans of stugge plastische materialen',
      'Preppy of klinisch strakke uniformiteit',
    ],
  },
  desiredPresence:
    'PRESENCE, NOT PERFORMANCE — Vrouwelijk, zacht, mysterieus, subtiel sexy, magnetisch, warm, vrij, zelfverzekerd en licht wild. Aandacht aantrekken door aura en uitstraling in plaats van schreeuwerigheid.',
  clothingDetails: [
    'Lange maxi- en midijurken',
    'Gedefinieerde taille zonder beklemming',
    'Vloeiende, bewegende stoffen',
    'Wikkel-silhouetten & draperingen',
    'Leer & suède jasjes',
    'Kant & subtiele transparantie',
    'Franjes & western details',
    'Brede riemen met vintage gespen',
    'Western boots & leren laarzen',
    'Karaktervolle hoeden (fedora, western, baret)',
    'Bloemenprints & donkere romantische motieven',
    '70s & vintage details',
    '90s grunge accenten (bandshirt, ripped denim)',
    'Zijdeachtig satijn & tactiele texturen',
  ],
  sensualityDNA: {
    philosophy:
      'FEMININE + SOFT + MYSTERIOUS + SUBTLY SEXY — Sensualiteit ontstaat vanuit natuurlijke gratie, een prachtig decolleté of zichtbare sleutelbenen, een benadrukte taille en beweging in een lange rok of split. Nooit plat "sexy om het sexy zijn", maar magnetisch en authentiek.',
    preferredAccents: [
      'Benadrukte natuurlijke taille',
      'Sierlijke halslijn en zichtbaar sleutelbeen',
      'Vloeiende lange rok/jurk met subtiele split bij het lopen',
      'Tactiel kant of zacht satijn',
      'Aansluitend op één punt + zwierig op een ander punt',
      'Laarzen & taille-accent met riem',
    ],
  },
  colourDNA: {
    paletteName: 'Warm Ivoor, Rijk Aarde, Diep Bordeaux & Nachtblauw',
    primaryColors: [
      { name: 'Warm Ivoor / Crème', hex: '#FAF6EE', role: 'Basis & Lichtpunt (voorkeur boven hard wit)' },
      { name: 'Chocoladebruin / Warm Bruin', hex: '#3E2723', role: 'Rijke diepte' },
      { name: 'Camel / Warm Zand', hex: '#C19A6B', role: 'Natuurlijke warmte' },
      { name: 'Olijf / Moss Green', hex: '#556B2F', role: 'Aardse sereniteit' },
      { name: 'Army Green', hex: '#4B5320', role: 'Karakter & Contrast' },
      { name: 'Diep Bordeaux / Warm Rood', hex: '#6A1B29', role: 'Donker romantisch' },
      { name: 'Diep Zwart', hex: '#1C1917', role: 'Kracht & Mysterie (essentiële stylingkleur)' },
      { name: 'Nachtblauw / Navy', hex: '#1B263B', role: 'Diepe elegantie' },
      { name: 'Teal / Petrol / Blauwgroen', hex: '#1D5D6B', role: 'Edelsteen diepte' },
      { name: 'Smaragd / Emerald', hex: '#0F5257', role: 'Rijke juweeltint' },
      { name: 'Dusty Rose / Zacht Roze', hex: '#D8A47F', role: 'Zachte romantiek' },
      { name: 'Terracotta / Roest', hex: '#B85D38', role: 'Portugese aarde & zon' },
      { name: 'Oudgoud / Warm Brons', hex: '#C5A880', role: 'Warm edelmetaal' },
    ],
    colorsToAvoid: [
      'Optisch hard tl-wit (kies altijd warm ivoor of crème)',
      'Ijzig koel grijs zonder warmte',
      'Synthetische neon- en fluoriserende tinten',
    ],
  },
  hairDNA: {
    aesthetic: 'Lang haar met lagen, volume, natuurlijke slag/golven en voelbare beweging.',
    notes:
      'Gezichtsomlijstende lagen en een zachte gordijnpony (curtain bangs). Moeiteloze textuur die de schouders en het sleutelbeen zacht omlijst.',
  },
  accessoryDNA: {
    metals: ['Warm 14k/18k goud', 'Vintage messing', 'Zilver met turquoise accenten'],
    jewelleryStyle:
      'Gelaagde gouden kettinkjes, hangerkettingen, statement oorbellen, vintage zegelringen en turquoise details.',
    bagsFootwear:
      'Western boots (suède en leer), zwarte leren veterlaarzen, slouchy suède schoudertassen met franjes, brede leren riemen met ornamentale gespen, fedora en western hoeden.',
  },
  styleFormula:
    'Taille-definitie (aansluitend/ingestopt) + Vloeiend volume onderlichaam (pantalon/rok) + Edele natuurlijke textuur + Gouden detail.',
  emotionalDressingMoods: [
    'soft',
    'romantic',
    'mysterious',
    'sensual',
    'powerful',
    'wild/free',
    'elegant',
    'playful',
    'witchy',
    'bohemian',
    'rock',
    'confident',
  ],
  philosophy:
    'Kleding is een verlengstuk van Patricia’s soevereiniteit, stemming en energie. Lichaamsmetingen zijn dynamisch en komen uit Welzijn; de Stijl DNA is een stabiele, evoluerende kern.',
  posturePresence: 'Gegrond, soeverein, vrouwelijk en ongehaast.',
  stylingLanguagePreferences:
    'Bespreek kleding in termen van proportie, verticale lijnen, harmonie en gevoel — vermijd te allen tijde veroordelende labels.',
  evaluationLogicSummary:
    'Kledingbeoordeling weegt silhouetbalans, taillepositie, beenlijn en kleurtint zwaarder dan puur lichaamsgewicht.',
  learnedFeedback: [],
  recentEvaluations: [
    {
      id: 'eval-demo-1',
      date: '2026-09-18',
      itemTitle: 'High-waist linnen pantalon met dubbele bandplooi',
      category: 'Broeken',
      styleMatchPercent: 96,
      silhouetteMatchPercent: 98,
      colourMatchPercent: 92,
      emotionalMatchPercent: 94,
      overallMatchPercent: 95,
      fitConfidencePercent: 88,
      verdictNl:
        'Uitzonderlijke match. De hoge taille definieert het smalste punt van het lichaam perfect, terwijl de wijde linnen pijp soepel over de heup valt zonder horizontaal te trekken.',
      keyObservations: [
        'Accentueert de natuurlijke taille perfect',
        'Verlengt optisch de benen bij lengte 1.57 m',
        'Natuurlijke linnenstructuur past bij Stijl DNA',
      ],
      userFeedback: 'love',
    },
  ],
};

export const DEFAULT_FOUNDATION_DATA: FoundationData = {
  isCompleted: true,
  isSkipped: false,
  currentStep: 1,
  completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  configuredSections: [
    'who-is-patz',
    'roots',
    'astrology',
    'communication',
    'life-work',
    'planning',
    'food',
    'styling',
    'wellbeing',
    'goals',
    'mariluna',
  ],
  skippedSections: [],
  lastUpdated: new Date().toISOString(),
  // Core Authoritative Patz Foundation
  patzIdentity: DEFAULT_PATZ_IDENTITY,
  astrology: DEFAULT_ASTROLOGY,
  communication: DEFAULT_COMMUNICATION,
  lifeWork: DEFAULT_LIFE_WORK,
  planning: DEFAULT_PLANNING,
  foodProfile: DEFAULT_FOOD_PROFILE,
  personalStyling: DEFAULT_PERSONAL_STYLING,
  // Domain Contexts (kept in sync for backwards compatibility)
  aboutYou: {
    name: 'Patricia',
    dateOfBirth: '',
    preferredLanguage: 'nl',
    location: 'België',
  },
  yourLife: {
    dailyRhythm: 'Gebalanceerd werk- en levensritme (Di, Wo, Vr werkdagen)',
    typicalAvailableTime: 'Beschermde avonden en weekenden',
    recurringCommitments: DEFAULT_LIFE_WORK.recurringCommitments,
    personalRoutines: DEFAULT_LIFE_WORK.personalRoutines,
    planningRestPeriods: ['Stille avonden vanaf 17:00', 'Onthaaste weekenden'],
    notes: 'Geen aanname dat elk vrij moment productief moet zijn.',
  },
  work: {
    workContexts: [
      {
        id: 'wc-patz-primary',
        name: 'Vaste Werkstructuur',
        workdays: DEFAULT_LIFE_WORK.workdays,
        startTime: DEFAULT_LIFE_WORK.workHoursStart,
        endTime: DEFAULT_LIFE_WORK.workHoursEnd,
        location: 'Kantoor / Atelier',
        commuteMinutes: 15,
        breakNotes: 'Middaglunchpauze met rust',
      },
    ],
  },
  goals: {
    goals: [
      {
        id: 'fg-1',
        name: 'Duurzaam evenwicht en vitaal gewichtsverlies',
        description: 'Krachtbehoud, 80-100g eiwit, zonder crashdieet of schuldgevoel.',
        domain: 'wellbeing',
        priority: 'high',
      },
      {
        id: 'fg-2',
        name: 'Mariluna Studio lancering & strategische rust',
        description: 'Excellente uitvoering binnen beschermde werkuren.',
        domain: 'mariluna',
        priority: 'high',
      },
    ],
  },
  wellbeing: {
    trackPhotos: false,
    wellbeingGoals: ['Geleidelijk gewichtsverlies', 'Spierbehoud', 'Vaste dagelijkse beweging'],
    movementPreferences: ['Wandelen', 'Pilates', 'Krachttraining', 'Cyclusbewust bewegen'],
    regularActivities: ['Wandelingen in de buitenlucht', 'Pilates sessies'],
    measurementFrequency: 'weekly',
  },
  nutrition: {
    enjoyedFoods: DEFAULT_FOOD_PROFILE.likes,
    dislikedFoods: DEFAULT_FOOD_PROFILE.dislikes,
    allergies: DEFAULT_FOOD_PROFILE.allergies,
    dietaryRestrictions: ['Geen couscous', 'Geen quinoa', 'Groenten gegaard of gepureerd'],
    avoidedFoods: ['Couscous', 'Quinoa', 'Fruit', 'Rauwe groenten', 'Yoghurt', 'Smoothies', 'Komkommer', 'Kabeljauw'],
    eatingPattern: 'Regelmatige warme maaltijden met 80-100g eiwitdoel',
    cookingTimeMinutes: 35,
    diningSetting: 'flexible',
    kitchenNotes: DEFAULT_FOOD_PROFILE.kitchenNotes,
  },
  cycle: {
    enabled: true,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    cycleInfluencesPlanning: true,
    cycleHistoryNotes: 'Cyclusritme dient ter zachte afstemming van energieniveaus.',
  },
  mariluna: {
    enabled: true,
    businessGoals: ['Excellente content & merkpositionering', 'Rustige strategische planning'],
    services: ['Creatieve richting & design consultancy'],
    products: [],
    projects: ['Autumn Launch'],
    contentAreas: ['Sovereignty', 'Quiet Luxury', 'Feminine Leadership'],
    platforms: ['Newsletter', 'Instagram'],
    recurringActivities: ['Wekelijkse strategische review'],
    importantDeadlines: [],
  },
  ai: {
    communicationStyle: 'short_direct',
    proactivity: 'balanced',
    suggestActions: true,
    helpPrioritize: true,
    challengeAssumptions: true,
    rescheduleUnfinished: true,
    surfacePatterns: true,
  },
  notifications: {
    categories: {
      tasks: true,
      calendar: true,
      goals: false,
      wellbeing: false,
      nutrition: false,
      cycle: false,
      mariluna: false,
      reviewsInsights: false,
    },
    quietHoursStart: '21:30',
    quietHoursEnd: '08:00',
    frequency: 'sparse',
    permissions: {
      calendarAccess: true,
      externalAiAccess: false,
      isolateMariluna: true,
      requireStepUpSensitive: true,
    },
  },
};

export const FOUNDATION_SECTIONS = [
  {
    id: 'who-is-patz',
    slug: 'who-is-patz',
    titleNl: 'Wie is Patz?',
    titleEn: 'Who is Patz?',
    icon: 'user',
    descriptionNl: 'Persoonlijke identiteit, naam, leeftijd en lengte.',
  },
  {
    id: 'roots',
    slug: 'roots',
    titleNl: 'Identiteit & Roots',
    titleEn: 'Identity & Roots',
    icon: 'compass',
    descriptionNl: 'Portugese achtergrond, cultuur en emotionele verbondenheid.',
  },
  {
    id: 'astrology',
    slug: 'astrology',
    titleNl: 'Astrologie & Spiritualiteit',
    titleEn: 'Astrology & Spirituality',
    icon: 'sparkles',
    descriptionNl: 'Weegschaal / Libra, referentiekader met wetenschappelijk onderscheid.',
  },
  {
    id: 'communication',
    slug: 'communication',
    titleNl: 'Communicatiestijl',
    titleEn: 'Communication Profile',
    icon: 'message-square',
    descriptionNl: 'Nederlands, bondig, bullet points, warm, direct en eerlijk.',
  },
  {
    id: 'life-work',
    slug: 'life-work',
    titleNl: 'Leven & Werk',
    titleEn: 'Life & Work',
    icon: 'briefcase',
    descriptionNl: 'Di / Wo / Vr 08:00–16:30, Mariluna studio en beschermde rust.',
  },
  {
    id: 'planning',
    slug: 'planning',
    titleNl: 'Planningsfilosofie',
    titleEn: 'Planning Personality',
    icon: 'calendar',
    descriptionNl: 'Zien wat ertoe doet, realistische tijd en Patricia behoudt de regie.',
  },
  {
    id: 'food',
    slug: 'food',
    titleNl: 'Voedingsprofiel',
    titleEn: 'Food Profile',
    icon: 'utensils',
    descriptionNl: 'Portugees (1), Belgisch (2), Italiaans (3) • Geen couscous • Eiwitdoel.',
  },
  {
    id: 'styling',
    slug: 'styling',
    titleNl: 'Personal Styling',
    titleEn: 'Personal Styling',
    icon: 'shirt',
    descriptionNl: 'Taille-gedefinieerd silhouet (v1.0), Stijl DNA & kledingevaluatie.',
  },
  {
    id: 'wellbeing',
    slug: 'wellbeing',
    titleNl: 'Welzijn & Gezondheid',
    titleEn: 'Wellbeing Preferences',
    icon: 'heart',
    descriptionNl: 'Wandelen, herstel en strikt afgeschermde privégegevens.',
  },
  {
    id: 'goals',
    slug: 'goals',
    titleNl: 'Doelen',
    titleEn: 'Goals',
    icon: 'target',
    descriptionNl: 'Persoonlijke en zakelijke doelen met domeinscheiding.',
  },
  {
    id: 'mariluna',
    slug: 'mariluna',
    titleNl: 'Mariluna Context',
    titleEn: 'Mariluna Context',
    icon: 'feather',
    descriptionNl: 'Zakelijke parameters met strikte privacy-afscherming.',
  },
];

/**
 * Short, non-punitive first-use onboarding flow (Requirement 16)
 */
export const FIRST_USE_FLOW_STEPS = [
  {
    id: 1,
    slug: 'identity',
    titleNl: 'Wie ben je?',
    titleEn: 'Who are you?',
    subtitleNl: 'Jouw naam, achtergrond en wat Alchemy over jou mag weten.',
  },
  {
    id: 2,
    slug: 'communication',
    titleNl: 'Hoe communiceren we?',
    titleEn: 'How should Alchemy communicate?',
    subtitleNl: 'Taal, toonzetting, diepgang en eerlijke constructieve feedback.',
  },
  {
    id: 3,
    slug: 'life-work',
    titleNl: 'Jouw werk- en levensritme',
    titleEn: 'Life & Work Rhythm',
    subtitleNl: 'Vaste werkdagen, beschikbare uren en ruimte voor rust en Mariluna.',
  },
  {
    id: 4,
    slug: 'intentions',
    titleNl: 'Belangrijke intenties',
    titleEn: 'Important Intentions',
    subtitleNl: 'Wat is op dit moment het belangrijkst om voor ogen te houden?',
  },
];

export const ONBOARDING_STEPS = FIRST_USE_FLOW_STEPS;

/**
 * Scoped Foundation Context Builder for AI
 * Strictly enforces Privacy & Domain boundaries (Requirement 14 & 18):
 * - Mariluna NEVER receives body measurements, weight, cycle, or private wellbeing info!
 */
export function getScopedFoundationContext(
  foundation: FoundationData,
  domain: 'today' | 'meals' | 'styling' | 'mariluna' | 'brain' | 'general'
): Record<string, any> {
  const base = {
    userName: foundation.patzIdentity?.name || foundation.aboutYou?.name || 'Patricia',
    preferredName: foundation.patzIdentity?.preferredName || 'Patz',
    language: foundation.patzIdentity?.primaryLanguage || 'nl',
    communication: {
      tone: foundation.communication?.preferredTone,
      shortAnswers: foundation.communication?.shortAnswers,
      bulletPoints: foundation.communication?.preferBulletPoints,
      avoidFiller: foundation.communication?.avoidGenericAiFiller,
      challengeConstructively: foundation.communication?.constructiveChallenge,
    },
  };

  switch (domain) {
    case 'mariluna':
      // STRICT PRIVACY: Only business & work availability. NO private health, cycle, weight, body info.
      return {
        ...base,
        domain: 'mariluna_business',
        businessName: foundation.lifeWork?.businessName || 'Mariluna',
        workdays: foundation.lifeWork?.workdays || ['tuesday', 'wednesday', 'friday'],
        workHours: `${foundation.lifeWork?.workHoursStart || '08:00'} - ${foundation.lifeWork?.workHoursEnd || '16:30'}`,
        businessGoals: foundation.mariluna?.businessGoals || [],
        services: foundation.mariluna?.services || [],
        contentAreas: foundation.mariluna?.contentAreas || [],
        privacyNote: 'Strictly isolated from personal wellbeing, body measurements, cycle, and private logs.',
      };

    case 'meals':
      return {
        ...base,
        domain: 'prive_meals',
        heritage: foundation.patzIdentity?.heritage,
        portugalConnection: 'Core culinary and cultural roots',
        cuisineHierarchy: foundation.foodProfile?.cuisineHierarchy,
        likes: foundation.foodProfile?.likes,
        dislikes: foundation.foodProfile?.dislikes,
        noCouscousEnforced: foundation.foodProfile?.noCouscousRule,
        noRawVegetablesEnforced: foundation.foodProfile?.noRawVegetablesRule,
        allergies: foundation.foodProfile?.allergies,
        intolerances: foundation.foodProfile?.intolerances,
        kitchenNotes: foundation.foodProfile?.kitchenNotes,
      };

    case 'styling':
      return {
        ...base,
        domain: 'prive_styling',
        heightMeters: foundation.personalStyling?.heightMeters || 1.57,
        silhouetteLabel: foundation.personalStyling?.silhouetteLabel,
        styleDNA: foundation.personalStyling?.styleDNA,
        sensualityDNA: foundation.personalStyling?.sensualityDNA,
        colourDNA: foundation.personalStyling?.colourDNA,
        styleFormula: foundation.personalStyling?.styleFormula,
        emotionalDressingMoods: foundation.personalStyling?.emotionalDressingMoods,
        learnedFeedbackCount: foundation.personalStyling?.learnedFeedback?.length || 0,
      };

    case 'today':
      return {
        ...base,
        domain: 'today_rhythm',
        workdays: foundation.lifeWork?.workdays,
        workHours: `${foundation.lifeWork?.workHoursStart} - ${foundation.lifeWork?.workHoursEnd}`,
        planningPhilosophy: {
          protectPersonalTime: foundation.lifeWork?.protectedPersonalTime,
          pacing: foundation.lifeWork?.pacingPhilosophy,
          avoidProductivityTrap: foundation.planning?.avoidProductivityTrap,
          respectAutonomy: foundation.planning?.respectAutonomy,
        },
      };

    case 'brain':
    case 'general':
    default:
      return {
        ...base,
        heritageContext: foundation.patzIdentity?.heritage,
        astrologyContext: foundation.astrology?.sunSign,
        planningPreferences: foundation.planning,
      };
  }
}

/**
 * Synchronizes foundation configuration into domain states (LifeProfile, Goals, CycleProfile, Wellbeing)
 */
export function syncFoundationData(
  foundation: FoundationData,
  prevLifeProfile: LifeProfile,
  prevGoals: Goal[],
  prevCycleProfile: CycleProfile,
  prevWellbeing: WellbeingState
): {
  lifeProfile: LifeProfile;
  goals: Goal[];
  cycleProfile: CycleProfile;
  wellbeing: WellbeingState;
} {
  // 1. Work contexts to LifeProfile
  const workdays =
    foundation.lifeWork?.workdays ||
    (foundation.work.workContexts[0] ? foundation.work.workContexts[0].workdays : prevLifeProfile.workingDays || []);
  const startTime =
    foundation.lifeWork?.workHoursStart ||
    (foundation.work.workContexts[0] ? foundation.work.workContexts[0].startTime : prevLifeProfile.workingHoursStart || '08:00');
  const endTime =
    foundation.lifeWork?.workHoursEnd ||
    (foundation.work.workContexts[0] ? foundation.work.workContexts[0].endTime : prevLifeProfile.workingHoursEnd || '16:30');

  const lifeProfile: LifeProfile = {
    ...prevLifeProfile,
    workingDays: workdays,
    workingHoursStart: startTime,
    workingHoursEnd: endTime,
    commitments: [
      ...(foundation.lifeWork?.recurringCommitments || []).map((c, i) => ({
        id: `fc-lw-${i + 1}`,
        title: c,
        dayOfWeek: 'Vrijdag',
        startTime: '10:00',
        endTime: '11:00',
        recurrence: 'recurring' as const,
        realm: 'personal' as const,
      })),
    ],
    routines: [
      ...(foundation.lifeWork?.personalRoutines || []).map((r, i) => ({
        id: `fr-lw-${i + 1}`,
        title: r,
        timeOfDay: 'morning' as const,
        durationMinutes: 20,
        recurrence: 'recurring' as const,
        realm: 'personal' as const,
      })),
    ],
  };

  // 2. Goals sync: only real user goals
  const syncedGoals: Goal[] = [
    ...prevGoals,
    ...foundation.goals.goals
      .filter((fg) => !prevGoals.some((pg) => pg.id === fg.id || pg.title.toLowerCase() === fg.name.toLowerCase()))
      .map((fg) => ({
        id: fg.id || `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: fg.name,
        description: fg.description || '',
        realm: fg.domain === 'mariluna' ? ('mariluna' as const) : ('personal' as const),
        timeframe: 'quarterly' as const,
        progress: 0,
        targetDate: fg.targetDate || '',
        connectedTaskIds: [],
        connectedProjectIds: [],
        milestones: [],
      })),
  ];

  // 3. Cycle profile sync
  const cycleProfile: CycleProfile = {
    ...prevCycleProfile,
    trackingEnabled: foundation.cycle?.enabled ?? true,
    lastPeriodStartDate: foundation.cycle?.lastPeriodStart || prevCycleProfile.lastPeriodStartDate || '',
    averageCycleLength: foundation.cycle?.averageCycleLength || 28,
    averagePeriodLength: foundation.cycle?.averagePeriodLength || 5,
    privacyLocked: true,
    lastUpdated: new Date().toISOString(),
  };

  // 4. Wellbeing state sync
  let updatedProgressLogs = [...(prevWellbeing.progressLogs || [])];
  if (
    foundation.wellbeing.currentWeightKg ||
    foundation.wellbeing.waistCm ||
    foundation.wellbeing.hipsCm ||
    foundation.wellbeing.chestCm
  ) {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingToday = updatedProgressLogs.find((p) => p.date === todayStr);
    if (!existingToday) {
      updatedProgressLogs.unshift({
        id: `pl-foundation-${Date.now()}`,
        date: todayStr,
        weightKg: foundation.wellbeing.currentWeightKg,
        measurements: {
          waistCm: foundation.wellbeing.waistCm,
          hipsCm: foundation.wellbeing.hipsCm,
          chestCm: foundation.wellbeing.chestCm,
        },
        recordedFact: 'Initiële startmeting vastgelegd tijdens fundament configuratie.',
      });
    }
  }

  const wellbeing: WellbeingState = {
    ...prevWellbeing,
    progressLogs: updatedProgressLogs,
    preferences: {
      ...prevWellbeing.preferences,
      foodPreferences: {
        ...prevWellbeing.preferences?.foodPreferences,
        dietaryStyle:
          foundation.foodProfile?.cuisineHierarchy.primary ||
          foundation.nutrition.dietaryRestrictions.join(', ') ||
          prevWellbeing.preferences?.foodPreferences?.dietaryStyle,
        exclusions: [
          ...(foundation.foodProfile?.noCouscousRule ? ['Couscous'] : []),
          ...(foundation.foodProfile?.dislikes || []),
          ...(foundation.nutrition.avoidedFoods || []),
        ],
        quickPrepWeekdaysMaxMinutes: foundation.nutrition.cookingTimeMinutes || 35,
      },
      movementPreferences: {
        ...prevWellbeing.preferences?.movementPreferences,
        preferredTypes:
          foundation.wellbeing.movementPreferences.length > 0
            ? foundation.wellbeing.movementPreferences
            : prevWellbeing.preferences?.movementPreferences?.preferredTypes || ['Wandelen', 'Pilates'],
      },
    },
  };

  return {
    lifeProfile,
    goals: syncedGoals,
    cycleProfile,
    wellbeing,
  };
}

export function applyFoundationToAppState(
  appStateOrFoundation: any,
  foundationOrLifeProfile?: any,
  prevGoals?: Goal[],
  prevCycleProfile?: CycleProfile,
  prevWellbeing?: WellbeingState
): any {
  if (appStateOrFoundation && 'tasks' in appStateOrFoundation && foundationOrLifeProfile) {
    const appState = appStateOrFoundation;
    const foundation: FoundationData = foundationOrLifeProfile;
    const res = syncFoundationData(
      foundation,
      appState.lifeProfile,
      appState.goals,
      appState.cycleProfile,
      appState.wellbeing
    );
    return {
      ...appState,
      lifeProfile: res.lifeProfile,
      goals: res.goals,
      cycleProfile: res.cycleProfile,
      wellbeing: res.wellbeing,
    };
  }

  return syncFoundationData(
    appStateOrFoundation as FoundationData,
    foundationOrLifeProfile as LifeProfile,
    prevGoals || [],
    prevCycleProfile || ({} as CycleProfile),
    prevWellbeing || ({} as WellbeingState)
  );
}

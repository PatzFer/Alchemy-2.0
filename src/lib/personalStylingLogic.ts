import {
  GarmentEvaluation,
  StyleLearnedFeedback,
  FoundationPersonalStyling,
  BodyMeasurementEntry,
} from '../types';

// ============================================================
// EMOTIONAL DRESSING MOODS (12 Moods as defined in Foundation)
// ============================================================
export interface EmotionalMoodConfig {
  id: string;
  nameNl: string;
  nameEn: string;
  taglineNl: string;
  descriptionNl: string;
  stylingKeyNl: string;
  paletteFocusNl: string;
  signaturePiecesNl: string[];
}

export const EMOTIONAL_MOODS: EmotionalMoodConfig[] = [
  {
    id: 'soft',
    nameNl: 'Zacht (Soft)',
    nameEn: 'Soft',
    taglineNl: 'Omhullend, tactiel en geruststellend voor jezelf.',
    descriptionNl: 'Stoffen die je zacht dragen: kasjmier, fijn linnen, soepele viscose en afgeronde lijnen.',
    stylingKeyNl: 'Vloeiende overgangen, geen harde contrasten, zachte halslijnen en soepelvallende draperie.',
    paletteFocusNl: 'Warm Ivoor, Camel, Zacht Taupe, Dusty Rose.',
    signaturePiecesNl: ['Fijne kasjmier trui met boothals', 'Vloeiende linnen midirok', 'Zachte suède loafers'],
  },
  {
    id: 'romantic',
    nameNl: 'Romantisch (Romantic)',
    nameEn: 'Romantic',
    taglineNl: 'Vrouwelijk, poëtisch en dromerig met verfijnde details.',
    descriptionNl: 'Zachte beweging in de stof, verfijnd kant, bloemmotieven en een prachtige halslijn.',
    stylingKeyNl: 'Sleutelbeen zichtbaar, zachte rimpeling of plooiing, beweging in de zoom bij elke stap.',
    paletteFocusNl: 'Warm Ivoor, Dusty Rose, Diep Bordeaux, Olijfgroen.',
    signaturePiecesNl: ['Kanten blouse met open kraag', 'Wikkeljurk met bloemendessin', 'Fijne goudkleurige kettinkjes'],
  },
  {
    id: 'mysterious',
    nameNl: 'Mysterieus (Mysterious)',
    nameEn: 'Mysterious',
    taglineNl: 'Intrigerend, diep en ingetogen aanwezig.',
    descriptionNl: 'Diepe schaduwen, rijke fluwelen of satijnen texturen en subtiele gelaagdheid.',
    stylingKeyNl: 'Donkere monochromatische basis met één tactiel textuurcontrast (bv. leer op zijde).',
    paletteFocusNl: 'Diep Zwart, Nachtblauw, Donker Chocoladebruin, Diep Smaragd.',
    signaturePiecesNl: ['Zijden midi-sliprok in zwart', 'Zwart leren jasje met patina', 'Zilver met donkere steen'],
  },
  {
    id: 'sensual',
    nameNl: 'Sensueel (Sensual)',
    nameEn: 'Sensual',
    taglineNl: 'Feminine + Soft + Mysterious + Subtly Sexy.',
    descriptionNl: 'Aansluitend op de taille, vloeiend over de heupen, tactiele stoffen en een subtiele split of open hals.',
    stylingKeyNl: 'Sensualiteit door pasvormprecisie en beweging — nooit schreeuwerig, altijd magnetisch.',
    paletteFocusNl: 'Diep Bordeaux, Warm Ivoor, Espresso, Nachtblauw.',
    signaturePiecesNl: ['Lange wikkeljurk met beenuitsnijding', 'Top met diepe ronde hals & brede ceintuur', 'Hoge leren laarzen'],
  },
  {
    id: 'powerful',
    nameNl: 'Krachtig (Powerful)',
    nameEn: 'Powerful',
    taglineNl: 'Soeverein, gegrond en ongehaast aanwezig.',
    descriptionNl: 'Gedefinieerde schouders, een scherpe maar soepele high-waist pantalon en een zelfverzekerde tred.',
    stylingKeyNl: 'Lange verticale beenlijnen, getailleerde blazer in zware textuur en sterke accessoires.',
    paletteFocusNl: 'Diep Zwart, Espresso, Army Green, Oudgoud.',
    signaturePiecesNl: ['High-waist plooipantalon met wijde pijp', 'Licht getailleerde blazer', 'Gouden statement ring'],
  },
  {
    id: 'wild/free',
    nameNl: 'Vrij & Wild (Wild / Free)',
    nameEn: 'Wild & Free',
    taglineNl: 'Natuurlijke ademruimte, ongepolijste authenticiteit en bewegingsvrijheid.',
    descriptionNl: 'Bohemian laagjes, suède franjes, comfortabele boots en kleding die danst in de wind.',
    stylingKeyNl: 'Geen stijve conventies: maxi-rokken, losgeknoopte kragen en karaktervolle hoeden.',
    paletteFocusNl: 'Terracotta, Camel, Olijf, Donker Zand, Turquoise accenten.',
    signaturePiecesNl: ['Maxi-jurk met franjes of split', 'Western boots met stiksels', 'Brede fedora hoed'],
  },
  {
    id: 'elegant',
    nameNl: 'Elegant (Elegant)',
    nameEn: 'Elegant',
    taglineNl: 'Tijdloze rust, pure verhoudingen en ingetogen Europese klasse.',
    descriptionNl: 'Monochrome combinaties, hoogwaardige natuurlijke materialen en onberispelijke proporties.',
    stylingKeyNl: 'Rustige lijnen, minimale opsmuk, een perfect vallende zoomlijn en gouden accenten.',
    paletteFocusNl: 'Warm Ivoor, Zacht Taupe, Espresso, Warm Brons.',
    signaturePiecesNl: ['Zijden blouse in ivoor', 'Klassieke trenchcoat op midi-lengte', 'Leren loafers'],
  },
  {
    id: 'playful',
    nameNl: 'Speels (Playful)',
    nameEn: 'Playful',
    taglineNl: 'Onbevangen, lichtvoetig en verrassend in contrasten.',
    descriptionNl: 'Een onverwachte print, een vrolijke strikceintuur of vintage accenten gecombineerd met denim.',
    stylingKeyNl: 'Mix van casual en chic: een vrouwelijke rok met een losvallend vintage shirt.',
    paletteFocusNl: 'Dusty Rose, Terracotta, Blauwgroen, Warm Ivoor.',
    signaturePiecesNl: ['Geprinte A-lijn rok met knopen', 'Zacht wit shirt met opgerolde mouwen', 'Goudkleurige hoepeloorbellen'],
  },
  {
    id: 'witchy',
    nameNl: 'Witchy (Witchy)',
    nameEn: 'Witchy',
    taglineNl: 'Donker romantisch, aards magisch en diep intuïtief.',
    descriptionNl: 'Donkere bloemen, fluweel, zwierige kanten zomen, zilver met edelstenen en wijde mouwen.',
    stylingKeyNl: 'Dramatische lengte, subtiele transparantie en donkere poëzie.',
    paletteFocusNl: 'Diep Zwart, Donker Smaragd, Diep Bordeaux, Nachtblauw.',
    signaturePiecesNl: ['Zwarte fluwelen maxi-jurk', 'Kanten kimono over zwart onderkleed', 'Zegelring met onyx'],
  },
  {
    id: 'bohemian',
    nameNl: 'Bohemian (Bohemian)',
    nameEn: 'Bohemian',
    taglineNl: 'Artisanaal, aards en rijk aan folklore en warmte.',
    descriptionNl: 'Natuurlijke vezels, borduursels, gelaagde sieraden en zwierige silhouetten.',
    stylingKeyNl: 'Rijke aardse kleurentinten, brede riem rond de natuurlijke taille en comfortabele laarzen.',
    paletteFocusNl: 'Terracotta, Olijfgroen, Warm Zand, Roest, Turquoise.',
    signaturePiecesNl: ['Gehaakte of geborduurde top', 'Tiered maxi-rok met beweging', 'Brede leren riem met gesp'],
  },
  {
    id: 'rock',
    nameNl: 'Rock / Grunge (Rock)',
    nameEn: 'Rock / Grunge',
    taglineNl: '90s coolness met vrouwelijke sensualiteit en lef.',
    descriptionNl: 'Zwart leer, vintage bandshirts, donker denim, grove gespen en een nonchalante houding.',
    stylingKeyNl: 'Tension tussen stoer en vrouwelijk: stoer leren jack over een zachte satijnen slip dress.',
    paletteFocusNl: 'Diep Zwart, Donkerrood, Donker Denimblauw, Zilver.',
    signaturePiecesNl: ['Zwart bikersjack met patina', 'Zwarte veterlaarzen of combat boots', 'Satijnen hemdje'],
  },
  {
    id: 'confident',
    nameNl: 'Zelfverzekerd (Confident)',
    nameEn: 'Confident',
    taglineNl: 'Gefocust, comfortabel in je eigen lijf en klaar voor de wereld.',
    descriptionNl: 'Kleding die nergens knelt of trekt, perfecte tailledefinitie en een open, gegronde houding.',
    stylingKeyNl: 'Heldere architectuur: benadrukte taille, verticale beenlijn en hoogwaardige textuur.',
    paletteFocusNl: 'Espresso, Warm Ivoor, Diep Zwart, Navy.',
    signaturePiecesNl: ['Maatwerk pantalon met hoge band', 'Aansluitende trui in fijne wol', 'Elegante haklaarsjes'],
  },
];

// ============================================================
// OCCASION TAXONOMY
// ============================================================
export interface OccasionOption {
  id: string;
  nameNl: string;
  nameEn: string;
  descriptionNl: string;
}

export const STYLING_OCCASIONS: OccasionOption[] = [
  { id: 'everyday', nameNl: 'Dagelijks & Rustig', nameEn: 'Everyday', descriptionNl: 'Thuis, ontspannen routines, wandelingen en dagelijks comfort' },
  { id: 'work', nameNl: 'Werk & Studio', nameEn: 'Work & Studio', descriptionNl: 'Creatieve focusdagen, videocalls of zakelijke afspraken' },
  { id: 'casual', nameNl: 'Casual & Vrije tijd', nameEn: 'Casual', descriptionNl: 'Stadswandeling, koffie drinken, museumbezoek' },
  { id: 'date', nameNl: 'Date & Intiem', nameEn: 'Date Night', descriptionNl: 'Subtiel verleidelijk, zacht licht, romantische sfeer' },
  { id: 'dinner', nameNl: 'Diner & Restaurant', nameEn: 'Dinner', descriptionNl: 'Verfijnde ambiance, gezellig tafelen met partner of vrienden' },
  { id: 'party', nameNl: 'Feest & Borrel', nameEn: 'Party', descriptionNl: 'Bruisende energie, extra gouden accenten en textuur' },
  { id: 'festival', nameNl: 'Festival & Openlucht', nameEn: 'Festival', descriptionNl: 'Bohemian vrijheid, stevige boots en bewegingsvrijheid' },
  { id: 'holiday', nameNl: 'Vakantie & Reizen', nameEn: 'Holiday', descriptionNl: 'Luchtig linnen, koffer-vriendelijk, zon en mediterrane aarde' },
  { id: 'wedding', nameNl: 'Bruiloft & Ceremonie', nameEn: 'Wedding', descriptionNl: 'Feestelijke elegantie, respect voor dresscode met eigen DNA' },
  { id: 'event', nameNl: 'Evenement & Gala', nameEn: 'Special Event', descriptionNl: 'Maximaal soeverein en feestelijk gekleed' },
  { id: 'general', nameNl: 'Algemeen Stijladvies', nameEn: 'General', descriptionNl: 'Algemene beoordeling zonder specifieke context' },
];

// ============================================================
// CURATED PRESET GARMENTS FOR INSTANT EVALUATION TESTING
// ============================================================
export interface PresetGarmentTest {
  id: string;
  title: string;
  category: string;
  brand: string;
  price: string;
  occasion: string;
  mood: string;
  imageUrl: string;
  fabricDescription: string;
  hasSizeChart: boolean;
  hasStretch: 'none' | 'slight' | 'high';
  expectedMatch: 'exceptional' | 'high' | 'moderate' | 'unfavorable';
  shortNoteNl: string;
}

export const PRESET_GARMENTS: PresetGarmentTest[] = [
  {
    id: 'preset-1',
    title: 'Bohemian Maxi Wikkeljurk in Terracotta met Kanten Bies',
    category: 'Jurken',
    brand: 'Sézane / Bohemian Paris',
    price: '€185',
    occasion: 'dinner',
    mood: 'romantic',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
    fabricDescription: '100% soepelvallende viscose met zachte kanten inzet bij de halslijn',
    hasSizeChart: true,
    hasStretch: 'slight',
    expectedMatch: 'exceptional',
    shortNoteNl: 'Ideale taille-insnoering, vloeiende lengte voor 1.57m, warme terracottatint.',
  },
  {
    id: 'preset-2',
    title: 'Vintage Suède Western Laarzen met Geborduurde Schacht',
    category: 'Schoenen & Laarzen',
    brand: 'Sendra / Vintage Suede',
    price: '€240',
    occasion: 'everyday',
    mood: 'wild/free',
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
    fabricDescription: 'Warm cognac suède met handgemaakte stiksels en comfortabele schuine hak',
    hasSizeChart: true,
    hasStretch: 'none',
    expectedMatch: 'exceptional',
    shortNoteNl: 'Hét signatuurstuk voor Patricia: maakt elke jurk direct meer "Patz".',
  },
  {
    id: 'preset-3',
    title: 'Donkerromantische Zijden Midirok met Zachte Split',
    category: 'Rokken',
    brand: 'Massimo Dutti Studio',
    price: '€129',
    occasion: 'date',
    mood: 'sensual',
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80',
    fabricDescription: 'Zware zijdeblend met schuine draad (bias cut) in diep nachtblauw',
    hasSizeChart: true,
    hasStretch: 'slight',
    expectedMatch: 'high',
    shortNoteNl: 'Valt zacht langs de heup zonder te tekenen, split geeft subtiele sensualiteit.',
  },
  {
    id: 'preset-4',
    title: 'Aansluitende Top met Diepe Boothals in Warm Ivoor',
    category: 'Tops & Blouses',
    brand: 'Arket / Fine Merino',
    price: '€69',
    occasion: 'work',
    mood: 'elegant',
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    fabricDescription: 'Fijne merinowol met ribstructuur en prachtig omlijste halslijn',
    hasSizeChart: false,
    hasStretch: 'high',
    expectedMatch: 'high',
    shortNoteNl: 'Toont het sleutelbeen, stopt mooi in de high-waist pantalon.',
  },
  {
    id: 'preset-5',
    title: 'Oversized Boxy Blazer in Stug Synthetisch Grijs',
    category: 'Jasjes & Blazers',
    brand: 'Fast Fashion Boxy',
    price: '€89',
    occasion: 'work',
    mood: 'powerful',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
    fabricDescription: '100% polyester, stugge schoudervulling, rechte vormeloze snit zonder taillering',
    hasSizeChart: false,
    hasStretch: 'none',
    expectedMatch: 'unfavorable',
    shortNoteNl: 'Vormeloos, verstopt de taille en creëert een massief horizontaal blok bij 1.57m.',
  },
  {
    id: 'preset-6',
    title: 'Strakke Kokerrok met Brede Horizontale Strepen',
    category: 'Rokken',
    brand: 'Trendy Knit',
    price: '€45',
    occasion: 'casual',
    mood: 'playful',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    fabricDescription: 'Strakke acrylbrei met stijve elastische band op heuphoogte',
    hasSizeChart: false,
    hasStretch: 'high',
    expectedMatch: 'unfavorable',
    shortNoteNl: 'Horizontale strepen op het breedste heuppunt verbreken de verticale beenlijn.',
  },
];

// ============================================================
// INTELLIGENT CLOTHING EVALUATION ENGINE
// ============================================================
export interface GarmentEvaluationInput {
  itemTitle: string;
  category: string;
  brand?: string;
  price?: string;
  occasion?: string;
  mood?: string;
  imageUrl?: string;
  productUrl?: string;
  fabricDescription?: string;
  hasSizeChartOrMeasurements?: boolean;
  hasStretch?: 'none' | 'slight' | 'high';
  userNotes?: string;
}

export function checkGarmentInputSufficiency(input: GarmentEvaluationInput): {
  isSufficient: boolean;
  reasonNl: string;
  reasonEn: string;
} {
  const hasImage = Boolean(input.imageUrl && input.imageUrl.trim().length > 5);
  const rawUrl = (input.productUrl || '').trim();
  const titleAsUrl = (input.itemTitle || '').trim().startsWith('http://') || (input.itemTitle || '').trim().startsWith('https://');
  const hasUrl = Boolean(rawUrl.length > 5 || titleAsUrl);

  const title = (input.itemTitle || '').trim();
  const fabric = (input.fabricDescription || '').trim();
  const brand = (input.brand || '').trim();
  const notes = (input.userNotes || '').trim();

  // Common placeholder or single generic test strings
  const lowerTitle = title.toLowerCase();
  const placeholderPatterns = ['test', 'demo', 'sample', 'item', 'kleding', 'kledingstuk', '123', 'abc', 'shirt', 'broek', 'jurk', 'rok', 'top', 'schoenen'];
  const isPlaceholderOnly = placeholderPatterns.includes(lowerTitle) || title.length < 3;

  const hasSubstantialTitle = !isPlaceholderOnly && title.length >= 4;
  const hasExtraAttributes = fabric.length > 2 || brand.length > 2 || notes.length > 2 || Boolean(input.hasSizeChartOrMeasurements);

  if (hasImage || hasUrl || (hasSubstantialTitle && (hasExtraAttributes || title.split(/\s+/).length >= 2))) {
    return {
      isSufficient: true,
      reasonNl: '',
      reasonEn: '',
    };
  }

  return {
    isSufficient: false,
    reasonNl: 'Onvoldoende informatie om dit kledingstuk betrouwbaar te beoordelen. Voeg een foto, productlink of meer details (zoals stof of merk) toe.',
    reasonEn: 'Insufficient information to evaluate this garment reliably. Please add a photo, product link, or more details (such as fabric or brand).',
  };
}

export function evaluateGarment(
  input: GarmentEvaluationInput,
  stylingProfile: FoundationPersonalStyling,
  latestMeasurement?: BodyMeasurementEntry,
  learnedFeedback: StyleLearnedFeedback[] = []
): GarmentEvaluation {
  const sufficiency = checkGarmentInputSufficiency(input);

  if (!sufficiency.isSufficient) {
    return {
      id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      itemTitle: input.itemTitle.trim() || 'Onbekend Kledingstuk',
      category: input.category || 'Algemeen',
      brand: input.brand?.trim() || undefined,
      price: input.price?.trim() || undefined,
      imageUrl: input.imageUrl?.trim() || undefined,
      productUrl: input.productUrl?.trim() || undefined,
      occasion: input.occasion || 'general',
      mood: input.mood || 'soft',
      isInsufficient: true,
      insufficientReasonNl: sufficiency.reasonNl,
      insufficientReasonEn: sufficiency.reasonEn,
      styleMatchPercent: 0,
      silhouetteMatchPercent: 0,
      colourMatchPercent: 0,
      overallMatchPercent: 0,
      fitConfidencePercent: 0,
      fitConfidenceReason: sufficiency.reasonNl,
      verdictNl: sufficiency.reasonNl,
      keyObservations: [sufficiency.reasonNl],
      pros: [],
      considerations: ['Voeg een foto, productlink of extra details toe om een betrouwbare Stijl DNA analyse te genereren.'],
      enhancements: [],
      conclusion: '',
      alternatives: [],
    };
  }

  const textCorpus = `${input.itemTitle} ${input.category} ${input.fabricDescription || ''} ${input.userNotes || ''}`.toLowerCase();
  
  // 1. STYLE DNA MATCH
  let styleScore = 80;
  const signatureMatches: string[] = [];
  const unfavorableMatches: string[] = [];

  // Check favorable signatures
  if (/maxi|wikkel|boho|bohemian|kant|suède|leer|laarzen|boots|flared|high-waist|plooi|vintage|wikkeljurk|satijn|zijde/i.test(textCorpus)) {
    styleScore += 12;
    signatureMatches.push('Sluit naadloos aan bij je kern (bohemian, romantisch & vrouwelijke silhouetten)');
  }
  if (/western|franje|cowboy|gesp|hoed|fedora|vintage/i.test(textCorpus)) {
    styleScore += 6;
    signatureMatches.push('Karaktervolle western/vintage touch aanwezig');
  }
  if (/donker|bordeaux|zwart|fluweel|kant|mysterieus|witchy/i.test(textCorpus)) {
    styleScore += 5;
    signatureMatches.push('Past bij het aantrekkelijke donker-romantische spanningsveld');
  }

  // Check unfavorable
  if (/boxy|oversized zonder taillering|vormeloos|strakke kokerrok|preppy|stijf|neon|felgeel|tl-wit/i.test(textCorpus)) {
    styleScore -= 28;
    unfavorableMatches.push('Vormeloze of stugge snit ontbreekt de nodige tailledefinitie');
  }
  if (/polyester|acryl|synthetisch glans/i.test(textCorpus)) {
    styleScore -= 8;
  }
  styleScore = Math.max(30, Math.min(99, styleScore));

  // 2. SILHOUETTE & ARCHITECTURE MATCH (Petite 157cm & Waist-defined)
  let silhouetteScore = 82;
  const silhouetteObservations: string[] = [];

  const hasWaistEmphasis = /taille|wikkel|high-waist|ceintuur|riem|aansluitend|ingestopt|getailleerd/i.test(textCorpus);
  const isBoxyOrStraight = /boxy|recht model|vormeloos|losvallend zonder riem|oversized blazer/i.test(textCorpus);
  const isHorizontalStripes = /horizontale strepen|brede banen/i.test(textCorpus);
  const isAwkwardLength = /tot net op de heup|halverwege heup/i.test(textCorpus);

  if (hasWaistEmphasis) {
    silhouetteScore += 14;
    silhouetteObservations.push('Benadrukt de natuurlijke taille als rustpunt en visueel anker.');
  }
  if (isBoxyOrStraight) {
    silhouetteScore -= 32;
    silhouetteObservations.push('Rechte vormeloze snit voorkomt dat de taille zichtbaar wordt, waardoor het volume massief kan lijken bij een petite lengte (1.57 m).');
  }
  if (isHorizontalStripes) {
    silhouetteScore -= 22;
    silhouetteObservations.push('Horizontale lijnen doorbreken de gewenste doorlopende verticale lijn.');
  }
  if (isAwkwardLength) {
    silhouetteScore -= 18;
    silhouetteObservations.push('Eindigt precies op het breedste heuppunt — kies liever korter (op de taille) of langer (over de heup vloeiend).');
  }
  if (/vloeiend|soepel|a-lijn|split|bias-cut|drapering/i.test(textCorpus)) {
    silhouetteScore += 8;
    silhouetteObservations.push('Vloeiende stof beweegt natuurlijk mee rond heupen en dijen zonder horizontaal te spannen.');
  }
  silhouetteScore = Math.max(25, Math.min(98, silhouetteScore));

  // 3. COLOUR DNA MATCH
  let colourScore = 80;
  const colourNotes: string[] = [];

  if (/ivoor|crème|warm wit|gebroken wit|taupe|camel|terracotta|cognac|zand|olijf|moss|army|khaki|bordeaux|diep rood|zwart|nachtblauw|navy|teal|petrol|smaragd|emerald|roest|oudgoud|brons/i.test(textCorpus)) {
    colourScore += 15;
    colourNotes.push('Tint past prachtig binnen je rijke, aardse en donker-romantische kleurenpalet.');
  }
  if (/hard wit|optisch wit|fel neon|zuur geel|ijzig grijs/i.test(textCorpus)) {
    colourScore -= 30;
    colourNotes.push('Kleur is optisch te hard of koel voor je warme Portugese aarde- en ivoortinten.');
  }
  colourScore = Math.max(35, Math.min(99, colourScore));

  // 4. DETAIL MATCH
  let detailScore = 78;
  if (/kant|suède|leer|western|gesp|franjes|knopen|split|decolleté|sleutelbeen|bloemenprint|vintage/i.test(textCorpus)) {
    detailScore += 16;
  }
  if (/plastic|grove ritsen|sportief logo/i.test(textCorpus)) {
    detailScore -= 18;
  }
  detailScore = Math.max(35, Math.min(97, detailScore));

  // 5. MOOD MATCH
  let moodScore = 85;
  if (input.mood) {
    const activeMoodConfig = EMOTIONAL_MOODS.find((m) => m.id === input.mood);
    if (activeMoodConfig) {
      if (textCorpus.includes(input.mood) || activeMoodConfig.signaturePiecesNl.some((p) => textCorpus.includes(p.toLowerCase().slice(0, 5)))) {
        moodScore = 95;
      }
    }
  }

  // 6. PRACTICALITY
  let practicalityScore = 82;
  if (/onderhoudsvriendelijk|comfortabel|zacht|soepel|ademend/i.test(textCorpus)) {
    practicalityScore += 8;
  }
  if (/alleen stomerij|extreem kreukgevoelig|knellend/i.test(textCorpus)) {
    practicalityScore -= 14;
  }
  practicalityScore = Math.max(40, Math.min(95, practicalityScore));

  // 7. LEARNED PREFERENCES ADJUSTMENT
  const lovesMaxi = learnedFeedback.filter((f) => (f.reaction === 'love' || f.reaction === 'loveee') && f.itemTitle.toLowerCase().includes('maxi')).length;
  const hatesBoxy = learnedFeedback.filter((f) => (f.reaction === 'nah' || f.reaction === 'dislike') && f.itemTitle.toLowerCase().includes('boxy')).length;
  if (lovesMaxi > 0 && /maxi|lange jurk/i.test(textCorpus)) {
    styleScore = Math.min(99, styleScore + 3);
  }
  if (hatesBoxy > 0 && /boxy|oversized/i.test(textCorpus)) {
    styleScore = Math.max(25, styleScore - 6);
  }

  // OVERALL WEIGHTED SYNTHESIS
  const overallScore = Math.round(
    styleScore * 0.3 +
    silhouetteScore * 0.25 +
    colourScore * 0.15 +
    detailScore * 0.15 +
    moodScore * 0.1 +
    practicalityScore * 0.05
  );

  // 8. FIT CONFIDENCE VS STYLE MATCH (Crucial Prompt 9 distinction!)
  let fitConfidence = 58;
  let fitReason = 'Gebaseerd op uiterlijke stijl- en foto-analyse zonder concrete maattabel. Foto toont niet hoe de stof om jouw individuele verhoudingen valt.';

  if (input.hasSizeChartOrMeasurements) {
    fitConfidence += 26;
    fitReason = 'Verhoogd: maattabel of specifieke maten beschikbaar. Kan nauwkeuriger worden vergeleken met je laatste metingen.';
  }
  if (input.hasStretch === 'high') {
    fitConfidence += 8;
    fitReason += ' Rekbare stof verkleint pasvormrisico aanzienlijk.';
  } else if (input.hasStretch === 'none') {
    fitConfidence -= 6;
    fitReason += ' Niet-elastische stof vereist precieze pasvorm rond taille en heup.';
  }
  if (latestMeasurement?.waist && latestMeasurement?.hip) {
    fitConfidence += 6;
  }
  fitConfidence = Math.max(35, Math.min(92, fitConfidence));

  // 9. FORMULATE WHY & CONCLUSION
  const pros: string[] = [];
  const considerations: string[] = [];
  const enhancements: string[] = [];

  if (styleScore >= 75) {
    pros.push('Vrouwelijk, zacht en romantisch met authentieke boho/western uitstraling.');
  }
  if (hasWaistEmphasis) {
    pros.push('Tailledefinitie werkt uitstekend: brengt direct evenwicht tussen boven- en onderlichaam.');
  }
  if (colourScore >= 80) {
    pros.push('Kleur harmonieert rijk met je warme aarde-, ivoor- en nachtblauwe Colour DNA.');
  }
  if (/split|open hals|sleutelbeen/i.test(textCorpus)) {
    pros.push('Mooie open halslijn of subtiele split geeft verfijnde sensualiteit zonder overdrijving.');
  }

  if (isBoxyOrStraight) {
    considerations.push('Rechte vormeloze belijning mist taillefocus, wat bij 1.57m snel massief kan ogen.');
  }
  if (isAwkwardLength) {
    considerations.push('Zoomhoogte vraagt aandacht: voorkom dat de zoomrand exact op het breedste heuppunt valt.');
  }
  if (!input.hasSizeChartOrMeasurements) {
    considerations.push('Controleer de maattabel voor de taille/heup ratio vooraleer te bestellen.');
  }

  // Enhancements ("+ would become more Patz with...")
  enhancements.push('Combineer met suède western laarzen of elegante leren boots voor direct meer karakter.');
  if (!hasWaistEmphasis) {
    enhancements.push('Draag er een brede leren tailleriem met ornamentale gesp bij om het smalste punt te markeren.');
  } else {
    enhancements.push('Draag gelaagde gouden colliers of subtiele hoepels om het sleutelbeen te accentueren.');
  }
  enhancements.push('Drapeer er een zacht suède jack of kort leren jasje overheen voor het gewenste soft + strong contrast.');

  // Conclusion
  let verdictNl = '';
  let conclusion = '';
  const alternatives: string[] = [];

  if (overallScore >= 85) {
    conclusion = `Ja — sterk Patricia. Dit stuk heeft exact de vrouwelijke poëzie, rust en tactiele aantrekkingskracht die bij jouw aanwezigheid past.`;
    verdictNl = `Zeer sterke match (${overallScore}%). Sluit naadloos aan bij jouw stijl-DNA en benadrukt je proporties op een zachte, elegante wijze.`;
    alternatives.push('Kies bij twijfel tussen twee maten de maat die op je taille aansluit; de rok of pantalon mag soepel vallen.');
  } else if (overallScore >= 70) {
    conclusion = `Goede basis, mits juist gestyled. Het kledingstuk heeft potentie, maar vraagt om een doordachte combinatie met laarzen en een taille-accent.`;
    verdictNl = `Goede match met stylingaandacht (${overallScore}%). Heeft de juiste stijltoon, maar vereist een bewuste volumeplaatsing rond de taille.`;
    alternatives.push('Draag dit stuk met een opgerolde mouw of ingestopt in een high-waist item.');
    alternatives.push('Voeg een suède riem of gelaagde kettingen toe om de focus naar boven en de taille te leiden.');
  } else {
    conclusion = `Niet mijn eerste keuze voor jou, vooral door het gebrek aan tailledefinitie en de stugge val. De stijl zelf mag dan aantrekkelijk zijn, de architectuur werkt minder gunstig voor jouw 1.57m proporties.`;
    verdictNl = `Lagere match (${overallScore}%). De snit creëert een te recht of massief silhouet en laat je natuurlijke taille niet tot haar recht komen.`;
    alternatives.push('Zoek naar een variant met een overslag/wikkel-model (wrap dress/top) in plaats van deze rechte snit.');
    alternatives.push('Kies een soepelvallende stof (zoals cupro, zijde, zachte viscose) in plaats van deze stugge textuur.');
    alternatives.push('Indien je dit item toch wilt dragen: voeg een opvallende tailleriem toe en laat de halslijn openvallen.');
  }

  return {
    id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: new Date().toISOString().split('T')[0],
    itemTitle: input.itemTitle.trim(),
    category: input.category,
    brand: input.brand?.trim() || undefined,
    price: input.price?.trim() || undefined,
    productUrl: input.productUrl?.trim() || undefined,
    occasion: input.occasion || 'general',
    mood: input.mood || 'soft',
    imageUrl: input.imageUrl?.trim() || undefined,
    styleMatchPercent: styleScore,
    silhouetteMatchPercent: silhouetteScore,
    colourMatchPercent: colourScore,
    detailMatchPercent: detailScore,
    moodMatchPercent: moodScore,
    practicalityPercent: practicalityScore,
    overallMatchPercent: overallScore,
    fitConfidencePercent: fitConfidence,
    fitConfidenceReason: fitReason,
    verdictNl,
    keyObservations: [...pros.slice(0, 2), ...considerations.slice(0, 2)],
    pros,
    considerations,
    enhancements,
    conclusion,
    alternatives,
  };
}

import { Language } from '../types';

export interface CelestialEvent {
  type: 'astronomical' | 'astrological';
  title: string;
  astronomicalFact: string;
  optionalAstrologicalNote?: string;
  isProminent: boolean;
}

// Synodic lunar cycle duration in days
const SYNODIC_MONTH = 29.53058867;
// Known astronomical reference New Moon: 2024-01-11 11:57 UTC
const REF_NEW_MOON_UTC = new Date(Date.UTC(2024, 0, 11, 11, 57, 0)).getTime();

export function getAstronomicalMoonPhase(date: Date = new Date()): {
  phaseFraction: number; // 0 to 1
  phaseNameNl: string;
  phaseNameEn: string;
  illuminationPct: number;
  daysIntoCycle: number;
} {
  const diffDays = (date.getTime() - REF_NEW_MOON_UTC) / (1000 * 60 * 60 * 24);
  const daysIntoCycle = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const phaseFraction = daysIntoCycle / SYNODIC_MONTH;
  const illuminationPct = Math.round(((1 - Math.cos(phaseFraction * 2 * Math.PI)) / 2) * 100);

  let phaseNameNl = 'Wassende Maan';
  let phaseNameEn = 'Waxing Moon';

  if (daysIntoCycle < 1.3 || daysIntoCycle > 28.2) {
    phaseNameNl = 'Nieuwe Maan';
    phaseNameEn = 'New Moon';
  } else if (daysIntoCycle >= 1.3 && daysIntoCycle < 6.4) {
    phaseNameNl = 'Wassende Sikkel';
    phaseNameEn = 'Waxing Crescent';
  } else if (daysIntoCycle >= 6.4 && daysIntoCycle <= 8.4) {
    phaseNameNl = 'Eerste Kwartier';
    phaseNameEn = 'First Quarter';
  } else if (daysIntoCycle > 8.4 && daysIntoCycle < 13.5) {
    phaseNameNl = 'Wassende Maan';
    phaseNameEn = 'Waxing Gibbous';
  } else if (daysIntoCycle >= 13.5 && daysIntoCycle <= 16.0) {
    phaseNameNl = 'Volle Maan';
    phaseNameEn = 'Full Moon';
  } else if (daysIntoCycle > 16.0 && daysIntoCycle < 21.0) {
    phaseNameNl = 'Afnemende Maan';
    phaseNameEn = 'Waning Gibbous';
  } else if (daysIntoCycle >= 21.0 && daysIntoCycle <= 23.0) {
    phaseNameNl = 'Laatste Kwartier';
    phaseNameEn = 'Last Quarter';
  } else {
    phaseNameNl = 'Afnemende Sikkel';
    phaseNameEn = 'Waning Crescent';
  }

  return {
    phaseFraction,
    phaseNameNl,
    phaseNameEn,
    illuminationPct,
    daysIntoCycle,
  };
}

export function getRelevantCelestialNote(date: Date = new Date(), lang: Language = 'nl'): CelestialEvent | null {
  const isNl = lang === 'nl';
  const moon = getAstronomicalMoonPhase(date);
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // 1. Exact New Moon (within ~1.2 days)
  if (moon.daysIntoCycle < 1.2 || moon.daysIntoCycle > 28.3) {
    return {
      type: 'astronomical',
      title: isNl ? '✦ Vanavond: Nieuwe Maan' : '✦ Tonight: New Moon',
      astronomicalFact: isNl
        ? 'Astronomisch verschijnsel: de maan staat tussen aarde en zon en is niet direct verlicht (0% verlicht).'
        : 'Astronomical event: the moon is aligned between earth and sun and not directly illuminated (0% illuminated).',
      optionalAstrologicalNote: isNl
        ? 'Optionele astrologische reflectie: een natuurlijke kosmische pauze om te verstillen en intenties te aarden.'
        : 'Optional astrological reflection: a natural cosmic pause to quieten down and ground intentions.',
      isProminent: true,
    };
  }

  // 2. Exact Full Moon (within ~1.2 days)
  if (moon.daysIntoCycle >= 13.6 && moon.daysIntoCycle <= 15.8) {
    return {
      type: 'astronomical',
      title: isNl ? '✦ Vanavond: Volle Maan' : '✦ Tonight: Full Moon',
      astronomicalFact: isNl
        ? `Astronomisch verschijnsel: volledige zonne-illuminatie van de zichtbare maanschijf (~${moon.illuminationPct}%).`
        : `Astronomical event: complete solar illumination of the lunar disk (~${moon.illuminationPct}%).`,
      optionalAstrologicalNote: isNl
        ? 'Optionele astrologische reflectie: piekend natuurlijk licht en helderheid om te oogsten wat volwassen is geworden.'
        : 'Optional astrological reflection: heightened natural luminosity and clarity to harvest what has matured.',
      isProminent: true,
    };
  }

  // 3. Exact First Quarter (Halve wassende maan)
  if (moon.daysIntoCycle >= 6.5 && moon.daysIntoCycle <= 8.2) {
    return {
      type: 'astronomical',
      title: isNl ? '✦ Vanavond: Eerste Kwartier' : '✦ Tonight: First Quarter Moon',
      astronomicalFact: isNl
        ? 'Astronomisch verschijnsel: de maanschijf is exact half verlicht (~50% zichtbaar licht) in haar wassende cyclus.'
        : 'Astronomical event: the lunar disk is half illuminated (~50% visible light) in its waxing phase.',
      optionalAstrologicalNote: isNl
        ? 'Optionele astrologische reflectie: een moment van actieve vormgeving en praktische focus.'
        : 'Optional astrological reflection: a checkpoint of active shaping and grounded practical focus.',
      isProminent: false,
    };
  }

  // 4. Exact Last Quarter (Halve afnemende maan)
  if (moon.daysIntoCycle >= 21.2 && moon.daysIntoCycle <= 22.8) {
    return {
      type: 'astronomical',
      title: isNl ? '✦ Vanavond: Laatste Kwartier' : '✦ Tonight: Last Quarter Moon',
      astronomicalFact: isNl
        ? 'Astronomisch verschijnsel: de maanschijf is half verlicht (~50%) in haar afnemende cyclus richting nieuwe maan.'
        : 'Astronomical event: the lunar disk is half illuminated (~50%) in its waning cycle towards new moon.',
      optionalAstrologicalNote: isNl
        ? 'Optionele astrologische reflectie: opruimen, afronden en ballast loslaten.'
        : 'Optional astrological reflection: releasing clutter, wrapping up tasks, and conserving vitality.',
      isProminent: false,
    };
  }

  // 5. Equinoxes and Solstices
  if (month === 3 && (day === 20 || day === 21)) {
    return {
      type: 'astronomical',
      title: isNl ? '✦ Astronomische Lente-equinox' : '✦ Vernal Equinox',
      astronomicalFact: isNl
        ? 'Astronomisch verschijnsel: dag en nacht zijn wereldwijd vrijwel exact even lang; de zon passeert de evenaar noordwaarts.'
        : 'Astronomical event: day and night are of nearly equal length worldwide; sun crosses the celestial equator northward.',
      isProminent: true,
    };
  }

  if (month === 6 && (day === 20 || day === 21)) {
    return {
      type: 'astronomical',
      title: isNl ? '✦ Astronomische Zomerzonnewende' : '✦ Summer Solstice',
      astronomicalFact: isNl
        ? 'Astronomisch verschijnsel: langste dag van het jaar op het noordelijk halfrond.'
        : 'Astronomical event: longest day of the year in the northern hemisphere.',
      isProminent: true,
    };
  }

  if (month === 9 && (day === 22 || day === 23)) {
    return {
      type: 'astronomical',
      title: isNl ? '✦ Astronomische Herfst-equinox' : '✦ Autumnal Equinox',
      astronomicalFact: isNl
        ? 'Astronomisch verschijnsel: dag en nacht zijn in evenwicht; astronomische intrede van de herfst.'
        : 'Astronomical event: day and night in equilibrium; astronomical transition into autumn.',
      isProminent: true,
    };
  }

  if (month === 12 && (day === 21 || day === 22)) {
    return {
      type: 'astronomical',
      title: isNl ? '✦ Astronomische Winterzonnewende' : '✦ Winter Solstice',
      astronomicalFact: isNl
        ? 'Astronomisch verschijnsel: kortste dag en langste nacht van het jaar op het noordelijk halfrond.'
        : 'Astronomical event: shortest day and longest night of the year in the northern hemisphere.',
      isProminent: true,
    };
  }

  // 6. Notable annual meteor showers
  if (month === 8 && day >= 11 && day <= 13) {
    return {
      type: 'astronomical',
      title: isNl ? '✦ Perseïden Meteorenzwerm Piek' : '✦ Perseid Meteor Shower Peak',
      astronomicalFact: isNl
        ? 'Astronomisch verschijnsel: jaarlijkse meteorietenregen veroorzaakt door stofdeeltjes van komeet Swift-Tuttle.'
        : 'Astronomical event: annual meteor shower caused by debris from comet Swift-Tuttle.',
      isProminent: true,
    };
  }

  if (month === 12 && day >= 13 && day <= 14) {
    return {
      type: 'astronomical',
      title: isNl ? '✦ Geminiden Meteorenzwerm Piek' : '✦ Geminid Meteor Shower Peak',
      astronomicalFact: isNl
        ? 'Astronomisch verschijnsel: een van de meest heldere meteorenregens van het jaar, afkomstig van planetoïde 3200 Phaethon.'
        : 'Astronomical event: one of the brightest meteor showers of the year, originating from asteroid 3200 Phaethon.',
      isProminent: true,
    };
  }

  // If no significant astronomical event applies today, return null (respecting "only when genuinely relevant")
  return null;
}

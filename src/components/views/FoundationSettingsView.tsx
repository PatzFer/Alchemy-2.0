import React, { useState } from 'react';
import {
  User,
  Compass,
  Sparkles,
  MessageSquare,
  Briefcase,
  Calendar,
  Utensils,
  Shirt,
  Heart,
  Target,
  Feather,
  Shield,
  Check,
  CheckCircle2,
  Save,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Info,
  Lock,
  Camera,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Upload,
  X,
  HelpCircle,
} from 'lucide-react';
import {
  FoundationData,
  Language,
  WellbeingState,
  BodyMeasurementEntry,
  GarmentEvaluation,
  StyleLearnedFeedback,
} from '../../types';
import {
  FOUNDATION_SECTIONS,
  DEFAULT_FOUNDATION_DATA,
  DEFAULT_PATZ_IDENTITY,
  DEFAULT_ASTROLOGY,
  DEFAULT_COMMUNICATION,
  DEFAULT_LIFE_WORK,
  DEFAULT_PLANNING,
  DEFAULT_FOOD_PROFILE,
  DEFAULT_PERSONAL_STYLING,
} from '../../lib/foundationDefaults';
import { evaluateGarment, GarmentEvaluationInput } from '../../lib/personalStylingLogic';

interface FoundationSettingsViewProps {
  foundation: FoundationData;
  onUpdateFoundation: (updated: FoundationData) => void;
  wellbeingState?: WellbeingState;
}

export const FoundationSettingsView: React.FC<FoundationSettingsViewProps> = ({
  foundation,
  onUpdateFoundation,
  wellbeingState,
}) => {
  const [data, setData] = useState<FoundationData>(foundation);
  const [activeSection, setActiveSection] = useState<string>('who-is-patz');
  const [savedMessage, setSavedMessage] = useState<boolean>(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);

  // Clothing Evaluation Interactive State ("Past dit bij mij?")
  const [evalTitle, setEvalTitle] = useState('');
  const [evalCategory, setEvalCategory] = useState('Jurken & Rokken');
  const [evalColor, setEvalColor] = useState('Zand / Terracotta');
  const [evalFabric, setEvalFabric] = useState('Linnen blend');
  const [evalWaistStyle, setEvalWaistStyle] = useState('Hoge taille met strikband');
  const [evalMood, setEvalMood] = useState('elegant');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [newEvalResult, setNewEvalResult] = useState<GarmentEvaluation | null>(null);

  const lang: Language = data.aboutYou?.preferredLanguage || 'nl';
  const isNl = lang === 'nl';

  // Read latest dynamic body measurements from Wellbeing if available
  const latestLog = wellbeingState?.progressLogs && wellbeingState.progressLogs.length > 0
    ? wellbeingState.progressLogs[0]
    : undefined;

  const currentMeasurements = {
    weightKg: latestLog?.weightKg || 68.4,
    waistCm: latestLog?.measurements?.waistCm || 74,
    hipsCm: latestLog?.measurements?.hipsCm || 104,
    chestCm: latestLog?.measurements?.chestCm || 92,
    shouldersCm: latestLog?.measurements?.shouldersCm || 96,
  };

  const waistHipRatio = currentMeasurements.waistCm && currentMeasurements.hipsCm
    ? (currentMeasurements.waistCm / currentMeasurements.hipsCm).toFixed(2)
    : '0.71';

  // Save handler
  const handleSave = () => {
    const updated: FoundationData = {
      ...data,
      isCompleted: true,
      lastUpdated: new Date().toISOString(),
    };
    onUpdateFoundation(updated);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2600);
  };

  // Reset to authoritative Patz profile
  const handleResetToAuthoritative = () => {
    const restored: FoundationData = {
      ...DEFAULT_FOUNDATION_DATA,
      lastUpdated: new Date().toISOString(),
    };
    setData(restored);
    onUpdateFoundation(restored);
    setResetConfirmOpen(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2600);
  };

  // Section status determination
  const getSectionStatus = (secId: string): 'complete' | 'partial' | 'not_set' => {
    switch (secId) {
      case 'who-is-patz':
        return data.patzIdentity?.name ? 'complete' : 'not_set';
      case 'roots':
        return data.patzIdentity?.bornIn ? 'complete' : 'partial';
      case 'astrology':
        return data.astrology?.sunSign ? 'complete' : 'partial';
      case 'communication':
        return data.communication?.primaryLanguage ? 'complete' : 'not_set';
      case 'life-work':
        return data.lifeWork?.workdays?.length > 0 ? 'complete' : 'partial';
      case 'planning':
        return data.planning ? 'complete' : 'partial';
      case 'food':
        return data.foodProfile?.noCouscousRule ? 'complete' : 'partial';
      case 'styling':
        return data.personalStyling?.silhouetteLabel ? 'complete' : 'partial';
      case 'wellbeing':
        return data.wellbeing?.movementPreferences?.length > 0 ? 'complete' : 'partial';
      case 'goals':
        return data.goals?.goals?.length > 0 ? 'complete' : 'not_set';
      case 'mariluna':
        return data.mariluna?.businessGoals?.length > 0 ? 'complete' : 'partial';
      default:
        return 'complete';
    }
  };

  // "Past dit bij mij?" evaluator algorithm
  const handleRunGarmentEvaluation = () => {
    if (!evalTitle.trim()) return;
    setIsEvaluating(true);

    setTimeout(() => {
      const input: GarmentEvaluationInput = {
        itemTitle: evalTitle,
        category: evalCategory,
        fabricDescription: `${evalFabric} (${evalColor}, ${evalWaistStyle})`,
        mood: evalMood,
      };

      const evaluation = evaluateGarment(
        input,
        data.personalStyling,
        latestLog ? { id: 'latest', unit: 'cm', waist: latestLog.waist, hip: latestLog.hip, date: latestLog.date } : undefined
      );

      setNewEvalResult(evaluation);
      setIsEvaluating(false);

      if (!evaluation.isInsufficient) {
        setData((prev) => ({
          ...prev,
          personalStyling: {
            ...prev.personalStyling,
            recentEvaluations: [evaluation, ...(prev.personalStyling.recentEvaluations || [])].slice(0, 10),
          },
        }));
      }
    }, 350);
  };

  // Feedback recording (Style Learning Layer)
  const handleRecordFeedback = (rating: 'love' | 'like' | 'neutral' | 'nah' | 'dislike', itemTitle?: string) => {
    const title = itemTitle || evalTitle || 'Kledingevaluatie';
    const feedbackItem: StyleLearnedFeedback = {
      id: `fb-${Date.now()}`,
      itemTitle: title,
      category: evalCategory,
      rating,
      date: new Date().toISOString().split('T')[0],
    };

    setData((prev) => ({
      ...prev,
      personalStyling: {
        ...prev.personalStyling,
        learnedFeedback: [feedbackItem, ...(prev.personalStyling.learnedFeedback || [])],
      },
    }));

    if (newEvalResult) {
      setNewEvalResult({
        ...newEvalResult,
        userFeedback: rating,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header / Tussenschot */}
      <div className="rounded-3xl border border-[#E8E1D4] bg-[#FAF8F3] p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest text-[#8C7654] font-medium">
                {isNl ? 'Centraal Fundament' : 'Central Foundation'}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#C5A880]" />
              <span className="text-[11px] text-[#7A7167] font-serif italic">
                Patz Profile • Versie 1.0
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#2C2825] tracking-tight">
              {isNl ? 'Wie is Patz?' : 'Who is Patz?'}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7167] max-w-2xl font-light leading-relaxed">
              {isNl
                ? 'Eén centrale, bewerkbare bron van stabiele persoonlijke informatie, Portugese roots, communicatievoorkeuren, levensstructuur en stijl-DNA. Andere modules lezen hieruit zonder herhaaldelijk dezelfde vragen te stellen.'
                : 'One central, editable source of truth for stable personal information, Portuguese roots, communication style, life rhythm, and styling DNA.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setResetConfirmOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-xs text-[#6D6357] hover:bg-[#F4EFE6] transition cursor-pointer flex items-center gap-1.5"
              title="Herstel naar Patricia's gezaghebbend basisprofiel"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isNl ? 'Standaardprofiel' : 'Standard Profile'}</span>
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {savedMessage ? <Check className="w-4 h-4 text-[#A3E635]" /> : <Save className="w-4 h-4" />}
              <span>{savedMessage ? (isNl ? 'Opgeslagen!' : 'Saved!') : (isNl ? 'Profiel Opslaan' : 'Save Profile')}</span>
            </button>
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        {resetConfirmOpen && (
          <div className="mt-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#D9CDBF] shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-serif font-medium text-[#2C2825]">
                  {isNl ? 'Patricia’s gezaghebbend profiel herstellen?' : 'Restore authoritative Patz profile?'}
                </h4>
                <p className="text-[11px] text-[#7A7167]">
                  {isNl
                    ? 'Dit herstelt de oorspronkelijke waarden: Patricia (32), 1.57 m, Portugese roots, Weegschaal, Di/Wo/Vr 08:00–16:30, Portugees/Belgisch/Italiaans eten (geen couscous), en het Taille-gedefinieerde Stijl DNA v1.0.'
                    : 'This restores all authoritative baseline facts for Patricia.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#D5CCBE] text-xs text-[#6D6357]"
              >
                {isNl ? 'Annuleren' : 'Cancel'}
              </button>
              <button
                onClick={handleResetToAuthoritative}
                className="px-3.5 py-1.5 rounded-lg bg-[#2C2825] text-xs text-[#FAF8F3] hover:bg-[#433D38]"
              >
                {isNl ? 'Ja, herstellen' : 'Yes, Restore'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Layout: Navigation Sidebar + Section Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar: 11 Foundation Domains */}
        <div className="lg:col-span-4 space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-[#8C7654] font-medium px-2 mb-2">
            {isNl ? 'Fundament Domeinen' : 'Foundation Domains'}
          </div>

          <div className="bg-[#FFFFFF] border border-[#E8E1D4] rounded-2xl p-2 shadow-xs divide-y divide-[#F4EFE6]">
            {FOUNDATION_SECTIONS.map((sec) => {
              const status = getSectionStatus(sec.id);
              const isActive = activeSection === sec.id;

              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-[#2C2825] text-[#FAF8F3] shadow-xs'
                      : 'hover:bg-[#FAF8F4] text-[#4A4238]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-[#433D38] text-[#FAF8F3]' : 'bg-[#F2ECE1] text-[#7A6E5F]'
                      }`}
                    >
                      {sec.id === 'who-is-patz' && <User className="w-3.5 h-3.5" />}
                      {sec.id === 'roots' && <Compass className="w-3.5 h-3.5" />}
                      {sec.id === 'astrology' && <Sparkles className="w-3.5 h-3.5" />}
                      {sec.id === 'communication' && <MessageSquare className="w-3.5 h-3.5" />}
                      {sec.id === 'life-work' && <Briefcase className="w-3.5 h-3.5" />}
                      {sec.id === 'planning' && <Calendar className="w-3.5 h-3.5" />}
                      {sec.id === 'food' && <Utensils className="w-3.5 h-3.5" />}
                      {sec.id === 'styling' && <Shirt className="w-3.5 h-3.5" />}
                      {sec.id === 'wellbeing' && <Heart className="w-3.5 h-3.5" />}
                      {sec.id === 'goals' && <Target className="w-3.5 h-3.5" />}
                      {sec.id === 'mariluna' && <Feather className="w-3.5 h-3.5" />}
                    </div>

                    <div className="truncate">
                      <div className="text-xs font-serif font-medium truncate">
                        {isNl ? sec.titleNl : sec.titleEn}
                      </div>
                      <div
                        className={`text-[10px] truncate font-light ${
                          isActive ? 'text-[#DCD3C4]' : 'text-[#8C8377]'
                        }`}
                      >
                        {isNl ? sec.descriptionNl : sec.titleEn}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex items-center gap-1">
                    {status === 'complete' && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isActive ? 'bg-[#433D38] text-[#A3E635]' : 'bg-[#EDF7ED] text-[#2E7D32]'
                        }`}
                      >
                        {isNl ? 'Compleet' : 'Complete'}
                      </span>
                    )}
                    {status === 'partial' && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isActive ? 'bg-[#433D38] text-[#FDE047]' : 'bg-[#FEF9C3] text-[#854D0E]'
                        }`}
                      >
                        {isNl ? 'Deels' : 'Partial'}
                      </span>
                    )}
                    {status === 'not_set' && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isActive ? 'bg-[#433D38] text-[#D1D5DB]' : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}
                      >
                        {isNl ? 'Niet ingesteld' : 'Not set'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Privacy Note Box */}
          <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4] space-y-2">
            <div className="flex items-center gap-2 text-xs font-serif text-[#2C2825] font-medium">
              <Shield className="w-3.5 h-3.5 text-[#8C7654]" />
              <span>{isNl ? 'Privacy & Gegevensscheiding' : 'Privacy & Scoping'}</span>
            </div>
            <p className="text-[11px] text-[#7A7167] font-light leading-relaxed">
              {isNl
                ? 'Gevoelige privégegevens (lichaamsmetingen, gewicht, cyclus en welzijnslogboeken) worden strikt afgeschermd en NOOIT gedeeld met het Mariluna bedrijfsdomein.'
                : 'Sensitive private info is quarantined and never exposed to the Mariluna business domain.'}
            </p>
          </div>
        </div>

        {/* Section Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* ============================================================
              1. WHO IS PATZ? (Personal Identity)
             ============================================================ */}
          {activeSection === 'who-is-patz' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <span>{isNl ? 'Domein 1 van 11' : 'Domain 1 of 11'}</span>
                  <span>•</span>
                  <span>{isNl ? 'Persoonlijke Identiteit' : 'Personal Identity'}</span>
                </div>
                <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                  {isNl ? 'Wie is Patz?' : 'Who is Patz?'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light mt-0.5">
                  {isNl
                    ? 'Basisgegevens voor aanspreken, taal en fysieke proporties.'
                    : 'Core personal identity for communication and physical proportions.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Volledige Naam' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={data.patzIdentity.name}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        patzIdentity: { ...p.patzIdentity, name: e.target.value },
                        aboutYou: { ...p.aboutYou, name: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Roepnaam / Aanspreekvorm' : 'Preferred Name / Call'}
                  </label>
                  <input
                    type="text"
                    value={data.patzIdentity.preferredName}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        patzIdentity: { ...p.patzIdentity, preferredName: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Leeftijd' : 'Age'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={data.patzIdentity.age}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          patzIdentity: { ...p.patzIdentity, age: parseInt(e.target.value) || 32 },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
                    />
                    <span className="text-xs text-[#7A7167] whitespace-nowrap">{isNl ? 'jaar' : 'years'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Lengte' : 'Height'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={data.patzIdentity.heightMeters}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          patzIdentity: { ...p.patzIdentity, heightMeters: parseFloat(e.target.value) || 1.57 },
                          personalStyling: {
                            ...p.personalStyling,
                            heightMeters: parseFloat(e.target.value) || 1.57,
                          },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
                    />
                    <span className="text-xs text-[#7A7167] whitespace-nowrap">meter (157 cm)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Woonplaats / Regio' : 'Location'}
                  </label>
                  <input
                    type="text"
                    value={data.patzIdentity.location}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        patzIdentity: { ...p.patzIdentity, location: e.target.value },
                        aboutYou: { ...p.aboutYou, location: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Primaire Taal' : 'Primary Language'}
                  </label>
                  <select
                    value={data.patzIdentity.primaryLanguage}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        patzIdentity: { ...p.patzIdentity, primaryLanguage: e.target.value as Language },
                        aboutYou: { ...p.aboutYou, preferredLanguage: e.target.value as Language },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
                  >
                    <option value="nl">Nederlands (Standaard)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              2. IDENTITY & ROOTS (Portugal Connection)
             ============================================================ */}
          {activeSection === 'roots' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <span>{isNl ? 'Domein 2 van 11' : 'Domain 2 of 11'}</span>
                  <span>•</span>
                  <span>{isNl ? 'Portugese Identiteit & Erfgoed' : 'Portuguese Heritage'}</span>
                </div>
                <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                  {isNl ? 'Identiteit & Roots' : 'Identity & Roots'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light mt-0.5">
                  {isNl
                    ? 'Portugal is een wezenlijk onderdeel van Patricia’s identiteit, cultuur en emotionele verbondenheid.'
                    : 'Portugal is an essential pillar of Patricia’s identity, culture, and emotional connection.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E6DBCE] space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif font-medium text-[#8C7654]">
                  <Compass className="w-4 h-4" />
                  <span>{isNl ? 'Belangrijke Instructie voor Alchemy' : 'Key Directive for Alchemy'}</span>
                </div>
                <p className="text-xs text-[#4A4238] font-light leading-relaxed">
                  {isNl
                    ? 'Portugal is GEEN oppervlakkige reisbestemming of generieke voorkeur. Het is de geboortegrond, culturele identiteit en emotionele thuisbasis. Alchemy houdt rekening met Portugese tradities, levensstijl, esthetiek en taal als betekenisvolle persoonlijke context.'
                    : 'Portugal is not merely a vacation spot. It is birthplace, cultural identity, and emotional roots.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Geboorteland' : 'Born In'}
                  </label>
                  <input
                    type="text"
                    value={data.patzIdentity.bornIn}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        patzIdentity: { ...p.patzIdentity, bornIn: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Culturele Achtergrond' : 'Heritage'}
                  </label>
                  <input
                    type="text"
                    value={data.patzIdentity.heritage}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        patzIdentity: { ...p.patzIdentity, heritage: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#6D6357] font-medium">
                  {isNl ? 'Betekenis & Persoonlijke Context' : 'Significance & Meaning'}
                </label>
                <textarea
                  rows={4}
                  value={data.patzIdentity.portugalConnectionNotes}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      patzIdentity: { ...p.patzIdentity, portugalConnectionNotes: e.target.value },
                    }))
                  }
                  className="w-full p-3.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825] leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* ============================================================
              3. ASTROLOGY & SPIRITUALITY
             ============================================================ */}
          {activeSection === 'astrology' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <span>{isNl ? 'Domein 3 van 11' : 'Domain 3 of 11'}</span>
                  <span>•</span>
                  <span>{isNl ? 'Astrologie & Spiritueel Referentiekader' : 'Astrology & Spiritual Framework'}</span>
                </div>
                <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                  {isNl ? 'Astrologie & Spiritualiteit' : 'Astrology & Spirituality'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light mt-0.5">
                  {isNl
                    ? 'Referentiekader voor reflectie met strikt onderscheid tussen wetenschap en traditie.'
                    : 'Reflection framework clearly separated from medical or scientific claims.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-[#E6E0D4] space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif font-medium text-[#2C2825]">
                  <Sparkles className="w-4 h-4 text-[#C5A880]" />
                  <span>{isNl ? 'Epistemologisch Principe' : 'Epistemological Principle'}</span>
                </div>
                <p className="text-xs text-[#6D6357] font-light leading-relaxed">
                  {isNl
                    ? 'Alchemy maakt altijd een helder onderscheid tussen: 1) bewezen wetenschappelijk feit, 2) aannemelijke interpretatie, en 3) spirituele/astrologische symboliek. Astrologie wordt nooit gepresenteerd als medisch of deterministisch feit.'
                    : 'Alchemy always distinguishes established evidence, reasonable interpretation, and spiritual frameworks.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Zonneteken / Sterrenbeeld' : 'Sun Sign'}
                  </label>
                  <input
                    type="text"
                    value={data.astrology.sunSign}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        astrology: { ...p.astrology, sunSign: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Rol in Alchemy' : 'Role in Alchemy'}
                  </label>
                  <textarea
                    rows={3}
                    value={data.astrology.frameworkRole}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        astrology: { ...p.astrology, frameworkRole: e.target.value },
                      }))
                    }
                    className="w-full p-3.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Notities & Karakteristieken' : 'Notes & Nuances'}
                  </label>
                  <input
                    type="text"
                    value={data.astrology.notes || ''}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        astrology: { ...p.astrology, notes: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              4. COMMUNICATION PROFILE
             ============================================================ */}
          {activeSection === 'communication' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <span>{isNl ? 'Domein 4 van 11' : 'Domain 4 of 11'}</span>
                  <span>•</span>
                  <span>{isNl ? 'Communicatieprofiel' : 'Communication Profile'}</span>
                </div>
                <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                  {isNl ? 'Hoe communiceert Alchemy met Patricia?' : 'Communication Profile'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light mt-0.5">
                  {isNl
                    ? 'Eerlijk, warm, to-the-point, met respect voor intelligentie en zonder AI-fluff.'
                    : 'Warm, direct, concise, and constructive without generic AI filler.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    key: 'shortAnswers',
                    titleNl: 'Korte, bondige antwoorden',
                    descNl: 'Niet onnodig langdradig over-uitleggen.',
                  },
                  {
                    key: 'preferBulletPoints',
                    titleNl: 'Voorkeur voor opsommingstekens',
                    descNl: 'Heldere bullet points voor snel overzicht.',
                  },
                  {
                    key: 'gentleCorrection',
                    titleNl: 'Zachtjes corrigeren bij onjuistheden',
                    descNl: 'Vriendelijk wijzen op feitelijke vergissingen.',
                  },
                  {
                    key: 'constructiveChallenge',
                    titleNl: 'Constructief uitdagen',
                    descNl: 'Niet zomaar ja knikken; meedenken als sparringpartner.',
                  },
                  {
                    key: 'avoidCorporateRobotic',
                    titleNl: 'Geen zakelijke robot-taal',
                    descNl: 'Natuurlijke, menselijke en geaarde formuleringen.',
                  },
                  {
                    key: 'avoidGenericAiFiller',
                    titleNl: 'Geen generieke AI-opvulling',
                    descNl: 'Vermijd loze superlatieven en herhalingen.',
                  },
                ].map((item) => {
                  const val = (data.communication as any)[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() =>
                        setData((p) => ({
                          ...p,
                          communication: {
                            ...p.communication,
                            [item.key]: !val,
                          },
                        }))
                      }
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                        val
                          ? 'bg-[#FAF8F4] border-[#8C7654] text-[#2C2825]'
                          : 'bg-[#FFFFFF] border-[#E8E1D4] text-[#8C8377]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border ${
                          val ? 'bg-[#2C2825] border-[#2C2825] text-[#FAF8F3]' : 'border-[#D5CCBE]'
                        }`}
                      >
                        {val && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="text-xs font-serif font-medium">{item.titleNl}</div>
                        <div className="text-[11px] text-[#7A7167] font-light mt-0.5">{item.descNl}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs text-[#6D6357] font-medium">
                  {isNl ? 'Gewenste Toonzetting' : 'Preferred Tone'}
                </label>
                <input
                  type="text"
                  value={data.communication.preferredTone}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      communication: { ...p.communication, preferredTone: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                />
              </div>
            </div>
          )}

          {/* ============================================================
              5. LIFE & WORK FOUNDATION
             ============================================================ */}
          {activeSection === 'life-work' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <span>{isNl ? 'Domein 5 van 11' : 'Domain 5 of 11'}</span>
                  <span>•</span>
                  <span>{isNl ? 'Vaste Levens- en Werkstructuur' : 'Life & Work Rhythm'}</span>
                </div>
                <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                  {isNl ? 'Leven & Werk' : 'Life & Work'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light mt-0.5">
                  {isNl
                    ? 'Vaste werkdagen, uren en beschermde ruimte voor herstel en Mariluna.'
                    : 'Fixed workdays, hours, and protected space for recovery and Mariluna.'}
                </p>
              </div>

              {/* Workdays selector */}
              <div className="space-y-2">
                <label className="text-xs text-[#6D6357] font-medium">
                  {isNl ? 'Vaste Werkdagen van Patricia' : 'Workdays'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'monday', label: isNl ? 'Maandag' : 'Monday' },
                    { id: 'tuesday', label: isNl ? 'Dinsdag (Vast)' : 'Tuesday' },
                    { id: 'wednesday', label: isNl ? 'Woensdag (Vast)' : 'Wednesday' },
                    { id: 'thursday', label: isNl ? 'Donderdag' : 'Thursday' },
                    { id: 'friday', label: isNl ? 'Vrijdag (Vast)' : 'Friday' },
                  ].map((day) => {
                    const isSelected = data.lifeWork.workdays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          const updatedDays = isSelected
                            ? data.lifeWork.workdays.filter((d) => d !== day.id)
                            : [...data.lifeWork.workdays, day.id];
                          setData((p) => ({
                            ...p,
                            lifeWork: { ...p.lifeWork, workdays: updatedDays },
                          }));
                        }}
                        className={`p-2.5 rounded-xl text-xs font-serif font-medium border transition cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825]'
                            : 'bg-[#FAF8F4] text-[#7A6E5F] border-[#E8E1D4] hover:bg-[#F2ECE1]'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Work hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Vaste Werkuren Start' : 'Work Start'}
                  </label>
                  <input
                    type="time"
                    value={data.lifeWork.workHoursStart}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        lifeWork: { ...p.lifeWork, workHoursStart: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Vaste Werkuren Einde' : 'Work End'}
                  </label>
                  <input
                    type="time"
                    value={data.lifeWork.workHoursEnd}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        lifeWork: { ...p.lifeWork, workHoursEnd: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>
              </div>

              {/* Balance & Protection Philosophy */}
              <div className="space-y-1">
                <label className="text-xs text-[#6D6357] font-medium">
                  {isNl ? 'Bescherming van Privétijd & Herstel' : 'Protected Personal Time'}
                </label>
                <textarea
                  rows={3}
                  value={data.lifeWork.protectedPersonalTime}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      lifeWork: { ...p.lifeWork, protectedPersonalTime: e.target.value },
                    }))
                  }
                  className="w-full p-3.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                />
              </div>
            </div>
          )}

          {/* ============================================================
              6. PLANNING PERSONALITY
             ============================================================ */}
          {activeSection === 'planning' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <span>{isNl ? 'Domein 6 van 11' : 'Domain 6 of 11'}</span>
                  <span>•</span>
                  <span>{isNl ? 'Planningsfilosofie' : 'Planning Personality'}</span>
                </div>
                <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                  {isNl ? 'Planningsfilosofie & Regie' : 'Planning Personality'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light mt-0.5">
                  {isNl
                    ? 'Patricia behoudt de controle. Alchemy suggereert en veronderstelt niet.'
                    : 'Patricia remains in control. Alchemy suggests and never presumes.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4] space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif font-medium text-[#2C2825]">
                  <Calendar className="w-4 h-4 text-[#8C7654]" />
                  <span>{isNl ? 'Geen Productiviteitsvalkuil' : 'Avoid Productivity Trap'}</span>
                </div>
                <p className="text-xs text-[#6D6357] font-light leading-relaxed">
                  {isNl
                    ? 'Maak niet van elk doel of verlangen een actiepunt. Rust, relaties, wandelen en contemplatie hebben een inherente waarde en hoeven niet afgevinkt te worden.'
                    : 'Do not turn every aspiration into a productivity task.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { key: 'helpSeeWhatMatters', label: 'Helpen zien wat er echt toe doet' },
                  { key: 'helpPrioritize', label: 'Prioriteren en focus beschermen' },
                  { key: 'avoidUnrealisticPlanning', label: 'Onrealistische overvolle planning voorkomen' },
                  { key: 'breakLargeProjectsIntoActions', label: 'Grote projecten opknippen in behapbare stappen' },
                  { key: 'rememberImportantThings', label: 'Belangrijke zaken tijdig herinneren' },
                  { key: 'noticeConflicts', label: 'Tijdsconflicten en energiedips tijdig signaleren' },
                  { key: 'suggestRealisticTiming', label: 'Realistische timing voorstellen' },
                  { key: 'keepSpaceForPersonalLife', label: 'Ruimte bewaren voor privéleven' },
                ].map((item) => {
                  const val = (data.planning as any)[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() =>
                        setData((p) => ({
                          ...p,
                          planning: {
                            ...p.planning,
                            [item.key]: !val,
                          },
                        }))
                      }
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                        val
                          ? 'bg-[#FAF8F4] border-[#8C7654] text-[#2C2825]'
                          : 'bg-[#FFFFFF] border-[#E8E1D4] text-[#8C8377]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                          val ? 'bg-[#2C2825] border-[#2C2825] text-[#FAF8F3]' : 'border-[#D5CCBE]'
                        }`}
                      >
                        {val && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-xs font-serif">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================
              7. FOOD FOUNDATION (Strict No Couscous)
             ============================================================ */}
          {activeSection === 'food' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <span>{isNl ? 'Domein 7 van 11' : 'Domain 7 of 11'}</span>
                  <span>•</span>
                  <span>{isNl ? 'Voedingsprofiel & Eetvoorkeuren' : 'Food Foundation'}</span>
                </div>
                <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                  {isNl ? 'Voedingsprofiel van Patricia' : 'Food Profile'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light mt-0.5">
                  {isNl
                    ? 'Portugees (1), Belgisch (2), Italiaans (3) • 80-100g eiwit • Geen couscous & geen quinoa • Geen schuldgevoel.'
                    : 'Portuguese, Belgian, Italian cuisines with strict no-couscous & no-quinoa policy.'}
                </p>
              </div>

              {/* Strict No Couscous & No Quinoa Callout */}
              <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif font-medium text-[#991B1B]">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                  <span>{isNl ? 'Strikte Regels: GEEN COUSCOUS & GEEN QUINOA' : 'Strict Directives: NO COUSCOUS & NO QUINOA'}</span>
                </div>
                <p className="text-xs text-[#7F1D1D] font-light leading-relaxed">
                  {isNl
                    ? 'Couscous en quinoa mogen NOOIT worden opgenomen als voorkeursvoedsel of standaard maaltijdsuggestie in weekmenu’s of recepten. Deze uitsluitingen zijn permanent verankerd in Patricia’s profiel.'
                    : 'Couscous and quinoa must NEVER be included or recommended as default meals.'}
                </p>
              </div>

              {/* Cuisine Hierarchy */}
              <div className="space-y-2">
                <label className="text-xs text-[#6D6357] font-medium">
                  {isNl ? 'Culinaire Identiteit & Hiërarchie' : 'Cuisine Hierarchy'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4]">
                    <div className="text-[10px] uppercase tracking-wider text-[#8C7654] font-medium">1. Kernidentiteit</div>
                    <div className="text-sm font-serif font-medium text-[#2C2825] mt-0.5">Portugees</div>
                    <div className="text-[10px] text-[#7A7167] mt-1">Cultuur, vis, sauzen & thuisbasis</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4]">
                    <div className="text-[10px] uppercase tracking-wider text-[#8C7654] font-medium">2. Vertrouwd lokaal</div>
                    <div className="text-sm font-serif font-medium text-[#2C2825] mt-0.5">Belgisch</div>
                    <div className="text-[10px] text-[#7A7167] mt-1">Klassiekers, streekproducten & soepen</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4]">
                    <div className="text-[10px] uppercase tracking-wider text-[#8C7654] font-medium">3. Pure eenvoud</div>
                    <div className="text-sm font-serif font-medium text-[#2C2825] mt-0.5">Italiaans</div>
                    <div className="text-[10px] text-[#7A7167] mt-1">Pasta, risotto & rijke warme sauzen</div>
                  </div>
                </div>
              </div>

              {/* Dislikes / Exclusions Pills */}
              <div className="space-y-2">
                <label className="text-xs text-[#6D6357] font-medium">
                  {isNl ? 'Vaste Dislikes & Bereidingsregels' : 'Dislikes & Preparation Rules'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Geen couscous (Strikt)',
                    'Geen quinoa (Strikt)',
                    'Geen fruit',
                    'Geen rauwe groenten',
                    'Groenten gegaard / gepureerd',
                    'Geen yoghurt',
                    'Geen smoothies',
                    'Geen komkommer',
                    'Geen havermout',
                    'Geen noten in maaltijden',
                    'Geen linzen als favoriet',
                    'Vis behalve kabeljauw',
                  ].map((d, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-[#FAF8F4] border border-[#D5CCBE] text-xs text-[#4A4238] font-light"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Separate Allergies field */}
              <div className="space-y-1">
                <label className="text-xs text-[#6D6357] font-medium">
                  {isNl ? 'Allergieën & Medische Intoleranties (Gescheiden van voorkeuren)' : 'Allergies & Intolerances'}
                </label>
                <input
                  type="text"
                  value={data.foodProfile.intolerances.join(', ')}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      foodProfile: {
                        ...p.foodProfile,
                        intolerances: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    }))
                  }
                  placeholder="e.g. Geen medische allergieën geregistreerd; kabeljauw vermijden"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                />
              </div>
            </div>
          )}

          {/* ============================================================
              8. PERSONAL STYLING FOUNDATION (v1.0 & Interactive Evaluation)
             ============================================================ */}
          {activeSection === 'styling' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-7 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                    <span>{isNl ? 'Domein 8 van 11' : 'Domain 8 of 11'}</span>
                    <span>•</span>
                    <span>{isNl ? 'Personal Styling & Body Architecture' : 'Personal Styling'}</span>
                  </div>
                  <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                    {isNl ? 'Personal Styling Foundation — Versie 1.0' : 'Personal Styling Foundation — v1.0'}
                  </h2>
                  <p className="text-xs text-[#7A7167] font-light mt-0.5">
                    {isNl
                      ? 'Gezaghebbend profiel: Taille-gedefinieerd silhouet met dynamische metingenlink.'
                      : 'Authoritative styling passport: Waist-defined curved silhouette.'}
                  </p>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-[#FAF8F3] border border-[#DCD3C4] text-xs font-serif text-[#2C2825] shrink-0">
                  {data.personalStyling.silhouetteLabel}
                </div>
              </div>

              {/* Dynamic Measurement Linkage Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F3] border border-[#E6E0D4] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8C7654]" />
                    <span className="text-xs font-serif font-medium text-[#2C2825]">
                      {isNl ? 'Dynamische Lichaamsmetingen (Gekoppeld aan Welzijn)' : 'Dynamic Measurements Link'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7A7167] font-light">
                    {latestLog?.date ? `Laatste meting: ${latestLog.date}` : 'Stabiele basis'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#ECE5D8] text-center">
                    <div className="text-[10px] text-[#8C8377]">{isNl ? 'Lengte' : 'Height'}</div>
                    <div className="text-sm font-mono font-medium text-[#2C2825]">1.57 m</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#ECE5D8] text-center">
                    <div className="text-[10px] text-[#8C8377]">{isNl ? 'Taille' : 'Waist'}</div>
                    <div className="text-sm font-mono font-medium text-[#2C2825]">{currentMeasurements.waistCm} cm</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#ECE5D8] text-center">
                    <div className="text-[10px] text-[#8C8377]">{isNl ? 'Heupen' : 'Hips'}</div>
                    <div className="text-sm font-mono font-medium text-[#2C2825]">{currentMeasurements.hipsCm} cm</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#ECE5D8] text-center">
                    <div className="text-[10px] text-[#8C8377]">{isNl ? 'Taille-Heup Ratio' : 'Waist-Hip Ratio'}</div>
                    <div className="text-sm font-mono font-medium text-[#2C2825]">{waistHipRatio}</div>
                  </div>
                </div>

                <p className="text-[11px] text-[#7A7167] font-light leading-relaxed">
                  {isNl
                    ? 'Gewicht is secundair; verhoudingen, kledingval en tailledefinitie zijn leidend voor de stijlanalyse.'
                    : 'Weight is secondary; proportions, drape, and waist harmony drive style analysis.'}
                </p>
              </div>

              {/* Stijl DNA & Kleuren Palette */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#8C7654] font-medium">
                  {isNl ? 'Stijl DNA & Handtekening' : 'Style DNA & Signature'}
                </h3>
                <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4] space-y-3">
                  <div className="text-xs font-serif font-medium text-[#2C2825]">
                    {data.personalStyling.styleDNA.essence}
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-[#7A7167] font-medium">{isNl ? 'Kenmerkende silhouetten:' : 'Signature silhouettes:'}</div>
                    <ul className="text-xs text-[#4A4238] font-light space-y-1 pl-4 list-disc">
                      {data.personalStyling.styleDNA.signatureElements.map((el, i) => (
                        <li key={i}>{el}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Color DNA Swatches */}
                <div className="space-y-2">
                  <div className="text-xs font-serif text-[#2C2825] font-medium">
                    {data.personalStyling.colourDNA.paletteName}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {data.personalStyling.colourDNA.primaryColors.map((col, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-[#E8E1D4] bg-[#FFFFFF] flex flex-col items-center text-center gap-1.5 shadow-2xs"
                      >
                        <div
                          className="w-8 h-8 rounded-full border border-[#D5CCBE] shadow-2xs"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="text-[11px] font-serif text-[#2C2825] font-medium leading-tight">
                          {col.name}
                        </span>
                        <span className="text-[9px] text-[#8C8377]">{col.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* INTERACTIVE CLOTHING EVALUATOR: "Past dit bij mij?" */}
              <div className="rounded-2xl border border-[#D9CDBF] bg-[#FAF8F3] p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-[#8C7654]" />
                    <h3 className="font-serif text-sm font-medium text-[#2C2825]">
                      {isNl ? '“Past dit bij mij?” — Kledingevaluatie' : '“Does this suit me?” Garment Analysis'}
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#8C7654] bg-[#FFFFFF] px-2.5 py-1 rounded-full border border-[#E3DCD1]">
                    AI Stijlanalyser
                  </span>
                </div>

                <p className="text-xs text-[#7A7167] font-light leading-relaxed">
                  {isNl
                    ? 'Test een kledingstuk tegen Patricia’s actuele lichaamsverhoudingen, Stijl DNA, Kleuren DNA en emotionele stemming.'
                    : 'Evaluate a garment against Patricia’s actual body proportions and Style DNA.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-[#6D6357] font-medium">
                      {isNl ? 'Kledingstuk Titel / Omschrijving' : 'Garment Description'}
                    </label>
                    <input
                      type="text"
                      value={evalTitle}
                      onChange={(e) => setEvalTitle(e.target.value)}
                      placeholder={isNl ? 'bijv. High-waist linnen pantalon met wijde pijpen' : 'e.g. High-waist wide leg linen trouser'}
                      className="w-full px-3 py-2 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-xs text-[#2C2825]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#6D6357] font-medium">
                      {isNl ? 'Categorie' : 'Category'}
                    </label>
                    <select
                      value={evalCategory}
                      onChange={(e) => setEvalCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-xs text-[#2C2825]"
                    >
                      <option>Broeken & Pantalons</option>
                      <option>Jurken & Rokken</option>
                      <option>Blazers & Jassen</option>
                      <option>Tops & Truien</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#6D6357] font-medium">
                      {isNl ? 'Kleurtoon' : 'Color Tone'}
                    </label>
                    <input
                      type="text"
                      value={evalColor}
                      onChange={(e) => setEvalColor(e.target.value)}
                      placeholder="bijv. Zand, Warm Ivoor, Espresso"
                      className="w-full px-3 py-2 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-xs text-[#2C2825]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#6D6357] font-medium">
                      {isNl ? 'Stof / Materiaal' : 'Fabric'}
                    </label>
                    <input
                      type="text"
                      value={evalFabric}
                      onChange={(e) => setEvalFabric(e.target.value)}
                      placeholder="bijv. 100% Linnen, Viscose blend"
                      className="w-full px-3 py-2 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-xs text-[#2C2825]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#6D6357] font-medium">
                      {isNl ? 'Emotionele Mood' : 'Emotional Mood'}
                    </label>
                    <select
                      value={evalMood}
                      onChange={(e) => setEvalMood(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-xs text-[#2C2825]"
                    >
                      {data.personalStyling.emotionalDressingMoods.map((m) => (
                        <option key={m} value={m}>{m.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunGarmentEvaluation}
                  disabled={!evalTitle.trim() || isEvaluating}
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isEvaluating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isNl ? 'Evalueer Kledingstuk' : 'Evaluate Garment'}</span>
                </button>

                {/* Evaluation Result Card */}
                {newEvalResult && (
                  newEvalResult.isInsufficient ? (
                    <div className="mt-4 p-4 rounded-2xl bg-[#FFFBF5] border border-[#E5C39E] space-y-2 shadow-xs">
                      <div className="flex items-center gap-2 text-[#A85A3C] font-medium text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{isNl ? 'Onvoldoende informatie' : 'Insufficient Information'}</span>
                      </div>
                      <p className="text-xs text-[#5C5449] leading-relaxed">
                        {newEvalResult.verdictNl}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#D5CCBE] space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[#8C7654] font-medium">
                          {isNl ? 'Evaluatie Resultaat' : 'Evaluation Result'}
                        </div>
                        <h4 className="text-sm font-serif font-medium text-[#2C2825] mt-0.5">
                          {newEvalResult.itemTitle}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-serif font-medium text-[#2C2825]">
                          {newEvalResult.overallMatchPercent}%
                        </div>
                        <div className="text-[10px] text-[#8C8377]">{isNl ? 'Overall Match' : 'Overall'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-[#FAF8F4] text-center border border-[#ECE5D8]">
                        <div className="text-[10px] text-[#8C8377]">{isNl ? 'Stijl Match' : 'Style Match'}</div>
                        <div className="text-xs font-mono font-medium text-[#2C2825]">{newEvalResult.styleMatchPercent}%</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF8F4] text-center border border-[#ECE5D8]">
                        <div className="text-[10px] text-[#8C8377]">{isNl ? 'Silhouet Match' : 'Silhouette'}</div>
                        <div className="text-xs font-mono font-medium text-[#2C2825]">{newEvalResult.silhouetteMatchPercent}%</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF8F4] text-center border border-[#ECE5D8]">
                        <div className="text-[10px] text-[#8C8377]">{isNl ? 'Kleur Match' : 'Colour'}</div>
                        <div className="text-xs font-mono font-medium text-[#2C2825]">{newEvalResult.colourMatchPercent}%</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF8F4] text-center border border-[#ECE5D8]">
                        <div className="text-[10px] text-[#8C8377]">{isNl ? 'Fit Confidence' : 'Fit Confidence'}</div>
                        <div className="text-xs font-mono font-medium text-[#8C7654]">{newEvalResult.fitConfidencePercent}%</div>
                      </div>
                    </div>

                    <p className="text-xs text-[#4A4238] font-light leading-relaxed bg-[#FAF8F4] p-3 rounded-xl border border-[#ECE5D8]">
                      {newEvalResult.verdictNl}
                    </p>

                    {/* Style Learning Feedback buttons */}
                    <div className="pt-2 border-t border-[#F4EFE6] flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] text-[#7A7167]">
                        {isNl ? 'Wat vind je van deze suggestie? (Style Learning)' : 'Rate this item (Style Learning):'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { id: 'love', label: 'Love' },
                          { id: 'like', label: 'Like' },
                          { id: 'neutral', label: 'Neutral' },
                          { id: 'nah', label: 'Nah' },
                          { id: 'dislike', label: 'Dislike' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => handleRecordFeedback(btn.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                              newEvalResult.userFeedback === btn.id
                                ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825]'
                                : 'bg-[#FFFFFF] text-[#6D6357] border-[#D5CCBE] hover:bg-[#F4EFE6]'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              9. WELLBEING PREFERENCES
             ============================================================ */}
          {activeSection === 'wellbeing' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <span>{isNl ? 'Domein 9 van 11' : 'Domain 9 of 11'}</span>
                  <span>•</span>
                  <span>{isNl ? 'Welzijn & Beweging' : 'Wellbeing Preferences'}</span>
                </div>
                <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                  {isNl ? 'Welzijn, Beweging & Herstel' : 'Wellbeing Preferences'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light mt-0.5">
                  {isNl
                    ? 'Wandelen, pilates, cyclusbewust bewegen en strikte privégegevensbescherming.'
                    : 'Movement routines and private wellbeing boundaries.'}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-[#6D6357] font-medium">
                  {isNl ? 'Voorkeursvormen van Beweging' : 'Movement Preferences'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Wandelen', 'Pilates', 'Krachttraining', 'Cyclusbewust bewegen', 'Stretchen'].map((m) => {
                    const active = data.wellbeing.movementPreferences.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          const updated = active
                            ? data.wellbeing.movementPreferences.filter((x) => x !== m)
                            : [...data.wellbeing.movementPreferences, m];
                          setData((p) => ({
                            ...p,
                            wellbeing: { ...p.wellbeing, movementPreferences: updated },
                          }));
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs transition cursor-pointer border ${
                          active
                            ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825]'
                            : 'bg-[#FAF8F4] text-[#6D6357] border-[#D5CCBE] hover:bg-[#F2ECE1]'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              10. GOALS
             ============================================================ */}
          {activeSection === 'goals' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <span>{isNl ? 'Domein 10 van 11' : 'Domain 10 of 11'}</span>
                  <span>•</span>
                  <span>{isNl ? 'Doelen & Intenties' : 'Goals & Intentions'}</span>
                </div>
                <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                  {isNl ? 'Doelen van Patricia' : 'Goals'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light mt-0.5">
                  {isNl
                    ? 'Persoonlijke en zakelijke doelen met heldere domeinscheiding.'
                    : 'Personal and business goals with clear domain scoping.'}
                </p>
              </div>

              <div className="space-y-3">
                {data.goals.goals.map((g, idx) => (
                  <div
                    key={g.id || idx}
                    className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
                            g.domain === 'mariluna'
                              ? 'bg-[#2C2825] text-[#FAF8F3]'
                              : 'bg-[#F2ECE1] text-[#7A6E5F]'
                          }`}
                        >
                          {g.domain}
                        </span>
                        <h4 className="text-xs font-serif font-medium text-[#2C2825]">{g.name}</h4>
                      </div>
                      {g.description && (
                        <p className="text-[11px] text-[#7A7167] font-light">{g.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================
              11. MARILUNA CONTEXT & STRICT PRIVACY BOUNDARY
             ============================================================ */}
          {activeSection === 'mariluna' && (
            <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="border-b border-[#F4EFE6] pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <span>{isNl ? 'Domein 11 van 11' : 'Domain 11 of 11'}</span>
                  <span>•</span>
                  <span>{isNl ? 'Mariluna Context & Strikte Scheiding' : 'Mariluna Context & Boundary'}</span>
                </div>
                <h2 className="text-xl font-serif text-[#2C2825] mt-1">
                  {isNl ? 'Mariluna Bedrijfscontext' : 'Mariluna Business Context'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light mt-0.5">
                  {isNl
                    ? 'Zakelijke parameters en strikte privacy-afscherming van privégegevens.'
                    : 'Business parameters and strict privacy quarantine.'}
                </p>
              </div>

              {/* STRICT PRIVACY QUARANTINE CALLOUT */}
              <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#8C7654] space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif font-medium text-[#2C2825]">
                  <Lock className="w-4 h-4 text-[#8C7654]" />
                  <span>{isNl ? 'Strikte Privacy Firewall' : 'Strict Privacy Firewall'}</span>
                </div>
                <p className="text-xs text-[#6D6357] font-light leading-relaxed">
                  {isNl
                    ? 'Mariluna planning ontvangt ALLEEN zakelijke doelen, werkbeschikbaarheid en communicatiestijl. Mariluna ontvangt NOOIT lichaamsmaten, gewicht, cyclusdata of intieme welzijnslogboeken.'
                    : 'Mariluna planning receives work availability and business goals only. It NEVER accesses body measurements, weight, cycle, or private wellbeing info.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Studio Naam' : 'Studio Name'}
                  </label>
                  <input
                    type="text"
                    value={data.lifeWork.businessName}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        lifeWork: { ...p.lifeWork, businessName: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Kernpijlers / Content Areas' : 'Core Content Areas'}
                  </label>
                  <input
                    type="text"
                    value={data.mariluna.contentAreas.join(', ')}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        mariluna: {
                          ...p.mariluna,
                          contentAreas: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

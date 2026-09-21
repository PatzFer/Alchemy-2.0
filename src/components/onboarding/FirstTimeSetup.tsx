import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Compass,
  MessageSquare,
  Briefcase,
  Shield,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import {
  FoundationData,
  Language,
} from '../../types';
import { DEFAULT_FOUNDATION_DATA } from '../../lib/foundationDefaults';

interface FirstTimeSetupProps {
  foundation: FoundationData;
  onSaveFoundation: (data: FoundationData) => void;
  onCompleteSetup: (data: FoundationData) => void;
  onSkipSetup: () => void;
}

export const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({
  foundation: initialData,
  onSaveFoundation,
  onCompleteSetup,
  onSkipSetup,
}) => {
  // 0: Welcome overview, 1: Who are you?, 2: Communication, 3: Life & Work, 4: Notes & Ready
  const [step, setStep] = useState<number>(0);
  const [data, setData] = useState<FoundationData>(() => ({
    ...DEFAULT_FOUNDATION_DATA,
    ...initialData,
    patzIdentity: {
      ...DEFAULT_FOUNDATION_DATA.patzIdentity,
      ...(initialData.patzIdentity || {}),
    },
    astrology: {
      ...DEFAULT_FOUNDATION_DATA.astrology,
      ...(initialData.astrology || {}),
    },
    communication: {
      ...DEFAULT_FOUNDATION_DATA.communication,
      ...(initialData.communication || {}),
    },
    lifeWork: {
      ...DEFAULT_FOUNDATION_DATA.lifeWork,
      ...(initialData.lifeWork || {}),
    },
    planning: {
      ...DEFAULT_FOUNDATION_DATA.planning,
      ...(initialData.planning || {}),
    },
    foodProfile: {
      ...DEFAULT_FOUNDATION_DATA.foodProfile,
      ...(initialData.foodProfile || {}),
    },
    personalStyling: {
      ...DEFAULT_FOUNDATION_DATA.personalStyling,
      ...(initialData.personalStyling || {}),
    },
  }));

  const lang: Language = data.aboutYou?.preferredLanguage || 'nl';
  const isNl = lang === 'nl';

  const updateField = (updater: (prev: FoundationData) => FoundationData) => {
    setData((prev) => {
      const next = updater(prev);
      onSaveFoundation(next);
      return next;
    });
  };

  const handleFinish = () => {
    const finalData: FoundationData = {
      ...data,
      isCompleted: true,
      isSkipped: false,
      lastUpdated: new Date().toISOString(),
    };
    onCompleteSetup(finalData);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col justify-between p-6 sm:p-12 text-[#2C2825]">
      {/* Top Bar */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-[#D5CCBE] bg-[#F3EDE2] flex items-center justify-center shadow-xs">
            <span className="font-serif text-xs font-semibold text-[#7E694E] tracking-tighter">
              P&M
            </span>
          </div>
          <span className="font-serif text-sm tracking-[0.2em] uppercase font-medium text-[#2C2825]">
            ALCHEMY
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSkipSetup}
            className="text-xs text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer"
          >
            {isNl ? 'Overslaan voor nu' : 'Skip for now'}
          </button>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="max-w-2xl mx-auto w-full my-auto py-6">
        <div className="rounded-3xl border border-[#E8E1D4] bg-[#FFFFFF] p-7 sm:p-10 shadow-sm space-y-7">
          {/* ============================================================
              STEP 0: WELCOME & OVERVIEW
             ============================================================ */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#8C7654] font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Eerste Kennismaking' : 'First Introduction'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif text-[#2C2825]">
                  {isNl ? 'Welkom bij Alchemy, Patricia' : 'Welcome to Alchemy, Patricia'}
                </h1>
                <p className="text-xs sm:text-sm text-[#7A7167] font-light leading-relaxed">
                  {isNl
                    ? 'Alchemy is jouw persoonlijke besturingssysteem. We stellen een kort basisprofiel in (“Wie is Patz?”) zodat je nooit meer herhaaldelijk dezelfde voorkeuren hoeft op te geven.'
                    : 'Alchemy is your personal operating system. We set up a concise baseline profile (“Who is Patz?”) so modules already know your preferences.'}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4] space-y-3">
                <div className="text-xs font-serif font-medium text-[#2C2825]">
                  {isNl ? 'Wat we in 4 korte stappen doornemen:' : 'What we will review in 4 quick steps:'}
                </div>
                <div className="space-y-2 text-xs text-[#6D6357]">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#8C7654]" />
                    <span>1. <strong>Wie ben je?</strong> (Naam, Portugese roots & basis)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-[#8C7654]" />
                    <span>2. <strong>Hoe communiceren we?</strong> (Direct, warm, bondig, Nederlands)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-[#8C7654]" />
                    <span>3. <strong>Leven & Werk</strong> (Di/Wo/Vr 08:00–16:30 & rustbescherming)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-[#8C7654]" />
                    <span>4. <strong>Afronding & Beheer</strong> (Alles blijft op elk moment aanpasbaar)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onSkipSetup}
                  className="text-xs text-[#8C8377] hover:text-[#2C2825]"
                >
                  {isNl ? 'Gebruik standaardprofiel' : 'Use default profile'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>{isNl ? 'Start kennismaking' : 'Begin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              STEP 1: WHO ARE YOU?
             ============================================================ */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1 border-b border-[#F4EFE6] pb-4">
                <div className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  {isNl ? 'Stap 1 van 4 • Identiteit & Roots' : 'Step 1 of 4 • Identity & Roots'}
                </div>
                <h2 className="text-xl font-serif text-[#2C2825]">
                  {isNl ? 'Wie ben je?' : 'Who are you?'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light">
                  {isNl
                    ? 'Patricia’s identiteit, Portugese herkomst en basiskenmerken.'
                    : 'Personal identity, Portuguese heritage, and physical proportions.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">{isNl ? 'Naam' : 'Name'}</label>
                  <input
                    type="text"
                    value={data.patzIdentity.name}
                    onChange={(e) =>
                      updateField((p) => ({
                        ...p,
                        patzIdentity: { ...p.patzIdentity, name: e.target.value },
                        aboutYou: { ...p.aboutYou, name: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">
                    {isNl ? 'Roepnaam / Aanspreekvorm' : 'Preferred Name'}
                  </label>
                  <input
                    type="text"
                    value={data.patzIdentity.preferredName}
                    onChange={(e) =>
                      updateField((p) => ({
                        ...p,
                        patzIdentity: { ...p.patzIdentity, preferredName: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">{isNl ? 'Geboorteland & Roots' : 'Born In'}</label>
                  <input
                    type="text"
                    value={data.patzIdentity.bornIn}
                    onChange={(e) =>
                      updateField((p) => ({
                        ...p,
                        patzIdentity: { ...p.patzIdentity, bornIn: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#6D6357] font-medium">{isNl ? 'Lengte & Leeftijd' : 'Height & Age'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled
                      value="1.57 m (32 jr)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CCBE] bg-[#F4EFE6] text-xs text-[#7A6E5F]"
                    />
                  </div>
                </div>
              </div>

              {/* Portugal Significance note */}
              <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E6DBCE] flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
                <p className="text-xs text-[#6D6357] font-light leading-relaxed">
                  {isNl
                    ? 'Portugal is een wezenlijk onderdeel van Patricia’s cultuur, levensritme en achtergrond — geen oppervlakkige reisbestemming.'
                    : 'Portugal is an essential cultural and emotional connection for Patricia.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#F4EFE6] transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Terug' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>{isNl ? 'Volgende' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              STEP 2: COMMUNICATION STYLE
             ============================================================ */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1 border-b border-[#F4EFE6] pb-4">
                <div className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  {isNl ? 'Stap 2 van 4 • Communicatie' : 'Step 2 of 4 • Communication'}
                </div>
                <h2 className="text-xl font-serif text-[#2C2825]">
                  {isNl ? 'Hoe moet Alchemy communiceren?' : 'How should Alchemy communicate?'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light">
                  {isNl
                    ? 'Korte antwoorden, eerlijk, zachtjes corrigeren en geen corporate AI-filler.'
                    : 'Concise, clear, warm, gently corrective, no robotic AI filler.'}
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'shortAnswers', label: 'Korte antwoorden (geen onnodige lappen tekst)' },
                  { key: 'preferBulletPoints', label: 'Voorkeur voor opsommingstekens en overzicht' },
                  { key: 'gentleCorrection', label: 'Zachtjes corrigeren bij onjuistheden' },
                  { key: 'constructiveChallenge', label: 'Niet zomaar ja knikken; constructief uitdagen' },
                  { key: 'avoidGenericAiFiller', label: 'Geen generieke superlatieven of AI-clichés' },
                ].map((item) => {
                  const val = (data.communication as any)[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() =>
                        updateField((p) => ({
                          ...p,
                          communication: {
                            ...p.communication,
                            [item.key]: !val,
                          },
                        }))
                      }
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
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

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#F4EFE6] transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Terug' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>{isNl ? 'Volgende' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              STEP 3: LIFE & WORK
             ============================================================ */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-1 border-b border-[#F4EFE6] pb-4">
                <div className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  {isNl ? 'Stap 3 van 4 • Levensstructuur' : 'Step 3 of 4 • Life & Work'}
                </div>
                <h2 className="text-xl font-serif text-[#2C2825]">
                  {isNl ? 'Vaste werkdagen & rust' : 'Work rhythm & protected space'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light">
                  {isNl
                    ? 'Vaste werkdagen voor Mariluna en beschermde tijd voor privé en herstel.'
                    : 'Core workdays and boundaries protecting personal wellbeing.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4] space-y-2">
                <div className="text-xs font-serif font-medium text-[#2C2825]">
                  {isNl ? 'Patricia’s Werkstructuur:' : 'Patricia’s Work Schedule:'}
                </div>
                <div className="text-xs text-[#6D6357] space-y-1">
                  <div>• <strong>Vaste dagen:</strong> Dinsdag, Woensdag, Vrijdag</div>
                  <div>• <strong>Werkuren:</strong> 08:00 – 16:30</div>
                  <div>• <strong>Bedrijf:</strong> Mariluna Studio</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F6F0] border border-[#E4DDD0] flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
                <p className="text-xs text-[#6D6357] font-light leading-relaxed">
                  {isNl
                    ? 'Niet elk vrij uur hoeft volgepland te worden. Rust, beweging en privéleven zijn essentieel en worden beschermd tegen overbelasting.'
                    : 'Personal downtime and recovery are preserved alongside work commitments.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#F4EFE6] transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Terug' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>{isNl ? 'Volgende' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              STEP 4: NOTES & READY
             ============================================================ */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-1 border-b border-[#F4EFE6] pb-4">
                <div className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  {isNl ? 'Stap 4 van 4 • Afronding' : 'Step 4 of 4 • Completion'}
                </div>
                <h2 className="text-xl font-serif text-[#2C2825]">
                  {isNl ? 'Klaar voor de start' : 'Ready to Begin'}
                </h2>
                <p className="text-xs text-[#7A7167] font-light">
                  {isNl
                    ? 'Jouw Fundament is geconfigureerd en dient als centrale waarheid voor alle modules.'
                    : 'Your Foundation is configured and serves as the single source of truth.'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#6D6357] font-medium">
                  {isNl ? 'Iets belangrijks dat Alchemy direct moet weten?' : 'Anything else Alchemy should know?'}
                </label>
                <textarea
                  rows={3}
                  value={data.aboutYou.bio || ''}
                  onChange={(e) =>
                    updateField((p) => ({
                      ...p,
                      aboutYou: { ...p.aboutYou, bio: e.target.value },
                    }))
                  }
                  placeholder={isNl ? 'Optioneel: noteer hier een intentie of focuspunt...' : 'Optional notes...'}
                  className="w-full p-3.5 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs text-[#2C2825]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D4] space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif font-medium text-[#2C2825]">
                  <CheckCircle2 className="w-4 h-4 text-[#8C7654]" />
                  <span>{isNl ? 'Centraal Beheer in Instellingen' : 'Central Management'}</span>
                </div>
                <p className="text-xs text-[#6D6357] font-light leading-relaxed">
                  {isNl
                    ? 'Je kunt elk onderdeel (stijl, kledingevaluatie, voedingsprofiel, doelen, astrologie) op ieder moment raadplegen en aanpassen via Instellingen → Fundament.'
                    : 'You can adjust all profile sections anytime via Settings → Foundation.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#F4EFE6] transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Terug' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-6 py-2.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4 text-[#A3E635]" />
                  <span>{isNl ? 'Start met Alchemy' : 'Enter Alchemy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer status */}
      <div className="max-w-2xl mx-auto w-full text-center text-[11px] text-[#A89F91]">
        {isNl ? 'Fundament • Patz Profile v1.0 • Privacy Gecertificeerd' : 'Foundation • Patz Profile v1.0 • Privacy Certified'}
      </div>
    </div>
  );
};

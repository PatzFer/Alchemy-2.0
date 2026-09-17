import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Heart,
  Activity,
  Briefcase,
  User,
  Clock,
  Calendar,
  Shield,
  Bell,
  Sliders,
  Utensils,
  Target,
  Compass,
  Check,
} from 'lucide-react';
import {
  FoundationData,
  Language,
  WorkContext,
  FoundationGoalItem,
} from '../../types';
import { ONBOARDING_STEPS, applyFoundationToAppState } from '../../lib/foundationDefaults';

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
  // Screen state: 0 = welcome, 1-10 = wizard steps, 11 = completion summary
  const [screen, setScreen] = useState<number>(() => {
    if (initialData.currentStep && initialData.currentStep > 1 && initialData.currentStep <= 10) {
      return initialData.currentStep;
    }
    return 0; // Welcome screen
  });

  const [data, setData] = useState<FoundationData>(initialData);
  const lang: Language = data.aboutYou.preferredLanguage || 'nl';
  const isNl = lang === 'nl';

  // Helper to persist intermediate state
  const updateData = (updater: (prev: FoundationData) => FoundationData) => {
    setData((prev) => {
      const next = updater(prev);
      onSaveFoundation(next);
      return next;
    });
  };

  // Section tracking helpers
  const markSectionConfigured = (sectionSlug: string) => {
    updateData((prev) => ({
      ...prev,
      configuredSections: Array.from(new Set([...prev.configuredSections, sectionSlug])),
      skippedSections: prev.skippedSections.filter((s) => s !== sectionSlug),
    }));
  };

  const markSectionSkipped = (sectionSlug: string) => {
    updateData((prev) => ({
      ...prev,
      skippedSections: Array.from(new Set([...prev.skippedSections, sectionSlug])),
      configuredSections: prev.configuredSections.filter((s) => s !== sectionSlug),
    }));
  };

  const goToStep = (stepNumber: number) => {
    updateData((prev) => ({
      ...prev,
      currentStep: stepNumber,
      completedSteps:
        stepNumber > 1 && !prev.completedSteps.includes(stepNumber - 1)
          ? [...prev.completedSteps, stepNumber - 1]
          : prev.completedSteps,
    }));
    setScreen(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    const currentStepConfig = ONBOARDING_STEPS.find((s) => s.id === screen);
    if (currentStepConfig) {
      markSectionConfigured(currentStepConfig.slug);
    }
    if (screen < 10) {
      goToStep(screen + 1);
    } else {
      setScreen(11); // Completion screen
    }
  };

  const handleSkipCurrentStep = () => {
    const currentStepConfig = ONBOARDING_STEPS.find((s) => s.id === screen);
    if (currentStepConfig) {
      markSectionSkipped(currentStepConfig.slug);
    }
    if (screen < 10) {
      goToStep(screen + 1);
    } else {
      setScreen(11);
    }
  };

  const handleBack = () => {
    if (screen > 1) {
      goToStep(screen - 1);
    } else if (screen === 1) {
      setScreen(0);
    }
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

  // =========================================================================
  // SCREEN 0: WELCOME SCREEN
  // =========================================================================
  if (screen === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col justify-between p-6 sm:p-12 text-[#2C2825]">
        {/* Top bar with language switcher */}
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-[#D5CCBE] bg-[#F3EDE2] flex items-center justify-center shadow-xs">
              <span className="font-serif text-xs font-semibold text-[#7E694E] tracking-tighter">
                P&M
              </span>
            </div>
            <span className="font-serif text-base tracking-[0.2em] uppercase font-medium text-[#2C2825]">
              ALCHEMY
            </span>
          </div>

          {/* Language selector */}
          <div className="flex items-center rounded-full border border-[#E3DCD1] bg-[#F1ECE3] p-0.5 text-xs">
            <button
              onClick={() =>
                updateData((p) => ({
                  ...p,
                  aboutYou: { ...p.aboutYou, preferredLanguage: 'nl' },
                }))
              }
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                isNl
                  ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                  : 'text-[#7A7167] hover:text-[#2C2825]'
              }`}
            >
              Nederlands
            </button>
            <button
              onClick={() =>
                updateData((p) => ({
                  ...p,
                  aboutYou: { ...p.aboutYou, preferredLanguage: 'en' },
                }))
              }
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                !isNl
                  ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                  : 'text-[#7A7167] hover:text-[#2C2825]'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Center welcome card */}
        <div className="max-w-2xl mx-auto w-full my-auto py-12 text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EDE2] border border-[#E5DFD3] text-xs font-medium text-[#7E694E] tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isNl ? 'Fundament & Eerste Configuratie' : 'Foundation & First-Time Setup'}</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#2C2825] font-normal tracking-tight">
              {isNl ? 'Welkom bij Alchemy' : 'Welcome to Alchemy'}
            </h1>
            <p className="font-serif italic text-xl sm:text-2xl text-[#6D6357] max-w-lg mx-auto leading-relaxed">
              {isNl
                ? '"Laten we het systeem bouwen rond jouw leven."'
                : '"Let\'s build the system around your life."'}
            </p>
            <p className="text-sm sm:text-base text-[#857B6F] max-w-md mx-auto leading-relaxed">
              {isNl
                ? 'Alchemy past zich aan jou aan — niet andersom. We configureren je werkritme, doelen, welzijn en voorkeuren in enkele doordachte stappen.'
                : 'Alchemy adapts to you — not the other way around. We configure your work rhythm, goals, wellbeing, and preferences in a few mindful steps.'}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => goToStep(1)}
              id="begin-setup-btn"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>{isNl ? 'Start configuratie' : 'Begin setup'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onSkipSetup}
              id="skip-setup-btn"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-[#D5CCBE] bg-transparent text-[#7E694E] hover:bg-[#F3EDE2] font-medium text-sm transition-all cursor-pointer"
            >
              {isNl ? 'Nu overslaan' : 'Skip for now'}
            </button>
          </div>

          <p className="text-xs text-[#9B9183]">
            {isNl
              ? 'Je kunt de configuratie altijd later voltooien of aanpassen via Instellingen → Fundament.'
              : 'You can always resume or adjust setup anytime from Settings → Foundation.'}
          </p>
        </div>

        {/* Footer */}
        <div className="max-w-3xl mx-auto w-full text-center text-xs text-[#A89F91]">
          <span>P&M ALCHEMY • {isNl ? 'Persoonlijke Soevereiniteit' : 'Personal Sovereignty'}</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 11: COMPLETION SCREEN
  // =========================================================================
  if (screen === 11) {
    const configuredCount = data.configuredSections.length;
    const skippedCount = data.skippedSections.length;

    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col justify-between p-6 sm:p-12 text-[#2C2825]">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#D5CCBE] bg-[#F3EDE2] flex items-center justify-center shadow-xs">
              <span className="font-serif text-xs font-semibold text-[#7E694E]">P&M</span>
            </div>
            <span className="font-serif text-base tracking-[0.2em] uppercase font-medium text-[#2C2825]">
              ALCHEMY
            </span>
          </div>
        </div>

        <div className="max-w-xl mx-auto w-full my-auto py-10 space-y-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#EDE6D8] border border-[#D5CCBE] flex items-center justify-center text-[#7E694E] shadow-xs">
            <Check className="w-7 h-7" />
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2825] font-normal tracking-tight">
              {isNl ? 'ALCHEMY IS GEREED' : 'ALCHEMY IS READY'}
            </h1>
            <p className="font-serif italic text-lg text-[#6D6357]">
              {isNl
                ? '"Jouw systeem is afgestemd op jouw leven."'
                : '"Your system has been configured around your life."'}
            </p>
            <p className="text-sm text-[#857B6F] max-w-md mx-auto">
              {isNl
                ? 'Er is geen fictieve data gegenereerd. Alchemy start precies met de informatie en voorkeuren die jij zojuist hebt ingevoerd.'
                : 'No fictional data was generated. Alchemy starts precisely with the real foundation and preferences you just configured.'}
            </p>
          </div>

          {/* Configuration Summary */}
          <div className="rounded-2xl border border-[#E5DFD3] bg-[#FFFFFF] p-5 text-left space-y-3 shadow-xs">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#8C8377] font-sans">
              {isNl ? 'Overzicht van je fundament' : 'Foundation Overview'}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {ONBOARDING_STEPS.map((s) => {
                const isConfigured = data.configuredSections.includes(s.slug);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-[#FAF8F3] border border-[#EFE9DF]"
                  >
                    {isConfigured ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5B8266] shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-[#B5ABA0] shrink-0" />
                    )}
                    <span className="truncate text-[#3D3732]">
                      {isNl ? s.titleNl : s.titleEn}
                    </span>
                    <span className="ml-auto text-[10px] text-[#8C8377]">
                      {isConfigured ? (isNl ? 'Ingesteld' : 'Configured') : (isNl ? 'Later' : 'Later')}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-[#8C8377] pt-1">
              {isNl
                ? 'Alles kan op ieder moment worden bijgewerkt via Instellingen → Fundament.'
                : 'Everything can be updated anytime from Settings → Foundation.'}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleFinish}
              id="finish-create-alchemy-btn"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
            >
              <span>{isNl ? 'Creëer mijn Alchemy' : 'Create my Alchemy'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full text-center text-xs text-[#A89F91]">
          <span>P&M ALCHEMY</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STEPS 1 TO 10: WIZARD STEPS
  // =========================================================================
  const currentStepInfo = ONBOARDING_STEPS.find((s) => s.id === screen)!;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#2C2825] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header Bar */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between pb-4 border-b border-[#EAE2D5]">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs text-[#7E694E] hover:text-[#2C2825] font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isNl ? 'Terug' : 'Back'}</span>
        </button>

        {/* Step Indicator */}
        <div className="text-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#8C8377] font-sans">
            {isNl ? `Stap ${screen} van 10` : `Step ${screen} of 10`}
          </span>
          <h2 className="font-serif text-base text-[#2C2825]">
            {isNl ? currentStepInfo.titleNl : currentStepInfo.titleEn}
          </h2>
        </div>

        {/* Skip button for optional steps */}
        <button
          onClick={handleSkipCurrentStep}
          className="text-xs text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer font-medium"
        >
          {isNl ? 'Overslaan' : 'Skip'}
        </button>
      </div>

      {/* Progress Line */}
      <div className="max-w-3xl mx-auto w-full py-2">
        <div className="h-1 w-full bg-[#EAE2D5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7E694E] transition-all duration-300 rounded-full"
            style={{ width: `${(screen / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Step Body */}
      <div className="max-w-2xl mx-auto w-full py-6 sm:py-8 flex-1">
        {/* STEP 1: ABOUT YOU */}
        {screen === 1 && (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2825]">
                {isNl ? 'Laten we bij jou beginnen' : "Let's start with you"}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7167]">
                {isNl
                  ? 'Hoe wil je dat Alchemy je aanspreekt en in welke taal?'
                  : 'How would you like Alchemy to address you and in which language?'}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Jouw naam / roepnaam *' : 'Your name *'}
                </label>
                <input
                  type="text"
                  value={data.aboutYou.name}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      aboutYou: { ...p.aboutYou, name: e.target.value },
                    }))
                  }
                  placeholder={isNl ? 'Bijv. Patricia' : 'e.g. Patricia'}
                  className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Geboortedatum (optioneel)' : 'Date of birth (optional)'}
                </label>
                <input
                  type="date"
                  value={data.aboutYou.dateOfBirth || ''}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      aboutYou: { ...p.aboutYou, dateOfBirth: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Voorkeurstaal voor de applicatie' : 'Preferred application language'}
                </label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateData((p) => ({
                        ...p,
                        aboutYou: { ...p.aboutYou, preferredLanguage: 'nl' },
                      }))
                    }
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      isNl
                        ? 'border-[#7E694E] bg-[#F7F2E9] font-medium'
                        : 'border-[#D5CCBE] bg-[#FFFFFF] hover:border-[#B5A897]'
                    }`}
                  >
                    <div className="text-sm text-[#2C2825]">Nederlands (Standaard)</div>
                    <div className="text-xs text-[#7A7167]">Nederlandstalige interface</div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateData((p) => ({
                        ...p,
                        aboutYou: { ...p.aboutYou, preferredLanguage: 'en' },
                      }))
                    }
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      !isNl
                        ? 'border-[#7E694E] bg-[#F7F2E9] font-medium'
                        : 'border-[#D5CCBE] bg-[#FFFFFF] hover:border-[#B5A897]'
                    }`}
                  >
                    <div className="text-sm text-[#2C2825]">English</div>
                    <div className="text-xs text-[#7A7167]">English interface</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: YOUR LIFE */}
        {screen === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2825]">
                {isNl ? 'Jouw levensstructuur' : 'Your life structure'}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7167]">
                {isNl
                  ? 'We leggen alleen stabiele structuren vast. Slaap- en waaktijden vul je later eenvoudig in via de dagelijkse check-in op Vandaag.'
                  : 'We only capture stable life patterns here. Exact sleep and wake times are captured daily on Today.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Normaal dagritme & energiepiek' : 'Normal daily rhythm'}
                </label>
                <input
                  type="text"
                  value={data.yourLife.dailyRhythm}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      yourLife: { ...p.yourLife, dailyRhythm: e.target.value },
                    }))
                  }
                  placeholder={
                    isNl
                      ? 'Bijv. Ochtendmens met rustige start, piek tussen 10:00 en 14:00'
                      : 'e.g. Morning person with gentle start, peak 10:00 - 14:00'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Beschikbare tijd voor persoonlijke focus / herstel' : 'Typical available focus time'}
                </label>
                <input
                  type="text"
                  value={data.yourLife.typicalAvailableTime}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      yourLife: { ...p.yourLife, typicalAvailableTime: e.target.value },
                    }))
                  }
                  placeholder={
                    isNl
                      ? 'Bijv. 2 tot 3 uur per werkdag voor diepe focus'
                      : 'e.g. 2 to 3 hours per workday for deep focus'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Belangrijke persoonlijke routines' : 'Personal routines'}
                </label>
                <textarea
                  rows={2}
                  value={data.yourLife.personalRoutines.join(', ')}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      yourLife: {
                        ...p.yourLife,
                        personalRoutines: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder={
                    isNl
                      ? 'Bijv. Ochtendthee & journaling, 30m middagwandeling, avond schermvrij'
                      : 'e.g. Morning tea, 30m nature walk, screen-free evening'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
                />
                <p className="text-[11px] text-[#8C8377]">
                  {isNl ? 'Scheid routines met een komma.' : 'Separate routines with a comma.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Beschermde rust- en planningsperiodes' : 'Protected rest & planning windows'}
                </label>
                <input
                  type="text"
                  value={data.yourLife.planningRestPeriods.join(', ')}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      yourLife: {
                        ...p.yourLife,
                        planningRestPeriods: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder={
                    isNl
                      ? 'Bijv. Rustige avonden na 20:30, vrije zondagochtend'
                      : 'e.g. Quiet evenings after 20:30, Sunday sanctuary'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WORK */}
        {screen === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2825]">
                {isNl ? 'Werkcontexten' : 'Work contexts'}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7167]">
                {isNl
                  ? 'Stel je werkrooster in. Werk staat los van het Mariluna ondernemingsdomein.'
                  : 'Configure your work contexts. Work remains separate from Mariluna.'}
              </p>
            </div>

            {data.work.workContexts.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-[#D5CCBE] text-center bg-[#FAF8F3] space-y-3">
                <p className="text-xs text-[#7A7167]">
                  {isNl
                    ? 'Nog geen werkcontext toegevoegd. Voeg je baan, freelance opdrachten of werkdagen toe.'
                    : 'No work contexts added yet.'}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    updateData((p) => ({
                      ...p,
                      work: {
                        workContexts: [
                          ...p.work.workContexts,
                          {
                            id: `wc-${Date.now()}`,
                            name: isNl ? 'Hoofdbaan' : 'Primary Work',
                            workdays: ['Maandag', 'Dinsdag', 'Donderdag', 'Vrijdag'],
                            startTime: '09:00',
                            endTime: '17:00',
                            location: isNl ? 'Kantoor / Hybride' : 'Office / Hybrid',
                            commuteMinutes: 20,
                          },
                        ],
                      },
                    }))
                  }
                  className="px-4 py-2 rounded-xl bg-[#EDE6D8] text-[#7E694E] hover:bg-[#E2D7C5] font-medium text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isNl ? '+ Werkcontext toevoegen' : '+ Add work context'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.work.workContexts.map((ctx, idx) => (
                  <div
                    key={ctx.id}
                    className="p-4 rounded-2xl border border-[#E0D7C9] bg-[#FFFFFF] space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={ctx.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateData((p) => ({
                            ...p,
                            work: {
                              workContexts: p.work.workContexts.map((c, i) =>
                                i === idx ? { ...c, name: val } : c
                              ),
                            },
                          }));
                        }}
                        className="font-medium text-sm text-[#2C2825] border-b border-[#E0D7C9] focus:outline-none focus:border-[#7E694E] pb-0.5"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateData((p) => ({
                            ...p,
                            work: {
                              workContexts: p.work.workContexts.filter((_, i) => i !== idx),
                            },
                          }))
                        }
                        className="text-[#B5ABA0] hover:text-[#B94A48] transition cursor-pointer p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                          {isNl ? 'Begintijd' : 'Start'}
                        </label>
                        <input
                          type="time"
                          value={ctx.startTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateData((p) => ({
                              ...p,
                              work: {
                                workContexts: p.work.workContexts.map((c, i) =>
                                i === idx ? { ...c, startTime: val } : c
                                ),
                              },
                            }));
                          }}
                          className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                          {isNl ? 'Eindtijd' : 'End'}
                        </label>
                        <input
                          type="time"
                          value={ctx.endTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateData((p) => ({
                              ...p,
                              work: {
                                workContexts: p.work.workContexts.map((c, i) =>
                                i === idx ? { ...c, endTime: val } : c
                                ),
                              },
                            }));
                          }}
                          className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                          {isNl ? 'Locatie' : 'Location'}
                        </label>
                        <input
                          type="text"
                          value={ctx.location}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateData((p) => ({
                              ...p,
                              work: {
                                workContexts: p.work.workContexts.map((c, i) =>
                                i === idx ? { ...c, location: val } : c
                                ),
                              },
                            }));
                          }}
                          placeholder={isNl ? 'Kantoor / Thuis' : 'Office / Home'}
                          className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                          {isNl ? 'Reistijd (min)' : 'Commute (min)'}
                        </label>
                        <input
                          type="number"
                          value={ctx.commuteMinutes || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateData((p) => ({
                              ...p,
                              work: {
                                workContexts: p.work.workContexts.map((c, i) =>
                                i === idx ? { ...c, commuteMinutes: val } : c
                                ),
                              },
                            }));
                          }}
                          placeholder="20"
                          className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE]"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    updateData((p) => ({
                      ...p,
                      work: {
                        workContexts: [
                          ...p.work.workContexts,
                          {
                            id: `wc-${Date.now()}`,
                            name: isNl ? 'Extra project / Consultancy' : 'Consultancy',
                            workdays: ['Woensdag'],
                            startTime: '10:00',
                            endTime: '16:00',
                            location: 'Flex',
                          },
                        ],
                      },
                    }))
                  }
                  className="text-xs text-[#7E694E] hover:text-[#2C2825] font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isNl ? '+ Extra werkcontext toevoegen' : '+ Add another context'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: GOALS */}
        {screen === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2825]">
                {isNl ? 'Wat wil je bereiken?' : 'What would you like to work toward?'}
              </h3>
              <p className="font-serif italic text-base text-[#7E694E]">
                {isNl ? '"Je hoeft het nu nog niet te weten."' : '"You don\'t need to know yet."'}
              </p>
              <p className="text-xs sm:text-sm text-[#7A7167]">
                {isNl
                  ? 'Voeg een doel toe als je er al een voor ogen hebt. Je kunt doelen altijd later toevoegen wanneer je er klaar voor bent.'
                  : 'Add a goal if you already have one in mind. You can always add goals later.'}
              </p>
            </div>

            {data.goals.goals.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-[#D5CCBE] text-center bg-[#FAF8F3] space-y-4">
                <p className="text-xs text-[#7A7167]">
                  {isNl
                    ? 'Nog geen doelen ingesteld. Helemaal prima — doelen zijn optioneel.'
                    : 'No goals added yet. Goals are optional.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateData((p) => ({
                        ...p,
                        goals: {
                          goals: [
                            ...p.goals.goals,
                            {
                              id: `fg-${Date.now()}`,
                              name: isNl ? 'Persoonlijk doel' : 'Personal goal',
                              domain: 'personal',
                              priority: 'medium',
                            },
                          ],
                        },
                      }))
                    }
                    className="px-4 py-2 rounded-xl bg-[#EDE6D8] text-[#7E694E] hover:bg-[#E2D7C5] font-medium text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isNl ? '+ Doel toevoegen' : '+ Add goal'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipCurrentStep}
                    className="px-4 py-2 rounded-xl border border-[#D5CCBE] text-[#8C8377] hover:text-[#2C2825] text-xs transition cursor-pointer"
                  >
                    {isNl ? 'Nu overslaan' : 'Skip for now'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {data.goals.goals.map((goal, idx) => (
                  <div
                    key={goal.id}
                    className="p-4 rounded-2xl border border-[#E0D7C9] bg-[#FFFFFF] space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={goal.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateData((p) => ({
                            ...p,
                            goals: {
                              goals: p.goals.goals.map((g, i) =>
                                i === idx ? { ...g, name: val } : g
                              ),
                            },
                          }));
                        }}
                        placeholder={isNl ? 'Titel van het doel' : 'Goal title'}
                        className="font-medium text-sm text-[#2C2825] border-b border-[#E0D7C9] focus:outline-none focus:border-[#7E694E] pb-0.5 flex-1 mr-2"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateData((p) => ({
                            ...p,
                            goals: {
                              goals: p.goals.goals.filter((_, i) => i !== idx),
                            },
                          }))
                        }
                        className="text-[#B5ABA0] hover:text-[#B94A48] transition cursor-pointer p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                          {isNl ? 'Domein' : 'Domain'}
                        </label>
                        <select
                          value={goal.domain}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            updateData((p) => ({
                              ...p,
                              goals: {
                                goals: p.goals.goals.map((g, i) =>
                                  i === idx ? { ...g, domain: val } : g
                                ),
                              },
                            }));
                          }}
                          className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE] bg-white"
                        >
                          <option value="personal">{isNl ? 'Persoonlijk' : 'Personal'}</option>
                          <option value="wellbeing">{isNl ? 'Welzijn' : 'Wellbeing'}</option>
                          <option value="mariluna">Mariluna</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                          {isNl ? 'Prioriteit' : 'Priority'}
                        </label>
                        <select
                          value={goal.priority}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            updateData((p) => ({
                              ...p,
                              goals: {
                                goals: p.goals.goals.map((g, i) =>
                                  i === idx ? { ...g, priority: val } : g
                                ),
                              },
                            }));
                          }}
                          className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE] bg-white"
                        >
                          <option value="high">{isNl ? 'Hoog' : 'High'}</option>
                          <option value="medium">{isNl ? 'Gemiddeld' : 'Medium'}</option>
                          <option value="low">{isNl ? 'Rustig / Laag' : 'Low'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                          {isNl ? 'Streefdatum (optioneel)' : 'Target date (optional)'}
                        </label>
                        <input
                          type="date"
                          value={goal.targetDate || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateData((p) => ({
                              ...p,
                              goals: {
                                goals: p.goals.goals.map((g, i) =>
                                  i === idx ? { ...g, targetDate: val } : g
                                ),
                              },
                            }));
                          }}
                          className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE]"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    updateData((p) => ({
                      ...p,
                      goals: {
                        goals: [
                          ...p.goals.goals,
                          {
                            id: `fg-${Date.now()}`,
                            name: isNl ? 'Nieuw doel' : 'New goal',
                            domain: 'personal',
                            priority: 'medium',
                          },
                        ],
                      },
                    }))
                  }
                  className="text-xs text-[#7E694E] hover:text-[#2C2825] font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isNl ? '+ Nog een doel toevoegen' : '+ Add another goal'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: WELLBEING */}
        {screen === 5 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2825]">
                {isNl ? 'Welzijn & Lichaamsintellect' : 'Wellbeing & Body Intelligence'}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7167]">
                {isNl
                  ? 'Koppel optioneel je startwaarden. Alchemy analyseert trends in plaats van te overreageren op een enkele meting.'
                  : 'Optionally record baseline measurements. Alchemy focuses on long-term trends.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Huidig startgewicht (kg, optioneel)' : 'Current weight (kg, optional)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={data.wellbeing.currentWeightKg || ''}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      wellbeing: {
                        ...p.wellbeing,
                        currentWeightKg: e.target.value ? Number(e.target.value) : undefined,
                      },
                    }))
                  }
                  placeholder="Bijv. 61.5"
                  className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Tailleomvang (cm, optioneel)' : 'Waist (cm, optional)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={data.wellbeing.waistCm || ''}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      wellbeing: {
                        ...p.wellbeing,
                        waistCm: e.target.value ? Number(e.target.value) : undefined,
                      },
                    }))
                  }
                  placeholder="Bijv. 68"
                  className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                {isNl ? 'Favoriete bewegingsvormen' : 'Movement preferences'}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'Wandelen', nl: 'Wandelen', en: 'Walking' },
                  { id: 'Zwemmen', nl: 'Zwemmen', en: 'Swimming' },
                  { id: 'Krachttraining', nl: 'Krachttraining', en: 'Strength training' },
                  { id: 'Yoga', nl: 'Yoga & Stretch', en: 'Yoga & Stretch' },
                  { id: 'Pilates', nl: 'Pilates', en: 'Pilates' },
                  { id: 'Ademwerk', nl: 'Ademwerk / Herstel', en: 'Breathwork' },
                ].map((item) => {
                  const isSelected = data.wellbeing.movementPreferences.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        updateData((p) => ({
                          ...p,
                          wellbeing: {
                            ...p.wellbeing,
                            movementPreferences: isSelected
                              ? p.wellbeing.movementPreferences.filter((x) => x !== item.id)
                              : [...p.wellbeing.movementPreferences, item.id],
                          },
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer border ${
                        isSelected
                          ? 'border-[#7E694E] bg-[#F7F2E9] text-[#2C2825] font-medium'
                          : 'border-[#D5CCBE] bg-white text-[#7A7167]'
                      }`}
                    >
                      {isNl ? item.nl : item.en}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                {isNl ? 'Meetfrequentie voor progressie' : 'Measurement frequency'}
              </label>
              <select
                value={data.wellbeing.measurementFrequency}
                onChange={(e) =>
                  updateData((p) => ({
                    ...p,
                    wellbeing: {
                      ...p.wellbeing,
                      measurementFrequency: e.target.value as any,
                    },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825]"
              >
                <option value="weekly">{isNl ? 'Wekelijks op een vaste ochtend' : 'Weekly'}</option>
                <option value="biweekly">{isNl ? 'Om de twee weken' : 'Bi-weekly'}</option>
                <option value="monthly">{isNl ? 'Maandelijks (bijvoorbeeld cyclus-gerelateerd)' : 'Monthly'}</option>
                <option value="as_desired">{isNl ? 'Enkel wanneer ik er zin in heb' : 'As desired'}</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 6: NUTRITION */}
        {screen === 6 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2825]">
                {isNl ? 'Voeding & Keukenvoorkeuren' : 'Nutrition & Cooking'}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7167]">
                {isNl
                  ? 'Optioneel en beknopt. Deze gegevens ondersteunen later je weekmenu, receptsuggesties en boodschappen.'
                  : 'Optional nutrition preferences to support meal planning and shopping.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Gerechten & ingrediënten waar je van geniet' : 'Foods you enjoy'}
                </label>
                <input
                  type="text"
                  value={data.nutrition.enjoyedFoods.join(', ')}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      nutrition: {
                        ...p.nutrition,
                        enjoyedFoods: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder={
                    isNl
                      ? 'Bijv. Mediterrane salades, gegrilde groenten, verse vis, olijfolie'
                      : 'e.g. Mediterranean bowls, fresh fish, olive oil'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Allergieën, intoleranties of vermeden voeding' : 'Allergies or exclusions'}
                </label>
                <input
                  type="text"
                  value={data.nutrition.avoidedFoods.join(', ')}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      nutrition: {
                        ...p.nutrition,
                        avoidedFoods: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder={
                    isNl
                      ? 'Bijv. Geen geraffineerde suikers, koemelkintolerantie'
                      : 'e.g. Refined sugar, lactose intolerance'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                    {isNl ? 'Typische kooktijd op werkdagen' : 'Weekday cooking time'}
                  </label>
                  <input
                    type="number"
                    value={data.nutrition.cookingTimeMinutes || 30}
                    onChange={(e) =>
                      updateData((p) => ({
                        ...p,
                        nutrition: {
                          ...p.nutrition,
                          cookingTimeMinutes: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                    {isNl ? 'Eet je meestal alleen of samen?' : 'Dining setting'}
                  </label>
                  <select
                    value={data.nutrition.diningSetting}
                    onChange={(e) =>
                      updateData((p) => ({
                        ...p,
                        nutrition: {
                          ...p.nutrition,
                          diningSetting: e.target.value as any,
                        },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-sm text-[#2C2825]"
                  >
                    <option value="alone">{isNl ? 'Meestal alleen' : 'Mostly alone'}</option>
                    <option value="with_partner">{isNl ? 'Gedeeld met partner' : 'With partner'}</option>
                    <option value="family">{isNl ? 'Met gezin / huisgenoten' : 'Family / household'}</option>
                    <option value="flexible">{isNl ? 'Wisselend / flexibel' : 'Flexible'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: CYCLE */}
        {screen === 7 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2825]">
                {isNl ? 'Menstruele Cyclus & Ritme' : 'Menstrual Cycle & Rhythm'}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7167]">
                {isNl
                  ? 'Optioneel. Blijft strikt binnen het persoonlijke domein en wordt nooit zonder toestemming gedeeld.'
                  : 'Optional rhythm tracking. Kept strictly inside the personal domain.'}
              </p>
            </div>

            {/* Privacy notice banner */}
            <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2DBD0] flex items-start gap-2.5 text-xs text-[#6D6357]">
              <Shield className="w-4 h-4 text-[#7E694E] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#2C2825]">
                  {isNl ? 'Persoonlijke soevereiniteit: ' : 'Personal sovereignty: '}
                </span>
                {isNl
                  ? 'Cyclusdata verschijnt nooit in Mariluna-taken of zakelijke overzichten en wordt niet naar externe AI-servers gestuurd zonder expliciete toestemming.'
                  : 'Cycle data never appears in Mariluna business outputs and is never sent to external AI without explicit approval.'}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#D5CCBE] bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.cycle.enabled}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      cycle: { ...p.cycle, enabled: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-[#7E694E]"
                />
                <span className="text-sm font-medium text-[#2C2825]">
                  {isNl ? 'Cyclusintelligentie activeren in Alchemy' : 'Enable cycle intelligence in Alchemy'}
                </span>
              </label>

              {data.cycle.enabled && (
                <div className="p-4 rounded-2xl border border-[#E0D7C9] bg-white space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                      {isNl ? 'Startdatum laatste menstruatie' : 'Last period start date'}
                    </label>
                    <input
                      type="date"
                      value={data.cycle.lastPeriodStart || ''}
                      onChange={(e) =>
                        updateData((p) => ({
                          ...p,
                          cycle: { ...p.cycle, lastPeriodStart: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5CCBE] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                        {isNl ? 'Gemiddelde cyclus (dagen)' : 'Average cycle length'}
                      </label>
                      <input
                        type="number"
                        min="21"
                        max="45"
                        value={data.cycle.averageCycleLength}
                        onChange={(e) =>
                          updateData((p) => ({
                            ...p,
                            cycle: { ...p.cycle, averageCycleLength: Number(e.target.value) },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D5CCBE] text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                        {isNl ? 'Menstruatieduur (dagen)' : 'Average period length'}
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={data.cycle.averagePeriodLength}
                        onChange={(e) =>
                          updateData((p) => ({
                            ...p,
                            cycle: { ...p.cycle, averagePeriodLength: Number(e.target.value) },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D5CCBE] text-sm"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 text-xs text-[#524B43]">
                    <input
                      type="checkbox"
                      checked={data.cycle.cycleInfluencesPlanning}
                      onChange={(e) =>
                        updateData((p) => ({
                          ...p,
                          cycle: { ...p.cycle, cycleInfluencesPlanning: e.target.checked },
                        }))
                      }
                      className="w-3.5 h-3.5 accent-[#7E694E]"
                    />
                    <span>
                      {isNl
                        ? 'Laat cyclusenergie zacht meewegen in taaksuggesties op Vandaag'
                        : 'Allow cycle rhythm to gently inform planning suggestions on Today'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 8: MARILUNA */}
        {screen === 8 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2825]">
                {isNl ? 'Mariluna Ondernemingsomgeving' : 'Mariluna Business Domain'}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7167]">
                {isNl
                  ? 'Optionele zakelijke context voor atelier, cliënten, contentpijlers en projecten.'
                  : 'Optional business context for atelier, client retainers, and content.'}
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#D5CCBE] bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.mariluna.enabled}
                  onChange={(e) =>
                    updateData((p) => ({
                      ...p,
                      mariluna: { ...p.mariluna, enabled: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-[#7E694E]"
                />
                <span className="text-sm font-medium text-[#2C2825]">
                  {isNl ? 'Mariluna werkruimte inschakelen in Alchemy' : 'Enable Mariluna workspace in Alchemy'}
                </span>
              </label>

              {data.mariluna.enabled && (
                <div className="p-4 rounded-2xl border border-[#E0D7C9] bg-white space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                      {isNl ? 'Belangrijkste zakelijke doelen / focus dit kwartaal' : 'Quarterly business focus'}
                    </label>
                    <input
                      type="text"
                      value={data.mariluna.businessGoals.join(', ')}
                      onChange={(e) =>
                        updateData((p) => ({
                          ...p,
                          mariluna: {
                            ...p.mariluna,
                            businessGoals: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        }))
                      }
                      placeholder={
                        isNl
                          ? 'Bijv. Lancering Sovereign cohort, afronding atelier voorstellen'
                          : 'e.g. Masterclass launch, atelier proposals'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5CCBE] text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                      {isNl ? 'Contentpijlers of communicatiekanalen' : 'Content pillars & platforms'}
                    </label>
                    <input
                      type="text"
                      value={data.mariluna.contentAreas.join(', ')}
                      onChange={(e) =>
                        updateData((p) => ({
                          ...p,
                          mariluna: {
                            ...p.mariluna,
                            contentAreas: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        }))
                      }
                      placeholder={
                        isNl
                          ? 'Bijv. Nieuwsbrief essay, Instagram editorial, podcast'
                          : 'e.g. Newsletter, Instagram editorial, podcast'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5CCBE] text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 9: YOUR AI */}
        {screen === 9 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2825]">
                {isNl ? 'Gedrag van je AI Sparringpartner' : 'Your AI Strategic Partner'}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7167]">
                {isNl
                  ? 'Alchemy gedraagt zich als een strategische sparringpartner — niet als een dwingend productiviteitssysteem.'
                  : 'Alchemy acts as a strategic personal assistant, not a controlling productivity manager.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Communicatiestijl' : 'Communication style'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'short_direct', nl: 'Kort & direct', en: 'Short & direct' },
                    { id: 'warm_supportive', nl: 'Warm & ondersteunend', en: 'Warm & supportive' },
                    { id: 'strategic', nl: 'Strategisch & bevragend', en: 'Strategic & questioning' },
                    { id: 'detailed', nl: 'Gedetailleerder waar nuttig', en: 'More detailed when useful' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() =>
                        updateData((p) => ({
                          ...p,
                          ai: { ...p.ai, communicationStyle: style.id as any },
                        }))
                      }
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        data.ai.communicationStyle === style.id
                          ? 'border-[#7E694E] bg-[#F7F2E9] font-medium'
                          : 'border-[#D5CCBE] bg-white'
                      }`}
                    >
                      <span className="text-xs text-[#2C2825]">
                        {isNl ? style.nl : style.en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Wat mag Alchemy proactief voorstellen?' : 'What may Alchemy propose proactively?'}
                </label>
                <div className="space-y-2 text-xs">
                  {[
                    {
                      key: 'suggestActions',
                      nl: 'Concreet volgende stappen voorstellen bij ideeën',
                      en: 'Suggest actionable next steps for ideas',
                    },
                    {
                      key: 'helpPrioritize',
                      nl: 'Helpen kiezen tussen urgente vs wezenlijke prioriteiten',
                      en: 'Help prioritize essential tasks over false urgency',
                    },
                    {
                      key: 'rescheduleUnfinished',
                      nl: 'Niet-voltooide taken vriendelijk herplannen zonder oordeel',
                      en: 'Reschedule unfinished tasks with compassion',
                    },
                    {
                      key: 'surfacePatterns',
                      nl: 'Waardevolle patronen in energie en gewoonten signaleren',
                      en: 'Surface thoughtful rhythm and energy patterns',
                    },
                  ].map((item) => {
                    const isChecked = (data.ai as any)[item.key];
                    return (
                      <label
                        key={item.key}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E2DBD0] bg-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            updateData((p) => ({
                              ...p,
                              ai: { ...p.ai, [item.key]: e.target.checked },
                            }))
                          }
                          className="w-3.5 h-3.5 accent-[#7E694E]"
                        />
                        <span className="text-[#3D3732]">{isNl ? item.nl : item.en}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: NOTIFICATIONS & PERMISSIONS */}
        {screen === 10 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2825]">
                {isNl ? 'Meldingen & Toestemmingen' : 'Notifications & Permissions'}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A7167]">
                {isNl
                  ? 'We hanteren minimale bevoegdheden. Rustige, doordachte meldingen die je focus respecteren.'
                  : 'Least-privilege by default. Sparse, meaningful notifications protecting your quiet hours.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-[#E0D7C9] bg-white space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#8C8377]">
                  {isNl ? 'Stille uren' : 'Quiet hours'}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                      {isNl ? 'Start stilte (avond)' : 'Start'}
                    </label>
                    <input
                      type="time"
                      value={data.notifications.quietHoursStart}
                      onChange={(e) =>
                        updateData((p) => ({
                          ...p,
                          notifications: {
                            ...p.notifications,
                            quietHoursStart: e.target.value,
                          },
                        }))
                      }
                      className="w-full mt-0.5 p-2 rounded-lg border border-[#D5CCBE]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                      {isNl ? 'Einde stilte (ochtend)' : 'End'}
                    </label>
                    <input
                      type="time"
                      value={data.notifications.quietHoursEnd}
                      onChange={(e) =>
                        updateData((p) => ({
                          ...p,
                          notifications: {
                            ...p.notifications,
                            quietHoursEnd: e.target.value,
                          },
                        }))
                      }
                      className="w-full mt-0.5 p-2 rounded-lg border border-[#D5CCBE]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-[#E0D7C9] bg-white space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#8C8377]">
                  {isNl ? 'Beveiligingsgrenzen (Least Privilege)' : 'Security Boundaries'}
                </h4>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.notifications.permissions.isolateMariluna}
                      onChange={(e) =>
                        updateData((p) => ({
                          ...p,
                          notifications: {
                            ...p.notifications,
                            permissions: {
                              ...p.notifications.permissions,
                              isolateMariluna: e.target.checked,
                            },
                          },
                        }))
                      }
                      className="w-3.5 h-3.5 accent-[#7E694E]"
                    />
                    <span>
                      {isNl
                        ? 'Strikte scheiding tussen persoonlijke levensdata en Mariluna data'
                        : 'Strict boundary between personal data and Mariluna business'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.notifications.permissions.requireStepUpSensitive}
                      onChange={(e) =>
                        updateData((p) => ({
                          ...p,
                          notifications: {
                            ...p.notifications,
                            permissions: {
                              ...p.notifications.permissions,
                              requireStepUpSensitive: e.target.checked,
                            },
                          },
                        }))
                      }
                      className="w-3.5 h-3.5 accent-[#7E694E]"
                    />
                    <span>
                      {isNl
                        ? 'Extra verificatie vereist bij gevoelige data-bewerkingen en export'
                        : 'Require step-up verification for exports and sensitive actions'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="max-w-3xl mx-auto w-full pt-4 border-t border-[#EAE2D5] flex items-center justify-between">
        <button
          onClick={handleBack}
          className="text-xs text-[#7E694E] hover:text-[#2C2825] font-medium transition cursor-pointer"
        >
          {isNl ? 'Terug' : 'Back'}
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSkipCurrentStep}
            className="text-xs text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer px-3 py-2"
          >
            {isNl ? 'Stap overslaan' : 'Skip step'}
          </button>
          <button
            onClick={handleNext}
            id="wizard-continue-btn"
            className="px-6 py-2.5 rounded-full bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>{screen === 10 ? (isNl ? 'Naar afronding' : 'Review & finish') : (isNl ? 'Verder' : 'Continue')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

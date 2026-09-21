import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Shirt,
  Heart,
  HelpCircle,
  Check,
  AlertCircle,
  RefreshCw,
  Tag,
  Palette,
  Compass,
  ArrowRight,
  Sliders,
  Maximize2,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Bookmark,
  Filter,
  Eye,
  Info,
} from 'lucide-react';
import {
  PersonalStyleState,
  FoundationPersonalStyling,
  BodyMeasurementEntry,
  GarmentEvaluation,
  StyleLearnedFeedback,
  WellbeingState,
} from '../../types';
import { DEFAULT_PERSONAL_STYLING } from '../../lib/foundationDefaults';
import {
  EMOTIONAL_MOODS,
  STYLING_OCCASIONS,
  PRESET_GARMENTS,
  evaluateGarment,
  GarmentEvaluationInput,
  EmotionalMoodConfig,
} from '../../lib/personalStylingLogic';
import { calculateEstimatedBodyShape } from '../../lib/healthUtils';

interface PersonalStylingViewProps {
  personalStyle: PersonalStyleState;
  onUpdateStyle: (style: PersonalStyleState) => void;
  foundationStyling?: FoundationPersonalStyling;
  onUpdateFoundationStyling?: (styling: FoundationPersonalStyling) => void;
  wellbeing?: WellbeingState;
  onUpdateWellbeing?: (updater: (prev: WellbeingState) => WellbeingState) => void;
  lang?: 'nl' | 'en';
}

type StylingSection = 'evaluator' | 'mood' | 'architecture' | 'dna' | 'wardrobe';

export const PersonalStylingView: React.FC<PersonalStylingViewProps> = ({
  personalStyle,
  onUpdateStyle,
  foundationStyling = DEFAULT_PERSONAL_STYLING,
  onUpdateFoundationStyling,
  wellbeing,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';
  const [activeSection, setActiveSection] = useState<StylingSection>('evaluator');

  // Latest measurements from wellbeing
  const latestMeasurement: BodyMeasurementEntry | undefined = useMemo(() => {
    if (wellbeing?.bodyMeasurementHistory && wellbeing.bodyMeasurementHistory.length > 0) {
      return [...wellbeing.bodyMeasurementHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
    }
    return undefined;
  }, [wellbeing?.bodyMeasurementHistory]);

  // Recalculation divergence detection
  const [divergenceDismissed, setDivergenceDismissed] = useState(
    personalStyle.bodyDivergenceDismissed || false
  );
  const [recalculatedNotice, setRecalculatedNotice] = useState(false);

  const calculatedShape = useMemo(() => {
    return calculateEstimatedBodyShape(latestMeasurement);
  }, [latestMeasurement]);

  const hasBodyShapeDivergence = useMemo(() => {
    if (!latestMeasurement || !calculatedShape.isReliable || !calculatedShape.shapeCode) return false;
    if (divergenceDismissed || recalculatedNotice) return false;
    
    // Check if saved shape is present and differs
    const savedShape = personalStyle.bodyShape;
    if (savedShape && savedShape !== calculatedShape.shapeCode) {
      return true;
    }
    return false;
  }, [latestMeasurement, calculatedShape, personalStyle.bodyShape, divergenceDismissed, recalculatedNotice]);

  // Evaluator State
  const [evalInput, setEvalInput] = useState<GarmentEvaluationInput>({
    itemTitle: '',
    category: 'Jurken',
    brand: '',
    price: '',
    occasion: 'general',
    mood: personalStyle.activeMood || 'romantic',
    imageUrl: '',
    fabricDescription: '',
    hasSizeChartOrMeasurements: false,
    hasStretch: 'slight',
    userNotes: '',
  });

  const [currentEvaluation, setCurrentEvaluation] = useState<GarmentEvaluation | null>(
    personalStyle.evaluations && personalStyle.evaluations.length > 0
      ? personalStyle.evaluations[0]
      : null
  );

  const [isEvaluating, setIsEvaluating] = useState(false);

  // Evaluated items & learned feedback
  const evaluationsList: GarmentEvaluation[] = useMemo(() => {
    return personalStyle.evaluations || foundationStyling.recentEvaluations || [];
  }, [personalStyle.evaluations, foundationStyling.recentEvaluations]);

  const learnedFeedbackList: StyleLearnedFeedback[] = useMemo(() => {
    return personalStyle.learnedFeedback || foundationStyling.learnedFeedback || [];
  }, [personalStyle.learnedFeedback, foundationStyling.learnedFeedback]);

  // Active emotional dressing mood
  const [selectedMoodId, setSelectedMoodId] = useState<string>(
    personalStyle.activeMood || 'romantic'
  );
  const activeMoodConfig: EmotionalMoodConfig = useMemo(() => {
    return EMOTIONAL_MOODS.find((m) => m.id === selectedMoodId) || EMOTIONAL_MOODS[1];
  }, [selectedMoodId]);

  // Wardrobe filter
  const [wardrobeFilter, setWardrobeFilter] = useState<'all' | 'favorite' | 'wishlist' | 'owned' | 'reconsider'>('all');

  // Handle Preset Garment Test
  const handleSelectPreset = (preset: typeof PRESET_GARMENTS[0]) => {
    setEvalInput({
      itemTitle: preset.title,
      category: preset.category,
      brand: preset.brand,
      price: preset.price,
      occasion: preset.occasion,
      mood: preset.mood,
      imageUrl: preset.imageUrl,
      fabricDescription: preset.fabricDescription,
      hasSizeChartOrMeasurements: preset.hasSizeChart,
      hasStretch: preset.hasStretch,
      userNotes: preset.shortNoteNl,
    });
  };

  // Run Evaluation
  const handleRunEvaluation = () => {
    if (!evalInput.itemTitle.trim()) return;
    setIsEvaluating(true);

    setTimeout(() => {
      const evaluation = evaluateGarment(
        evalInput,
        foundationStyling,
        latestMeasurement,
        learnedFeedbackList
      );

      setCurrentEvaluation(evaluation);
      setIsEvaluating(false);

      // Save to evaluations list
      const updatedList = [evaluation, ...evaluationsList.filter((e) => e.id !== evaluation.id)];
      onUpdateStyle({
        ...personalStyle,
        evaluations: updatedList,
      });

      if (onUpdateFoundationStyling) {
        onUpdateFoundationStyling({
          ...foundationStyling,
          recentEvaluations: updatedList.slice(0, 15),
        });
      }
    }, 350);
  };

  // User Reaction on Evaluation (❤️, 💕, 👍, 😐, 👎, ❌)
  const handleSetUserReaction = (
    reaction: 'love' | 'loveee' | 'like' | 'neutral' | 'nah' | 'dislike',
    reactionType?: 'mooi_bij_anderen' | 'zou_dragen' | 'voelt_als_mij' | 'gewenste_uitstraling'
  ) => {
    if (!currentEvaluation) return;

    const updatedEval: GarmentEvaluation = {
      ...currentEvaluation,
      userReaction: reaction,
      reactionType: reactionType || currentEvaluation.reactionType || 'voelt_als_mij',
    };

    setCurrentEvaluation(updatedEval);

    // Record into learned feedback
    const newFeedback: StyleLearnedFeedback = {
      id: `fb-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      itemTitle: currentEvaluation.itemTitle,
      category: currentEvaluation.category,
      rating: reaction === 'loveee' ? 'love' : reaction,
      reaction,
      reactionType: reactionType || updatedEval.reactionType,
      elementsLiked: reaction === 'love' || reaction === 'loveee' || reaction === 'like' ? [currentEvaluation.category] : [],
      elementsDisliked: reaction === 'nah' || reaction === 'dislike' ? [currentEvaluation.category] : [],
    };

    const updatedFeedbackList = [newFeedback, ...learnedFeedbackList];
    const updatedEvaluations = evaluationsList.map((e) => (e.id === updatedEval.id ? updatedEval : e));

    onUpdateStyle({
      ...personalStyle,
      evaluations: updatedEvaluations,
      learnedFeedback: updatedFeedbackList,
    });

    if (onUpdateFoundationStyling) {
      onUpdateFoundationStyling({
        ...foundationStyling,
        recentEvaluations: updatedEvaluations.slice(0, 15),
        learnedFeedback: updatedFeedbackList.slice(0, 30),
      });
    }
  };

  // Wardrobe Status
  const handleSetWardrobeStatus = (status: 'none' | 'favorite' | 'wishlist' | 'owned' | 'reconsider') => {
    if (!currentEvaluation) return;
    const updatedEval: GarmentEvaluation = {
      ...currentEvaluation,
      wardrobeStatus: status,
    };
    setCurrentEvaluation(updatedEval);

    const updatedEvaluations = evaluationsList.map((e) => (e.id === updatedEval.id ? updatedEval : e));
    onUpdateStyle({
      ...personalStyle,
      evaluations: updatedEvaluations,
    });
  };

  // Recalculate body shape action
  const handleRecalculateBodyShape = () => {
    if (!calculatedShape.shapeCode) return;
    onUpdateStyle({
      ...personalStyle,
      bodyShape: calculatedShape.shapeCode,
      bodyDivergenceDismissed: false,
    });
    setRecalculatedNotice(true);
  };

  const handleKeepCurrentBodyShape = () => {
    setDivergenceDismissed(true);
    onUpdateStyle({
      ...personalStyle,
      bodyDivergenceDismissed: true,
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* ============================================================ */}
      {/* 1. HEADER & SECTION TABS                                      */}
      {/* ============================================================ */}
      <div className="rounded-3xl border border-[#E3D9C9] bg-[#FAF8F3] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#EBE3D5]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-medium bg-[#EFE8DC] text-[#78664D]">
                Privé Sanctuary
              </span>
              <span className="w-1 h-1 rounded-full bg-[#C5A880]" />
              <span className="text-[11px] text-[#7A7167] font-serif italic">
                Personal Styling 2.0
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#2C2825] font-normal tracking-tight">
              {isNl ? 'Personal Styling & Esthetisch Kompas' : 'Personal Styling & Aesthetic Compass'}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7167] font-light max-w-2xl leading-relaxed">
              {isNl
                ? 'Kleding als visuele architectuur en soevereine zelfexpressie. Analyseert silhouet, tailleplaatsing, kleurharmonie en aanwezigheid voor jouw 1.57m proporties.'
                : 'Clothing as visual architecture and sovereign presence. Tailored to your 1.57m proportions, waist definition, and personal Style DNA.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[#E5DAC8] bg-[#F4EFE6] px-4 py-2.5 text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#8C7654] block font-medium">
                {isNl ? 'Lichaamsarchitectuur' : 'Body Architecture'}
              </span>
              <span className="text-xs font-serif font-medium text-[#2C2825]">
                {foundationStyling.silhouetteLabel || 'Waist-Defined Silhouette'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2 pt-5">
          <button
            type="button"
            onClick={() => setActiveSection('evaluator')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
              activeSection === 'evaluator'
                ? 'bg-[#2C2825] text-[#FAF8F3] shadow-xs'
                : 'bg-[#F2ECE0] text-[#5C5449] hover:bg-[#EBE2D3]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{isNl ? 'Past dit bij mij?' : 'Does this fit me?'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('mood')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
              activeSection === 'mood'
                ? 'bg-[#2C2825] text-[#FAF8F3] shadow-xs'
                : 'bg-[#F2ECE0] text-[#5C5449] hover:bg-[#EBE2D3]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{isNl ? 'Emotional Dressing (Stemming)' : 'Emotional Dressing'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('architecture')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
              activeSection === 'architecture'
                ? 'bg-[#2C2825] text-[#FAF8F3] shadow-xs'
                : 'bg-[#F2ECE0] text-[#5C5449] hover:bg-[#EBE2D3]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{isNl ? 'Lichaamsarchitectuur & Metingen' : 'Body Architecture'}</span>
            {hasBodyShapeDivergence && (
              <span className="w-2 h-2 rounded-full bg-[#B85D38] animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('dna')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
              activeSection === 'dna'
                ? 'bg-[#2C2825] text-[#FAF8F3] shadow-xs'
                : 'bg-[#F2ECE0] text-[#5C5449] hover:bg-[#EBE2D3]'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{isNl ? 'Stijl DNA & Kleurenpalet' : 'Style DNA & Palette'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('wardrobe')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
              activeSection === 'wardrobe'
                ? 'bg-[#2C2825] text-[#FAF8F3] shadow-xs'
                : 'bg-[#F2ECE0] text-[#5C5449] hover:bg-[#EBE2D3]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{isNl ? 'Geleerde Voorkeuren & Kledingkast' : 'Learned & Wardrobe'}</span>
            {evaluationsList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#E5DAC8] text-[10px] text-[#4A4237]">
                {evaluationsList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. BODY MEASUREMENTS DIVERGENCE PROMPT (Prompt 9 requirement)  */}
      {/* ============================================================ */}
      {hasBodyShapeDivergence && (
        <div className="rounded-2xl border border-[#D9C8B2] bg-[#FAF4EA] p-5 sm:p-6 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#A85A3C] shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h3 className="font-serif text-base text-[#2C2825] font-normal">
                {isNl
                  ? 'Actuele metingen en stijlsilhouet'
                  : 'Current measurements and silhouette profile'}
              </h3>
              <p className="text-xs text-[#5C5449] leading-relaxed">
                “Ik zie dat je huidige metingen niet meer volledig overeenkomen met je opgeslagen lichaamsvormprofiel. Wil je je stylingprofiel opnieuw laten berekenen?”
              </p>
              <p className="text-[11px] text-[#8C8174] italic">
                {isNl
                  ? 'Je Stijl-DNA en esthetische kern blijven te allen tijde bewaard; alleen de dynamische omtrekmaten worden geactualiseerd.'
                  : 'Your core Style DNA is never overwritten; only measurement-driven proportion advice updates.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 sm:pl-8">
            <button
              type="button"
              onClick={handleRecalculateBodyShape}
              className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D38] transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{isNl ? 'Opnieuw berekenen' : 'Recalculate'}</span>
            </button>
            <button
              type="button"
              onClick={handleKeepCurrentBodyShape}
              className="px-4 py-2 rounded-xl bg-[#EFE8DC] text-[#5C5449] text-xs font-medium hover:bg-[#E5DAC8] transition-all"
            >
              <span>{isNl ? 'Behouden' : 'Keep current profile'}</span>
            </button>
          </div>
        </div>
      )}

      {recalculatedNotice && (
        <div className="rounded-xl border border-[#C5D6BF] bg-[#F2F7F0] p-4 flex items-center gap-3 text-xs text-[#35522F]">
          <CheckCircle2 className="w-4 h-4 text-[#4D7C43] shrink-0" />
          <span>
            {isNl
              ? 'Stylingprofiel succesvol gesynchroniseerd met je actuele lichaamsmetingen uit Gezondheid & Voortgang.'
              : 'Styling profile successfully synchronized with your latest health measurements.'}
          </span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. SECTION: "PAST DIT BIJ MIJ?" (Hero Feature)                */}
      {/* ============================================================ */}
      {activeSection === 'evaluator' && (
        <div className="space-y-8">
          {/* Quick Preset Selector */}
          <div className="rounded-3xl border border-[#E3D9C9] bg-[#FAF8F3] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg text-[#2C2825]">
                  {isNl ? 'Snel testen met voorbeeldkledingstukken' : 'Quick test with curated pieces'}
                </h2>
                <p className="text-xs text-[#7A7167]">
                  {isNl
                    ? 'Kies een kledingstuk om direct te zien hoe het match-algoritme de 7 dimensies en pasvormzekerheid berekent.'
                    : 'Select a garment to instantly preview how the evaluation engine scores style, proportions, and fit confidence.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {PRESET_GARMENTS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    evalInput.itemTitle === preset.title
                      ? 'border-[#8C7654] bg-[#F4EFE6] ring-1 ring-[#8C7654]'
                      : 'border-[#EAE2D5] bg-[#FFFFFF] hover:border-[#D5C7B3]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#8C7654] font-medium uppercase tracking-wider">
                        {preset.category}
                      </span>
                      <span className="font-semibold text-[#2C2825]">{preset.price}</span>
                    </div>
                    <div className="text-xs font-serif font-medium text-[#2C2825] line-clamp-1">
                      {preset.title}
                    </div>
                    <p className="text-[11px] text-[#7A7167] font-light line-clamp-2">
                      {preset.shortNoteNl}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-[10px] text-[#8C8377]">
                    <span>{preset.brand}</span>
                    <span className="text-[#8C7654] font-medium">Selecteer →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload & Garment Input Form */}
          <div className="rounded-3xl border border-[#E3D9C9] bg-[#FAF8F3] p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium block mb-1">
                  {isNl ? 'Kleding Evaluatie Studio' : 'Clothing Evaluation Studio'}
                </span>
                <h2 className="font-serif text-xl sm:text-2xl text-[#2C2825]">
                  “Past dit bij mij?”
                </h2>
                <p className="text-xs sm:text-sm text-[#7A7167] mt-1 font-light">
                  {isNl
                    ? 'Upload een screenshot, productfoto of kledingstuk en laat Alchemy analyseren of het past bij jouw Proporties, Stijl-DNA en gewenste uitstraling.'
                    : 'Upload a product screenshot or garment photo to analyze fit, Style DNA, and presence.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Image Input / Preview */}
              <div className="md:col-span-4 space-y-3">
                <label className="text-xs font-medium text-[#2C2825] block">
                  {isNl ? 'Kledingfoto of screenshot' : 'Garment Photo / Screenshot'}
                </label>
                <div className="aspect-3/4 rounded-2xl border-2 border-dashed border-[#DCD3C4] bg-[#FFFFFF] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group">
                  {evalInput.imageUrl ? (
                    <div className="w-full h-full relative">
                      <img
                        src={evalInput.imageUrl}
                        alt={evalInput.itemTitle || 'Kledingstuk'}
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setEvalInput({ ...evalInput, imageUrl: '' })}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white text-xs hover:bg-black/80 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 p-2">
                      <div className="w-10 h-10 rounded-full bg-[#F4EFE6] mx-auto flex items-center justify-center text-[#8C7654]">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-[#5C5449] font-medium">
                        {isNl ? 'Sleep een screenshot hierheen' : 'Drop an image or screenshot'}
                      </p>
                      <p className="text-[10px] text-[#8C8377]">
                        {isNl ? 'of plak hieronder een afbeeldingslink' : 'or enter image URL below'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="url"
                    placeholder={isNl ? 'Afbeeldingslink (URL)...' : 'Paste image URL...'}
                    value={evalInput.imageUrl || ''}
                    onChange={(e) => setEvalInput({ ...evalInput, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] placeholder-[#A0988B]"
                  />
                </div>
              </div>

              {/* Garment Details Fields */}
              <div className="md:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#2C2825] block mb-1">
                      {isNl ? 'Titel / Naam van het item' : 'Garment Name / Title'} *
                    </label>
                    <input
                      type="text"
                      placeholder={isNl ? 'bijv. Bohemian Maxi Wikkeljurk' : 'e.g. Bohemian Maxi Wrap Dress'}
                      value={evalInput.itemTitle}
                      onChange={(e) => setEvalInput({ ...evalInput, itemTitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2825] block mb-1">
                      {isNl ? 'Categorie' : 'Category'}
                    </label>
                    <select
                      value={evalInput.category}
                      onChange={(e) => setEvalInput({ ...evalInput, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    >
                      <option value="Jurken">Jurken (Maxi, Midi, Wikkel)</option>
                      <option value="Tops & Blouses">Tops & Blouses (Kant, Open hals, Linnen)</option>
                      <option value="Broeken & Pantalons">Broeken & Pantalons (High-waist, Plooi)</option>
                      <option value="Rokken">Rokken (Midi, Satijn, Wikkel)</option>
                      <option value="Jasjes & Blazers">Jasjes & Blazers (Getailleerd, Leer, Suède)</option>
                      <option value="Schoenen & Laarzen">Schoenen & Laarzen (Western boots, Loafers)</option>
                      <option value="Accessoires & Sieraden">Accessoires (Tailleriemen, Hoeden, Gouden colliers)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#2C2825] block mb-1">
                      {isNl ? 'Merk / Winkel' : 'Brand'}
                    </label>
                    <input
                      type="text"
                      placeholder="bijv. Sézane, Massimo Dutti"
                      value={evalInput.brand || ''}
                      onChange={(e) => setEvalInput({ ...evalInput, brand: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2825] block mb-1">
                      {isNl ? 'Gelegenheid (Optioneel)' : 'Occasion'}
                    </label>
                    <select
                      value={evalInput.occasion || 'general'}
                      onChange={(e) => setEvalInput({ ...evalInput, occasion: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    >
                      {STYLING_OCCASIONS.map((occ) => (
                        <option key={occ.id} value={occ.id}>
                          {occ.nameNl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2825] block mb-1">
                      {isNl ? 'Gewenste Stemming' : 'Desired Mood'}
                    </label>
                    <select
                      value={evalInput.mood || 'romantic'}
                      onChange={(e) => setEvalInput({ ...evalInput, mood: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    >
                      {EMOTIONAL_MOODS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nameNl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stof, Rekbaarheid & Maattabel (Crucial for Fit Confidence distinction) */}
                <div className="rounded-2xl border border-[#EBE3D5] bg-[#F7F4EC] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#2C2825] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#8C7654]" />
                      {isNl ? 'Materiaalinformatie & Pasvormgegevens' : 'Fabric & Sizing Data'}
                    </span>
                    <span className="text-[11px] text-[#8C8174]">
                      {isNl ? 'Verhoogt de Pasvormzekerheid' : 'Increases Fit Confidence'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder={isNl ? 'Stof (bijv. 100% linnen, viscose blend, zijde)' : 'Fabric (e.g. linen, silk)'}
                        value={evalInput.fabricDescription || ''}
                        onChange={(e) => setEvalInput({ ...evalInput, fabricDescription: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[#4A4237]">
                        <input
                          type="checkbox"
                          checked={evalInput.hasSizeChartOrMeasurements || false}
                          onChange={(e) =>
                            setEvalInput({ ...evalInput, hasSizeChartOrMeasurements: e.target.checked })
                          }
                          className="rounded border-[#C5A880] text-[#2C2825] focus:ring-[#C5A880]"
                        />
                        <span>{isNl ? 'Maattabel / maten beschikbaar' : 'Size chart available'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleRunEvaluation}
                    disabled={!evalInput.itemTitle.trim() || isEvaluating}
                    className="px-6 py-3 rounded-2xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D38] transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#C5A880]" />
                        <span>{isNl ? 'Analyseren tegen Stijl DNA...' : 'Analyzing against Style DNA...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#C5A880]" />
                        <span>{isNl ? 'Beoordeel dit kledingstuk' : 'Analyze this Garment'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation Result Card */}
          {currentEvaluation && (
            <div className="rounded-3xl border border-[#D5C7B3] bg-[#FFFFFF] p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#F0E9DF]">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-[#8C7654] uppercase tracking-wider font-medium mb-1">
                    <span>{currentEvaluation.category}</span>
                    <span>•</span>
                    <span>{currentEvaluation.date}</span>
                    {currentEvaluation.occasion && (
                      <>
                        <span>•</span>
                        <span>{currentEvaluation.occasion}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-serif text-2xl text-[#2C2825]">
                    {currentEvaluation.itemTitle}
                  </h3>
                  {currentEvaluation.brand && (
                    <p className="text-xs text-[#7A7167] font-light mt-0.5">
                      {currentEvaluation.brand} {currentEvaluation.price && `— ${currentEvaluation.price}`}
                    </p>
                  )}
                </div>

                {/* Main Verdict Badge */}
                <div className="text-right flex sm:flex-col items-end gap-2 sm:gap-0">
                  <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                    Overall Match
                  </span>
                  <div className="font-serif text-3xl font-normal text-[#2C2825]">
                    {currentEvaluation.overallMatchPercent}%
                  </div>
                </div>
              </div>

              {/* CRITICAL PROMPT 9 REQUIREMENT: STYLE MATCH VS FIT CONFIDENCE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-medium text-[#2C2825]">
                      STYLE MATCH
                    </span>
                    <span className="font-serif text-xl font-normal text-[#2C2825]">
                      {currentEvaluation.styleMatchPercent}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A7167] leading-relaxed">
                    {isNl
                      ? 'Esthetische harmonie met jouw Stijl DNA (boho, romantisch, donkere accenten, taillefocus en aanwezigheid).'
                      : 'Aesthetic harmony with your Style DNA and silhouette preferences.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E0D7C9] bg-[#F7F4EE] p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-serif font-medium text-[#2C2825]">
                        PASVORMZEKERHEID (FIT CONFIDENCE)
                      </span>
                      <Info className="w-3.5 h-3.5 text-[#8C7654]" />
                    </div>
                    <span className="font-serif text-xl font-normal text-[#8C7654]">
                      {currentEvaluation.fitConfidencePercent}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A7167] leading-relaxed">
                    {currentEvaluation.fitConfidenceReason ||
                      'Fysieke pasvormzekerheid is een schatting. Een hoge stijlmatch betekent niet automatisch dat een specifiek confectiemaatstuk fysiek vlekkeloos zit.'}
                  </p>
                </div>
              </div>

              {/* 7 Detailed Match Dimension Scores */}
              <div className="rounded-2xl border border-[#EDE5D8] bg-[#FAF8F4] p-5 space-y-3">
                <h4 className="text-xs font-medium text-[#2C2825] uppercase tracking-wider">
                  {isNl ? 'Evaluatie per stijldimensie' : 'Detailed Dimension Match'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
                  <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#EAE2D5] text-center">
                    <span className="text-[10px] text-[#7A7167] block">Silhouet</span>
                    <span className="font-serif text-lg text-[#2C2825]">
                      {currentEvaluation.silhouetteMatchPercent}%
                    </span>
                  </div>
                  <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#EAE2D5] text-center">
                    <span className="text-[10px] text-[#7A7167] block">Kleur (Palette)</span>
                    <span className="font-serif text-lg text-[#2C2825]">
                      {currentEvaluation.colourMatchPercent}%
                    </span>
                  </div>
                  <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#EAE2D5] text-center">
                    <span className="text-[10px] text-[#7A7167] block">Details & Stof</span>
                    <span className="font-serif text-lg text-[#2C2825]">
                      {currentEvaluation.detailMatchPercent || 85}%
                    </span>
                  </div>
                  <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#EAE2D5] text-center">
                    <span className="text-[10px] text-[#7A7167] block">Stemming (Mood)</span>
                    <span className="font-serif text-lg text-[#2C2825]">
                      {currentEvaluation.moodMatchPercent || 88}%
                    </span>
                  </div>
                  <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#EAE2D5] text-center">
                    <span className="text-[10px] text-[#7A7167] block">Draagbaarheid</span>
                    <span className="font-serif text-lg text-[#2C2825]">
                      {currentEvaluation.practicalityPercent || 82}%
                    </span>
                  </div>
                  <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#EAE2D5] text-center">
                    <span className="text-[10px] text-[#7A7167] block">Overall</span>
                    <span className="font-serif text-lg text-[#2C2825] font-semibold">
                      {currentEvaluation.overallMatchPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* WHY Breakdown (✓ Pros, ~ Considerations, + Enhancements) */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-[#2C2825] uppercase tracking-wider">
                  WHY / WAAROM:
                </h4>
                <div className="space-y-2.5 text-xs text-[#4A4237]">
                  {currentEvaluation.pros?.map((pro, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-[#35522F] font-bold text-sm shrink-0">✓</span>
                      <span className="leading-relaxed">{pro}</span>
                    </div>
                  ))}

                  {currentEvaluation.considerations?.map((con, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-[#A85A3C] font-bold text-sm shrink-0">~</span>
                      <span className="leading-relaxed">{con}</span>
                    </div>
                  ))}

                  {currentEvaluation.enhancements?.map((enh, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-[#8C7654] font-bold text-sm shrink-0">+</span>
                      <span className="leading-relaxed font-medium">{enh}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONCLUSION CARD */}
              <div className="rounded-2xl border border-[#E0D4C2] bg-[#FAF6EE] p-5 space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  CONCLUSION / CONCLUSIE
                </span>
                <p className="text-sm font-serif italic text-[#2C2825] leading-relaxed">
                  “{currentEvaluation.conclusion || currentEvaluation.verdictNl}”
                </p>

                {currentEvaluation.alternatives && currentEvaluation.alternatives.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#EAE0D1] space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#8C7654] font-medium block">
                      {isNl ? 'Hoe aan te passen / Alternatieven:' : 'Alternatives & Styling Advice:'}
                    </span>
                    <ul className="text-xs text-[#5C5449] space-y-1 list-disc list-inside">
                      {currentEvaluation.alternatives.map((alt, idx) => (
                        <li key={idx}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* FEEDBACK & LEARNING: REACTION BUTTONS (Prompt 9 requirement) */}
              <div className="pt-4 border-t border-[#F0E9DF] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-[#2C2825] block">
                      {isNl ? 'Jouw reactie op dit item (Systeem leert hiervan):' : 'Your reaction (System learns from this):'}
                    </span>
                    <p className="text-[11px] text-[#7A7167]">
                      {isNl
                        ? 'Herhaalde reacties verfijnen toekomstige adviezen zonder je oorspronkelijke Stijl-DNA te overschrijven.'
                        : 'Repeated feedback refines recommendations while keeping your core Style DNA intact.'}
                    </p>
                  </div>

                  {/* Reaction Emojis */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Love"
                      onClick={() => handleSetUserReaction('love')}
                      className={`p-2 rounded-xl border text-sm transition-all ${
                        currentEvaluation.userReaction === 'love'
                          ? 'bg-[#F9EBEA] border-[#D98880] ring-1 ring-[#D98880]'
                          : 'bg-[#FAF8F4] border-[#E5DAC8] hover:bg-[#F2ECE0]'
                      }`}
                    >
                      ❤️
                    </button>
                    <button
                      type="button"
                      title="Loveee"
                      onClick={() => handleSetUserReaction('loveee')}
                      className={`p-2 rounded-xl border text-sm transition-all ${
                        currentEvaluation.userReaction === 'loveee'
                          ? 'bg-[#FCE4EC] border-[#F48FB1] ring-1 ring-[#F48FB1]'
                          : 'bg-[#FAF8F4] border-[#E5DAC8] hover:bg-[#F2ECE0]'
                      }`}
                    >
                      💕
                    </button>
                    <button
                      type="button"
                      title="Like"
                      onClick={() => handleSetUserReaction('like')}
                      className={`p-2 rounded-xl border text-sm transition-all ${
                        currentEvaluation.userReaction === 'like'
                          ? 'bg-[#E8F8F5] border-[#76D7C4] ring-1 ring-[#76D7C4]'
                          : 'bg-[#FAF8F4] border-[#E5DAC8] hover:bg-[#F2ECE0]'
                      }`}
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      title="Neutral"
                      onClick={() => handleSetUserReaction('neutral')}
                      className={`p-2 rounded-xl border text-sm transition-all ${
                        currentEvaluation.userReaction === 'neutral'
                          ? 'bg-[#FEF9E7] border-[#F9E79F] ring-1 ring-[#F9E79F]'
                          : 'bg-[#FAF8F4] border-[#E5DAC8] hover:bg-[#F2ECE0]'
                      }`}
                    >
                      😐
                    </button>
                    <button
                      type="button"
                      title="Nah"
                      onClick={() => handleSetUserReaction('nah')}
                      className={`p-2 rounded-xl border text-sm transition-all ${
                        currentEvaluation.userReaction === 'nah'
                          ? 'bg-[#FBEEE6] border-[#EDBB99] ring-1 ring-[#EDBB99]'
                          : 'bg-[#FAF8F4] border-[#E5DAC8] hover:bg-[#F2ECE0]'
                      }`}
                    >
                      👎
                    </button>
                    <button
                      type="button"
                      title="Strong Dislike"
                      onClick={() => handleSetUserReaction('dislike')}
                      className={`p-2 rounded-xl border text-sm transition-all ${
                        currentEvaluation.userReaction === 'dislike'
                          ? 'bg-[#FADBD8] border-[#E6B0AA] ring-1 ring-[#E6B0AA]'
                          : 'bg-[#FAF8F4] border-[#E5DAC8] hover:bg-[#F2ECE0]'
                      }`}
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {/* DISTINGUISH TYPES OF REACTION (Prompt 9 Requirement) */}
                <div className="rounded-xl border border-[#EDE5D8] bg-[#FAF8F3] p-3 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C7654] font-medium block">
                    {isNl ? 'Wat voor type reactie is dit?' : 'What type of reaction is this?'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'mooi_bij_anderen', label: 'A. Mooi bij anderen' },
                      { id: 'zou_dragen', label: 'B. Ik zou dit dragen' },
                      { id: 'voelt_als_mij', label: 'C. Dit voelt als mij' },
                      { id: 'gewenste_uitstraling', label: 'D. Gewenste uitstraling' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() =>
                          handleSetUserReaction(
                            currentEvaluation.userReaction || 'like',
                            type.id as any
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left truncate ${
                          currentEvaluation.reactionType === type.id
                            ? 'bg-[#2C2825] text-[#FAF8F3]'
                            : 'bg-[#FFFFFF] border border-[#DDD4C5] text-[#5C5449] hover:bg-[#F4EFE6]'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save to Wardrobe / Wishlist Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-[#7A7167]">
                    {isNl ? 'Opslaan in persoonlijke collectie:' : 'Save to personal collection:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetWardrobeStatus('favorite')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        currentEvaluation.wardrobeStatus === 'favorite'
                          ? 'bg-[#B85D38] text-white'
                          : 'bg-[#F2ECE0] text-[#5C5449] hover:bg-[#EBE2D3]'
                      }`}
                    >
                      ★ Favoriet
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetWardrobeStatus('wishlist')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        currentEvaluation.wardrobeStatus === 'wishlist'
                          ? 'bg-[#8C7654] text-white'
                          : 'bg-[#F2ECE0] text-[#5C5449] hover:bg-[#EBE2D3]'
                      }`}
                    >
                      Wil ik kopen
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetWardrobeStatus('owned')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        currentEvaluation.wardrobeStatus === 'owned'
                          ? 'bg-[#2C2825] text-white'
                          : 'bg-[#F2ECE0] text-[#5C5449] hover:bg-[#EBE2D3]'
                      }`}
                    >
                      Heb ik al
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetWardrobeStatus('reconsider')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        currentEvaluation.wardrobeStatus === 'reconsider'
                          ? 'bg-[#7A7167] text-white'
                          : 'bg-[#F2ECE0] text-[#5C5449] hover:bg-[#EBE2D3]'
                      }`}
                    >
                      Heroverwegen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. SECTION: EMOTIONAL DRESSING (“Welke versie van jezelf...”)  */}
      {/* ============================================================ */}
      {activeSection === 'mood' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E3D9C9] bg-[#FAF8F3] p-6 sm:p-8 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                Emotional Dressing
              </span>
              <h2 className="font-serif text-2xl text-[#2C2825]">
                “Welke versie van jezelf wil vandaag naar buiten?”
              </h2>
              <p className="text-xs sm:text-sm text-[#7A7167] font-light max-w-2xl leading-relaxed">
                {isNl
                  ? 'Kies je gevoelsstemming van de dag. Het stijlsysteem past de silhouetformule en textuurmix aan op jouw gekozen aanwezigheid.'
                  : 'Dress the feeling — then build the silhouette around it. Select your desired mood for today.'}
              </p>
            </div>

            {/* 12 Mood Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-3">
              {EMOTIONAL_MOODS.map((mood) => {
                const isSelected = selectedMoodId === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => {
                      setSelectedMoodId(mood.id);
                      onUpdateStyle({ ...personalStyle, activeMood: mood.id });
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825] shadow-xs'
                        : 'bg-[#FFFFFF] border-[#E5DAC8] text-[#4A4237] hover:border-[#C5A880] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <div className="text-xs font-serif font-medium">{mood.nameNl}</div>
                    <div
                      className={`text-[10px] mt-1 line-clamp-1 ${
                        isSelected ? 'text-[#DCD3C4]' : 'text-[#8C8377]'
                      }`}
                    >
                      {mood.taglineNl}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Mood Styling Blueprint */}
          <div className="rounded-3xl border border-[#DCD3C4] bg-[#FFFFFF] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E9DF]">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#8C7654] font-medium block">
                  {isNl ? 'Stemming Blauwdruk' : 'Mood Blueprint'}
                </span>
                <h3 className="font-serif text-2xl text-[#2C2825]">
                  {activeMoodConfig.nameNl}
                </h3>
              </div>
              <span className="font-serif italic text-xs text-[#8C7654]">
                “Dress the feeling — then build the silhouette around it.”
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#4A4237]">
              <div className="space-y-1.5">
                <span className="font-medium text-[#2C2825] uppercase tracking-wider text-[10px] block">
                  {isNl ? 'Stof & Textuur' : 'Fabric & Texture'}
                </span>
                <p className="leading-relaxed text-[#5C5449]">
                  {activeMoodConfig.descriptionNl}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-medium text-[#2C2825] uppercase tracking-wider text-[10px] block">
                  {isNl ? 'Styling Sleutel' : 'Styling Key'}
                </span>
                <p className="leading-relaxed text-[#5C5449]">
                  {activeMoodConfig.stylingKeyNl}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-medium text-[#2C2825] uppercase tracking-wider text-[10px] block">
                  {isNl ? 'Kleurenfocus' : 'Palette Focus'}
                </span>
                <p className="leading-relaxed text-[#5C5449]">
                  {activeMoodConfig.paletteFocusNl}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#EDE5D8] bg-[#FAF8F4] p-5 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-[#8C7654] font-medium block">
                {isNl ? 'Aanbevolen Signatuurstukken voor deze stemming:' : 'Signature Pieces for this mood:'}
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {activeMoodConfig.signaturePiecesNl.map((piece, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E0D7C9] text-xs text-[#2C2825] font-serif"
                  >
                    ✦ {piece}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. SECTION: LICHAAMSARCHITECTUUR & ACTUELE METINGEN           */}
      {/* ============================================================ */}
      {activeSection === 'architecture' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E3D9C9] bg-[#FAF8F3] p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                Visuele Lichaamsarchitectuur
              </span>
              <h2 className="font-serif text-2xl text-[#2C2825]">
                {foundationStyling.silhouetteLabel}
              </h2>
              <p className="text-xs sm:text-sm text-[#7A7167] font-light max-w-2xl leading-relaxed">
                {foundationStyling.antiRigidDisclaimer}
              </p>
            </div>

            {/* Current Measurements vs Stable Style DNA comparison */}
            <div className="rounded-2xl border border-[#E5DAC8] bg-[#FFFFFF] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2ECE0] pb-3">
                <span className="text-xs font-serif font-medium text-[#2C2825]">
                  {isNl ? 'Actuele Lichaamsgegevens uit Gezondheid & Voortgang' : 'Current Health Measurements'}
                </span>
                <span className="text-[11px] text-[#8C8377]">
                  {latestMeasurement?.date ? `Laatste meting: ${latestMeasurement.date}` : 'Nog geen meting vastgelegd'}
                </span>
              </div>

              {latestMeasurement ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D8]">
                    <span className="text-[10px] text-[#7A7167] block">Taille</span>
                    <span className="font-serif text-base text-[#2C2825] font-medium">
                      {latestMeasurement.waist ? `${latestMeasurement.waist} cm` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D8]">
                    <span className="text-[10px] text-[#7A7167] block">Heupen</span>
                    <span className="font-serif text-base text-[#2C2825] font-medium">
                      {latestMeasurement.hip ? `${latestMeasurement.hip} cm` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D8]">
                    <span className="text-[10px] text-[#7A7167] block">Borst</span>
                    <span className="font-serif text-base text-[#2C2825] font-medium">
                      {latestMeasurement.chest ? `${latestMeasurement.chest} cm` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D8]">
                    <span className="text-[10px] text-[#7A7167] block">Schouders</span>
                    <span className="font-serif text-base text-[#2C2825] font-medium">
                      {latestMeasurement.shoulder ? `${latestMeasurement.shoulder} cm` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D8]">
                    <span className="text-[10px] text-[#7A7167] block">Dij</span>
                    <span className="font-serif text-base text-[#2C2825] font-medium">
                      {latestMeasurement.thighLeft ? `${latestMeasurement.thighLeft} cm` : '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D8]">
                    <span className="text-[10px] text-[#7A7167] block">Lengte</span>
                    <span className="font-serif text-base text-[#2C2825] font-medium">1.57 m</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8C8377] italic">
                  {isNl
                    ? 'Nog geen metingen ingevoerd in Gezondheid. Het stylingprofiel hanteert Patricia’s opgeslagen proporties uit Foundation.'
                    : 'No measurements entered in Health yet.'}
                </p>
              )}
            </div>

            {/* Visual Architecture Principles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D5] space-y-2">
                <span className="text-xs font-serif font-medium text-[#2C2825] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C7654]" />
                  {isNl ? 'Natuurlijke Taille als Rustpunt' : 'Natural Waist as Focal Point'}
                </span>
                <p className="text-xs text-[#5C5449] leading-relaxed">
                  De taille is jouw sterkste stylingpunt. Het benadrukken van de taille betekent niet strak insnoeren, maar het visueel markeren van het smalste punt (bv. via een wikkeljurk, ceintuur of ingestopte top) om te voorkomen dat het middenrif het onbedoelde zwaartepunt wordt.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D5] space-y-2">
                <span className="text-xs font-serif font-medium text-[#2C2825] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C7654]" />
                  {isNl ? 'Verticale Lijnen bij 1.57 m' : 'Vertical Lines at 1.57m'}
                </span>
                <p className="text-xs text-[#5C5449] leading-relaxed">
                  Bij 1.57 m zijn kledinglengtes en visuele eindpunten cruciaal. Lange verticale lijnen (maxi-rokken, rechte broekspijpen met hoge taille) verlengen de beenlijn. Vermijd zoomranden die exact stoppen op het breedste heuppunt.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D5] space-y-2">
                <span className="text-xs font-serif font-medium text-[#2C2825] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C7654]" />
                  {isNl ? 'Doordachte Volumeplaatsing' : 'Deliberate Volume Placement'}
                </span>
                <p className="text-xs text-[#5C5449] leading-relaxed">
                  Oversized kleding is zelden een flatterende oplossing wanneer het vormeloos valt. Kies voor volume met intentie: een vloeiende wijde rok gecombineerd met een aansluitende top, of een getailleerde blazer over een rechte pantalon.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D5] space-y-2">
                <span className="text-xs font-serif font-medium text-[#2C2825] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C7654]" />
                  {isNl ? 'Aanwezigheid & Houding (Posture)' : 'Presence, not Performance'}
                </span>
                <p className="text-xs text-[#5C5449] leading-relaxed">
                  “PRESENCE, NOT PERFORMANCE.” Een meer geopende, soevereine natuurlijke houding verandert onmiddellijk de val van elke stof. Aandacht trekken vanuit rustige elegantie en aura, nooit vanuit schreeuwerigheid.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. SECTION: STIJL DNA & KLEURENPALET                          */}
      {/* ============================================================ */}
      {activeSection === 'dna' && (
        <div className="space-y-6">
          {/* Core DNA and Style Tensions */}
          <div className="rounded-3xl border border-[#E3D9C9] bg-[#FAF8F3] p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                Stijl DNA & Identiteit
              </span>
              <h2 className="font-serif text-2xl text-[#2C2825]">
                {isNl ? 'Patricia’s Esthetisch Paspoort' : 'Patricia’s Aesthetic Passport'}
              </h2>
              <p className="text-xs sm:text-sm text-[#7A7167] font-light max-w-2xl leading-relaxed">
                {foundationStyling.styleDNA.essence}
              </p>
            </div>

            {/* Core & Accents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#EAE2D5] bg-[#FFFFFF] p-5 space-y-2">
                <span className="text-xs font-serif font-medium text-[#2C2825] block">
                  Kern (Core):
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Feminine', 'Romantic', 'Bohemian'].map((w) => (
                    <span key={w} className="px-3 py-1 rounded-xl bg-[#FAF6EE] border border-[#E8DFD1] text-xs font-serif text-[#2C2825]">
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#EAE2D5] bg-[#FFFFFF] p-5 space-y-2">
                <span className="text-xs font-serif font-medium text-[#2C2825] block">
                  Sterke Accenten:
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Dark Feminine', 'Witchy', 'Western', 'Vintage', 'Rock / Grunge', 'Sensual & Elegant'].map((w) => (
                    <span key={w} className="px-3 py-1 rounded-xl bg-[#FAF6EE] border border-[#E8DFD1] text-xs font-serif text-[#2C2825]">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Style Tensions */}
            <div className="rounded-2xl border border-[#EDE5D8] bg-[#FAF8F4] p-5 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-[#8C7654] font-medium block">
                {isNl ? 'Karakteristieke Stijlspanningen (Style Tensions):' : 'Key Style Tensions:'}
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  'soft + strong',
                  'romantic + dark',
                  'natural + glamorous',
                  'feminine + wild',
                  'vintage + modern',
                  'sexy + mysterious',
                ].map((tension) => (
                  <span
                    key={tension}
                    className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E0D7C9] text-xs font-serif text-[#2C2825]"
                  >
                    ✦ {tension}
                  </span>
                ))}
              </div>
            </div>

            {/* Colour DNA Palette */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#2C2825] uppercase tracking-wider">
                  {foundationStyling.colourDNA.paletteName}
                </span>
                <span className="text-[11px] text-[#8C8377] italic">
                  {isNl ? 'Warm ivoor > hard wit • Zwart als sleutel' : 'Warm ivory > harsh white'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {foundationStyling.colourDNA.primaryColors.map((col, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-[#EAE2D5] bg-[#FFFFFF] space-y-2 text-center"
                  >
                    <div
                      className="w-full h-8 rounded-lg shadow-2xs border border-black/10"
                      style={{ backgroundColor: col.hex }}
                    />
                    <div>
                      <div className="text-[11px] font-medium text-[#2C2825] line-clamp-1">
                        {col.name}
                      </div>
                      <div className="text-[9px] text-[#8C8377] line-clamp-1">{col.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sensuality DNA */}
            <div className="rounded-2xl border border-[#E0D7C9] bg-[#FAF6EE] p-5 space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium block">
                SENSUALITY DNA
              </span>
              <p className="text-xs text-[#5C5449] leading-relaxed">
                {foundationStyling.sensualityDNA.philosophy}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {foundationStyling.sensualityDNA.preferredAccents.map((acc, i) => (
                  <span key={i} className="text-xs text-[#2C2825] font-serif bg-white/70 px-2.5 py-1 rounded-lg border border-[#EAE0D1]">
                    • {acc}
                  </span>
                ))}
              </div>
            </div>

            {/* Accessories & Hair */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D5] space-y-2">
                <span className="text-xs font-serif font-medium text-[#2C2825] block">
                  Accessoire DNA:
                </span>
                <p className="text-xs text-[#5C5449] leading-relaxed">
                  {foundationStyling.accessoryDNA.bagsFootwear}
                </p>
                <p className="text-xs text-[#8C7654] font-serif">
                  {foundationStyling.accessoryDNA.jewelleryStyle}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D5] space-y-2">
                <span className="text-xs font-serif font-medium text-[#2C2825] block">
                  Haar DNA:
                </span>
                <p className="text-xs text-[#5C5449] leading-relaxed">
                  {foundationStyling.hairDNA.aesthetic}
                </p>
                <p className="text-xs text-[#8C7654] font-serif">
                  {foundationStyling.hairDNA.notes}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. SECTION: GELEERDE VOORKEUREN & KLEDINGKAST (Wardrobe Ext)  */}
      {/* ============================================================ */}
      {activeSection === 'wardrobe' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E3D9C9] bg-[#FAF8F3] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                  {isNl ? 'Aangeleerde Voorkeuren & Collectie' : 'Learned Preferences & Wardrobe'}
                </span>
                <h2 className="font-serif text-2xl text-[#2C2825]">
                  {isNl ? 'Origineel Stijlprofiel + Aangeleerde Voorkeuren' : 'Original Style DNA + Learned Patterns'}
                </h2>
                <p className="text-xs sm:text-sm text-[#7A7167] font-light max-w-2xl leading-relaxed mt-1">
                  {isNl
                    ? 'Het systeem onthoudt jouw reacties op kledingstukken en herkent terugkerende voorkeuren zonder je authentieke Stijl DNA te herschrijven.'
                    : 'Your reactions teach the system what feels most authentic to you over time.'}
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#DDD4C5] p-1 rounded-xl text-xs">
                {(['all', 'favorite', 'wishlist', 'owned', 'reconsider'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setWardrobeFilter(filter)}
                    className={`px-3 py-1 rounded-lg transition-all capitalize ${
                      wardrobeFilter === filter
                        ? 'bg-[#2C2825] text-white font-medium'
                        : 'text-[#5C5449] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    {filter === 'all'
                      ? 'Alles'
                      : filter === 'favorite'
                      ? 'Favorieten'
                      : filter === 'wishlist'
                      ? 'Wishlist'
                      : filter === 'owned'
                      ? 'In Kast'
                      : 'Heroverwegen'}
                  </button>
                ))}
              </div>
            </div>

            {/* Learned Insights Summary */}
            {learnedFeedbackList.length > 0 ? (
              <div className="rounded-2xl border border-[#EDE5D8] bg-[#FAF8F4] p-5 space-y-3">
                <span className="text-xs font-semibold text-[#2C2825] uppercase tracking-wider">
                  {isNl ? 'Geleerde Patronen uit je Reacties:' : 'Learned Patterns:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#5C5449]">
                  <div className="p-3 bg-white rounded-xl border border-[#EAE2D5] space-y-1">
                    <span className="font-medium text-[#2C2825] flex items-center gap-1.5">
                      ❤️ {isNl ? 'Favoriete Elementen' : 'Top Elements'}
                    </span>
                    <p className="text-[11px] text-[#7A7167]">
                      Herhaaldelijk hoge waardering voor lange zwierige maxi- en midijurken, wikkelvormen en suède western boots.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#EAE2D5] space-y-1">
                    <span className="font-medium text-[#2C2825] flex items-center gap-1.5">
                      ❌ {isNl ? 'Vermeden Elementen' : 'Avoided Elements'}
                    </span>
                    <p className="text-[11px] text-[#7A7167]">
                      Vormeloze boxy snitten, hard optisch tl-wit en stugge synthetische stoffen worden consequent afgewezen.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EDE5D8] bg-[#FAF8F4] p-5 text-center text-xs text-[#8C8377] italic">
                {isNl
                  ? 'Nog geen reacties vastgelegd. Beoordeel items in “Past dit bij mij?” om geleerde voorkeuren op te bouwen.'
                  : 'No reactions logged yet.'}
              </div>
            )}

            {/* Wardrobe Items Gallery */}
            {evaluationsList.length > 0 ? (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {evaluationsList
                    .filter(
                      (item) =>
                        wardrobeFilter === 'all' || item.wardrobeStatus === wardrobeFilter
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[#EAE2D5] bg-[#FFFFFF] p-4 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          {item.imageUrl && (
                            <div className="aspect-4/3 rounded-xl overflow-hidden bg-[#FAF8F4]">
                              <img
                                src={item.imageUrl}
                                alt={item.itemTitle}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-[#8C7654]">
                            <span>{item.category}</span>
                            <span className="font-serif text-xs font-semibold text-[#2C2825]">
                              {item.overallMatchPercent}% Match
                            </span>
                          </div>

                          <h4 className="font-serif text-sm font-medium text-[#2C2825] line-clamp-1">
                            {item.itemTitle}
                          </h4>

                          <p className="text-[11px] text-[#7A7167] line-clamp-2 leading-relaxed font-light">
                            {item.conclusion || item.verdictNl}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#F2ECE0] flex items-center justify-between text-[10px]">
                          <span className="px-2 py-0.5 rounded-full bg-[#FAF6EE] border border-[#E8DFD1] text-[#4A4237]">
                            {item.wardrobeStatus === 'favorite'
                              ? '★ Favoriet'
                              : item.wardrobeStatus === 'wishlist'
                              ? 'Wishlist'
                              : item.wardrobeStatus === 'owned'
                              ? 'In Kast'
                              : item.wardrobeStatus === 'reconsider'
                              ? 'Heroverwegen'
                              : 'Geëvalueerd'}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setCurrentEvaluation(item);
                              setActiveSection('evaluator');
                            }}
                            className="text-[#8C7654] font-medium hover:underline flex items-center gap-1"
                          >
                            Bekijk details →
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#DCD3C4] bg-[#FFFFFF] p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF6EE] mx-auto flex items-center justify-center text-[#8C7654]">
                  <Shirt className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-base text-[#2C2825]">
                  {isNl ? 'Nog geen voorkeur opgeslagen.' : 'No items saved yet.'}
                </h3>
                <p className="text-xs text-[#7A7167] max-w-sm mx-auto">
                  {isNl
                    ? 'Gebruik “Past dit bij mij?” om kledingstukken te testen en bewaar ze in je kledingkast.'
                    : 'Test garments in “Does this fit me?” and save your favorites here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

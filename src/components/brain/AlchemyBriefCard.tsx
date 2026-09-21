import React, { useState } from 'react';
import { Sparkles, Calendar, CheckSquare, Utensils, Briefcase, HelpCircle, ChevronDown, ChevronUp, Moon, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { DailyAlchemyBrief, BrainSuggestion, BrainCapacityLevel, CheckInFeeling } from '../../types';

interface AlchemyBriefCardProps {
  brief: DailyAlchemyBrief;
  onAcceptSuggestionAction: (suggestion: BrainSuggestion, actionId: string) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onSaveEveningReflection?: (feeling: 'good' | 'okay' | 'heavy' | 'productive' | 'chaotic' | 'calm', note?: string) => void;
  onOpenTaskSplitter?: (taskId: string, taskTitle: string) => void;
  onOpenPlanner?: () => void;
  onOpenMeals?: () => void;
  onOpenProjects?: () => void;
  isNl?: boolean;
}

export const AlchemyBriefCard: React.FC<AlchemyBriefCardProps> = ({
  brief,
  onAcceptSuggestionAction,
  onDismissSuggestion,
  onSaveEveningReflection,
  onOpenTaskSplitter,
  onOpenPlanner,
  onOpenMeals,
  onOpenProjects,
  isNl = true,
}) => {
  const [showExplainability, setShowExplainability] = useState<string | null>(null);
  const [showEveningReflection, setShowEveningReflection] = useState(false);
  const [reflectionFeeling, setReflectionFeeling] = useState<'good' | 'okay' | 'heavy' | 'productive' | 'chaotic' | 'calm' | null>(null);
  const [reflectionNote, setReflectionNote] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Capacity visual styling
  const capacityConfig: Record<BrainCapacityLevel, { label: string; bg: string; text: string }> = {
    high: { label: isNl ? 'Ruime capaciteit' : 'High capacity', bg: 'bg-[#EBF2EB]', text: 'text-[#2D5A27]' },
    normal: { label: isNl ? 'Normale capaciteit' : 'Normal capacity', bg: 'bg-[#F4EFE6]', text: 'text-[#554C42]' },
    reduced: { label: isNl ? 'Beperkte ademruimte' : 'Reduced capacity', bg: 'bg-[#FDF3E7]', text: 'text-[#8A5817]' },
    minimal: { label: isNl ? 'Minimale belasting (Herstel)' : 'Minimal capacity (Recovery)', bg: 'bg-[#FBEAEB]', text: 'text-[#8A2424]' },
  };

  const currentCap = capacityConfig[brief.capacityLevel] || capacityConfig.normal;

  const handleActionClick = (suggestion: BrainSuggestion, actionId: string) => {
    const action = suggestion.actions?.find((a) => a.id === actionId);
    if (!action) return;

    if (action.actionType === 'split_task' && action.payload?.taskId && onOpenTaskSplitter) {
      onOpenTaskSplitter(action.payload.taskId, action.payload.taskTitle);
      onDismissSuggestion(suggestion.id);
      return;
    }

    if (action.actionType === 'plan_meal' && onOpenMeals) {
      onOpenMeals();
      return;
    }

    if (action.actionType === 'view_project' && onOpenProjects) {
      onOpenProjects();
      return;
    }

    if (action.actionType === 'dismiss') {
      onDismissSuggestion(suggestion.id);
      return;
    }

    onAcceptSuggestionAction(suggestion, actionId);
  };

  const handleSaveReflection = () => {
    if (!reflectionFeeling) return;
    if (onSaveEveningReflection) {
      onSaveEveningReflection(reflectionFeeling, reflectionNote.trim());
    }
    setReflectionSaved(true);
    setTimeout(() => {
      setShowEveningReflection(false);
      setReflectionSaved(false);
    }, 2000);
  };

  return (
    <div className="rounded-2xl bg-[#FFFFFF] border border-[#E8E1D4] shadow-xs overflow-hidden transition-all duration-300">
      {/* Top Banner: Greeting & Capacity */}
      <div className="p-4 sm:p-5 border-b border-[#F2ECE1] bg-gradient-to-b from-[#FAF8F5] to-[#FFFFFF] flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-[#8C7654]">
              <Sparkles className="w-3.5 h-3.5 text-[#8C7654]" />
              Alchemy Brief
            </span>
            <span className="text-xs text-[#9E958B]">•</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${currentCap.bg} ${currentCap.text}`}>
              {currentCap.label}
            </span>
          </div>
          <h2 className="font-serif text-lg sm:text-xl font-medium text-[#2C2825] tracking-tight">
            {brief.greeting}
          </h2>
        </div>

        {/* Capacity Reason Tooltip */}
        <div className="text-[11px] text-[#7A7267] max-w-xs text-right hidden md:block">
          {brief.capacityReason}
        </div>
      </div>

      {/* Main Body: Practical High-Signal Bullets */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {brief.bullets.map((bullet, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#EFE9DE] text-xs text-[#3E3832]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#8C7654] shrink-0" />
              <span className="leading-snug">{bullet}</span>
            </div>
          ))}
        </div>

        {/* Sovereign Focus Anchor */}
        <div className="px-4 py-3 rounded-xl bg-[#F6F3EC] border-l-3 border-[#8C7654] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8175]">
              {isNl ? 'Sober focus-anker' : 'Sovereign Focus'}
            </span>
            <p className="text-xs sm:text-sm font-serif italic text-[#2C2825]">
              "{brief.focusAnchor}"
            </p>
          </div>
          <ShieldCheck className="w-4 h-4 text-[#8C7654] shrink-0 opacity-60" />
        </div>

        {/* Active Proactive Suggestions (Max 2, Unobtrusive) */}
        {brief.suggestions && brief.suggestions.length > 0 && (
          <div className="pt-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8175]">
                {isNl ? 'Intelligente suggesties' : 'Intelligent Suggestions'}
              </span>
              <span className="text-[10px] text-[#9E958B]">
                Alchemy adviseert • Patz beslist
              </span>
            </div>

            <div className="space-y-2">
              {brief.suggestions.map((sug) => {
                const isExplaining = showExplainability === sug.id;
                return (
                  <div
                    key={sug.id}
                    className="p-3.5 rounded-xl border border-[#E8E1D4] bg-[#FFFFFF] hover:border-[#D5CCBE] transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#2C2825]">
                            {sug.title}
                          </span>
                          {sug.priority === 'high' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-[#FDF3E7] text-[#8A5817] font-semibold">
                              Aandacht
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B6358] leading-relaxed">
                          {sug.description}
                        </p>
                      </div>

                      <button
                        onClick={() => setShowExplainability(isExplaining ? null : sug.id)}
                        title={isNl ? 'Waarom stelt Alchemy dit voor?' : 'Why is this suggested?'}
                        className="text-[#9E958B] hover:text-[#554C42] p-1 rounded-md transition shrink-0 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Transparent Explainability Expansion */}
                    {isExplaining && (
                      <div className="px-3 py-2 rounded-lg bg-[#FAF8F4] border border-[#EAE3D6] text-[11px] text-[#554C42] space-y-1">
                        <span className="font-semibold text-[#8C7654]">
                          {isNl ? 'Toelichting (Transparante context):' : 'Transparent Rationale:'}
                        </span>
                        <p className="font-light leading-relaxed">{sug.reason}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#F5EFE6]">
                      {sug.actions?.map((act) => (
                        <button
                          key={act.id}
                          onClick={() => handleActionClick(sug, act.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                            act.isPrimary
                              ? 'bg-[#2C2825] text-[#FAF8F5] hover:bg-[#453E38]'
                              : 'bg-[#F4EFE6] text-[#554C42] hover:bg-[#EAE3D6]'
                          }`}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Evening Reflection Toggle */}
        <div className="pt-2 border-t border-[#F2ECE1]">
          <button
            onClick={() => setShowEveningReflection(!showEveningReflection)}
            className="w-full flex items-center justify-between text-xs text-[#7A7267] hover:text-[#2C2825] py-1.5 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-[#8C7654]" />
              {isNl ? 'Optionele avondreflectie & herinnering' : 'Evening reflection & memory capture'}
            </span>
            {showEveningReflection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showEveningReflection && (
            <div className="mt-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-medium text-[#2C2825]">
                  {isNl ? 'Hoe ging vandaag voor jou?' : 'How was your day?'}
                </span>
                <p className="text-[11px] text-[#7A7267]">
                  {isNl
                    ? 'Kies een feitelijke gemoedstoestand om je ritme te kalibreren.'
                    : 'Select a feeling to help calibrate your rhythm.'}
                </p>
              </div>

              {/* Emotion pills */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'good', label: 'Goed' },
                    { id: 'okay', label: 'Oké' },
                    { id: 'heavy', label: 'Zwaar' },
                    { id: 'productive', label: 'Productief' },
                    { id: 'chaotic', label: 'Chaotisch' },
                    { id: 'calm', label: 'Rustig' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setReflectionFeeling(item.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                      reflectionFeeling === item.id
                        ? 'bg-[#2C2825] text-[#FAF8F5]'
                        : 'bg-[#FFFFFF] border border-[#DCD5C9] text-[#554C42] hover:bg-[#F2ECE1]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Memory capture input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-medium text-[#554C42]">
                  {isNl ? 'Wil je iets onthouden voor morgen?' : 'Remember something for tomorrow?'}
                </label>
                <input
                  type="text"
                  value={reflectionNote}
                  onChange={(e) => setReflectionNote(e.target.value)}
                  placeholder={isNl ? 'bijv. "Morgen ochtendwandeling vóór 9:00" of "Taak X uitstellen"...' : 'e.g. "Morning walk before 9:00"...'}
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825] placeholder-[#9E958B] focus:outline-hidden focus:border-[#8C7654]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {reflectionSaved ? (
                  <span className="text-xs text-[#2D5A27] font-medium">
                    {isNl ? '✓ Reflectie en herinnering bewaard!' : '✓ Reflection saved!'}
                  </span>
                ) : (
                  <span />
                )}

                <button
                  onClick={handleSaveReflection}
                  disabled={!reflectionFeeling}
                  className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F5] text-xs font-medium hover:bg-[#453E38] disabled:opacity-40 transition cursor-pointer"
                >
                  {isNl ? 'Reflectie opslaan' : 'Save reflection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

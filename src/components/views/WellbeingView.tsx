import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  Activity,
  Utensils,
  ShoppingBag,
  Sparkles,
  Heart,
  ShieldCheck,
  Shield,
  Layers,
  Droplet,
} from 'lucide-react';
import {
  WellbeingState,
  PersonalStyleState,
  DailyCheckIn,
  CycleProfile,
  WaterTrackerState,
  NutritionState,
  FoundationFoodProfile,
  CalendarEvent,
  IntegrationsState,
} from '../../types';
import { WellbeingProgressSection } from '../wellbeing/WellbeingProgressSection';
import { WellbeingCheckInsSection } from '../wellbeing/WellbeingCheckInsSection';
import { WellbeingMovementSection } from '../wellbeing/WellbeingMovementSection';
import { WellbeingNutritionSection } from '../wellbeing/WellbeingNutritionSection';
import { WellbeingShoppingSection } from '../wellbeing/WellbeingShoppingSection';
import { WellbeingAiPromptsSection } from '../wellbeing/WellbeingAiPromptsSection';
import { WaterTrackerSection } from '../health/WaterTrackerSection';

export type WellbeingSubTab =
  | 'progress'
  | 'movement'
  | 'water'
  | 'checkins'
  | 'nutrition'
  | 'shopping'
  | 'ai';

interface WellbeingViewProps {
  wellbeing: WellbeingState;
  onUpdateWellbeing: (updater: (prev: WellbeingState) => WellbeingState) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
  personalStyle?: PersonalStyleState;
  onUpdateStyle?: (updater: (prev: PersonalStyleState) => PersonalStyleState) => void;
  dailyCheckIns?: DailyCheckIn[];
  onSaveDailyCheckIn?: (checkIn: DailyCheckIn) => void;
  cycleProfile?: CycleProfile;
  nutrition?: NutritionState;
  onUpdateNutrition?: (nutrition: NutritionState) => void;
  foodProfile?: FoundationFoodProfile;
  calendarEvents?: CalendarEvent[];
  integrations?: IntegrationsState;
}

export const WellbeingView: React.FC<WellbeingViewProps> = ({
  wellbeing,
  onUpdateWellbeing,
  onOpenAssistantWithPrompt,
  personalStyle,
  onUpdateStyle,
  dailyCheckIns,
  onSaveDailyCheckIn,
  cycleProfile,
  nutrition,
  onUpdateNutrition,
  foodProfile,
  calendarEvents = [],
  integrations,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<WellbeingSubTab>('progress');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckIn = dailyCheckIns?.find((c) => c.date === todayStr);

  const tabs: { id: WellbeingSubTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'progress', label: 'Progress & Metingen', icon: TrendingUp },
    { id: 'movement', label: 'Beweging', icon: Activity },
    { id: 'water', label: 'Water (750ml)', icon: Droplet },
    { id: 'checkins', label: 'Check-Ins', icon: Clock },
    { id: 'nutrition', label: 'Nutrition & Menu', icon: Utensils },
    { id: 'shopping', label: 'Shopping List', icon: ShoppingBag },
    { id: 'ai', label: 'Wellbeing AI', icon: Sparkles },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Masthead */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#8C8377] font-serif">
              Personal Sovereign Domain
            </span>
            <span className="w-1 h-1 rounded-full bg-[#C5A880]" />
            <span className="text-[11px] text-[#7A7167] font-light">Confidential</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#2C2825] tracking-tight">
            WELLBEING
          </h1>
          <p className="text-sm text-[#7A7167] mt-1 font-light max-w-2xl leading-relaxed">
            A calm, intelligent sanctuary for physical flow, unhurried nourishment, and longitudinal progress without guilt or punishment.
          </p>
        </div>

        {/* Quick status & AI access badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF8F3] border border-[#E8E2D6] text-xs text-[#5C5245]">
            {wellbeing.preferences.allowWellbeingDataToAI ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#7E694E]" />
                <span>AI Access: Authorized</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-[#8C8377]" />
                <span>AI Access: Quarantined</span>
              </>
            )}
          </div>

          <button
            onClick={() => onOpenAssistantWithPrompt('What movement and nourishment should I prioritize today?')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Ask Alchemy</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation bar */}
      <div className="flex items-center gap-1 border-b border-[#E8E2D6] overflow-x-auto no-scrollbar pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              id={`wellbeing-subtab-${tab.id}`}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all whitespace-nowrap cursor-pointer border-b-2 -mb-px ${
                isActive
                  ? 'border-[#2C2825] text-[#2C2825] font-semibold'
                  : 'border-transparent text-[#7A7167] hover:text-[#2C2825] hover:border-[#DED6C7]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7E694E]' : 'text-[#8C8377]'}`} />
              <span>{tab.label}</span>
              {tab.id === 'shopping' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EAE3D5] text-[#5C5245]">
                  {wellbeing.shoppingList.filter((i) => !i.inPantry).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="min-h-[500px]">
        {activeSubTab === 'progress' && (
          <WellbeingProgressSection
            wellbeing={wellbeing}
            onUpdateWellbeing={onUpdateWellbeing}
            onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
            personalStyle={personalStyle}
            onUpdateStyle={onUpdateStyle}
          />
        )}

        {activeSubTab === 'movement' && (
          <WellbeingMovementSection
            wellbeing={wellbeing}
            onUpdateWellbeing={onUpdateWellbeing}
            onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
            todayCheckIn={todayCheckIn}
            cycleProfile={cycleProfile}
            integrations={integrations}
          />
        )}

        {activeSubTab === 'water' && (
          <WaterTrackerSection
            waterTracker={wellbeing.waterTracker}
            onUpdateWaterTracker={(updater) =>
              onUpdateWellbeing((prev) => ({
                ...prev,
                waterTracker: updater(prev.waterTracker),
              }))
            }
            lang="nl"
          />
        )}

        {activeSubTab === 'checkins' && (
          <WellbeingCheckInsSection
            wellbeing={wellbeing}
            onUpdateWellbeing={onUpdateWellbeing}
            dailyCheckIns={dailyCheckIns}
            onSaveDailyCheckIn={onSaveDailyCheckIn}
            onNavigateToProgress={() => setActiveSubTab('progress')}
          />
        )}

        {activeSubTab === 'nutrition' && (
          <WellbeingNutritionSection
            wellbeing={wellbeing}
            onUpdateWellbeing={onUpdateWellbeing}
            onNavigateToShopping={() => setActiveSubTab('shopping')}
            onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
            nutrition={nutrition}
            onUpdateNutrition={onUpdateNutrition}
            foodProfile={foodProfile}
            calendarEvents={calendarEvents}
          />
        )}

        {activeSubTab === 'shopping' && (
          <WellbeingShoppingSection
            wellbeing={wellbeing}
            onUpdateWellbeing={onUpdateWellbeing}
            onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
          />
        )}

        {activeSubTab === 'ai' && (
          <WellbeingAiPromptsSection
            wellbeing={wellbeing}
            onUpdateWellbeing={onUpdateWellbeing}
            onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
          />
        )}
      </div>
    </div>
  );
};

import React from 'react';
import {
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Heart,
  Clock,
  Utensils,
  TrendingUp,
  Activity,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { WellbeingState } from '../../types';

interface WellbeingAiPromptsSectionProps {
  wellbeing: WellbeingState;
  onUpdateWellbeing: (updater: (prev: WellbeingState) => WellbeingState) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
}

export const WellbeingAiPromptsSection: React.FC<WellbeingAiPromptsSectionProps> = ({
  wellbeing,
  onUpdateWellbeing,
  onOpenAssistantWithPrompt,
}) => {
  const isAiPermitted = wellbeing.preferences.allowWellbeingDataToAI;

  const toggleAiPermission = () => {
    onUpdateWellbeing((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        allowWellbeingDataToAI: !prev.preferences.allowWellbeingDataToAI,
      },
    }));
  };

  const corePrompts = [
    {
      title: "What movement should I do today?",
      description: "Synthesizes your today's calendar commitments, reported energy, and cycle rhythm into an unhurried, grounded session.",
      icon: Activity,
      prompt: "What movement should I do today based on my schedule and energy?",
    },
    {
      title: "Give me a realistic plan for this week",
      description: "Designs a balanced weekly movement cadence that accounts for high-meeting days, preserving your evening buffers.",
      icon: Clock,
      prompt: "Give me a realistic movement plan for this week calibrated to my calendar load.",
    },
    {
      title: "Create next week's menu",
      description: "Generates an anti-inflammatory Mediterranean menu with quick weeknight meals and partner dinners.",
      icon: Utensils,
      prompt: "Create next week's menu with plant-forward Mediterranean nourishment and quick prep on workdays.",
    },
    {
      title: "I only have 15 minutes today",
      description: "Adapts today's movement into an express posture and joint decompression sequence without guilt or strain.",
      icon: Sliders,
      prompt: "I only have 15 minutes today. Give me an express grounding mobility flow.",
    },
    {
      title: "Adjust my menu because I'm eating alone tonight",
      description: "Swaps a multi-portion partner meal for an effortless, single-pan soothing dinner.",
      icon: Heart,
      prompt: "Adjust tonight's dinner because plans shifted and I am eating alone.",
    },
    {
      title: "Show me my progress over the last month",
      description: "Presents objective empirical facts and pattern observations, emphasizing consistency and nervous system stability.",
      icon: TrendingUp,
      prompt: "Show me my progress trajectory over the last month, clearly distinguishing recorded facts from interpretation.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C8377] font-serif">
            Intelligent Strategic Partner
          </span>
          <h2 className="text-2xl font-serif text-[#2C2825] mt-1">
            Wellbeing AI & Guided Actions
          </h2>
          <p className="text-xs text-[#7A7167] mt-1 max-w-2xl font-light leading-relaxed">
            Collaborate with Alchemy on physical flow, menu adaptation, and unhurried consistency under strict sovereign privacy boundaries.
          </p>
        </div>
      </div>

      {/* Privacy Firewall Sovereignty Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isAiPermitted
          ? 'bg-[#FAF8F3] border-[#DED6C7]'
          : 'bg-[#F9F7F3] border-[#E8E2D6]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              isAiPermitted ? 'bg-[#2C2825] text-[#F9F7F2]' : 'bg-[#EAE4D8] text-[#7E694E]'
            }`}>
              {isAiPermitted ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#2C2825]">
                  AI Access to Personal Wellbeing Data
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isAiPermitted
                    ? 'bg-[#EAE4D8] text-[#3E372E]'
                    : 'bg-[#E0D8CA] text-[#6A6054]'
                }`}>
                  {isAiPermitted ? 'Authorized for Synthesis' : 'Strictly Quarantined (Default)'}
                </span>
              </div>
              <p className="text-xs text-[#7A7167] font-light mt-1 max-w-xl leading-relaxed">
                {isAiPermitted
                  ? 'Alchemy AI is permitted to analyze your anonymized weight trends, movement logs, and menu preferences to generate personalized recommendations.'
                  : 'Personal body measurements, weight records, progress photos, and private reflections remain strictly quarantined on your local device. The AI only provides general assistance.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleAiPermission}
            id="toggle-wellbeing-ai-access-btn"
            className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              isAiPermitted
                ? 'bg-[#2C2825] text-[#FAF8F3] hover:bg-[#1A1816]'
                : 'bg-[#FAF8F3] border border-[#DED6C7] text-[#2C2825] hover:bg-[#F2ECE1]'
            }`}
          >
            {isAiPermitted ? 'Revoke AI Access' : 'Authorize AI Synthesis'}
          </button>
        </div>
      </div>

      {/* Suggested Prompt Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[#2C2825]">High-Leverage Wellbeing Inquiries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {corePrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => onOpenAssistantWithPrompt(item.prompt)}
                className="group p-5 rounded-2xl border border-[#E8E2D6] bg-[#FFFFFF] hover:border-[#2C2825] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F4] border border-[#EFE8DC] flex items-center justify-center text-[#7E694E] group-hover:bg-[#2C2825] group-hover:text-[#FAF8F3] transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A89E92] group-hover:text-[#2C2825] group-hover:translate-x-0.5 transition" />
                  </div>
                  <h4 className="text-sm font-serif font-semibold text-[#2C2825] mt-3">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#7A7167] mt-1 font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F4EFE6] flex items-center justify-between text-[11px] text-[#8C8377]">
                  <span className="italic font-light">"Ask Alchemy"</span>
                  <span className="font-medium text-[#7E694E] group-hover:underline">Launch prompt →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

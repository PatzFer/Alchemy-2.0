import React, { useState } from 'react';
import {
  User,
  Heart,
  Briefcase,
  Target,
  Activity,
  Utensils,
  Moon,
  Sparkles,
  Bell,
  Shield,
  Check,
  Plus,
  Trash2,
  Calendar,
  Save,
  Clock,
} from 'lucide-react';
import {
  FoundationData,
  Language,
  WorkContext,
  FoundationGoalItem,
} from '../../types';
import { ONBOARDING_STEPS } from '../../lib/foundationDefaults';

interface FoundationSettingsViewProps {
  foundation: FoundationData;
  onUpdateFoundation: (updated: FoundationData) => void;
}

export const FoundationSettingsView: React.FC<FoundationSettingsViewProps> = ({
  foundation,
  onUpdateFoundation,
}) => {
  const [data, setData] = useState<FoundationData>(foundation);
  const [activeTab, setActiveTab] = useState<string>('about-you');
  const [savedMessage, setSavedMessage] = useState<boolean>(false);

  const lang: Language = data.aboutYou.preferredLanguage || 'nl';
  const isNl = lang === 'nl';

  const handleSave = () => {
    const updated: FoundationData = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    onUpdateFoundation(updated);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE2D5]">
        <div>
          <h2 className="font-serif text-2xl text-[#2C2825]">
            {isNl ? 'Fundament van Alchemy' : 'Foundation of Alchemy'}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7167] mt-1">
            {isNl
              ? 'Beheer alle basisinstellingen rond jouw leven, werk, welzijn en doelen.'
              : 'Manage all core foundation preferences around your life, work, wellbeing, and goals.'}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shadow-xs"
        >
          {savedMessage ? <Check className="w-4 h-4 text-[#A3E635]" /> : <Save className="w-4 h-4" />}
          <span>{savedMessage ? (isNl ? 'Opgeslagen!' : 'Saved!') : (isNl ? 'Wijzigingen opslaan' : 'Save Changes')}</span>
        </button>
      </div>

      {/* Area Selector Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#EFE9DF]">
        {ONBOARDING_STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.slug)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === s.slug
                ? 'bg-[#2C2825] text-[#FAF8F3]'
                : 'bg-[#F4EFE6] text-[#6D6357] hover:bg-[#EAE3D6]'
            }`}
          >
            {isNl ? s.titleNl : s.titleEn}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-[#FFFFFF] border border-[#E5DFD3] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
        {/* 1. ABOUT YOU */}
        {activeTab === 'about-you' && (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'Over jou' : 'About You'}
            </h3>
            <div className="space-y-3 max-w-md">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Naam / Roepnaam' : 'Name'}
                </label>
                <input
                  type="text"
                  value={data.aboutYou.name}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      aboutYou: { ...p.aboutYou, name: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Geboortedatum' : 'Date of Birth'}
                </label>
                <input
                  type="date"
                  value={data.aboutYou.dateOfBirth || ''}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      aboutYou: { ...p.aboutYou, dateOfBirth: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Taal van de applicatie' : 'Language'}
                </label>
                <select
                  value={data.aboutYou.preferredLanguage}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      aboutYou: {
                        ...p.aboutYou,
                        preferredLanguage: e.target.value as Language,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] text-sm bg-white"
                >
                  <option value="nl">Nederlands (Standaard)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 2. YOUR LIFE */}
        {activeTab === 'your-life' && (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'Jouw levensritme & routines' : 'Your Life & Rhythm'}
            </h3>
            <div className="space-y-4 max-w-xl">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Dagritme & energieprofiel' : 'Daily Rhythm'}
                </label>
                <input
                  type="text"
                  value={data.yourLife.dailyRhythm}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      yourLife: { ...p.yourLife, dailyRhythm: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Persoonlijke routines' : 'Personal Routines'}
                </label>
                <textarea
                  rows={2}
                  value={data.yourLife.personalRoutines.join(', ')}
                  onChange={(e) =>
                    setData((p) => ({
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
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Beschermde rustperiodes' : 'Rest Periods'}
                </label>
                <input
                  type="text"
                  value={data.yourLife.planningRestPeriods.join(', ')}
                  onChange={(e) =>
                    setData((p) => ({
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
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. WORK */}
        {activeTab === 'work' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#2C2825]">
                {isNl ? 'Werkcontexten' : 'Work Contexts'}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setData((p) => ({
                    ...p,
                    work: {
                      workContexts: [
                        ...p.work.workContexts,
                        {
                          id: `wc-${Date.now()}`,
                          name: isNl ? 'Nieuwe werkcontext' : 'New Context',
                          workdays: ['Maandag', 'Dinsdag'],
                          startTime: '09:00',
                          endTime: '17:00',
                          location: 'Kantoor',
                        },
                      ],
                    },
                  }))
                }
                className="px-3 py-1.5 rounded-lg bg-[#EDE6D8] text-[#7E694E] hover:bg-[#E2D7C5] font-medium text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isNl ? '+ Context toevoegen' : '+ Add Context'}</span>
              </button>
            </div>

            {data.work.workContexts.map((ctx, idx) => (
              <div
                key={ctx.id}
                className="p-4 rounded-xl border border-[#E0D7C9] bg-[#FAF8F3] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={ctx.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setData((p) => ({
                        ...p,
                        work: {
                          workContexts: p.work.workContexts.map((c, i) =>
                            i === idx ? { ...c, name: val } : c
                          ),
                        },
                      }));
                    }}
                    className="font-medium text-sm text-[#2C2825] border-b border-[#D5CCBE] pb-0.5"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setData((p) => ({
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
                      {isNl ? 'Van' : 'From'}
                    </label>
                    <input
                      type="time"
                      value={ctx.startTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setData((p) => ({
                          ...p,
                          work: {
                            workContexts: p.work.workContexts.map((c, i) =>
                              i === idx ? { ...c, startTime: val } : c
                            ),
                          },
                        }));
                      }}
                      className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE] bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                      {isNl ? 'Tot' : 'To'}
                    </label>
                    <input
                      type="time"
                      value={ctx.endTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setData((p) => ({
                          ...p,
                          work: {
                            workContexts: p.work.workContexts.map((c, i) =>
                              i === idx ? { ...c, endTime: val } : c
                            ),
                          },
                        }));
                      }}
                      className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE] bg-white"
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
                        setData((p) => ({
                          ...p,
                          work: {
                            workContexts: p.work.workContexts.map((c, i) =>
                              i === idx ? { ...c, location: val } : c
                            ),
                          },
                        }));
                      }}
                      className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE] bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                      {isNl ? 'Reistijd (min)' : 'Commute'}
                    </label>
                    <input
                      type="number"
                      value={ctx.commuteMinutes || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setData((p) => ({
                          ...p,
                          work: {
                            workContexts: p.work.workContexts.map((c, i) =>
                              i === idx ? { ...c, commuteMinutes: val } : c
                            ),
                          },
                        }));
                      }}
                      className="w-full mt-0.5 p-1.5 rounded-lg border border-[#D5CCBE] bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. GOALS */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#2C2825]">
                {isNl ? 'Basisdoelen' : 'Foundation Goals'}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setData((p) => ({
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
                className="px-3 py-1.5 rounded-lg bg-[#EDE6D8] text-[#7E694E] hover:bg-[#E2D7C5] font-medium text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isNl ? '+ Doel toevoegen' : '+ Add Goal'}</span>
              </button>
            </div>

            {data.goals.goals.map((g, idx) => (
              <div
                key={g.id}
                className="p-3.5 rounded-xl border border-[#E0D7C9] bg-[#FAF8F3] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={g.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setData((p) => ({
                        ...p,
                        goals: {
                          goals: p.goals.goals.map((item, i) =>
                            i === idx ? { ...item, name: val } : item
                          ),
                        },
                      }));
                    }}
                    className="font-medium text-sm text-[#2C2825] border-b border-[#D5CCBE] pb-0.5 flex-1 mr-3"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setData((p) => ({
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
              </div>
            ))}
          </div>
        )}

        {/* 5. WELLBEING */}
        {activeTab === 'wellbeing' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'Welzijn & Metingen' : 'Wellbeing & Measurements'}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                  {isNl ? 'Gewicht (kg)' : 'Weight (kg)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={data.wellbeing.currentWeightKg || ''}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      wellbeing: {
                        ...p.wellbeing,
                        currentWeightKg: e.target.value ? Number(e.target.value) : undefined,
                      },
                    }))
                  }
                  className="w-full mt-0.5 p-2 rounded-lg border border-[#D5CCBE]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                  {isNl ? 'Taille (cm)' : 'Waist (cm)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={data.wellbeing.waistCm || ''}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      wellbeing: {
                        ...p.wellbeing,
                        waistCm: e.target.value ? Number(e.target.value) : undefined,
                      },
                    }))
                  }
                  className="w-full mt-0.5 p-2 rounded-lg border border-[#D5CCBE]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. NUTRITION */}
        {activeTab === 'nutrition' && (
          <div className="space-y-4 max-w-xl">
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'Voedingsvoorkeuren' : 'Nutrition Preferences'}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                  {isNl ? 'Geliefde gerechten & ingrediënten' : 'Enjoyed Foods'}
                </label>
                <input
                  type="text"
                  value={data.nutrition.enjoyedFoods.join(', ')}
                  onChange={(e) =>
                    setData((p) => ({
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
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. CYCLE */}
        {activeTab === 'cycle' && (
          <div className="space-y-4 max-w-md">
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'Cyclusconfiguratie' : 'Cycle Configuration'}
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={data.cycle.enabled}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    cycle: { ...p.cycle, enabled: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#7E694E]"
              />
              <span>{isNl ? 'Cyclus tracking geactiveerd' : 'Cycle tracking enabled'}</span>
            </label>

            {data.cycle.enabled && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                    {isNl ? 'Startdatum laatste menstruatie' : 'Last Period Start'}
                  </label>
                  <input
                    type="date"
                    value={data.cycle.lastPeriodStart || ''}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        cycle: { ...p.cycle, lastPeriodStart: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. MARILUNA */}
        {activeTab === 'mariluna' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'Mariluna Onderneming' : 'Mariluna Enterprise'}
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={data.mariluna.enabled}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    mariluna: { ...p.mariluna, enabled: e.target.checked },
                  }))
                }
                className="w-4 h-4 accent-[#7E694E]"
              />
              <span>{isNl ? 'Mariluna werkruimte actief' : 'Mariluna workspace active'}</span>
            </label>
          </div>
        )}

        {/* 9. YOUR AI */}
        {activeTab === 'your-ai' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'AI Communicatie & Proactiviteit' : 'AI Communication & Proactivity'}
            </h3>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-medium text-[#6D6357]">
                {isNl ? 'Communicatiestijl' : 'Style'}
              </label>
              <select
                value={data.ai.communicationStyle}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    ai: { ...p.ai, communicationStyle: e.target.value as any },
                  }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] text-sm bg-white"
              >
                <option value="short_direct">{isNl ? 'Kort & direct' : 'Short & direct'}</option>
                <option value="warm_supportive">{isNl ? 'Warm & ondersteunend' : 'Warm & supportive'}</option>
                <option value="strategic">{isNl ? 'Strategisch & bevragend' : 'Strategic'}</option>
                <option value="detailed">{isNl ? 'Gedetailleerd' : 'Detailed'}</option>
              </select>
            </div>
          </div>
        )}

        {/* 10. NOTIFICATIONS & PERMISSIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'Meldingen & Privacy' : 'Notifications & Privacy'}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                  {isNl ? 'Stilte start' : 'Quiet start'}
                </label>
                <input
                  type="time"
                  value={data.notifications.quietHoursStart}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      notifications: { ...p.notifications, quietHoursStart: e.target.value },
                    }))
                  }
                  className="w-full mt-0.5 p-2 rounded-lg border border-[#D5CCBE]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8C8377] uppercase font-medium">
                  {isNl ? 'Stilte einde' : 'Quiet end'}
                </label>
                <input
                  type="time"
                  value={data.notifications.quietHoursEnd}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      notifications: { ...p.notifications, quietHoursEnd: e.target.value },
                    }))
                  }
                  className="w-full mt-0.5 p-2 rounded-lg border border-[#D5CCBE]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

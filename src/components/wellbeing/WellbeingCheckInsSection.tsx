import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Bell,
  Heart,
  Settings,
  Plus,
  Moon,
  Sparkles,
  Shield,
  Coffee,
} from 'lucide-react';
import { WellbeingState, CheckInConfig } from '../../types';

interface WellbeingCheckInsSectionProps {
  wellbeing: WellbeingState;
  onUpdateWellbeing: (updater: (prev: WellbeingState) => WellbeingState) => void;
  onNavigateToProgress: () => void;
}

export const WellbeingCheckInsSection: React.FC<WellbeingCheckInsSectionProps> = ({
  wellbeing,
  onUpdateWellbeing,
  onNavigateToProgress,
}) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [activeCheckInModal, setActiveCheckInModal] = useState<CheckInConfig | null>(null);

  // Form for completing check-in
  const [checkInWeight, setCheckInWeight] = useState('');
  const [checkInWaist, setCheckInWaist] = useState('');
  const [checkInReflection, setCheckInReflection] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form for new check-in config
  const [newTitle, setNewTitle] = useState('');
  const [newFrequency, setNewFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [newDay, setNewDay] = useState<CheckInConfig['preferredDay']>('sunday');
  const [incWeight, setIncWeight] = useState(true);
  const [incMeasurements, setIncMeasurements] = useState(true);
  const [incComposition, setIncComposition] = useState(false);
  const [incPhotos, setIncPhotos] = useState(false);
  const [incReflection, setIncReflection] = useState(true);
  const [newPrompt, setNewPrompt] = useState('How did you care for your energy this week?');

  const toggleConfigActive = (id: string) => {
    onUpdateWellbeing((prev) => ({
      ...prev,
      checkInConfigs: prev.checkInConfigs.map((c) =>
        c.id === id ? { ...c, active: !c.active } : c
      ),
    }));
  };

  const handleAddConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Calculate sample next due date (e.g., in 7 days)
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const nextDue = d.toISOString().split('T')[0];

    const config: CheckInConfig = {
      id: `cic-${Date.now()}`,
      title: newTitle.trim(),
      frequency: newFrequency,
      preferredDay: newDay,
      includeWeight: incWeight,
      includeMeasurements: incMeasurements,
      includeComposition: incComposition,
      includePhotos: incPhotos,
      includeReflection: incReflection,
      reflectionPrompt: newPrompt.trim(),
      active: true,
      nextDueDate: nextDue,
    };

    onUpdateWellbeing((prev) => ({
      ...prev,
      checkInConfigs: [...prev.checkInConfigs, config],
    }));

    setNewTitle('');
    setIsConfiguring(false);
  };

  const handleCompleteCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckInModal) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const w = parseFloat(checkInWeight);
    const waist = parseFloat(checkInWaist);

    // If user provided weight or waist, add to progress logs
    if (!isNaN(w) || !isNaN(waist) || checkInReflection.trim()) {
      onUpdateWellbeing((prev) => ({
        ...prev,
        progressLogs: [
          ...prev.progressLogs,
          {
            id: `pl-${Date.now()}`,
            date: todayStr,
            weightKg: !isNaN(w) ? w : undefined,
            measurements: !isNaN(waist) ? { waistCm: waist } : undefined,
            feelingNotes: checkInReflection.trim() || undefined,
            recordedFact: `Completed recurring check-in (${activeCheckInModal.title}).`,
            aiInterpretation: 'Check-in completed unhurriedly. Routine maintains steady awareness.',
          },
        ],
        checkInConfigs: prev.checkInConfigs.map((c) =>
          c.id === activeCheckInModal.id
            ? {
                ...c,
                lastCompletedDate: todayStr,
                nextDueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              }
            : c
        ),
      }));
    }

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setActiveCheckInModal(null);
      setCheckInWeight('');
      setCheckInWaist('');
      setCheckInReflection('');
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C8377] font-serif">
            Gentle Somatic Cadence
          </span>
          <h2 className="text-2xl font-serif text-[#2C2825] mt-1">
            Recurring Reflection & Check-Ins
          </h2>
          <p className="text-xs text-[#7A7167] mt-1 max-w-2xl font-light leading-relaxed">
            Configure intentional moments of reflection. No guilt, no streak counters, no pressure. Your body rhythm is respected without urgency.
          </p>
        </div>

        <button
          onClick={() => setIsConfiguring(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF8F3] border border-[#DED6C7] text-[#2C2825] text-xs font-medium hover:bg-[#F2ECE1] transition cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Check-In Cadence</span>
        </button>
      </div>

      {/* Gentle Philosophy Banner */}
      <div className="bg-[#FAF8F3] border border-[#E8E2D6] rounded-2xl p-5 flex items-start gap-4 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-[#EFE9DD] flex items-center justify-center text-[#7E694E] shrink-0 mt-0.5">
          <Heart className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-serif text-[#2C2825] font-semibold text-sm">
            The Philosophy of Unhurried Check-Ins
          </h4>
          <p className="text-[#6A6054] font-light leading-relaxed">
            Traditional health apps rely on punitive streaks, red alert notifications, and urgency that spikes cortisol. In Alchemy, check-ins are peaceful invitations. If a week is crowded or you need complete quiet, simply pause or step back. Your baseline remains intact.
          </p>
        </div>
      </div>

      {/* Active Cadences List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#2C2825]">Configured Check-In Rhythms</h3>
          <span className="text-xs text-[#8C8377]">{wellbeing.checkInConfigs.length} cadences active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {wellbeing.checkInConfigs.map((config) => (
            <div
              key={config.id}
              className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-[#F2ECE1] text-[#6E6353]">
                    {config.frequency} • {config.preferredDay}s
                  </span>
                  <button
                    onClick={() => toggleConfigActive(config.id)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium transition cursor-pointer ${
                      config.active
                        ? 'bg-[#2C2825] text-[#FAF8F3]'
                        : 'bg-[#EDE6D8] text-[#7A7167]'
                    }`}
                  >
                    {config.active ? 'Active' : 'Paused'}
                  </button>
                </div>

                <h4 className="text-base font-serif text-[#2C2825] mt-2.5">{config.title}</h4>
                {config.reflectionPrompt && (
                  <p className="text-xs text-[#7A7167] mt-1.5 italic font-light">
                    "{config.reflectionPrompt}"
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-4 text-[11px] text-[#6A6054]">
                  {config.includeWeight && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F4] border border-[#E8E2D6]">
                      Weight
                    </span>
                  )}
                  {config.includeMeasurements && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F4] border border-[#E8E2D6]">
                      Measurements
                    </span>
                  )}
                  {config.includeComposition && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F4] border border-[#E8E2D6]">
                      Composition
                    </span>
                  )}
                  {config.includeReflection && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F4] border border-[#E8E2D6]">
                      Reflection
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#F2ECE1] flex items-center justify-between">
                <div className="text-[11px] text-[#8C8377]">
                  {config.lastCompletedDate ? (
                    <span>Last completed: {config.lastCompletedDate}</span>
                  ) : (
                    <span>Next scheduled: {config.nextDueDate}</span>
                  )}
                </div>
                <button
                  onClick={() => setActiveCheckInModal(config)}
                  className="px-3 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer"
                >
                  Open Check-In
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Check-In Modal */}
      {activeCheckInModal && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#8C8377]">Gentle Check-In</span>
                <h3 className="text-base font-serif text-[#2C2825]">{activeCheckInModal.title}</h3>
              </div>
              <button
                onClick={() => setActiveCheckInModal(null)}
                className="text-xs text-[#8C8377] hover:text-[#2C2825]"
              >
                ✕
              </button>
            </div>

            {isSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#7E694E] mx-auto" />
                <h4 className="font-serif text-[#2C2825] text-base">Check-In Saved Gracefully</h4>
                <p className="text-xs text-[#7A7167]">Thank you for honoring this moment of quiet awareness.</p>
              </div>
            ) : (
              <form onSubmit={handleCompleteCheckIn} className="space-y-4 text-xs">
                <p className="text-[#6A6054] font-light leading-relaxed">
                  Only fill what feels nourishing today. You can skip any metric without friction.
                </p>

                {activeCheckInModal.includeWeight && (
                  <div>
                    <label className="block text-[#6A6054] font-medium mb-1">Current Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={checkInWeight}
                      onChange={(e) => setCheckInWeight(e.target.value)}
                      placeholder="e.g. 60.8 (optional)"
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                    />
                  </div>
                )}

                {activeCheckInModal.includeMeasurements && (
                  <div>
                    <label className="block text-[#6A6054] font-medium mb-1">Waist Measurement (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={checkInWaist}
                      onChange={(e) => setCheckInWaist(e.target.value)}
                      placeholder="e.g. 67.0 (optional)"
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                    />
                  </div>
                )}

                {activeCheckInModal.includeReflection && (
                  <div>
                    <label className="block text-[#6A6054] font-medium mb-1">
                      {activeCheckInModal.reflectionPrompt || 'How did your energy and body feel?'}
                    </label>
                    <textarea
                      rows={3}
                      value={checkInReflection}
                      onChange={(e) => setCheckInReflection(e.target.value)}
                      placeholder="Notes on energy, ease, recovery, or grounding..."
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                    />
                  </div>
                )}

                <div className="pt-3 flex items-center justify-between border-t border-[#E8E2D6]">
                  <button
                    type="button"
                    onClick={() => setActiveCheckInModal(null)}
                    className="text-xs text-[#8C8377] hover:underline"
                  >
                    Postpone for later
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium hover:bg-[#1A1816]"
                  >
                    Save Check-In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Cadence Modal */}
      {isConfiguring && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h3 className="text-base font-serif text-[#2C2825]">Configure New Check-In</h3>
              <button
                onClick={() => setIsConfiguring(false)}
                className="text-xs text-[#8C8377] hover:text-[#2C2825]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddConfig} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Cadence Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Mid-Week Somatic Grounding"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6A6054] font-medium mb-1">Frequency</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every 2 Weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#6A6054] font-medium mb-1">Preferred Day</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  >
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-2">Metrics to Include</label>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#4A433A]">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={incWeight}
                      onChange={(e) => setIncWeight(e.target.checked)}
                      className="rounded text-[#7E694E]"
                    />
                    <span>Weight</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={incMeasurements}
                      onChange={(e) => setIncMeasurements(e.target.checked)}
                      className="rounded text-[#7E694E]"
                    />
                    <span>Measurements</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={incComposition}
                      onChange={(e) => setIncComposition(e.target.checked)}
                      className="rounded text-[#7E694E]"
                    />
                    <span>Composition</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={incReflection}
                      onChange={(e) => setIncReflection(e.target.checked)}
                      className="rounded text-[#7E694E]"
                    />
                    <span>Reflection</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Custom Reflection Prompt</label>
                <input
                  type="text"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="e.g. How rested is your nervous system?"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfiguring(false)}
                  className="px-4 py-2 rounded-xl border border-[#DED6C7] text-[#6A6054]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium"
                >
                  Create Rhythm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

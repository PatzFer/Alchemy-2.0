import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Plus,
  Calendar,
  CheckCircle2,
  Award,
  Sparkles,
  Info,
  ShieldCheck,
  Camera,
  Layers,
} from 'lucide-react';
import {
  WellbeingState,
  ProgressLog,
  WellbeingGoal,
  WellbeingMilestone,
} from '../../types';
import { interpretProgressTrends } from '../../lib/wellbeingData';

interface WellbeingProgressSectionProps {
  wellbeing: WellbeingState;
  onUpdateWellbeing: (updater: (prev: WellbeingState) => WellbeingState) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
}

export const WellbeingProgressSection: React.FC<WellbeingProgressSectionProps> = ({
  wellbeing,
  onUpdateWellbeing,
  onOpenAssistantWithPrompt,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'waist' | 'composition'>('weight');
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  // Form states for new log
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newWeight, setNewWeight] = useState<string>('60.8');
  const [newWaist, setNewWaist] = useState<string>('67.0');
  const [newHips, setNewHips] = useState<string>('95.8');
  const [newChest, setNewChest] = useState<string>('87.5');
  const [newBodyFat, setNewBodyFat] = useState<string>('');
  const [newMuscle, setNewMuscle] = useState<string>('');
  const [newFeeling, setNewFeeling] = useState<string>('Grounded, energized morning.');

  // Form states for new goal
  const [goalTitle, setGoalTitle] = useState('');
  const [goalMetric, setGoalMetric] = useState('Sessions / week');
  const [goalTarget, setGoalTarget] = useState('4 sessions');

  // Form states for new milestone
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneCategory, setMilestoneCategory] = useState<WellbeingMilestone['category']>('movement');

  const { recordedFacts, patterns, guidance } = interpretProgressTrends(wellbeing.progressLogs);

  // Format data for Recharts
  const chartData = [...wellbeing.progressLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => {
      const d = new Date(log.date);
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: formattedDate,
        fullDate: log.date,
        weight: log.weightKg || null,
        waist: log.measurements?.waistCm || null,
        hips: log.measurements?.hipsCm || null,
        bodyFat: log.composition?.bodyFatPercentage || null,
        muscleMass: log.composition?.muscleMassPercentage || null,
        fact: log.recordedFact || '',
        interpretation: log.aiInterpretation || '',
      };
    });

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const wNum = parseFloat(newWeight);
    const waistNum = parseFloat(newWaist);
    const hipsNum = parseFloat(newHips);
    const chestNum = parseFloat(newChest);
    const fatNum = newBodyFat ? parseFloat(newBodyFat) : undefined;
    const muscleNum = newMuscle ? parseFloat(newMuscle) : undefined;

    const newLog: ProgressLog = {
      id: `pl-${Date.now()}`,
      date: newDate,
      weightKg: isNaN(wNum) ? undefined : wNum,
      measurements: {
        waistCm: isNaN(waistNum) ? undefined : waistNum,
        hipsCm: isNaN(hipsNum) ? undefined : hipsNum,
        chestCm: isNaN(chestNum) ? undefined : chestNum,
      },
      composition: (fatNum || muscleNum) ? {
        bodyFatPercentage: fatNum,
        muscleMassPercentage: muscleNum,
      } : undefined,
      feelingNotes: newFeeling.trim() || undefined,
      recordedFact: `Measurement logged on ${newDate}: ${!isNaN(wNum) ? `${wNum} kg` : ''} ${!isNaN(waistNum) ? `| waist ${waistNum} cm` : ''}`.trim(),
      aiInterpretation: 'Fresh record logged. Patterns update as baseline observations mature.',
    };

    onUpdateWellbeing((prev) => ({
      ...prev,
      progressLogs: [...prev.progressLogs, newLog],
    }));

    setIsAddingLog(false);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const newG: WellbeingGoal = {
      id: `wg-${Date.now()}`,
      title: goalTitle.trim(),
      targetMetric: goalMetric.trim(),
      targetValue: goalTarget.trim(),
      currentValue: 'In progress',
      status: 'active',
    };
    onUpdateWellbeing((prev) => ({
      ...prev,
      goals: [...prev.goals, newG],
    }));
    setGoalTitle('');
    setIsAddingGoal(false);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    const newM: WellbeingMilestone = {
      id: `wm-${Date.now()}`,
      title: milestoneTitle.trim(),
      date: new Date().toISOString().split('T')[0],
      category: milestoneCategory,
      celebrated: true,
    };
    onUpdateWellbeing((prev) => ({
      ...prev,
      milestones: [newM, ...prev.milestones],
    }));
    setMilestoneTitle('');
    setIsAddingMilestone(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C8377] font-serif">
            Empirical Health & Quiet Trajectory
          </span>
          <h2 className="text-2xl font-serif text-[#2C2825] mt-1">
            Progress & Measured Trends
          </h2>
          <p className="text-xs text-[#7A7167] mt-1 max-w-2xl font-light leading-relaxed">
            Unhurried long-term observations over single fluctuations. Every measurement distinguishes objective empirical records from lifestyle pattern interpretation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingLog(true)}
            id="add-measurement-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Measurement</span>
          </button>
        </div>
      </div>

      {/* Main Trends Graph Card */}
      <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F7F4EE] border border-[#E8E2D6] flex items-center justify-center text-[#2C2825]">
              <TrendingUp className="w-4 h-4 text-[#8C8377]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#2C2825]">Longitudinal Trend Graph</h3>
              <p className="text-[11px] text-[#7A7167] font-light">
                Visualizing multi-week equilibrium across natural phases
              </p>
            </div>
          </div>

          {/* Metric Switcher */}
          <div className="flex items-center rounded-xl bg-[#F7F4EE] p-1 border border-[#E8E2D6]">
            <button
              onClick={() => setSelectedMetric('weight')}
              className={`px-3 py-1 text-xs rounded-lg transition cursor-pointer ${
                selectedMetric === 'weight'
                  ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                  : 'text-[#7A7167] hover:text-[#2C2825]'
              }`}
            >
              Weight (kg)
            </button>
            <button
              onClick={() => setSelectedMetric('waist')}
              className={`px-3 py-1 text-xs rounded-lg transition cursor-pointer ${
                selectedMetric === 'waist'
                  ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                  : 'text-[#7A7167] hover:text-[#2C2825]'
              }`}
            >
              Waist & Hips (cm)
            </button>
            <button
              onClick={() => setSelectedMetric('composition')}
              className={`px-3 py-1 text-xs rounded-lg transition cursor-pointer ${
                selectedMetric === 'composition'
                  ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                  : 'text-[#7A7167] hover:text-[#2C2825]'
              }`}
            >
              Composition (%)
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#A89E92"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E8E2D6' }}
              />
              <YAxis
                stroke="#A89E92"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E8E2D6' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#FAF8F3] border border-[#DED6C7] p-3 rounded-xl shadow-md text-xs space-y-1 max-w-xs">
                        <div className="font-serif text-[#2C2825] font-semibold">{data.fullDate}</div>
                        {selectedMetric === 'weight' && (
                          <div className="text-[#6B5E4F]">Weight: <span className="font-medium text-[#2C2825]">{data.weight} kg</span></div>
                        )}
                        {selectedMetric === 'waist' && (
                          <>
                            <div className="text-[#6B5E4F]">Waist: <span className="font-medium text-[#2C2825]">{data.waist} cm</span></div>
                            <div className="text-[#6B5E4F]">Hips: <span className="font-medium text-[#2C2825]">{data.hips} cm</span></div>
                          </>
                        )}
                        {selectedMetric === 'composition' && (
                          <>
                            <div className="text-[#6B5E4F]">Muscle Mass: <span className="font-medium text-[#2C2825]">{data.muscleMass || '—'}%</span></div>
                            <div className="text-[#6B5E4F]">Body Fat: <span className="font-medium text-[#2C2825]">{data.bodyFat || '—'}%</span></div>
                          </>
                        )}
                        {data.fact && (
                          <div className="text-[10px] text-[#8C8377] border-t border-[#E8E2D6] pt-1 mt-1">
                            <span className="font-semibold text-[#5A5043]">Fact:</span> {data.fact}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {selectedMetric === 'weight' && (
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Weight (kg)"
                  stroke="#7E694E"
                  strokeWidth={2.5}
                  dot={{ fill: '#FAF8F3', stroke: '#7E694E', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#2C2825' }}
                />
              )}
              {selectedMetric === 'waist' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="waist"
                    name="Waist (cm)"
                    stroke="#C5A880"
                    strokeWidth={2.5}
                    dot={{ fill: '#FAF8F3', stroke: '#C5A880', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hips"
                    name="Hips (cm)"
                    stroke="#8C8377"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#FAF8F3', stroke: '#8C8377', strokeWidth: 2, r: 3 }}
                  />
                </>
              )}
              {selectedMetric === 'composition' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="muscleMass"
                    name="Muscle Mass %"
                    stroke="#7E694E"
                    strokeWidth={2.5}
                    dot={{ fill: '#FAF8F3', stroke: '#7E694E', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bodyFat"
                    name="Body Fat %"
                    stroke="#D97706"
                    strokeWidth={2}
                    dot={{ fill: '#FAF8F3', stroke: '#D97706', strokeWidth: 2, r: 3 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-4 border-t border-[#F0EBE1] flex flex-wrap items-center justify-between gap-3 text-xs text-[#7A7167]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7E694E]"></span>
              Primary metric
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5A880]"></span>
              Circumference marker
            </span>
          </div>
          <span className="text-[11px] text-[#8C8377] font-light italic">
            Trend reflects natural 28-day somatic ebb and flow.
          </span>
        </div>
      </div>

      {/* Distinction of Recorded Facts vs AI Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Empirical Recorded Facts */}
        <div className="bg-[#FAF8F3] border border-[#E8E2D6] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#7E694E]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2C2825]">
              Empirical Recorded Facts
            </h3>
          </div>
          <p className="text-[11px] text-[#7A7167] font-light">
            Verified objective data points recorded directly from your inputs:
          </p>
          <ul className="space-y-2.5 text-xs text-[#3E3832]">
            {recordedFacts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7E694E] mt-1.5 shrink-0" />
                <span className="font-light">{fact}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* AI Pattern Observations & Interpretation */}
        <div className="bg-[#FAF8F3] border border-[#E8E2D6] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2C2825]">
              AI Pattern Interpretation
            </h3>
          </div>
          <p className="text-[11px] text-[#7A7167] font-light">
            Algorithmic lifestyle observations (clearly distinguished from facts):
          </p>
          <ul className="space-y-2.5 text-xs text-[#3E3832]">
            {patterns.map((pat, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] mt-1.5 shrink-0" />
                <span className="font-light">{pat}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 border-t border-[#E8E2D6] flex items-center justify-between text-[11px] text-[#8C8377]">
            <span>{guidance}</span>
          </div>
        </div>
      </div>

      {/* Goals & Milestones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Goals */}
        <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[#2C2825]">Personal Wellbeing Intentions</h3>
              <p className="text-[11px] text-[#7A7167] font-light">Rooted in stamina and vitality, not guilt</p>
            </div>
            <button
              onClick={() => setIsAddingGoal(true)}
              className="text-xs text-[#7E694E] hover:text-[#2C2825] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Goal
            </button>
          </div>

          <div className="space-y-3">
            {wellbeing.goals.map((g) => (
              <div
                key={g.id}
                className="p-3.5 rounded-xl border border-[#F0EBE1] bg-[#FAF8F4] flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-medium text-[#2C2825]">{g.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[#7A7167]">
                    <span>Target: {g.targetValue}</span>
                    <span>•</span>
                    <span className="text-[#8C8377]">{g.currentValue || 'Active'}</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#EDE6D8] text-[#5C5245]">
                  {g.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Milestones */}
        <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[#2C2825]">Quiet Milestones</h3>
              <p className="text-[11px] text-[#7A7167] font-light">Acknowledging consistency and physical sovereignty</p>
            </div>
            <button
              onClick={() => setIsAddingMilestone(true)}
              className="text-xs text-[#7E694E] hover:text-[#2C2825] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Log Milestone
            </button>
          </div>

          <div className="space-y-3">
            {wellbeing.milestones.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-[#F0EBE1] bg-[#FAF8F4] flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-[#EFE9DD] flex items-center justify-center text-[#7E694E] shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-[#2C2825]">{m.title}</h4>
                    <span className="text-[10px] text-[#8C8377]">{m.date}</span>
                  </div>
                  {m.description && (
                    <p className="text-[11px] text-[#7A7167] mt-0.5 font-light leading-relaxed">
                      {m.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Photos Reference Note */}
      <div className="p-4 rounded-2xl border border-[#E8E2D6] bg-[#FAF8F4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EAE3D5] flex items-center justify-center text-[#6A5F50]">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-medium text-[#2C2825]">Private Progress References</h4>
            <p className="text-[11px] text-[#7A7167] font-light">
              Visual posture checkpoints are stored encrypted in your local browser sandbox and quarantined from AI transmission.
            </p>
          </div>
        </div>
        <button
          onClick={() => onOpenAssistantWithPrompt('Show me my progress trajectory over the last month, focusing on consistency.')}
          className="text-xs text-[#7E694E] font-medium hover:underline shrink-0"
        >
          Ask Alchemy for Progress Summary →
        </button>
      </div>

      {/* Add Measurement Modal */}
      {isAddingLog && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h3 className="text-base font-serif text-[#2C2825]">Record New Measurement</h3>
              <button
                onClick={() => setIsAddingLog(false)}
                className="text-xs text-[#8C8377] hover:text-[#2C2825]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6A6054] font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  />
                </div>
                <div>
                  <label className="block text-[#6A6054] font-medium mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newWaist}
                    onChange={(e) => setNewWaist(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6A6054] font-medium mb-1">Hips (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newHips}
                    onChange={(e) => setNewHips(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  />
                </div>
                <div>
                  <label className="block text-[#6A6054] font-medium mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newChest}
                    onChange={(e) => setNewChest(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6A6054] font-medium mb-1">Muscle Mass % (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMuscle}
                    onChange={(e) => setNewMuscle(e.target.value)}
                    placeholder="e.g. 33.4"
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  />
                </div>
                <div>
                  <label className="block text-[#6A6054] font-medium mb-1">Body Fat % (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBodyFat}
                    onChange={(e) => setNewBodyFat(e.target.value)}
                    placeholder="e.g. 21.8"
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Subjective Feeling / Energy Notes</label>
                <input
                  type="text"
                  value={newFeeling}
                  onChange={(e) => setNewFeeling(e.target.value)}
                  placeholder="e.g. Grounded, light digestion, post-pilates tone"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E8E2D6]">
                <button
                  type="button"
                  onClick={() => setIsAddingLog(false)}
                  className="px-4 py-2 rounded-xl border border-[#DED6C7] text-[#6A6054] hover:bg-[#F2ECE1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium hover:bg-[#1A1816]"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddingGoal && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-serif text-[#2C2825]">New Wellbeing Intention</h3>
            <form onSubmit={handleSaveGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Intention / Focus</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Consistent unhurried morning mobility"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  required
                />
              </div>
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Target Pace</label>
                <input
                  type="text"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder="e.g. 3-4 sessions / week"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#DED6C7] text-[#6A6054]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium"
                >
                  Save Intention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {isAddingMilestone && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-serif text-[#2C2825]">Log Quiet Milestone</h3>
            <form onSubmit={handleSaveMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Achievement</label>
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="e.g. 30 consecutive days of unhurried hydration"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  required
                />
              </div>
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Category</label>
                <select
                  value={milestoneCategory}
                  onChange={(e) => setMilestoneCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                >
                  <option value="movement">Movement & Strength</option>
                  <option value="habit">Nourishment & Habit</option>
                  <option value="body">Body Sovereignty</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMilestone(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#DED6C7] text-[#6A6054]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium"
                >
                  Celebrate Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

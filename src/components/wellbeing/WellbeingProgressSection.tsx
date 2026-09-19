import React, { useState, useMemo } from 'react';
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
  Ruler,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Scale,
} from 'lucide-react';
import {
  WellbeingState,
  ProgressLog,
  WellbeingGoal,
  WellbeingMilestone,
  BodyMeasurementEntry,
  PersonalStyleState,
} from '../../types';
import { interpretProgressTrends } from '../../lib/wellbeingData';
import {
  calculateProgressDifferences,
  BODY_MEASUREMENT_FIELDS,
} from '../../lib/healthUtils';
import { BodyMeasurementsModal } from '../health/BodyMeasurementsModal';
import { WeeklyReminderBanner } from '../health/WeeklyReminderBanner';
import { BodyShapeCard } from '../health/BodyShapeCard';

type TimeRange = '4w' | '3m' | '6m' | '1y' | 'all';

interface WellbeingProgressSectionProps {
  wellbeing: WellbeingState;
  onUpdateWellbeing: (updater: (prev: WellbeingState) => WellbeingState) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
  personalStyle?: PersonalStyleState;
  onUpdateStyle?: (updater: (prev: PersonalStyleState) => PersonalStyleState) => void;
}

export const WellbeingProgressSection: React.FC<WellbeingProgressSectionProps> = ({
  wellbeing,
  onUpdateWellbeing,
  onOpenAssistantWithPrompt,
  personalStyle,
  onUpdateStyle,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'waist' | 'composition'>('weight');
  const [timeRange, setTimeRange] = useState<TimeRange>('3m');
  const [isAddingMeasurementModal, setIsAddingMeasurementModal] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  // Form states for new goal
  const [goalTitle, setGoalTitle] = useState('');
  const [goalMetric, setGoalMetric] = useState('Sessions / week');
  const [goalTarget, setGoalTarget] = useState('4 sessions');

  // Form states for new milestone
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneCategory, setMilestoneCategory] = useState<WellbeingMilestone['category']>('movement');

  const { recordedFacts, patterns, guidance } = interpretProgressTrends(wellbeing.progressLogs);

  // Filter logs by selected time range
  const filteredLogs = useMemo(() => {
    if (timeRange === 'all') return wellbeing.progressLogs;
    const now = new Date();
    const daysMap: Record<TimeRange, number> = {
      '4w': 28,
      '3m': 90,
      '6m': 180,
      '1y': 365,
      all: 99999,
    };
    const cutoffMs = now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000;
    return wellbeing.progressLogs.filter((l) => new Date(l.date).getTime() >= cutoffMs);
  }, [wellbeing.progressLogs, timeRange]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    return [...filteredLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((log) => {
        const d = new Date(log.date);
        const formattedDate = d.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
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
  }, [filteredLogs]);

  // Detailed Progress Differences (11 body measurements + weight)
  const diffs = useMemo(() => {
    return calculateProgressDifferences(
      wellbeing.bodyMeasurementHistory || [],
      wellbeing.progressLogs || []
    );
  }, [wellbeing.bodyMeasurementHistory, wellbeing.progressLogs]);

  // Handle saving new comprehensive measurement
  const handleSaveMeasurementEntry = (data: {
    date: string;
    weightKg?: number;
    measurements: Partial<Omit<BodyMeasurementEntry, 'id' | 'date' | 'unit' | 'notes'>>;
    unit: 'cm' | 'in';
    notes?: string;
  }) => {
    const newEntry: BodyMeasurementEntry = {
      id: `bm-${Date.now()}`,
      date: data.date,
      unit: data.unit,
      notes: data.notes,
      ...data.measurements,
    };

    // Also synchronize into progressLogs for charts and historical timeline
    const newLog: ProgressLog = {
      id: `pl-${Date.now()}`,
      date: data.date,
      weightKg: data.weightKg,
      measurements: {
        waistCm: data.measurements.waist,
        hipsCm: data.measurements.hip,
        chestCm: data.measurements.chest,
      },
      feelingNotes: data.notes,
      recordedFact: `Meting op ${data.date}: ${data.weightKg ? `${data.weightKg} kg` : ''} ${data.measurements.waist ? `| taille ${data.measurements.waist} cm` : ''}`.trim(),
      aiInterpretation: 'Gegevens nuchter vastgelegd. Patronen actualiseren zich naarmate basismetingen vorderen.',
    };

    onUpdateWellbeing((prev) => {
      const updatedHistory = [...(prev.bodyMeasurementHistory || []), newEntry].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      const updatedLogs = [...prev.progressLogs, newLog].sort((a, b) => a.date.localeCompare(b.date));

      // If weekly reminder was active, record completion date
      const updatedReminder = prev.weeklyBodyCheckReminder
        ? { ...prev.weeklyBodyCheckReminder, lastCompletedDate: data.date, snoozedUntil: null }
        : undefined;

      return {
        ...prev,
        bodyMeasurementHistory: updatedHistory,
        progressLogs: updatedLogs,
        weeklyBodyCheckReminder: updatedReminder || prev.weeklyBodyCheckReminder,
      };
    });
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

  // Format factual diff pill without judgment
  const renderDiffPill = (val?: number, unit = 'cm') => {
    if (val === undefined || isNaN(val)) {
      return <span className="text-[#A89E92] font-mono">—</span>;
    }
    const formatted = Math.abs(val).toFixed(1);
    if (val === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#7A7167] bg-[#F2ECE1] px-2 py-0.5 rounded-md">
          <Minus className="w-3 h-3" />
          <span>0.0 {unit}</span>
        </span>
      );
    }
    const isIncrease = val > 0;
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-[#554C40] bg-[#FAF6F0] border border-[#E8E1D3] px-2 py-0.5 rounded-md">
        <span>{isIncrease ? `+${formatted}` : `-${formatted}`}</span>
        <span className="text-[10px] text-[#8C8377]">{unit}</span>
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7654] font-serif font-medium">
            Gezondheid & Rustige Progressie
          </span>
          <h2 className="text-2xl font-serif text-[#2C2825] mt-1">
            Voortgang, Gewicht & Lichaamsmetingen
          </h2>
          <p className="text-xs text-[#7A7167] mt-1 max-w-2xl font-light leading-relaxed">
            Langdurige observaties zonder oordeel. Schommelingen binnen de cyclus zijn natuurlijk. Cijfers zijn feitelijke registraties, nooit een evaluatie van goed of slecht.
          </p>
        </div>

        {/* Action Buttons: Mobile First easy access */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="btn-add-weight"
            onClick={() => setIsAddingMeasurementModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DCD3C4] bg-[#FFFFFF] text-xs font-medium text-[#4A433A] hover:border-[#8C7654] transition cursor-pointer min-h-[44px]"
          >
            <Scale className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>+ Gewicht</span>
          </button>

          <button
            type="button"
            id="btn-add-measurements"
            onClick={() => setIsAddingMeasurementModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Metingen</span>
          </button>
        </div>
      </div>

      {/* Weekly Body Check Sunday Reminder */}
      <WeeklyReminderBanner
        reminder={wellbeing.weeklyBodyCheckReminder}
        onUpdateReminder={(updated) =>
          onUpdateWellbeing((prev) => ({ ...prev, weeklyBodyCheckReminder: updated }))
        }
        onOpenMeasurementModal={() => setIsAddingMeasurementModal(true)}
        lang="nl"
      />

      {/* Key Metrics Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Weight card */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D6] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-[#8C7654]">
            <span className="font-medium uppercase tracking-wider">Actueel Gewicht</span>
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div className="font-serif text-2xl text-[#2C2825]">
            {diffs.weight.current !== undefined ? `${diffs.weight.current.toFixed(1)} kg` : '—'}
          </div>
          <div className="text-[11px] text-[#7A7167] flex flex-wrap items-center gap-2 pt-1 border-t border-[#F2ECE1]">
            <span>Vorig: {renderDiffPill(diffs.weight.diffPrev, 'kg')}</span>
            <span>Start: {renderDiffPill(diffs.weight.diffStart, 'kg')}</span>
          </div>
        </div>

        {/* Waist card */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D6] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-[#8C7654]">
            <span className="font-medium uppercase tracking-wider">Taille (Waist)</span>
            <Ruler className="w-3.5 h-3.5" />
          </div>
          <div className="font-serif text-2xl text-[#2C2825]">
            {diffs.measurements.waist?.current !== undefined
              ? `${diffs.measurements.waist.current.toFixed(1)} cm`
              : '—'}
          </div>
          <div className="text-[11px] text-[#7A7167] flex flex-wrap items-center gap-2 pt-1 border-t border-[#F2ECE1]">
            <span>Vorig: {renderDiffPill(diffs.measurements.waist?.diffPrev)}</span>
            <span>Start: {renderDiffPill(diffs.measurements.waist?.diffStart)}</span>
          </div>
        </div>

        {/* Hips card */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D6] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-[#8C7654]">
            <span className="font-medium uppercase tracking-wider">Heupen (Hip)</span>
            <Ruler className="w-3.5 h-3.5" />
          </div>
          <div className="font-serif text-2xl text-[#2C2825]">
            {diffs.measurements.hip?.current !== undefined
              ? `${diffs.measurements.hip.current.toFixed(1)} cm`
              : '—'}
          </div>
          <div className="text-[11px] text-[#7A7167] flex flex-wrap items-center gap-2 pt-1 border-t border-[#F2ECE1]">
            <span>Vorig: {renderDiffPill(diffs.measurements.hip?.diffPrev)}</span>
            <span>Start: {renderDiffPill(diffs.measurements.hip?.diffStart)}</span>
          </div>
        </div>

        {/* Abdomen card */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D6] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-[#8C7654]">
            <span className="font-medium uppercase tracking-wider">Onderbuik (Abdomen)</span>
            <Ruler className="w-3.5 h-3.5" />
          </div>
          <div className="font-serif text-2xl text-[#2C2825]">
            {diffs.measurements.abdomen?.current !== undefined
              ? `${diffs.measurements.abdomen.current.toFixed(1)} cm`
              : '—'}
          </div>
          <div className="text-[11px] text-[#7A7167] flex flex-wrap items-center gap-2 pt-1 border-t border-[#F2ECE1]">
            <span>Vorig: {renderDiffPill(diffs.measurements.abdomen?.diffPrev)}</span>
            <span>Start: {renderDiffPill(diffs.measurements.abdomen?.diffStart)}</span>
          </div>
        </div>
      </div>

      {/* Body Shape Calculation Card with Personal Styling Comparison */}
      <BodyShapeCard
        latestMeasurement={diffs.latestEntry}
        personalStyle={personalStyle}
        onUpdateStyle={onUpdateStyle}
        lang="nl"
      />

      {/* Main Trends Graph Card */}
      <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F7F4EE] border border-[#E8E2D6] flex items-center justify-center text-[#2C2825]">
              <TrendingUp className="w-4 h-4 text-[#8C7654]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#2C2825]">Trendgrafiek over Tijd</h3>
              <p className="text-[11px] text-[#7A7167] font-light">
                Rustige meerweeks-curve binnen natuurlijke cyclusfasen
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Switcher */}
            <div className="flex items-center rounded-xl bg-[#F7F4EE] p-1 border border-[#E8E2D6]">
              <button
                type="button"
                onClick={() => setSelectedMetric('weight')}
                className={`px-3 py-1 text-xs rounded-lg transition cursor-pointer ${
                  selectedMetric === 'weight'
                    ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                    : 'text-[#7A7167] hover:text-[#2C2825]'
                }`}
              >
                Gewicht (kg)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('waist')}
                className={`px-3 py-1 text-xs rounded-lg transition cursor-pointer ${
                  selectedMetric === 'waist'
                    ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                    : 'text-[#7A7167] hover:text-[#2C2825]'
                }`}
              >
                Taille & Heup (cm)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('composition')}
                className={`px-3 py-1 text-xs rounded-lg transition cursor-pointer ${
                  selectedMetric === 'composition'
                    ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                    : 'text-[#7A7167] hover:text-[#2C2825]'
                }`}
              >
                Samenstelling (%)
              </button>
            </div>

            {/* Time range filter buttons: 4w, 3m, 6m, 1y, all */}
            <div className="flex items-center rounded-xl bg-[#F7F4EE] p-1 border border-[#E8E2D6]">
              {(['4w', '3m', '6m', '1y', 'all'] as TimeRange[]).map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => setTimeRange(tr)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg transition cursor-pointer ${
                    timeRange === tr
                      ? 'bg-[#2C2825] text-[#FAF8F3] font-medium'
                      : 'text-[#7A7167] hover:text-[#2C2825]'
                  }`}
                >
                  {tr === '4w' ? '4w' : tr === '3m' ? '3m' : tr === '6m' ? '6m' : tr === '1y' ? '1j' : 'Alles'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State for Chart if zero logs */}
        {chartData.length === 0 ? (
          <div className="py-16 text-center space-y-2 border border-dashed border-[#E8E2D6] rounded-2xl bg-[#FAF8F4]">
            <Ruler className="w-6 h-6 text-[#A89E92] mx-auto" />
            <div className="text-sm font-serif text-[#2C2825]">Nog geen metingen toegevoegd.</div>
            <p className="text-xs text-[#7A7167] max-w-sm mx-auto font-light">
              Voeg je eerste meting toe om je progressie te zien.
            </p>
            <button
              type="button"
              onClick={() => setIsAddingMeasurementModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium cursor-pointer"
            >
              + Eerste meting invoeren
            </button>
          </div>
        ) : (
          /* Recharts Container */
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
                            <div className="text-[#6B5E4F]">
                              Gewicht: <span className="font-medium text-[#2C2825]">{data.weight} kg</span>
                            </div>
                          )}
                          {selectedMetric === 'waist' && (
                            <>
                              <div className="text-[#6B5E4F]">
                                Taille: <span className="font-medium text-[#2C2825]">{data.waist || '—'} cm</span>
                              </div>
                              <div className="text-[#6B5E4F]">
                                Heupen: <span className="font-medium text-[#2C2825]">{data.hips || '—'} cm</span>
                              </div>
                            </>
                          )}
                          {selectedMetric === 'composition' && (
                            <>
                              <div className="text-[#6B5E4F]">
                                Spiermassa: <span className="font-medium text-[#2C2825]">{data.muscleMass || '—'}%</span>
                              </div>
                              <div className="text-[#6B5E4F]">
                                Vetpercentage: <span className="font-medium text-[#2C2825]">{data.bodyFat || '—'}%</span>
                              </div>
                            </>
                          )}
                          {data.fact && (
                            <div className="text-[10px] text-[#8C8377] border-t border-[#E8E2D6] pt-1 mt-1">
                              <span className="font-semibold text-[#5A5043]">Feit:</span> {data.fact}
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
                    name="Gewicht (kg)"
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
                      name="Taille (cm)"
                      stroke="#C5A880"
                      strokeWidth={2.5}
                      dot={{ fill: '#FAF8F3', stroke: '#C5A880', strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hips"
                      name="Heupen (cm)"
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
                      name="Spiermassa %"
                      stroke="#7E694E"
                      strokeWidth={2.5}
                      dot={{ fill: '#FAF8F3', stroke: '#7E694E', strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bodyFat"
                      name="Vet %"
                      stroke="#D97706"
                      strokeWidth={2}
                      dot={{ fill: '#FAF8F3', stroke: '#D97706', strokeWidth: 2, r: 3 }}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="pt-3 border-t border-[#F0EBE1] flex flex-wrap items-center justify-between gap-3 text-xs text-[#7A7167]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7E694E]" />
              Hoofdmeting
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5A880]" />
              Omtrek referentie
            </span>
          </div>
          <span className="text-[11px] text-[#8C8377] font-light italic">
            Trendcurve respecteert de natuurlijke 28-daagse biologische fluctuaties.
          </span>
        </div>
      </div>

      {/* Comprehensive 11 Body Measurements Table */}
      <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#F0EBE1]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
                Volledige Lichaamsmetingen
              </span>
              <span className="w-1 h-1 rounded-full bg-[#C5A880]" />
              <span className="text-[10px] text-[#7A7167]">11 Meetpunten</span>
            </div>
            <h3 className="text-lg font-serif text-[#2C2825] mt-0.5">
              Overzicht & Vergelijking per Meetpunt
            </h3>
            <p className="text-xs text-[#7A7167] font-light">
              Feitelijke vergelijking: actueel versus vorige meting en startpunt.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingMeasurementModal(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#DCD3C4] bg-[#FAF8F3] text-xs font-medium text-[#4A433A] hover:border-[#8C7654] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Meting toevoegen</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#ECE5D8] text-[#8C8377] font-medium">
                <th className="py-2.5 pr-4">Meetpunt</th>
                <th className="py-2.5 px-3 text-right">Actueel</th>
                <th className="py-2.5 px-3 text-right">Vorige</th>
                <th className="py-2.5 px-3 text-right">Verschil (vorig)</th>
                <th className="py-2.5 pl-3 text-right">Verschil (start)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE4]">
              {BODY_MEASUREMENT_FIELDS.map((f) => {
                const item = diffs.measurements[f.key];
                return (
                  <tr key={f.key} className="hover:bg-[#FAF8F4] transition">
                    <td className="py-3 pr-4 font-medium text-[#2C2825]">
                      <div>{f.labelNl}</div>
                      <div className="text-[10px] text-[#8C8377] font-light">{f.labelEn}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#2C2825]">
                      {item?.current !== undefined ? `${item.current.toFixed(1)} cm` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#7A7167]">
                      {item?.previous !== undefined ? `${item.previous.toFixed(1)} cm` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {renderDiffPill(item?.diffPrev)}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      {renderDiffPill(item?.diffStart)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Measurement History timeline */}
        <div className="pt-4 border-t border-[#F0EBE1] space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6A6054]">
            Geregistreerde Meetsessies ({wellbeing.bodyMeasurementHistory?.length || 0})
          </div>

          {!wellbeing.bodyMeasurementHistory || wellbeing.bodyMeasurementHistory.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#ECE5D8] text-xs text-[#8C8377] text-center italic">
              Nog geen metingen toegevoegd.
            </div>
          ) : (
            <div className="space-y-2">
              {[...wellbeing.bodyMeasurementHistory]
                .reverse()
                .slice(0, 5)
                .map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-xl bg-[#FAF8F4] border border-[#EFE8DC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8C7654]" />
                      <span className="font-medium text-[#2C2825]">{session.date}</span>
                      {session.notes && (
                        <span className="text-[11px] text-[#7A7167] font-light italic">
                          ({session.notes})
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#5C5245]">
                      {session.waist && <span>Taille: {session.waist}cm</span>}
                      {session.hip && <span>Heup: {session.hip}cm</span>}
                      {session.chest && <span>Borst: {session.chest}cm</span>}
                      {session.abdomen && <span>Onderbuik: {session.abdomen}cm</span>}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Distinction of Recorded Facts vs AI Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Empirical Recorded Facts */}
        <div className="bg-[#FAF8F3] border border-[#E8E2D6] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#7E694E]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2C2825]">
              Empirische Geregistreerde Feiten
            </h3>
          </div>
          <p className="text-[11px] text-[#7A7167] font-light">
            Objectieve meetpunten rechtstreeks afkomstig uit je eigen invoer:
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
              Patronen & Leefstijlcontext
            </h3>
          </div>
          <p className="text-[11px] text-[#7A7167] font-light">
            Observaties en interpretaties (duidelijk onderscheiden van feitelijke data):
          </p>
          <ul className="space-y-2.5 text-xs text-[#3E3832]">
            {patterns.map((pat, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] mt-1.5 shrink-0" />
                <span className="font-light">{pat}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 border-t border-[#E8E2D6] flex items-center justify-between text-[11px] text-[#8C7654]">
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
              <h3 className="text-sm font-medium text-[#2C2825]">Persoonlijke Intenties</h3>
              <p className="text-[11px] text-[#7A7167] font-light">Gegrond in vitaliteit en duurzaamheid</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingGoal(true)}
              className="text-xs text-[#7E694E] hover:text-[#2C2825] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Intentie toevoegen
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
                    <span>Doel: {g.targetValue}</span>
                    <span>•</span>
                    <span className="text-[#8C8377]">{g.currentValue || 'Actief'}</span>
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
              <h3 className="text-sm font-medium text-[#2C2825]">Rustige Mijlpalen</h3>
              <p className="text-[11px] text-[#7A7167] font-light">Waardering voor consistentie en zorg voor jezelf</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingMilestone(true)}
              className="text-xs text-[#7E694E] hover:text-[#2C2825] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Mijlpaal noteren
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

      {/* Progress References Privacy Note */}
      <div className="p-4 rounded-2xl border border-[#E8E2D6] bg-[#FAF8F4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EAE3D5] flex items-center justify-center text-[#6A5F50]">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-medium text-[#2C2825]">Veilige Privégegevens</h4>
            <p className="text-[11px] text-[#7A7167] font-light">
              Alle metingen en gezondheidsstatistieken horen strikt bij Privé en worden nooit gedeeld met zakelijke Mariluna context.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onOpenAssistantWithPrompt(
              'Help me reflecteren op mijn rustige voortgang en welzijnstrends van de afgelopen maand.'
            )
          }
          className="text-xs text-[#7E694E] font-medium hover:underline shrink-0 cursor-pointer"
        >
          Vraag Alchemy om rustig voortgangsoverzicht →
        </button>
      </div>

      {/* Comprehensive Body Measurements Modal */}
      <BodyMeasurementsModal
        isOpen={isAddingMeasurementModal}
        onClose={() => setIsAddingMeasurementModal(false)}
        onSave={handleSaveMeasurementEntry}
        initialValues={{
          weightKg: diffs.weight.current,
          measurements: diffs.latestEntry,
        }}
        lang="nl"
      />

      {/* Add Goal Modal */}
      {isAddingGoal && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-serif text-[#2C2825]">Nieuwe Welzijnsintentie</h3>
            <form onSubmit={handleSaveGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Intentie / Focus</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="bv. Rustige ochtendmobiliteit en zachte houding"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  required
                />
              </div>
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Gewenst tempo</label>
                <input
                  type="text"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder="bv. 3-4 sessies per week"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#DED6C7] text-[#6A6054]"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium"
                >
                  Intentie opslaan
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
            <h3 className="text-base font-serif text-[#2C2825]">Rustige Mijlpaal Noteren</h3>
            <form onSubmit={handleSaveMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Mijlpaal</label>
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="bv. 4 weken consistente hydratatie en rustige wandelingen"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  required
                />
              </div>
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Categorie</label>
                <select
                  value={milestoneCategory}
                  onChange={(e) => setMilestoneCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                >
                  <option value="movement">Beweging & Kracht</option>
                  <option value="habit">Voeding & Routine</option>
                  <option value="body">Lichaamsbewustzijn</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMilestone(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#DED6C7] text-[#6A6054]"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium"
                >
                  Mijlpaal vastleggen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  DollarSign,
  Users,
  Calendar,
  Sparkles,
  Edit3,
  Trash2,
  ChevronDown,
  Target,
  Briefcase,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  MarilunaMetricsState,
  MarilunaMetricRecord,
  MarilunaMetric,
  Project,
  Goal,
} from '../../types';

interface MarilunaMetricsSectionProps {
  metricsState: MarilunaMetricsState;
  onUpdateMetricsState?: (metrics: MarilunaMetricsState) => void;
  projects?: Project[];
  goals?: Goal[];
  onOpenAssistantWithPrompt: (prompt: string) => void;
  isNl?: boolean;
}

const PRESET_METRIC_TYPES = [
  { key: 'revenue', nameNl: 'Omzet', nameEn: 'Revenue', unit: '€' },
  { key: 'expense', nameNl: 'Kosten / Uitgaven', nameEn: 'Expenses', unit: '€' },
  { key: 'profit', nameNl: 'Winst / Resultaat', nameEn: 'Profit', unit: '€' },
  { key: 'clients', nameNl: 'Aantal klanten', nameEn: 'Number of clients', unit: 'klanten' },
  { key: 'bookings', nameNl: 'Boekingen', nameEn: 'Bookings', unit: 'boekingen' },
  { key: 'products', nameNl: 'Verkochte producten', nameEn: 'Products sold', unit: 'stuks' },
  { key: 'services', nameNl: 'Verkochte diensten', nameEn: 'Services sold', unit: 'diensten' },
  { key: 'content', nameNl: 'Gepubliceerde content', nameEn: 'Content published', unit: 'posts' },
  { key: 'followers', nameNl: 'Volgers', nameEn: 'Followers', unit: 'volgers' },
  { key: 'visits', nameNl: 'Websitebezoeken', nameEn: 'Website visits', unit: 'bezoeken' },
  { key: 'custom', nameNl: 'Aangepaste metriek', nameEn: 'Custom metric', unit: '' },
];

export const MarilunaMetricsSection: React.FC<MarilunaMetricsSectionProps> = ({
  metricsState,
  onUpdateMetricsState,
  projects = [],
  goals = [],
  onOpenAssistantWithPrompt,
  isNl = true,
}) => {
  // Support both new historical `records` and legacy `metrics`
  const records: MarilunaMetricRecord[] = useMemo(() => {
    if (metricsState.records && metricsState.records.length > 0) {
      return metricsState.records;
    }
    // Fallback convert legacy metrics if any
    if (metricsState.metrics && metricsState.metrics.length > 0) {
      return metricsState.metrics.map((m) => ({
        id: m.id,
        name: m.name,
        category: (m.category as any) || 'custom',
        value: typeof m.value === 'number' ? m.value : parseFloat(m.value) || 0,
        unit: m.unit || '',
        period: m.period || '2026',
        recordedAt: new Date().toISOString(),
        notes: m.notes,
      }));
    }
    return [];
  }, [metricsState.records, metricsState.metrics]);

  // Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MarilunaMetricRecord | null>(null);

  // Selected Metric for Chart
  const [selectedMetricForChart, setSelectedMetricForChart] = useState<string>('all_unique');

  // Selected Period Filter
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Available unique periods
  const uniquePeriods = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.period) set.add(r.period);
    });
    return Array.from(set).sort().reverse();
  }, [records]);

  // Available unique metric names
  const uniqueMetricNames = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.name) set.add(r.name);
    });
    return Array.from(set);
  }, [records]);

  // Filtered records by period
  const displayedRecords = useMemo(() => {
    if (selectedPeriod === 'all') return records;
    return records.filter((r) => r.period === selectedPeriod);
  }, [records, selectedPeriod]);

  // Group records by metric name for historical comparison & trend analysis
  const metricsByName = useMemo(() => {
    const map = new Map<string, MarilunaMetricRecord[]>();
    records.forEach((r) => {
      const list = map.get(r.name) || [];
      list.push(r);
      map.set(r.name, list);
    });

    // Sort each list chronologically by period or recordedAt
    map.forEach((list) => {
      list.sort((a, b) => (a.period || '').localeCompare(b.period || ''));
    });

    return map;
  }, [records]);

  // Financial Calculations for current selected period or overall
  const financialSummary = useMemo(() => {
    // Find revenue and expense in the displayed set or latest period
    const revenueRecords = displayedRecords.filter(
      (r) =>
        r.category === 'revenue' ||
        r.name.toLowerCase().includes('omzet') ||
        r.name.toLowerCase().includes('revenue')
    );
    const expenseRecords = displayedRecords.filter(
      (r) =>
        r.category === 'expense' ||
        r.name.toLowerCase().includes('kosten') ||
        r.name.toLowerCase().includes('uitgaven') ||
        r.name.toLowerCase().includes('expense')
    );

    const hasRevenue = revenueRecords.length > 0;
    const hasExpense = expenseRecords.length > 0;

    const totalRevenue = revenueRecords.reduce((sum, r) => sum + r.value, 0);
    const totalExpense = expenseRecords.reduce((sum, r) => sum + r.value, 0);

    const isComplete = hasRevenue && hasExpense;
    const profit = isComplete ? totalRevenue - totalExpense : null;

    return {
      hasRevenue,
      hasExpense,
      totalRevenue,
      totalExpense,
      profit,
      isComplete,
    };
  }, [displayedRecords]);

  // Trend Observations (purely based on real user historical entries, minimum 2 periods)
  const trendObservations = useMemo(() => {
    const observations: { title: string; detail: string; direction: 'up' | 'down' | 'neutral' }[] = [];

    metricsByName.forEach((history, metricName) => {
      if (history.length >= 2) {
        const latest = history[history.length - 1];
        const previous = history[history.length - 2];
        const diff = latest.value - previous.value;

        if (diff > 0) {
          const unitStr = latest.unit ? ` ${latest.unit}` : '';
          const isCurrency = latest.unit === '€';
          const formattedDiff = isCurrency
            ? `€${diff.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`
            : `${diff}${unitStr}`;

          observations.push({
            title: `${metricName}: ${isNl ? 'Hoger dan vorige periode' : 'Higher than previous period'}`,
            detail: isNl
              ? `${formattedDiff} meer geregistreerd in ${latest.period} vergeleken met ${previous.period}.`
              : `${formattedDiff} higher in ${latest.period} compared to ${previous.period}.`,
            direction: 'up',
          });
        } else if (diff < 0) {
          const absDiff = Math.abs(diff);
          const unitStr = latest.unit ? ` ${latest.unit}` : '';
          const isCurrency = latest.unit === '€';
          const formattedDiff = isCurrency
            ? `€${absDiff.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`
            : `${absDiff}${unitStr}`;

          observations.push({
            title: `${metricName}: ${isNl ? 'Lager dan vorige periode' : 'Lower than previous period'}`,
            detail: isNl
              ? `${formattedDiff} minder geregistreerd in ${latest.period} vergeleken met ${previous.period}.`
              : `${formattedDiff} lower in ${latest.period} compared to ${previous.period}.`,
            direction: 'down',
          });
        } else {
          observations.push({
            title: `${metricName}: ${isNl ? 'Gelijk gebleven' : 'Unchanged'}`,
            detail: isNl
              ? `Gelijk aan de voorgaande periode (${previous.period}).`
              : `Equal to previous period (${previous.period}).`,
            direction: 'neutral',
          });
        }
      }
    });

    return observations;
  }, [metricsByName, isNl]);

  // Handlers
  const handleSaveRecord = (recordPayload: Partial<MarilunaMetricRecord>) => {
    if (!onUpdateMetricsState) return;

    let updatedRecords: MarilunaMetricRecord[];
    const isEdit = !!recordPayload.id && records.some((r) => r.id === recordPayload.id);

    if (isEdit) {
      updatedRecords = records.map((r) =>
        r.id === recordPayload.id ? ({ ...r, ...recordPayload } as MarilunaMetricRecord) : r
      );
    } else {
      const newRec: MarilunaMetricRecord = {
        id: recordPayload.id || 'met-' + Date.now(),
        name: recordPayload.name?.trim() || (isNl ? 'Nieuwe metriek' : 'New Metric'),
        category: recordPayload.category || 'custom',
        value: Number(recordPayload.value) || 0,
        unit: recordPayload.unit?.trim() || '',
        period: recordPayload.period?.trim() || '2026',
        recordedAt: new Date().toISOString(),
        notes: recordPayload.notes?.trim() || undefined,
        projectId: recordPayload.projectId || undefined,
        goalId: recordPayload.goalId || undefined,
      };
      updatedRecords = [newRec, ...records];
    }

    // Keep legacy array in sync for backwards compatibility
    const legacyMetrics: MarilunaMetric[] = updatedRecords.map((r) => ({
      id: r.id,
      name: r.name,
      value: r.value,
      unit: r.unit,
      period: r.period,
      notes: r.notes,
      category: r.category,
    }));

    onUpdateMetricsState({
      ...metricsState,
      records: updatedRecords,
      metrics: legacyMetrics,
    });

    setIsRecordModalOpen(false);
    setEditingRecord(null);
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!onUpdateMetricsState) return;
    const updated = records.filter((r) => r.id !== recordId);
    onUpdateMetricsState({
      ...metricsState,
      records: updated,
      metrics: updated.map((r) => ({
        id: r.id,
        name: r.name,
        value: r.value,
        unit: r.unit,
        period: r.period,
        notes: r.notes,
        category: r.category,
      })),
    });
  };

  // Chart data calculation
  const activeChartMetricName =
    selectedMetricForChart === 'all_unique' && uniqueMetricNames.length > 0
      ? uniqueMetricNames[0]
      : selectedMetricForChart;

  const chartSeries = useMemo(() => {
    if (!activeChartMetricName || !metricsByName.has(activeChartMetricName)) {
      return [];
    }
    return metricsByName.get(activeChartMetricName) || [];
  }, [activeChartMetricName, metricsByName]);

  const maxChartValue = useMemo(() => {
    if (chartSeries.length === 0) return 1;
    const max = Math.max(...chartSeries.map((s) => s.value));
    return max > 0 ? max : 1;
  }, [chartSeries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-normal text-[#2C2825]">
            {isNl ? 'Zakelijke Cijfers & Trends' : 'Business Figures & Metrics'}
          </h2>
          <p className="text-xs text-[#7A7167] mt-1 max-w-xl leading-relaxed">
            {isNl
              ? 'Voer uitsluitend de getallen in die voor jou betekenisvol zijn (omzet, boekingen, volgers). Historische registratie bouwt betrouwbare trends op.'
              : 'Record only the numbers meaningful to you. Historical logging produces genuine trend insights.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingRecord(null);
            setIsRecordModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isNl ? 'Cijfer Toevoegen' : 'Add Metric'}</span>
        </button>
      </div>

      {/* Period Filter Bar */}
      {uniquePeriods.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-[#7A7167] font-medium mr-1 shrink-0">
            {isNl ? 'Periode:' : 'Period:'}
          </span>
          <button
            type="button"
            onClick={() => setSelectedPeriod('all')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer ${
              selectedPeriod === 'all'
                ? 'bg-[#2C2825] text-[#FAF8F3]'
                : 'bg-[#FAF8F3] border border-[#DDD4C5] text-[#7A7167] hover:text-[#2C2825]'
            }`}
          >
            {isNl ? 'Alle Periodes' : 'All Periods'}
          </button>
          {uniquePeriods.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer ${
                selectedPeriod === period
                  ? 'bg-[#2C2825] text-[#FAF8F3]'
                  : 'bg-[#FAF8F3] border border-[#DDD4C5] text-[#7A7167] hover:text-[#2C2825]'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      )}

      {/* Financial Calculation Banner (Only if real data exists) */}
      {(financialSummary.hasRevenue || financialSummary.hasExpense) && (
        <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#8C7654]" />
              <h3 className="font-serif text-sm font-medium text-[#2C2825]">
                {isNl ? 'Financiële Resultaatberekening' : 'Financial Calculation'}
              </h3>
            </div>
            <span className="text-[10px] text-[#7A7167] italic">
              {selectedPeriod === 'all' ? (isNl ? 'Totaal alle periodes' : 'All periods') : selectedPeriod}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#8C7654] block">
                {isNl ? 'Geregistreerde Omzet' : 'Recorded Revenue'}
              </span>
              <div className="font-serif text-lg text-[#2C2825]">
                {financialSummary.hasRevenue
                  ? `€${financialSummary.totalRevenue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`
                  : '—'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#8C7654] block">
                {isNl ? 'Geregistreerde Kosten' : 'Recorded Expenses'}
              </span>
              <div className="font-serif text-lg text-[#2C2825]">
                {financialSummary.hasExpense
                  ? `€${financialSummary.totalExpense.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`
                  : '—'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#8C7654] block">
                {isNl ? 'Resultaat (Winst)' : 'Net Result (Profit)'}
              </span>
              <div className="font-serif text-lg text-[#2C2825]">
                {financialSummary.isComplete && financialSummary.profit !== null ? (
                  <span className={financialSummary.profit >= 0 ? 'text-[#2C2825]' : 'text-[#A64A38]'}>
                    €{financialSummary.profit.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="text-xs text-[#8C8377] font-normal italic">
                    {isNl ? 'Onvolledige data' : 'Incomplete data'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Incomplete indicator warning */}
          {!financialSummary.isComplete && (
            <div className="flex items-start gap-2 text-xs text-[#7A7167] bg-[#F4EFE6] p-2.5 rounded-xl border border-[#E8E1D3]">
              <AlertCircle className="w-3.5 h-3.5 text-[#8C7654] shrink-0 mt-0.5" />
              <p>
                {isNl
                  ? 'Resultaat kan pas exact berekend worden zodra zowel omzet als kosten zijn vastgelegd voor deze periode. Er worden geen aannames gedaan.'
                  : 'Profit is only calculated when both revenue and expenses are entered. No assumptions are made.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Metric Cards Grid */}
      {displayedRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DCD3C4] p-12 text-center space-y-3">
          <p className="text-xs text-[#7A7167] italic">
            {isNl
              ? 'Nog geen cijfers geregistreerd. Voeg je eerste cijfer toe om trends op te bouwen.'
              : 'No metrics recorded yet. Record your first figure to establish trends.'}
          </p>
          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
          >
            {isNl ? '+ Voeg je eerste cijfer toe' : '+ Add your first metric'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayedRecords.map((r) => {
            const relatedProject = projects.find((p) => p.id === r.projectId);
            const relatedGoal = goals.find((g) => g.id === r.goalId);
            const isCurrency = r.unit === '€';

            return (
              <div
                key={r.id}
                className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] space-y-2 shadow-xs hover:border-[#DDD4C5] transition relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-[#8C7654] tracking-wider block">
                    {r.period}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecord(r);
                        setIsRecordModalOpen(true);
                      }}
                      className="p-1 text-[#7A7167] hover:text-[#2C2825] cursor-pointer"
                      title={isNl ? 'Bewerken' : 'Edit'}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(r.id)}
                      className="p-1 text-[#A89F91] hover:text-[#A64A38] cursor-pointer"
                      title={isNl ? 'Verwijderen' : 'Delete'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="font-serif text-2xl text-[#2C2825]">
                  {isCurrency
                    ? `€${r.value.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`
                    : `${r.value.toLocaleString('nl-NL')} ${r.unit || ''}`}
                </div>

                <div className="text-xs text-[#554C42] font-medium">{r.name}</div>

                {r.notes && (
                  <p className="text-[11px] text-[#7A7167] line-clamp-2 leading-relaxed">
                    {r.notes}
                  </p>
                )}

                {/* Optional links to Project or Goal */}
                {(relatedProject || relatedGoal) && (
                  <div className="pt-2 border-t border-[#ECE3D4] flex items-center gap-2 flex-wrap text-[10px] text-[#7A7167]">
                    {relatedProject && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-[#8C7654]" />
                        <span>{relatedProject.title}</span>
                      </span>
                    )}
                    {relatedGoal && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-[#8C7654]" />
                        <span>{relatedGoal.title}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Minimal & Elegant Trend Chart (Only rendered when at least 2 data points exist) */}
      {chartSeries.length >= 2 && (
        <div className="p-5 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#ECE3D4]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8C7654]" />
              <h3 className="font-serif text-base font-medium text-[#2C2825]">
                {isNl ? 'Trend over Periodes' : 'Trend Over Periods'}
              </h3>
            </div>

            {/* Metric Switcher */}
            {uniqueMetricNames.length > 1 && (
              <select
                value={activeChartMetricName}
                onChange={(e) => setSelectedMetricForChart(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] cursor-pointer"
              >
                {uniqueMetricNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-xs text-[#7A7167]">
              {activeChartMetricName} {isNl ? 'over opeenvolgende periodes' : 'over recorded periods'}:
            </div>

            {/* Minimal SVG Bar Chart */}
            <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-[#E8E1D3]">
              {chartSeries.map((pt, idx) => {
                const heightPct = Math.max(8, Math.round((pt.value / maxChartValue) * 100));
                const isCurrency = pt.unit === '€';
                const labelValue = isCurrency
                  ? `€${pt.value.toLocaleString('nl-NL')}`
                  : `${pt.value} ${pt.unit || ''}`;

                return (
                  <div key={pt.id || idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono text-[#7A7167] mb-1 opacity-80 group-hover:opacity-100 transition whitespace-nowrap">
                      {labelValue}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[42px] rounded-t-lg bg-[#2C2825] group-hover:bg-[#8C7654] transition-all duration-300"
                    />
                    <span className="text-[10px] text-[#6E6458] mt-2 font-medium truncate max-w-full text-center">
                      {pt.period}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Trend Observations (Prepared only when sufficient historical data exists) */}
      <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-[#ECE3D4]">
          <TrendingUp className="w-4 h-4 text-[#8C7654]" />
          <h3 className="font-serif text-base font-medium text-[#2C2825]">
            {isNl ? 'Zakelijke Trendwaarnemingen' : 'Business Trend Observations'}
          </h3>
        </div>

        {trendObservations.length === 0 ? (
          <div className="py-4 text-xs text-[#7A7167] italic leading-relaxed">
            {isNl
              ? 'Nog onvoldoende opeenvolgende periodes geregistreerd om betrouwbare trends te tonen. Zodra je cijfers van minstens twee periodes hebt vastgelegd, worden hier feitelijke vergelijkingen getoond (zonder fictieve prognoses).'
              : 'Not enough periods recorded yet to evaluate trends. Once you record at least two periods, genuine comparisons will appear here.'}
          </div>
        ) : (
          <div className="space-y-2">
            {trendObservations.map((obs, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] flex items-start gap-2.5 text-xs text-[#2C2825]"
              >
                {obs.direction === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
                ) : obs.direction === 'down' ? (
                  <ArrowDownRight className="w-4 h-4 text-[#A64A38] shrink-0 mt-0.5" />
                ) : (
                  <Minus className="w-4 h-4 text-[#7A7167] shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium text-[#2C2825]">{obs.title}</div>
                  <div className="text-[11px] text-[#7A7167] mt-0.5">{obs.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Sparring Prompt */}
      <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#EAE2D3] text-[#2C2825]">
            <Sparkles className="w-4 h-4 text-[#8C7654]" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-medium text-[#2C2825]">
              {isNl ? 'Cijfermatige Reflectie met Alchemy' : 'Strategic Metric Reflection'}
            </h4>
            <p className="text-xs text-[#7A7167]">
              {isNl
                ? 'Analyseer je omzetdoelen en zakelijke capaciteit rustig met je strategische partner.'
                : 'Analyze revenue targets and capacity calmly with Alchemy.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onOpenAssistantWithPrompt(
              isNl
                ? 'Ik wil graag even kijken naar mijn zakelijke cijfers en doelen voor Mariluna. Welke patronen of verbeteringen zie je op basis van wat ik heb geregistreerd?'
                : 'I would like to review my Mariluna business figures and goals. What patterns or adjustments do you suggest?'
            )
          }
          className="px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer shrink-0"
        >
          {isNl ? 'Bespreek Cijfers' : 'Discuss Metrics'}
        </button>
      </div>

      {/* ============================================================ */}
      {/* MODAL: RECORD METRIC                                         */}
      {/* ============================================================ */}
      {isRecordModalOpen && (
        <MetricRecordModal
          record={editingRecord}
          projects={projects}
          goals={goals}
          onSave={handleSaveRecord}
          onClose={() => {
            setIsRecordModalOpen(false);
            setEditingRecord(null);
          }}
          isNl={isNl}
        />
      )}
    </div>
  );
};

interface MetricRecordModalProps {
  record: MarilunaMetricRecord | null;
  projects: Project[];
  goals: Goal[];
  onSave: (payload: Partial<MarilunaMetricRecord>) => void;
  onClose: () => void;
  isNl: boolean;
}

const MetricRecordModal: React.FC<MetricRecordModalProps> = ({
  record,
  projects,
  goals,
  onSave,
  onClose,
  isNl,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(
    record?.category || 'revenue'
  );
  const [customName, setCustomName] = useState<string>(record?.name || '');
  const [value, setValue] = useState<string>(record?.value !== undefined ? String(record?.value) : '');
  const [unit, setUnit] = useState<string>(record?.unit || '€');
  const [period, setPeriod] = useState<string>(
    record?.period ||
      `${new Date().toLocaleString('nl-NL', { month: 'long' })} ${new Date().getFullYear()}`
  );
  const [projectId, setProjectId] = useState<string>(record?.projectId || '');
  const [goalId, setGoalId] = useState<string>(record?.goalId || '');
  const [notes, setNotes] = useState<string>(record?.notes || '');

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = PRESET_METRIC_TYPES.find((p) => p.key === presetKey);
    if (preset) {
      if (presetKey !== 'custom') {
        setCustomName(isNl ? preset.nameNl : preset.nameEn);
      }
      setUnit(preset.unit);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customName.trim() || (selectedPreset === 'custom' ? (isNl ? 'Aangepast' : 'Custom') : selectedPreset);
    if (!finalName || value === '') return;

    onSave({
      id: record?.id,
      name: finalName,
      category: selectedPreset as any,
      value: Number(value),
      unit: unit.trim() || undefined,
      period: period.trim() || '2026',
      projectId: projectId || undefined,
      goalId: goalId || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl text-[#2C2825] max-h-[90vh] overflow-y-auto">
        <h3 className="font-serif text-lg text-[#2C2825]">
          {record ? (isNl ? 'Cijfer Bewerken' : 'Edit Metric') : (isNl ? 'Zakelijk Cijfer Registreren' : 'Record Business Metric')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1.5">
              {isNl ? 'Kies Type Metriek' : 'Select Metric Type'}
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl bg-[#EFE9DD]">
              {PRESET_METRIC_TYPES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePresetSelect(p.key)}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                    selectedPreset === p.key
                      ? 'bg-[#2C2825] text-[#FAF8F3] font-medium'
                      : 'bg-[#FAF8F3] text-[#2C2825] hover:bg-[#F2ECE1]'
                  }`}
                >
                  {isNl ? p.nameNl : p.nameEn}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
              {isNl ? 'Naam van de Metriek *' : 'Metric Name *'}
            </label>
            <input
              type="text"
              required
              placeholder={isNl ? 'bijv. Omzet, Boekingen, Instagram volgers' : 'Metric name'}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Waarde *' : 'Value *'}
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Eenheid' : 'Unit'}
              </label>
              <input
                type="text"
                placeholder="€, klanten, volgers, stuks"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
              {isNl ? 'Periode (bijv. September 2026, Q3 2026) *' : 'Period *'}
            </label>
            <input
              type="text"
              required
              placeholder="September 2026"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Koppel aan Doel (optioneel)' : 'Link Goal'}
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                <option value="">{isNl ? '(Geen doel)' : '(No goal)'}</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Koppel aan Project (optioneel)' : 'Link Project'}
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                <option value="">{isNl ? '(Geen project)' : '(No project)'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
              {isNl ? 'Notities & Context' : 'Notes'}
            </label>
            <textarea
              rows={2}
              placeholder={isNl ? 'Toelichting op dit cijfer...' : 'Notes...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-[#7A7167]"
            >
              {isNl ? 'Annuleren' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!customName.trim() || value === ''}
              className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium disabled:opacity-40"
            >
              {isNl ? 'Opslaan' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

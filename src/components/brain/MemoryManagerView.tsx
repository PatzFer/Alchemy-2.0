import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit2,
  Check,
  X,
  Filter,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  MemoryItem,
  MemoryType,
  MemorySource,
  MemoryConfidence,
  Realm,
} from '../../types';
import {
  createMemory,
  confirmLearnedMemory,
  dismissLearnedMemory,
  updateMemoryContent,
  parseExplicitMemoryStatement,
} from '../../lib/brain/memoryEngine';

interface MemoryManagerViewProps {
  memories: MemoryItem[];
  onAddMemory: (memory: Partial<MemoryItem>) => void;
  onUpdateMemories: (updater: (prev: MemoryItem[]) => MemoryItem[]) => void;
  onDeleteMemory: (id: string) => void;
  isNl?: boolean;
}

export const MemoryManagerView: React.FC<MemoryManagerViewProps> = ({
  memories,
  onAddMemory,
  onUpdateMemories,
  onDeleteMemory,
  isNl = true,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'explicit' | 'confirmed' | 'learned' | 'temporary'>('all');
  const [realmFilter, setRealmFilter] = useState<'all' | 'personal' | 'mariluna'>('all');
  const [contentInput, setContentInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Dagritme & Voorkeuren');
  const [realmInput, setRealmInput] = useState<Realm>('personal');
  const [typeInput, setTypeInput] = useState<MemoryType>('explicit');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Auto-detect "Onthoud dat..." input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContentInput(val);

    const parsed = parseExplicitMemoryStatement(val);
    if (parsed.isExplicitMemory && parsed.suggestedCategory && parsed.suggestedRealm) {
      setCategoryInput(parsed.suggestedCategory);
      setRealmInput(parsed.suggestedRealm);
    }
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentInput.trim()) return;

    const parsed = parseExplicitMemoryStatement(contentInput);
    const content = parsed.isExplicitMemory && parsed.extractedContent ? parsed.extractedContent : contentInput.trim();

    const newMem = createMemory({
      content,
      type: typeInput,
      category: categoryInput,
      realm: realmInput,
    });

    onAddMemory(newMem);
    setContentInput('');
  };

  const handleConfirm = (id: string) => {
    onUpdateMemories((prev) => confirmLearnedMemory(prev, id));
  };

  const handleDismiss = (id: string) => {
    onUpdateMemories((prev) => dismissLearnedMemory(prev, id));
  };

  const handleStartEdit = (m: MemoryItem) => {
    setEditingId(m.id);
    setEditContent(m.content);
  };

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) return;
    onUpdateMemories((prev) => updateMemoryContent(prev, id, editContent));
    setEditingId(null);
  };

  const filtered = memories.filter((m) => {
    if (realmFilter !== 'all' && m.realm !== realmFilter) return false;
    if (activeTab === 'all') return true;
    return m.type === activeTab || (activeTab === 'explicit' && !m.type);
  });

  const pendingCount = memories.filter((m) => m.type === 'learned' && m.status === 'pending_confirmation').length;

  return (
    <div className="space-y-6">
      {/* Overview & Philosophy Card */}
      <div className="rounded-2xl border border-[#E8E1D4] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EBE0]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#8C7654]" />
              <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                {isNl ? 'Alchemy Memory Engine' : 'Alchemy Memory Engine'}
              </h3>
            </div>
            <p className="text-xs text-[#7A7267]">
              {isNl
                ? 'Onthoudt kwalitatieve voorkeuren en context die toekomstige planning verbeteren.'
                : 'Remembers qualitative preferences and context that improve future planning.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] text-[#6B6358] font-medium">
              {memories.length} {isNl ? 'herinneringen bewaard' : 'memories stored'}
            </span>
            {pendingCount > 0 && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#FDF3E7] border border-[#F3DFC7] text-[#8A5817] font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {pendingCount} {isNl ? 'te bevestigen' : 'to confirm'}
              </span>
            )}
          </div>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleCreateMemory} className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8175]">
              {isNl ? 'Nieuwe herinnering toevoegen' : 'Add New Memory'}
            </label>
            <input
              type="text"
              value={contentInput}
              onChange={handleInputChange}
              placeholder={
                isNl
                  ? 'Typ bijv. "Onthoud dat we in Mariluna nooit korting geven op vlaggenschipcursussen" of een dagritme-voorkeur...'
                  : 'Type e.g. "Remember that in Mariluna we never discount flagship courses"...'
              }
              className="w-full bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl p-3 text-xs text-[#2C2825] placeholder-[#9E958B] focus:outline-hidden focus:border-[#8C7654]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={realmInput}
                onChange={(e) => setRealmInput(e.target.value as Realm)}
                className="bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-1.5 text-xs text-[#2C2825]"
              >
                <option value="personal">{isNl ? 'Persoonlijk Leven' : 'Personal'}</option>
                <option value="mariluna">{isNl ? 'Mariluna Business' : 'Mariluna'}</option>
              </select>

              <select
                value={typeInput}
                onChange={(e) => setTypeInput(e.target.value as MemoryType)}
                className="bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-1.5 text-xs text-[#2C2825]"
              >
                <option value="explicit">{isNl ? 'Expliciet (Door mij opgegeven)' : 'Explicit'}</option>
                <option value="temporary">{isNl ? 'Tijdelijke context' : 'Temporary context'}</option>
              </select>

              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="Categorie"
                className="bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-1.5 text-xs text-[#2C2825] w-36"
              />
            </div>

            <button
              type="submit"
              disabled={!contentInput.trim()}
              className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F5] text-xs font-medium hover:bg-[#453E38] disabled:opacity-40 transition cursor-pointer"
            >
              {isNl ? 'Bewaar in Memory' : 'Save to Memory'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Type tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: isNl ? 'Alle' : 'All' },
            { id: 'explicit', label: isNl ? 'Expliciet' : 'Explicit' },
            { id: 'confirmed', label: isNl ? 'Bevestigd' : 'Confirmed' },
            { id: 'learned', label: `${isNl ? 'Geleerd' : 'Learned'} ${pendingCount > 0 ? `(${pendingCount})` : ''}` },
            { id: 'temporary', label: isNl ? 'Tijdelijk' : 'Temporary' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#2C2825] text-[#FAF8F5]'
                  : 'bg-[#FFFFFF] border border-[#E8E1D4] text-[#554C42] hover:bg-[#F2ECE1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Realm filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#8A8175] flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Domein:
          </span>
          {(['all', 'personal', 'mariluna'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRealmFilter(r)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                realmFilter === r
                  ? 'bg-[#8C7654] text-[#FAF8F5]'
                  : 'bg-[#FAF8F5] text-[#7A7267] hover:bg-[#EAE3D6]'
              }`}
            >
              {r === 'all' ? 'Beide' : r === 'personal' ? 'Privé' : 'Mariluna'}
            </button>
          ))}
        </div>
      </div>

      {/* Memory List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#E8E1D4] text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#8C7654] mx-auto opacity-60" />
            <p className="text-xs text-[#7A7267]">
              {isNl
                ? 'Geen herinneringen gevonden binnen deze selectie.'
                : 'No memories found matching this filter.'}
            </p>
          </div>
        ) : (
          filtered.map((m) => {
            const isEditing = editingId === m.id;
            const isLearnedPending = m.type === 'learned' && m.status === 'pending_confirmation';

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl bg-[#FFFFFF] border transition-all space-y-2 ${
                  isLearnedPending ? 'border-[#E5BE84] shadow-xs' : 'border-[#E8E1D4]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Realm badge */}
                    <span
                      className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                        m.realm === 'mariluna'
                          ? 'bg-[#2C2825] text-[#F9F7F2]'
                          : 'bg-[#EAE4D7] text-[#554C42]'
                      }`}
                    >
                      {m.realm}
                    </span>

                    {/* Type badge */}
                    <span
                      className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                        m.type === 'learned'
                          ? 'bg-[#FDF3E7] text-[#8A5817]'
                          : m.type === 'confirmed'
                          ? 'bg-[#EBF2EB] text-[#2D5A27]'
                          : m.type === 'temporary'
                          ? 'bg-[#E8F1F5] text-[#274B5A]'
                          : 'bg-[#F2ECE1] text-[#6B6358]'
                      }`}
                    >
                      {m.type || 'expliciet'}
                    </span>

                    {/* Category */}
                    <span className="text-[11px] font-semibold text-[#8C7654]">
                      {m.category}
                    </span>

                    {/* Source & date */}
                    <span className="text-[10px] text-[#9E958B]">
                      • {m.dateAdded}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {isLearnedPending && (
                      <button
                        onClick={() => handleConfirm(m.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2D5A27] text-[#FAF8F5] text-[11px] font-medium hover:bg-[#3D7A37] transition cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        {isNl ? 'Bevestigen' : 'Confirm'}
                      </button>
                    )}

                    <button
                      onClick={() => (isEditing ? handleSaveEdit(m.id) : handleStartEdit(m))}
                      className="p-1.5 text-[#9E958B] hover:text-[#2C2825] rounded-lg hover:bg-[#FAF8F5] transition cursor-pointer"
                      title={isEditing ? 'Opslaan' : 'Bewerken'}
                    >
                      {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onDeleteMemory(m.id)}
                      className="p-1.5 text-[#9E958B] hover:text-[#8A2424] rounded-lg hover:bg-[#FBEAEB] transition cursor-pointer"
                      title={isNl ? 'Verwijderen' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div className="pt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 bg-[#FAF8F4] border border-[#D5CCBE] rounded-lg p-2 text-xs text-[#2C2825] focus:outline-hidden"
                    />
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 text-[#9E958B] hover:text-[#2C2825] transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-[#3E3832] font-light leading-relaxed">
                    {m.content}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

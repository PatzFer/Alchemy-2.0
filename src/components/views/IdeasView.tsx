import React, { useEffect, useState } from 'react';
import {
  Lightbulb,
  Plus,
  Sparkles,
  Archive,
  ArrowRight,
  Clock,
  Trash2,
  FolderPlus,
  HelpCircle,
  Calendar,
  Edit3,
} from 'lucide-react';
import { Idea, Realm, ActiveWorldFilter } from '../../types';
import { requestIdeaAnalysis } from '../../lib/aiService';
import { isIdeaDueForReview } from '../../lib/ideaReview';

interface IdeasViewProps {
  ideas: Idea[];
  activeWorld: ActiveWorldFilter;
  onSaveIdea: (idea: Partial<Idea>) => void;
  onConvertToProject: (ideaId: string) => void;
  onArchiveIdea: (ideaId: string) => void;
  onDeleteIdea: (ideaId: string) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
}

const getLocalDateString = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getSharedIdeaKeywords = (left: string, right: string): string[] => {
  const stopWords = new Set(['de', 'het', 'een', 'en', 'van', 'voor', 'met', 'op', 'in', 'aan', 'is', 'ik', 'mijn', 'dit', 'dat', 'the', 'and', 'for', 'with', 'from', 'into', 'your', 'you']);
  const words = (value: string) => new Set(
    value.toLocaleLowerCase('nl-BE')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .match(/[a-z0-9]{4,}/g)?.filter((word) => !stopWords.has(word)) || []
  );
  const leftWords = words(left);
  return [...words(right)].filter((word) => leftWords.has(word)).slice(0, 4);
};

export const IdeasView: React.FC<IdeasViewProps> = ({
  ideas,
  activeWorld,
  onSaveIdea,
  onConvertToProject,
  onArchiveIdea,
  onDeleteIdea,
  onOpenAssistantWithPrompt,
}) => {
  const [quickIdeaText, setQuickIdeaText] = useState('');
  const [quickIdeaTheme, setQuickIdeaTheme] = useState('');
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTheme, setEditTheme] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [quickRealm, setQuickRealm] = useState<Realm>(activeWorld === 'mariluna' ? 'mariluna' : 'personal');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setQuickRealm(activeWorld === 'mariluna' ? 'mariluna' : 'personal');
  }, [activeWorld]);

  // Use local calendar-day arithmetic so ISO date strings do not shift at UTC boundaries.
  const untouchedIdeas = ideas.filter(
    (idea) =>
      (activeWorld === 'all' || idea.realm === activeWorld) &&
      idea.status !== 'archived' &&
      idea.status !== 'converted_to_project' &&
      isIdeaDueForReview(idea.lastRevisitedAt, idea.createdAt)
  );

  const filteredIdeas = ideas.filter((i) => {
    if (activeWorld !== 'all' && i.realm !== activeWorld) return false;
    return true;
  });

  const openIdeaEditor = (idea: Idea) => {
    setEditingIdeaId(idea.id);
    setEditTitle(idea.title);
    setEditContent(idea.content);
    setEditTheme(idea.contentPillar || '');
    setEditCategory(idea.category || '');
    setEditTags((idea.tags || []).join(', '));
  };

  const handleSaveIdeaEdits = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingIdeaId || !editTitle.trim() || !editContent.trim()) return;
    onSaveIdea({
      id: editingIdeaId,
      title: editTitle.trim(),
      content: editContent.trim(),
      contentPillar: editTheme.trim() || undefined,
      category: editCategory.trim() || 'Overig',
      tags: [...new Set(editTags.split(',').map((tag) => tag.trim()).filter(Boolean))],
    });
    setEditingIdeaId(null);
  };

  const handleCaptureIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickIdeaText.trim()) return;

    setIsAnalyzing(true);
    let analysis: { category?: string; summary?: string; suggestedNextAction?: string; followUpQuestions?: string[] } = {};
    try {
      const analysisInput = quickIdeaTheme.trim()
        ? `Thema: ${quickIdeaTheme.trim()}\n\nIdee: ${quickIdeaText.trim()}`
        : quickIdeaText.trim();
      analysis = await requestIdeaAnalysis(analysisInput, quickRealm);
    } catch (error) {
      console.warn('Idea analysis unavailable; keeping the original brain dump.', error);
    } finally {
      setIsAnalyzing(false);
    }

    onSaveIdea({
      id: 'i-' + Date.now(),
      title: quickIdeaText.split('\n')[0].slice(0, 60),
      content: quickIdeaText,
      contentPillar: quickIdeaTheme.trim() || undefined,
      realm: quickRealm,
      category: analysis.category || (quickRealm === 'mariluna' ? 'strategy' : 'lifestyle'),
      status: 'raw',
      createdAt: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
      lastRevisitedAt: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
      aiSummary: analysis.summary,
      suggestedNextStep: analysis.suggestedNextAction,
      followUpQuestions: analysis.followUpQuestions || [],
    });

    setQuickIdeaText('');
    setQuickIdeaTheme('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)]">
          Braindump & ideeën
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-light">
          Gooi je gedachten hier neer. Jarvis helpt je verbanden zien, verder denken en ideeën op het juiste moment opnieuw oppakken.
        </p>
      </div>

      {/* Proactive Untouched Ideas Review Card */}
      {untouchedIdeas.length > 0 && (
        <div className="rounded-2xl border border-[#D5C6AF] bg-[var(--surface-2)] p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-[var(--surface-2)] text-[var(--accent-secondary)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-medium text-[var(--text-primary)]">
                  Idee om opnieuw op te pakken
                </h3>
                <span className="text-[10px] uppercase font-semibold text-[var(--accent-secondary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                  Terugblik
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Dit idee staat hier al minstens drie weken. Wil je het opnieuw bekijken, bewaren of omzetten naar een project?
              </p>

              <div className="mt-3 space-y-2">
                {untouchedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-serif font-medium text-[var(--text-primary)]">
                          {idea.title}
                        </span>
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#EAE4D7] text-[#554C42]">
                          {idea.realm}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                        {idea.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {onOpenAssistantWithPrompt && <button
                        onClick={() => {
                          onSaveIdea({ id: idea.id, lastRevisitedAt: getLocalDateString() });
                          onOpenAssistantWithPrompt(
                            `We pakken dit oudere idee opnieuw op. Help me eerst onderzoeken wat er interessant aan is en welke richting het kan krijgen, zonder meteen een plan op te dringen. Idee: "${idea.title}" — ${idea.content}`,
                            { type: 'idea', id: idea.id, title: idea.title, realm: idea.realm, details: idea }
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      >
                        Spar met Jarvis
                      </button>}
                      <button
                        onClick={() => onSaveIdea({ id: idea.id, lastRevisitedAt: getLocalDateString() })}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      >
                        Later herinneren
                      </button>
                      {idea.realm === 'mariluna' && <button
                        onClick={() => onConvertToProject(idea.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--text-primary)] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Maak project</span>
                      </button>}
                      <button
                        onClick={() => onArchiveIdea(idea.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                      >
                        Archiveren
                      </button>
                      <button
                        onClick={() => onDeleteIdea(idea.id)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[#733] transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Capture Input */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-5 shadow-xs">
        <form onSubmit={handleCaptureIdea} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5A524A] uppercase tracking-wider">
              Nieuwe braindump
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuickRealm('personal')}
                className={`text-xs px-2.5 py-1 rounded-full transition cursor-pointer ${
                  quickRealm === 'personal'
                    ? 'bg-[#EAE4D7] text-[#4A433B] font-medium'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                Privé
              </button>
              <button
                type="button"
                onClick={() => setQuickRealm('mariluna')}
                className={`text-xs px-2.5 py-1 rounded-full transition cursor-pointer ${
                  quickRealm === 'mariluna'
                    ? 'bg-[var(--text-primary)] text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                Mariluna
              </button>
            </div>
          </div>

          <input
            type="text"
            value={quickIdeaTheme}
            onChange={(e) => setQuickIdeaTheme(e.target.value)}
            placeholder="Thema of rode draad (optioneel, bv. vrouwelijke autonomie)"
            className="w-full bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-secondary)]"
          />

          <textarea
            rows={3}
            required
            value={quickIdeaText}
            onChange={(e) => setQuickIdeaText(e.target.value)}
            placeholder="Schrijf hier je gedachte, inspiratie of Mariluna-idee..."
            className="w-full bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-3 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-secondary)]"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C5A880]" />
              Jarvis helpt je ordenen en stelt mogelijke vervolgstappen voor.
            </span>
            <button
              type="submit"
              disabled={!quickIdeaText.trim() || isAnalyzing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--text-primary)] text-xs font-medium hover:bg-[#433D37] disabled:opacity-40 transition cursor-pointer"
            >
              <span>{isAnalyzing ? 'Even ordenen...' : 'Idee bewaren'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIdeas.map((idea) => {
          const isArchived = idea.status === 'archived';
          const relatedIdeas = filteredIdeas
            .filter((other) => other.id !== idea.id && other.realm === idea.realm && other.status !== 'archived')
            .map((other) => ({ idea: other, shared: getSharedIdeaKeywords(`${idea.title} ${idea.content}`, `${other.title} ${other.content}`) }))
            .filter((match) => match.shared.length >= 2)
            .sort((a, b) => b.shared.length - a.shared.length)
            .slice(0, 2);
          return (
            <div
              key={idea.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                isArchived
                  ? 'bg-[var(--surface-2)]/50 border-[var(--border-subtle)] opacity-60'
                  : 'bg-[var(--surface-2)] border-[var(--border-subtle)] hover:border-[#C4B9A7] shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      idea.realm === 'mariluna'
                        ? 'bg-[var(--text-primary)] text-[var(--text-primary)]'
                        : 'bg-[#EAE4D7] text-[#554C42]'
                    }`}
                  >
                    {idea.realm}
                  </span>
                  <span>{idea.contentPillar ? `${idea.contentPillar} · ${idea.category}` : idea.category}</span>
                </div>

                <h3 className="font-serif text-base font-medium text-[var(--text-primary)]">
                  {idea.title}
                </h3>
                <p className="text-xs text-[#5A524A] mt-2 font-light leading-relaxed whitespace-pre-wrap">
                  {idea.content}
                </p>

                {relatedIdeas.length > 0 && (
                  <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-secondary)]">
                      Mogelijk verwant aan
                    </span>
                    <div className="mt-2 space-y-2">
                      {relatedIdeas.map(({ idea: related, shared }) => (
                        <div key={related.id} className="text-[11px] text-[var(--text-secondary)]">
                          <span className="font-medium text-[var(--text-primary)]">{related.title}</span>
                          <span className="block mt-0.5 text-[10px] text-[var(--text-muted)]">
                            Gedeelde themawoorden: {shared.join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* AI Follow-up Questions if present */}
                {idea.followUpQuestions && idea.followUpQuestions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#F0EBE1] space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--accent-secondary)] block">
                      Vragen om verder te denken
                    </span>
                    {idea.followUpQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] text-[var(--text-secondary)] italic bg-[var(--surface-2)] p-2 rounded-lg"
                      >
                        "{q}"
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs">
                {onOpenAssistantWithPrompt ? (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenAssistantWithPrompt(
                        `Wil je dit idee verder uitwerken, er content van maken, er een project van maken of het voorlopig bewaren? Idee: "${idea.title}" - ${idea.content}`,
                        { type: 'idea', id: idea.id, title: idea.title, realm: idea.realm, details: idea }
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-secondary)] hover:text-[var(--text-primary)] font-medium transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                    <span>Spar met Jarvis</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Bewaard {idea.createdAt}
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openIdeaEditor(idea)}
                    title="Idee bewerken"
                    aria-label={`Bewerk idee ${idea.title}`}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {idea.realm === 'mariluna' && <button
                    onClick={() => onConvertToProject(idea.id)}
                    title="Omzetten naar project"
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>}
                  <button
                    onClick={() => onArchiveIdea(idea.id)}
                    title="Idee archiveren"
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteIdea(idea.id)}
                    title="Definitief verwijderen"
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#733] hover:bg-[var(--surface-2)] transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      {editingIdeaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveIdeaEdits} className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6 shadow-2xl space-y-4">
            <div>
              <h2 className="font-serif text-xl text-[var(--text-primary)]">Idee bewerken</h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Pas je oorspronkelijke gedachte aan. De gekoppelde Jarvis-sparring en geschiedenis blijven behouden.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Titel</label>
              <input required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Gedachte / beschrijving</label>
              <textarea required rows={6} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text-primary)]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Thema / pijler</label>
                <input value={editTheme} onChange={(e) => setEditTheme(e.target.value)} placeholder="Bijv. autonomie" className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2.5 text-xs text-[var(--text-primary)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Categorie</label>
                <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Bijv. dienst, inzicht, product" className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2.5 text-xs text-[var(--text-primary)]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Tags (gescheiden door komma's)</label>
              <input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="idee, onderzoek, later" className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2.5 text-xs text-[var(--text-primary)]" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button type="button" onClick={() => setEditingIdeaId(null)} className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">Annuleren</button>
              <button type="submit" disabled={!editTitle.trim() || !editContent.trim()} className="px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--surface-1)] text-xs font-medium disabled:opacity-40">Wijzigingen bewaren</button>
            </div>
          </form>
        </div>
      )}

      </div>
    </div>
  );
};

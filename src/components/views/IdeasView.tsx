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
} from 'lucide-react';
import { Idea, Realm, ActiveWorldFilter } from '../../types';
import { requestIdeaAnalysis } from '../../lib/aiService';

interface IdeasViewProps {
  ideas: Idea[];
  activeWorld: ActiveWorldFilter;
  onSaveIdea: (idea: Partial<Idea>) => void;
  onConvertToProject: (ideaId: string) => void;
  onArchiveIdea: (ideaId: string) => void;
  onDeleteIdea: (ideaId: string) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
}

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
  const [quickRealm, setQuickRealm] = useState<Realm>(activeWorld === 'mariluna' ? 'mariluna' : 'personal');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setQuickRealm(activeWorld === 'mariluna' ? 'mariluna' : 'personal');
  }, [activeWorld]);

  // Identify ideas untouched for > 3 weeks (e.g. created before 2026-08-25)
  const today = new Date();
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(today.getDate() - 21);

  const untouchedIdeas = ideas.filter(
    (i) =>
      (activeWorld === 'all' || i.realm === activeWorld) &&
      i.status !== 'archived' &&
      i.status !== 'converted_to_project' &&
      new Date(i.createdAt) < threeWeeksAgo
  );

  const filteredIdeas = ideas.filter((i) => {
    if (activeWorld !== 'all' && i.realm !== activeWorld) return false;
    return true;
  });

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

                    <div className="flex items-center gap-2 shrink-0">
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
      </div>
    </div>
  );
};

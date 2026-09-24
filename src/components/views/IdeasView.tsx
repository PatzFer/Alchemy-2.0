import React, { useState } from 'react';
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
  const [quickRealm, setQuickRealm] = useState<Realm>('mariluna');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Identify ideas untouched for > 3 weeks (e.g. created before 2026-08-25)
  const today = new Date();
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(today.getDate() - 21);

  const untouchedIdeas = ideas.filter(
    (i) =>
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
    const analysis = await requestIdeaAnalysis(quickIdeaText, quickRealm);
    setIsAnalyzing(false);

    onSaveIdea({
      id: 'i-' + Date.now(),
      title: quickIdeaText.split('\n')[0].slice(0, 60),
      content: quickIdeaText,
      realm: quickRealm,
      category: analysis.category || (quickRealm === 'mariluna' ? 'strategy' : 'lifestyle'),
      status: 'raw',
      createdAt: new Date().toISOString().split('T')[0],
      lastRevisitedAt: new Date().toISOString().split('T')[0],
      aiSummary: analysis.summary,
      suggestedNextStep: analysis.suggestedNextAction,
      followUpQuestions: analysis.followUpQuestions || [],
    });

    setQuickIdeaText('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#E8E2D5] pb-5">
        <h1 className="font-serif text-3xl font-normal text-[#2C2825]">
          Brain Dump & Sparks
        </h1>
        <p className="text-xs text-[#7A7167] mt-1 font-light">
          Capture without cognitive friction. The assistant periodically revisits sparks to turn them into structured projects or peaceful archives.
        </p>
      </div>

      {/* Proactive Untouched Ideas Review Card */}
      {untouchedIdeas.length > 0 && (
        <div className="rounded-2xl border border-[#D5C6AF] bg-[#F7F2E7] p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-[#EFE6D5] text-[#8C7654]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-medium text-[#2C2825]">
                  Untouched Spark Revisited
                </h3>
                <span className="text-[10px] uppercase font-semibold text-[#8C7654] bg-[#EDE2CE] px-2 py-0.5 rounded-full">
                  Memory Loop
                </span>
              </div>
              <p className="text-xs text-[#6C6357] mt-1">
                You captured this thought over a month ago. Should we advance it, park it, or turn it into a dedicated project?
              </p>

              <div className="mt-3 space-y-2">
                {untouchedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E2D8C7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-serif font-medium text-[#2C2825]">
                          {idea.title}
                        </span>
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#EAE4D7] text-[#554C42]">
                          {idea.realm}
                        </span>
                      </div>
                      <p className="text-xs text-[#7A7167] mt-0.5 line-clamp-2">
                        {idea.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onConvertToProject(idea.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Form Project</span>
                      </button>
                      <button
                        onClick={() => onArchiveIdea(idea.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#DDD5C7] text-xs text-[#6C6358] hover:bg-[#F2ECE1] transition cursor-pointer"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => onDeleteIdea(idea.id)}
                        className="p-1.5 text-[#8C8377] hover:text-[#733] transition cursor-pointer"
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
      <div className="rounded-2xl border border-[#E5DFD3] bg-[#FFFFFF] p-5 shadow-xs">
        <form onSubmit={handleCaptureIdea} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5A524A] uppercase tracking-wider">
              Instant Capture
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuickRealm('personal')}
                className={`text-xs px-2.5 py-1 rounded-full transition cursor-pointer ${
                  quickRealm === 'personal'
                    ? 'bg-[#EAE4D7] text-[#4A433B] font-medium'
                    : 'text-[#8C8377]'
                }`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => setQuickRealm('mariluna')}
                className={`text-xs px-2.5 py-1 rounded-full transition cursor-pointer ${
                  quickRealm === 'mariluna'
                    ? 'bg-[#2C2825] text-[#F9F7F2] font-medium'
                    : 'text-[#8C8377]'
                }`}
              >
                Mariluna Studio
              </button>
            </div>
          </div>

          <textarea
            rows={3}
            required
            value={quickIdeaText}
            onChange={(e) => setQuickIdeaText(e.target.value)}
            placeholder="Type your fleeting thought, creative inspiration, or business seed..."
            className="w-full bg-[#FAF8F4] border border-[#DDD5C7] rounded-xl p-3 text-xs sm:text-sm text-[#2C2825] placeholder-[#9E958B] focus:outline-hidden focus:border-[#8C7654]"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#8C8377] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C5A880]" />
              AI will automatically categorize and recommend next inquiry steps
            </span>
            <button
              type="submit"
              disabled={!quickIdeaText.trim() || isAnalyzing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] disabled:opacity-40 transition cursor-pointer"
            >
              <span>{isAnalyzing ? 'Synthesizing...' : 'Capture Spark'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIdeas.map((idea) => {
          const isArchived = idea.status === 'archived';
          return (
            <div
              key={idea.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                isArchived
                  ? 'bg-[#F4F1EA]/50 border-[#DDD5C7] opacity-60'
                  : 'bg-[#FFFFFF] border-[#E8E1D4] hover:border-[#C4B9A7] shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-[#8C8377] uppercase tracking-wider font-semibold mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      idea.realm === 'mariluna'
                        ? 'bg-[#2C2825] text-[#F9F7F2]'
                        : 'bg-[#EAE4D7] text-[#554C42]'
                    }`}
                  >
                    {idea.realm}
                  </span>
                  <span>{idea.category}</span>
                </div>

                <h3 className="font-serif text-base font-medium text-[#2C2825]">
                  {idea.title}
                </h3>
                <p className="text-xs text-[#5A524A] mt-2 font-light leading-relaxed whitespace-pre-wrap">
                  {idea.content}
                </p>

                {/* AI Follow-up Questions if present */}
                {idea.followUpQuestions && idea.followUpQuestions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#F0EBE1] space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C7654] block">
                      Reflective Questions
                    </span>
                    {idea.followUpQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] text-[#695E52] italic bg-[#FAF7F2] p-2 rounded-lg"
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
                        { type: 'idea', id: idea.id, title: idea.title, details: idea }
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#8C7654] hover:text-[#2C2825] font-medium transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#8C7654]" />
                    <span>Bespreek met Alchemy</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-[#9E958B]">
                    Logged {idea.createdAt}
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onConvertToProject(idea.id)}
                    title="Promote to dedicated project"
                    className="p-1.5 rounded-lg text-[#6C6358] hover:text-[#2C2825] hover:bg-[#F2ECE1] transition cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onArchiveIdea(idea.id)}
                    title="Archive spark"
                    className="p-1.5 rounded-lg text-[#6C6358] hover:text-[#2C2825] hover:bg-[#F2ECE1] transition cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteIdea(idea.id)}
                    title="Delete permanently"
                    className="p-1.5 rounded-lg text-[#8C8377] hover:text-[#733] hover:bg-[#F2ECE1] transition cursor-pointer"
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

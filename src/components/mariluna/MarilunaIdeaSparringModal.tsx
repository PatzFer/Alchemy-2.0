import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  ArrowRight,
  ShieldCheck,
  FileText,
  Briefcase,
  CheckSquare,
  Clock,
  Bookmark,
  RefreshCw,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { Idea, ContentPlan, Project, Goal } from '../../types';
import { sendChatMessage } from '../../lib/aiService';

interface MarilunaIdeaSparringModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  contentPlan: ContentPlan;
  projects: Project[];
  goals: Goal[];
  onSaveIdeaNotes: (ideaId: string, notes: string) => void;
  onConvertToContent: (idea: Idea, initialTitle?: string, initialNotes?: string) => void;
  onConvertToProject: (idea: Idea, initialTitle?: string, initialDescription?: string) => void;
  onConvertToTask: (idea: Idea, initialTitle?: string) => void;
  onParkIdea: (ideaId: string) => void;
}

interface SparringMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const STRATEGIC_PROMPTS = [
  'Werk dit idee verder uit.',
  'Is hier een goede contentreeks van te maken?',
  'Welke invalshoeken zie je?',
  'Maak hier 5 mogelijke posts van.',
  'Wat ontbreekt er nog?',
  'Challenge mijn idee.',
  'Maak dit concreter.',
  'Hoe zou jij dit positioneren?',
  'Kan dit een groter project worden?',
];

export const MarilunaIdeaSparringModal: React.FC<MarilunaIdeaSparringModalProps> = ({
  isOpen,
  onClose,
  idea,
  contentPlan,
  projects,
  goals,
  onSaveIdeaNotes,
  onConvertToContent,
  onConvertToProject,
  onConvertToTask,
  onParkIdea,
}) => {
  const [messages, setMessages] = useState<SparringMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Initialize conversation when opened with an idea
  useEffect(() => {
    if (isOpen && idea) {
      const initialGreeting = `Ik heb je idee **"${idea.title}"** scherp voor ogen. 
${idea.content ? `\n> *${idea.content}*\n` : ''}
${idea.contentPillar ? `Pijler: **${idea.contentPillar}**` : ''}

Als strategisch klankbord denk ik kritisch mee over de diepgang, positionering en hefboomwerking. Waar wil je de focus op leggen?`;

      setMessages([
        {
          id: 'sparring-init',
          role: 'assistant',
          content: initialGreeting,
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      setMessages([]);
      setInputText('');
    }
  }, [isOpen, idea?.id]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  if (!isOpen || !idea) return null;

  const handleSendPrompt = async (promptToSend: string) => {
    if (!promptToSend.trim() || isThinking) return;

    const userMsg: SparringMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toISOString(),
    };

    const newThread = [...messages, userMsg];
    setMessages(newThread);
    setInputText('');
    setIsThinking(true);

    // Build STRICT Mariluna-only context. Zero personal domain / cycle / wellbeing data!
    const context = {
      activeIdea: {
        id: idea.id,
        title: idea.title,
        content: idea.content,
        pillar: idea.contentPillar,
        status: idea.status,
        tags: idea.tags,
      },
      contentPillars: contentPlan.pillars.map((p) => (typeof p === 'string' ? p : p.name)),
      existingProjects: projects
        .filter((p) => p.realm === 'mariluna')
        .map((p) => ({ title: p.title, status: p.status })),
      existingContentCount: contentPlan.posts.length,
      recentContentTitles: contentPlan.posts.slice(-5).map((cp) => cp.title),
      marilunaGoals: goals
        .filter((g) => g.realm === 'mariluna')
        .map((g) => ({ title: g.title, progress: g.progress })),
      sparringRoleInstruction: `You are acting as senior strategic brand & editorial sparring partner in Mariluna Atelier.
CRITICAL MANDATE:
- Do NOT simply agree with or flatter the user.
- Constructively challenge assumptions: is this too generic? Is it aligned with high-end sovereignty and quiet luxury? Is the scope too broad or too shallow?
- Proactively suggest concrete hooks, contrasting angles, or formats.
- NEVER mention or leak personal domain data (cycle, personal health, measurements, personal style).`,
    };

    const historyPayload = newThread.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await sendChatMessage(historyPayload, context, 'mariluna');
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: response.id || 'ast-' + Date.now(),
          role: 'assistant',
          content: response.content,
          timestamp: response.timestamp || new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Sparring error:', err);
      setIsThinking(false);
      // Fallback response with genuine strategic insight
      setMessages((prev) => [
        ...prev,
        {
          id: 'ast-' + Date.now(),
          role: 'assistant',
          content: generateLocalSparringResponse(idea, promptToSend),
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  // Helper for grounded fallback sparring when offline or before API key entered
  const generateLocalSparringResponse = (currentIdea: Idea, prompt: string): string => {
    const title = currentIdea.title;
    if (prompt.includes('Challenge')) {
      return `Strategische challenge op **"${title}"**:
1. **Het risico op herhaling**: Is deze invalshoek echt onderscheidend voor Mariluna, of voelt het als advies dat elke creatieve studio zou kunnen geven?
2. **De kernspanning**: Wat is het taboe of de tegenintuïtieve waarheid hier? Een lezer blijft alleen hangen als je een gangbare aanname doorbreekt.
3. **Conversie & relevantie**: Waar leidt dit idee uiteindelijk naartoe? Versterkt het je gezag of voelt het puur als 'ruis' op de tijdlijn?`;
    }
    if (prompt.includes('contentreeks') || prompt.includes('5 mogelijke posts')) {
      return `Hier is een gerichte 5-delige contentreeks rondom **"${title}"**:
- **Post 1 (De Prikkel)**: Het ongemakkelijke inzicht over dit thema. *(Format: Carousel)*
- **Post 2 (De Fout)**: Waarom de standaardoplossing meestal averechts werkt. *(Format: Essay / Tekstpost)*
- **Post 3 (Achter de schermen)**: Hoe wij dit binnen Mariluna concreet aanpakken. *(Format: Reel / Story)*
- **Post 4 (De Methode)**: 3 heldere principes die direct soevereiniteit teruggeven. *(Format: Carousel)*
- **Post 5 (De Uitnodiging)**: Verbinding maken met je aanbod of diepere samenwerking. *(Format: Newsletter / Journal)*`;
    }
    if (prompt.includes('groter project')) {
      return `Ja, **"${title}"** heeft de signatuur van een overkoepelend project. 
In plaats van eenmalige content kun je dit structureren als:
- Een exclusieve workshop of client masterclass
- Een signature methodiek voor je branding
- Een diepgaand redactioneel dossier (whitepaper / journal serie)
Wil je dat we hier een formeel **Project** van maken zodat je er taken en deliverables aan kunt koppelen?`;
    }
    return `Reflectie op **"${title}"**:
Als we dit scherper positioneren binnen Mariluna, wil je focussen op de hefboomwerking. Zorg dat je niet alleen beschrijft wát het is, maar waarom het voor de doelgroep van Mariluna een onmisbaar referentiepunt wordt.

Kies hieronder een vervolgstap: wil je dit vertalen naar content, een project opzetten, of een concrete taak inplannen?`;
  };

  // Save conversation insights into idea notes
  const handleSaveAsIdeaNotes = () => {
    const conversationSummary = messages
      .filter((m) => m.role === 'assistant' && m.id !== 'sparring-init')
      .map((m) => m.content)
      .join('\n\n---\n\n');

    const updatedNotes = idea.sparringNotes
      ? `${idea.sparringNotes}\n\n[Sparring ${new Date().toLocaleDateString('nl-NL')}]:\n${conversationSummary}`
      : `[Sparring ${new Date().toLocaleDateString('nl-NL')}]:\n${conversationSummary}`;

    onSaveIdeaNotes(idea.id, updatedNotes);
    setSavedNotice('Inzichten bewaard bij idee!');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/50 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-[#FAF8F4] border border-[#DDD4C5] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D6] bg-[#F4EFE6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2C2825] flex items-center justify-center text-[#FAF8F3] shadow-xs">
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base sm:text-lg font-semibold text-[#2C2825]">
                  Bespreek met Alchemy
                </h2>
                <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#E5DCCF] text-[#60564C] font-medium">
                  Studio Sparring
                </span>
              </div>
              <p className="text-xs text-[#7A7167]">
                Strategisch klankbord & kritische verfijning voor je ideeën
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#7A7167] hover:text-[#2C2825] hover:bg-[#EAE4D7] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Idea Focus Card */}
        <div className="px-4 py-3 bg-[#FAF8F3] border-b border-[#EAE3D5] shrink-0">
          <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E3DBD0] shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-[#8C7654] tracking-wider">
                Focus Idee
              </span>
              {idea.contentPillar && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4EFE6] text-[#6B5E4E] font-medium">
                  {idea.contentPillar}
                </span>
              )}
            </div>
            <h3 className="font-serif text-sm font-semibold text-[#2C2825]">{idea.title}</h3>
            {idea.content && (
              <p className="text-xs text-[#7A7167] line-clamp-2 leading-relaxed">{idea.content}</p>
            )}
          </div>
        </div>

        {/* Strategic Prompt Pills */}
        <div className="px-4 py-2 bg-[#F6F2EB] border-b border-[#EDE7DB] overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
          {STRATEGIC_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isThinking}
              onClick={() => handleSendPrompt(prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-[#FFFFFF] border border-[#E0D7C9] text-[#554C42] hover:bg-[#2C2825] hover:text-[#FAF8F3] hover:border-[#2C2825] transition cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed transition-all ${
                    isUser
                      ? 'bg-[#2C2825] text-[#F9F7F2] rounded-tr-xs shadow-xs'
                      : 'bg-[#FFFFFF] text-[#2C2825] border border-[#EAE3D5] rounded-tl-xs shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-[#8C7654] italic p-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Alchemy reflecteert strategisch op je idee...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Feedback / Notification Bar */}
        {savedNotice && (
          <div className="bg-[#D9E4D4] text-[#2E4F2C] text-xs px-4 py-1.5 text-center font-medium shrink-0 animate-fade-in">
            ✓ {savedNotice}
          </div>
        )}

        {/* Actions After Sparring Bar */}
        <div className="p-3 bg-[#F2ECE1] border-t border-[#E5DFD3] shrink-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6E60] mb-2 flex items-center justify-between">
            <span>Vervolgacties na Sparring</span>
            <span className="text-[10px] normal-case text-[#8C7654] italic">
              Jij behoudt altijd de controle
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={handleSaveAsIdeaNotes}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-[#2C2825] text-[11px] font-medium hover:bg-[#FAF8F3] transition shadow-2xs cursor-pointer"
              title="Sla deze sparringnotities op bij het idee"
            >
              <Bookmark className="w-3 h-3 text-[#8C7654]" />
              <span>Bewaar als idee</span>
            </button>

            <button
              type="button"
              onClick={() => onConvertToContent(idea, idea.title, idea.content)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-[11px] font-medium hover:bg-[#433D37] transition shadow-2xs cursor-pointer"
              title="Zet dit idee om naar een contentbericht"
            >
              <FileText className="w-3 h-3 text-[#C5A880]" />
              <span>Maak content</span>
            </button>

            <button
              type="button"
              onClick={() => onConvertToProject(idea, idea.title, idea.content)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-[#2C2825] text-[11px] font-medium hover:bg-[#FAF8F3] transition shadow-2xs cursor-pointer"
              title="Maak hier een volwaardig project van"
            >
              <Briefcase className="w-3 h-3 text-[#8C7654]" />
              <span>Maak project</span>
            </button>

            <button
              type="button"
              onClick={() => onConvertToTask(idea, `Werk idee uit: ${idea.title}`)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-[#2C2825] text-[11px] font-medium hover:bg-[#FAF8F3] transition shadow-2xs cursor-pointer"
              title="Maak hier een concrete taak van"
            >
              <CheckSquare className="w-3 h-3 text-[#8C7654]" />
              <span>Maak taak</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onParkIdea(idea.id);
                onClose();
              }}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-[#7A7167] text-[11px] font-medium hover:bg-[#FAF8F3] transition shadow-2xs cursor-pointer"
              title="Parkeer dit idee voor een later moment"
            >
              <Clock className="w-3 h-3 text-[#8C7654]" />
              <span>Plan voor later</span>
            </button>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-3 bg-[#FAF8F3] border-t border-[#E8E2D6] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Stel een vraag, vraag om feedback of daag Alchemy uit..."
              disabled={isThinking}
              className="flex-1 bg-[#FFFFFF] border border-[#DDD4C5] rounded-xl px-3.5 py-2 text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="p-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D37] transition disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  ArrowRight,
  Compass,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { AssistantMessage, Task, Goal, Idea, LifeProfile, MemoryItem, Realm, WellbeingState } from '../types';
import { sendChatMessage } from '../lib/aiService';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AssistantMessage[];
  onAddMessage: (msg: AssistantMessage) => void;
  tasks: Task[];
  goals: Goal[];
  ideas: Idea[];
  lifeProfile: LifeProfile;
  memories: MemoryItem[];
  activeWorld: 'all' | 'personal' | 'mariluna';
  onExecuteAction: (action: any) => void;
  wellbeing?: WellbeingState;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onAddMessage,
  tasks,
  goals,
  ideas,
  lifeProfile,
  memories,
  activeWorld,
  onExecuteAction,
  wellbeing,
}) => {
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    {
      label: 'Evaluate realistic day capacity',
      prompt: 'Review my day schedule and tasks. Tell me if I am at risk of overcrowding and how to protect my evening breathing room.',
      icon: Calendar,
    },
    {
      label: 'Brainstorm next theme angles',
      prompt: 'Let us brainstorm 3 fresh strategic content angles for Mariluna around our Q4 Sovereignty theme.',
      icon: Compass,
    },
    {
      label: 'Constructively challenge my priorities',
      prompt: 'Look at my current tasks. Challenge me honestly: are any of these low-leverage distractions disguised as productivity?',
      icon: ShieldCheck,
    },
    {
      label: 'Help me break down a goal',
      prompt: 'Help me break down my primary quarterly goal into three calm, non-punitive execution micro-tasks.',
      icon: Layers,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if (!textToSend || isThinking) return;

    const userMessage: AssistantMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    onAddMessage(userMessage);
    if (!customPrompt) setInputText('');
    setIsThinking(true);

    // Build system context
    const context = {
      activeTasksCount: tasks.filter((t) => t.status !== 'completed').length,
      topTasks: tasks.filter((t) => t.status !== 'completed').slice(0, 5).map((t) => ({
        title: t.title,
        realm: t.realm,
        duration: t.estimatedDuration,
        priority: t.priority,
      })),
      goals: goals.map((g) => ({ title: g.title, progress: g.progress, realm: g.realm })),
      workingHours: `${lifeProfile.workingHoursStart} - ${lifeProfile.workingHoursEnd}`,
      preferences: lifeProfile.preferences,
      memoriesSample: memories.map((m) => m.content),
      wellbeing:
        wellbeing && wellbeing.preferences.allowWellbeingDataToAI
          ? {
              focusTheme: wellbeing.currentWeeklyMovement.focusTheme,
              todaySession: wellbeing.currentWeeklyMovement.sessions[0]?.title,
              dietaryStyle: wellbeing.preferences.foodPreferences.dietaryStyle,
              allowedToAI: true,
            }
          : undefined,
    };

    const historyPayload = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await sendChatMessage(historyPayload, context, activeWorld);
    setIsThinking(false);
    onAddMessage(response);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1A1816]/30 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-lg bg-[#FAF8F4] h-full shadow-2xl flex flex-col border-l border-[#E5DFD3] animate-slide-in">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D6] bg-[#F4EFE6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EADFCF] border border-[#D5C6B1] flex items-center justify-center text-[#7E694E] shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-semibold text-[#2C2825] tracking-wide">
                  Strategic Partner
                </h2>
                <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#E5DCCF] text-[#60564C] font-medium font-sans">
                  JARVIS
                </span>
              </div>
              <p className="text-xs text-[#7A7167]">
                Intelligent, grounded thinking partner for Life & Mariluna
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-assistant-btn"
            className="p-1.5 rounded-full text-[#7A7167] hover:text-[#2C2825] hover:bg-[#EAE4D7] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="px-4 py-2.5 bg-[#F6F2EB] border-b border-[#EDE7DB] overflow-x-auto scrollbar-none flex gap-2">
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.prompt)}
              className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-[#FFFFFF] border border-[#E0D7C9] text-[#554C42] hover:bg-[#F2ECE1] hover:text-[#2C2825] transition cursor-pointer"
            >
              <item.icon className="w-3 h-3 text-[#A8906E]" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed transition-all ${
                    isUser
                      ? 'bg-[#2C2825] text-[#F9F7F2] rounded-tr-xs shadow-xs'
                      : 'bg-[#FFFFFF] text-[#2C2825] border border-[#EAE3D5] rounded-tl-xs shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Render Suggested Action Card if provided by AI */}
                  {msg.suggestedAction && (
                    <div className="mt-3 pt-3 border-t border-[#EAE3D5]">
                      <div className="text-[11px] font-medium text-[#8C7654] uppercase tracking-wider mb-1">
                        Suggested Direction
                      </div>
                      <button
                        onClick={() => onExecuteAction(msg.suggestedAction)}
                        className="flex items-center justify-between w-full p-2.5 rounded-xl bg-[#F8F5EE] border border-[#DDD5C7] hover:bg-[#EFE9DD] transition text-left cursor-pointer"
                      >
                        <span className="text-xs font-medium text-[#2C2825]">
                          {msg.suggestedAction.label}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8C7654]" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#9E958B] mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex items-center gap-2 p-3 bg-[#FFFFFF] border border-[#EAE3D5] rounded-2xl w-fit text-xs text-[#7A7167]">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880] animate-spin" />
              <span>Contemplating schedule and strategic context...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#E8E2D6] bg-[#FAF8F4]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask for strategic advice, plan adjustments, ideas..."
              className="flex-1 bg-[#FFFFFF] border border-[#D8D0C2] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#2C2825] placeholder-[#9E958B] focus:outline-hidden focus:border-[#8C7654] focus:ring-1 focus:ring-[#8C7654]/40 transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              id="assistant-submit-btn"
              className="p-2.5 rounded-xl bg-[#2C2825] text-[#F9F7F2] hover:bg-[#453E38] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 text-[10px] text-[#9A9084] px-1">
            <span>Server-Side Gemini 3.8 Flash • Contextual Memory Active</span>
            <span>Focus: {activeWorld}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

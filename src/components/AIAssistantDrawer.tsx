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
import { AssistantMessage, Task, Goal, Idea, LifeProfile, MemoryItem, Realm, WellbeingState, Project, CalendarEvent, ContentPlan, MarilunaOffering, DailyCheckIn } from '../types';
import { sendChatMessage } from '../lib/aiService';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AssistantMessage[];
  onAddMessage: (msg: AssistantMessage) => void;
  tasks: Task[];
  goals: Goal[];
  ideas: Idea[];
  projects?: Project[];
  calendarEvents?: CalendarEvent[];
  contentPlan?: ContentPlan;
  offerings?: MarilunaOffering[];
  lifeProfile: LifeProfile;
  memories: MemoryItem[];
  activeWorld: 'all' | 'personal' | 'mariluna';
  onExecuteAction: (action: any) => void;
  wellbeing?: WellbeingState;
  dailyCheckIns?: DailyCheckIn[];
  activeContextItem?: any;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onAddMessage,
  tasks,
  goals,
  ideas,
  projects = [],
  calendarEvents = [],
  contentPlan,
  offerings = [],
  lifeProfile,
  memories,
  activeWorld,
  onExecuteAction,
  wellbeing,
  dailyCheckIns = [],
  activeContextItem,
}) => {
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMsgIdRef = useRef<string | null>(null);

  const quickPrompts = [
    {
      label: 'Evaluate realistic day capacity',
      prompt: 'Evaluate realistic day capacity.',
      icon: Calendar,
    },
    {
      label: 'Brainstorm next theme angles',
      prompt: 'Brainstorm 3 fresh strategic content angles for Mariluna around our Q4 Sovereignty theme.',
      icon: Compass,
    },
    {
      label: 'Constructively challenge priorities',
      prompt: 'Look at my current tasks. Challenge me honestly: are any of these low-leverage distractions disguised as productivity?',
      icon: ShieldCheck,
    },
    {
      label: 'Help me break down a goal',
      prompt: 'Help me break down my primary goal into three calm, non-punitive execution micro-tasks.',
      icon: Layers,
    },
  ];

  const buildContextPayload = (customContextItem?: any) => {
    return {
      currentDate: new Date().toISOString().split('T')[0],
      currentDayOfWeek: new Date().toLocaleDateString('nl-NL', { weekday: 'long' }),
      activeWorld,
      activeContextItem: customContextItem || activeContextItem,
      calendarEvents: (calendarEvents || []).map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        category: e.category,
        realm: e.realm,
      })),
      tasks: (tasks || []).map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        status: t.status,
        priority: t.priority,
        realm: t.realm,
        estimatedDuration: t.estimatedDuration,
      })),
      projects: (projects || []).map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        realm: p.realm,
        targetDate: p.targetDate,
        description: p.description,
      })),
      ideas: (ideas || []).map((i) => ({
        id: i.id,
        title: i.title,
        content: i.content,
        pillar: i.contentPillar,
        status: i.status,
        realm: i.realm,
      })),
      goals: (goals || []).map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        progress: g.progress,
        timeframe: g.timeframe,
        startDate: g.startDate,
        endDate: g.endDate,
        targetDate: g.targetDate,
        realm: g.realm,
        status: g.status,
      })),
      contentPlan: contentPlan ? {
        quarterTheme: contentPlan.quarterTheme,
        monthlyTheme: contentPlan.monthlyTheme,
        pillars: contentPlan.pillars,
        recentPosts: contentPlan.posts?.slice(-5).map((p) => ({ title: p.title, status: p.status, pillar: p.pillar })),
      } : undefined,
      offerings: (offerings || []).map((o) => ({
        id: o.id,
        title: o.title,
        type: o.type,
        price: o.price,
        description: o.description,
        status: o.status,
      })),
      workingHours: `${lifeProfile.workingHoursStart} - ${lifeProfile.workingHoursEnd}`,
      preferences: lifeProfile.preferences,
      memoriesSample: (memories || []).map((m) => m.content),
      wellbeing:
        wellbeing && wellbeing.preferences?.allowWellbeingDataToAI
          ? {
              focusTheme: wellbeing.currentWeeklyMovement?.focusTheme,
              todaySession: wellbeing.currentWeeklyMovement?.sessions?.[0]?.title,
              dietaryStyle: wellbeing.preferences?.foodPreferences?.dietaryStyle,
              allowedToAI: true,
            }
          : undefined,
      dailyCheckIns:
        activeWorld !== 'mariluna' && (wellbeing?.preferences?.allowWellbeingDataToAI || lifeProfile?.preferences?.allowPersonalDataToAI)
          ? (dailyCheckIns || []).slice(0, 10).map((c) => ({
              date: c.date,
              energy: c.energy,
              mood: c.mood,
              wakeTime: c.wakeTime,
              sleepTime: c.sleepTime,
              notes: c.notes,
            }))
          : undefined,
    };
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking]);

  // Auto-trigger response when opened with a user message that has no assistant reply yet
  useEffect(() => {
    if (!isOpen || isThinking || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'user' && lastMsg.id !== lastProcessedMsgIdRef.current) {
      lastProcessedMsgIdRef.current = lastMsg.id;
      setIsThinking(true);

      const context = buildContextPayload();
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      sendChatMessage(historyPayload, context, activeWorld)
        .then((response) => {
          setIsThinking(false);
          onAddMessage(response);
        })
        .catch((err) => {
          console.error('Error in assistant auto-response:', err);
          setIsThinking(false);
        });
    }
  }, [isOpen, messages, isThinking, activeWorld]);

  const handleSend = async (customPrompt?: string, customContextItem?: any) => {
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
    lastProcessedMsgIdRef.current = userMessage.id;

    const context = buildContextPayload(customContextItem);
    const historyPayload = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await sendChatMessage(historyPayload, context, activeWorld);
      setIsThinking(false);
      onAddMessage(response);
    } catch (err) {
      console.error('Error sending message:', err);
      setIsThinking(false);
    }
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

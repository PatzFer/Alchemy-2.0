import React, { useState } from 'react';
import {
  Briefcase,
  Compass,
  FileText,
  DollarSign,
  Users,
  Sparkles,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { ContentPlan, ContentPost, Project, Task } from '../../types';

interface MarilunaHubViewProps {
  contentPlan: ContentPlan;
  projects: Project[];
  tasks: Task[];
  onAddContentPost: (post: Partial<ContentPost>) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
}

export const MarilunaHubView: React.FC<MarilunaHubViewProps> = ({
  contentPlan,
  projects,
  tasks,
  onAddContentPost,
  onOpenAssistantWithPrompt,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'projects' | 'offerings' | 'finances'>('content');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postPlatform, setPostPlatform] = useState<ContentPost['platform']>('Newsletter');
  const [postPillar, setPostPillar] = useState(contentPlan.pillars[0] || 'Sovereignty & Agency');

  const businessTasks = tasks.filter((t) => t.realm === 'mariluna');
  const marilunaProjects = projects.filter((p) => p.realm === 'mariluna');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;

    onAddContentPost({
      id: 'cp-' + Date.now(),
      title: postTitle,
      platform: postPlatform,
      pillar: postPillar,
      status: 'idea',
      scheduledDate: new Date().toISOString().split('T')[0],
    });

    setPostTitle('');
    setIsPostModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Editorial Luxury Header for Mariluna */}
      <div className="rounded-3xl border border-[#D5C6AF] bg-[#23201D] text-[#FAF8F5] p-6 sm:p-8 shadow-md relative overflow-hidden">
        {/* Subtle decorative gold accent line */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#C5A880]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#C5A880] font-sans font-semibold">
              <span>Studio & Enterprise</span>
              <span>•</span>
              <span>Q4 Horizon</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight mt-1">
              Mariluna Atelier
            </h1>
            <p className="text-xs sm:text-sm text-[#D8D0C5] mt-2 max-w-xl font-light leading-relaxed">
              Theme: <strong className="text-[#FAF8F5] font-medium">"{contentPlan.quarterTheme}"</strong>
              <br />
              Unhurried authority, conscious agency, and bespoke creative excellence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                onOpenAssistantWithPrompt(
                  'Act as my high-level business strategist for Mariluna. Review my content pipeline, current offerings, and Q4 revenue targets with calm discernment.'
                )
              }
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#C5A880] bg-[#C5A880]/15 text-[#FAF8F5] text-xs font-medium hover:bg-[#C5A880]/25 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Strategic Review</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-[#3E3832] flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'content', label: 'Content Architecture' },
            { id: 'projects', label: 'Strategic Projects' },
            { id: 'offerings', label: 'Products & Offerings' },
            { id: 'finances', label: 'Financial Snapshot' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full transition cursor-pointer shrink-0 ${
                activeSubTab === tab.id
                  ? 'bg-[#FAF8F5] text-[#23201D] font-medium shadow-xs'
                  : 'text-[#B8AEA2] hover:text-[#FAF8F5] hover:bg-[#342F2A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SubTab 1: Content Planning */}
      {activeSubTab === 'content' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-medium text-[#2C2825]">
                Content Editorial & Pillars
              </h2>
              <p className="text-xs text-[#7A7167] mt-0.5">
                Monthly Theme: <em>"{contentPlan.monthlyTheme}"</em>
              </p>
            </div>

            <button
              onClick={() => setIsPostModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition shadow-xs cursor-pointer w-fit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Draft Content Piece</span>
            </button>
          </div>

          {/* Pillars Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {contentPlan.pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E5DFD3] text-center shadow-xs"
              >
                <span className="text-[10px] text-[#8C7654] uppercase tracking-wider font-semibold block mb-1">
                  Pillar 0{idx + 1}
                </span>
                <span className="font-serif text-xs font-medium text-[#2C2825] block">
                  {pillar}
                </span>
              </div>
            ))}
          </div>

          {/* Content Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {['idea', 'drafted', 'ready'].map((colStatus) => {
              const postsInCol = contentPlan.posts.filter((p) => p.status === colStatus);
              const label =
                colStatus === 'idea'
                  ? 'Raw Concepts'
                  : colStatus === 'drafted'
                  ? 'Drafts in Progress'
                  : 'Ready for Publication';

              return (
                <div
                  key={colStatus}
                  className="rounded-2xl border border-[#E8E1D4] bg-[#FAF8F4] p-4 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#EDE7DC] mb-3">
                    <span className="text-xs font-semibold text-[#2C2825] uppercase tracking-wider">
                      {label}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAE4D7] text-[#554C42] font-medium">
                      {postsInCol.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {postsInCol.length === 0 ? (
                      <p className="text-[11px] text-[#9A9084] italic py-6 text-center">
                        Column empty
                      </p>
                    ) : (
                      postsInCol.map((post) => (
                        <div
                          key={post.id}
                          className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E3DBD0] shadow-xs"
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#8C7654] font-semibold mb-1">
                            <span>{post.platform}</span>
                            {post.scheduledDate && <span>{post.scheduledDate}</span>}
                          </div>
                          <h4 className="font-serif text-sm font-medium text-[#2C2825]">
                            {post.title}
                          </h4>
                          <span className="inline-block mt-2 text-[10px] text-[#7A7167] bg-[#F4EFE6] px-2 py-0.5 rounded-md">
                            {post.pillar}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 2: Strategic Projects */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-medium text-[#2C2825]">
            Active Studio Initiatives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {marilunaProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5DFD3] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#8C8377] mb-2">
                    <span className="capitalize text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#2C2825] text-[#F9F7F2]">
                      {p.status}
                    </span>
                    {p.deadline && <span>Deadline: {p.deadline}</span>}
                  </div>
                  <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#6C6357] mt-1 font-light leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0EBE1]">
                  <div className="flex items-center justify-between text-xs text-[#7A7167] mb-1">
                    <span>Progress</span>
                    <span className="font-medium text-[#2C2825]">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#EFE9DE] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${p.progress}%` }}
                      className="h-full bg-[#C5A880] rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 3: Offerings */}
      {activeSubTab === 'offerings' && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-medium text-[#2C2825]">
            Portfolio of Offerings & Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                title: 'The Sovereign Woman Masterclass',
                type: 'Signature Cohort',
                price: '€1,850',
                status: 'Q4 Enrollment Open',
                desc: '8-week live intensive on creative sovereignty, leadership, and unhurried enterprise.',
              },
              {
                title: 'Private Atelier Advisory',
                type: '1:1 Bespoke Retainer',
                price: '€4,200 / mo',
                status: '2 Spots Open',
                desc: 'Strategic thinking partnership and brand positioning for discerning creative founders.',
              },
              {
                title: 'Contemplative Digital Tools',
                type: 'Digital Shop',
                price: '€85 – €220',
                status: 'Active Evergreen',
                desc: 'Guided audio rituals, editorial Notion frameworks, and aesthetic planning suites.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8E1D4] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#8C7654] uppercase tracking-wider font-semibold mb-2">
                    <span>{item.type}</span>
                    <span className="font-serif text-sm text-[#2C2825] font-normal">{item.price}</span>
                  </div>
                  <h3 className="font-serif text-base font-medium text-[#2C2825]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#6C6357] mt-2 font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs">
                  <span className="text-[#8C7654] font-medium text-[11px]">{item.status}</span>
                  <button
                    onClick={() =>
                      onOpenAssistantWithPrompt(
                        `Let's analyze launch strategy and conversion optimizations for "${item.title}".`
                      )
                    }
                    className="text-[#2C2825] hover:text-[#8C7654] font-medium text-[11px] underline cursor-pointer"
                  >
                    Strategize
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 4: Financial Snapshot */}
      {activeSubTab === 'finances' && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-medium text-[#2C2825]">
            Financial Grounding & Projections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8E1D4] shadow-xs">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8A8175]">
                Monthly Retainer Run-Rate
              </span>
              <div className="font-serif text-2xl text-[#2C2825] mt-1 font-light">€12,600</div>
              <span className="text-[11px] text-[#4A6343] mt-1 block">
                Stable baseline covering studio expenses
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8E1D4] shadow-xs">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8A8175]">
                Q4 Masterclass Projection
              </span>
              <div className="font-serif text-2xl text-[#2C2825] mt-1 font-light">€37,000</div>
              <span className="text-[11px] text-[#8C7654] mt-1 block">
                Target: 20 sovereign cohort participants
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8E1D4] shadow-xs">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8A8175]">
                Healthy Buffer Margin
              </span>
              <div className="font-serif text-2xl text-[#2C2825] mt-1 font-light">6.5 Months</div>
              <span className="text-[11px] text-[#7A7167] mt-1 block">
                Preserving peace and non-urgency in decision making
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#FAF8F3] border border-[#E3DCD0] p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-medium text-[#2C2825] mb-4">
              Schedule Editorial Content
            </h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">Title or Topic</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Why hurried urgency is the enemy of true luxury"
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">Platform</label>
                  <select
                    value={postPlatform}
                    onChange={(e) => setPostPlatform(e.target.value as any)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  >
                    <option value="Newsletter">Newsletter</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Journal / Blog">Journal / Blog</option>
                    <option value="Podcast">Podcast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">Pillar</label>
                  <select
                    value={postPillar}
                    onChange={(e) => setPostPillar(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  >
                    {contentPlan.pillars.map((p, idx) => (
                      <option key={idx} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8E2D6]">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#EFE9DE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38]"
                >
                  Add to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

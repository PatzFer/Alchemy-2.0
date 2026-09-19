import React, { useState } from 'react';
import {
  Receipt,
  FileText,
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Briefcase,
  Target,
  Edit3,
  Trash2,
  Repeat,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import {
  MarilunaAdminState,
  MarilunaAdminItem,
  MarilunaExpense,
  MarilunaInvoice,
  MarilunaTaxDeadline,
  AdminItemFrequency,
  AdminItemStatus,
  Project,
  Goal,
  Task,
} from '../../types';

interface MarilunaAdminSectionProps {
  adminState: MarilunaAdminState;
  onUpdateAdminState?: (admin: MarilunaAdminState) => void;
  projects?: Project[];
  goals?: Goal[];
  tasks?: Task[];
  onSaveTask?: (task: Partial<Task>) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
  isNl?: boolean;
}

type AdminViewTab = 'overview' | 'tasks' | 'invoices' | 'expenses';

export const MarilunaAdminSection: React.FC<MarilunaAdminSectionProps> = ({
  adminState,
  onUpdateAdminState,
  projects = [],
  goals = [],
  tasks = [],
  onSaveTask,
  onOpenAssistantWithPrompt,
  isNl = true,
}) => {
  const [activeTab, setActiveTab] = useState<AdminViewTab>('overview');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);

  // Edit targets
  const [editingItem, setEditingItem] = useState<MarilunaAdminItem | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<MarilunaInvoice | null>(null);
  const [editingExpense, setEditingExpense] = useState<MarilunaExpense | null>(null);
  const [editingDeadline, setEditingDeadline] = useState<MarilunaTaxDeadline | null>(null);

  // Expanded items for mobile readability
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Filter & Search
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  const adminItems: MarilunaAdminItem[] = adminState.items || [];
  const invoices: MarilunaInvoice[] = adminState.invoices || [];
  const expenses: MarilunaExpense[] = adminState.expenses || [];
  const deadlines: MarilunaTaxDeadline[] = adminState.deadlines || [];

  // Financial Quick Calculations (only from real user data)
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
  const totalPaidRevenue = paidInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const openInvoices = invoices.filter((inv) => inv.status === 'sent' || inv.status === 'overdue');
  const totalOpenAmount = openInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  // Calculations: only show result if user has recorded either invoices or expenses
  const hasFinancialData = invoices.length > 0 || expenses.length > 0;
  const netResult = totalPaidRevenue - totalExpenses;

  // Upcoming Dates (Deadlines + Invoices due + Admin Items with due date)
  const combinedUpcomingDates = [
    ...deadlines
      .filter((d) => !d.completed)
      .map((d) => ({
        id: 'deadline-' + d.id,
        rawId: d.id,
        title: d.title,
        dueDate: d.dueDate,
        type: 'deadline' as const,
        category: d.type,
        notes: d.notes,
        completed: d.completed,
      })),
    ...invoices
      .filter((i) => i.status === 'sent' || i.status === 'overdue')
      .map((i) => ({
        id: 'invoice-' + i.id,
        rawId: i.id,
        title: `${isNl ? 'Vervaldatum Factuur' : 'Invoice Due'}: ${i.invoiceNumber} (${i.clientName})`,
        dueDate: i.dueDate,
        type: 'invoice' as const,
        amount: i.amount,
        notes: i.notes,
        completed: false,
      })),
    ...adminItems
      .filter((item) => item.status !== 'completed' && item.dueDate)
      .map((item) => ({
        id: 'item-' + item.id,
        rawId: item.id,
        title: item.title,
        dueDate: item.dueDate!,
        type: 'admin_item' as const,
        category: item.category,
        priority: item.priority,
        notes: item.notes,
        completed: false,
      })),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Handlers for Admin Items
  const handleSaveAdminItem = (itemPayload: Partial<MarilunaAdminItem>, createCentralTask: boolean = false) => {
    if (!onUpdateAdminState) return;

    let updatedItems: MarilunaAdminItem[];
    const isEdit = !!itemPayload.id && adminItems.some((i) => i.id === itemPayload.id);

    if (isEdit) {
      updatedItems = adminItems.map((item) =>
        item.id === itemPayload.id ? ({ ...item, ...itemPayload } as MarilunaAdminItem) : item
      );
    } else {
      const newItemId = itemPayload.id || 'adm-' + Date.now();
      let linkedTaskId = itemPayload.linkedTaskId;

      // Central Task Integration: create task in central task system if requested
      if (createCentralTask && onSaveTask) {
        const taskId = 't-' + Date.now();
        linkedTaskId = taskId;
        onSaveTask({
          id: taskId,
          title: itemPayload.title || (isNl ? 'Administratieve taak' : 'Admin Task'),
          description: itemPayload.description || '',
          realm: 'mariluna',
          category: 'admin',
          priority: itemPayload.priority === 'high' ? 'high' : 'medium',
          dueDate: itemPayload.dueDate || todayStr,
          estimatedDuration: 30,
          recurring: itemPayload.recurring === 'none' ? 'none' : 'weekly',
          status: 'todo',
          subtasks: [],
          createdAt: todayStr,
        });
      }

      const newItem: MarilunaAdminItem = {
        id: newItemId,
        title: itemPayload.title || (isNl ? 'Nieuw administratief item' : 'New admin item'),
        description: itemPayload.description || '',
        category: itemPayload.category || 'ADMIN',
        priority: itemPayload.priority || 'normal',
        dueDate: itemPayload.dueDate,
        recurring: itemPayload.recurring || 'none',
        customRecurringInterval: itemPayload.customRecurringInterval,
        status: itemPayload.status || 'todo',
        notes: itemPayload.notes || '',
        amount: itemPayload.amount,
        reference: itemPayload.reference,
        projectId: itemPayload.projectId,
        goalId: itemPayload.goalId,
        linkedTaskId,
        createdAt: todayStr,
      };
      updatedItems = [newItem, ...adminItems];
    }

    onUpdateAdminState({
      ...adminState,
      items: updatedItems,
    });

    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handleToggleAdminItemStatus = (item: MarilunaAdminItem) => {
    if (!onUpdateAdminState) return;

    if (item.status === 'completed') {
      // Revert to todo
      const updated = adminItems.map((i) =>
        i.id === item.id ? { ...i, status: 'todo' as AdminItemStatus } : i
      );
      onUpdateAdminState({ ...adminState, items: updated });
    } else {
      // Mark as completed.
      // If recurring, generate the next occurrence without duplicating unrelated information!
      let nextItem: MarilunaAdminItem | null = null;
      if (item.recurring && item.recurring !== 'none') {
        const currentDueDate = item.dueDate ? new Date(item.dueDate) : new Date();
        const nextDate = new Date(currentDueDate);

        if (item.recurring === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (item.recurring === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (item.recurring === 'quarterly') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (item.recurring === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else if (item.recurring === 'custom') {
          nextDate.setMonth(nextDate.getMonth() + 2); // Default custom interval
        }

        const nextDueDateStr = nextDate.toISOString().split('T')[0];

        nextItem = {
          id: 'adm-' + Date.now(),
          title: item.title,
          description: item.description,
          category: item.category,
          priority: item.priority,
          dueDate: nextDueDateStr,
          recurring: item.recurring,
          customRecurringInterval: item.customRecurringInterval,
          status: 'todo',
          notes: item.notes,
          amount: item.amount,
          reference: item.reference,
          projectId: item.projectId,
          goalId: item.goalId,
          createdAt: todayStr,
        };
      }

      const updated = adminItems.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'completed' as AdminItemStatus,
              lastCompletedDate: todayStr,
            }
          : i
      );

      onUpdateAdminState({
        ...adminState,
        items: nextItem ? [nextItem, ...updated] : updated,
      });
    }
  };

  const handleDeleteAdminItem = (id: string) => {
    if (!onUpdateAdminState) return;
    onUpdateAdminState({
      ...adminState,
      items: adminItems.filter((i) => i.id !== id),
    });
  };

  // Handlers for Invoices
  const handleSaveInvoice = (invoicePayload: Partial<MarilunaInvoice>) => {
    if (!onUpdateAdminState) return;
    let updatedInvoices: MarilunaInvoice[];
    const isEdit = !!invoicePayload.id && invoices.some((i) => i.id === invoicePayload.id);

    if (isEdit) {
      updatedInvoices = invoices.map((inv) =>
        inv.id === invoicePayload.id ? ({ ...inv, ...invoicePayload } as MarilunaInvoice) : inv
      );
    } else {
      const newInv: MarilunaInvoice = {
        id: invoicePayload.id || 'inv-' + Date.now(),
        invoiceNumber:
          invoicePayload.invoiceNumber?.trim() ||
          `ML-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(3, '0')}`,
        clientName: invoicePayload.clientName?.trim() || (isNl ? 'Klant' : 'Client'),
        amount: Number(invoicePayload.amount) || 0,
        date: invoicePayload.date || todayStr,
        dueDate: invoicePayload.dueDate || todayStr,
        status: invoicePayload.status || 'draft',
        notes: invoicePayload.notes,
        projectId: invoicePayload.projectId,
        goalId: invoicePayload.goalId,
        reference: invoicePayload.reference,
      };
      updatedInvoices = [newInv, ...invoices];
    }

    onUpdateAdminState({
      ...adminState,
      invoices: updatedInvoices,
    });
    setIsInvoiceModalOpen(false);
    setEditingInvoice(null);
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: MarilunaInvoice['status']) => {
    if (!onUpdateAdminState) return;
    onUpdateAdminState({
      ...adminState,
      invoices: invoices.map((inv) => (inv.id === invoiceId ? { ...inv, status } : inv)),
    });
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (!onUpdateAdminState) return;
    onUpdateAdminState({
      ...adminState,
      invoices: invoices.filter((inv) => inv.id !== invoiceId),
    });
  };

  // Handlers for Expenses
  const handleSaveExpense = (expensePayload: Partial<MarilunaExpense>) => {
    if (!onUpdateAdminState) return;
    let updatedExpenses: MarilunaExpense[];
    const isEdit = !!expensePayload.id && expenses.some((e) => e.id === expensePayload.id);

    if (isEdit) {
      updatedExpenses = expenses.map((exp) =>
        exp.id === expensePayload.id ? ({ ...exp, ...expensePayload } as MarilunaExpense) : exp
      );
    } else {
      const newExp: MarilunaExpense = {
        id: expensePayload.id || 'exp-' + Date.now(),
        description: expensePayload.description?.trim() || (isNl ? 'Uitgave' : 'Expense'),
        amount: Number(expensePayload.amount) || 0,
        vatAmount: expensePayload.vatAmount ? Number(expensePayload.vatAmount) : undefined,
        date: expensePayload.date || todayStr,
        category: expensePayload.category || 'software',
        paid: expensePayload.paid ?? true,
        notes: expensePayload.notes,
        projectId: expensePayload.projectId,
        goalId: expensePayload.goalId,
        reference: expensePayload.reference,
        receiptRef: expensePayload.receiptRef,
      };
      updatedExpenses = [newExp, ...expenses];
    }

    onUpdateAdminState({
      ...adminState,
      expenses: updatedExpenses,
    });
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!onUpdateAdminState) return;
    onUpdateAdminState({
      ...adminState,
      expenses: expenses.filter((exp) => exp.id !== expenseId),
    });
  };

  // Handlers for Deadlines / Important Dates
  const handleSaveDeadline = (deadlinePayload: Partial<MarilunaTaxDeadline>) => {
    if (!onUpdateAdminState) return;
    let updatedDeadlines: MarilunaTaxDeadline[];
    const isEdit = !!deadlinePayload.id && deadlines.some((d) => d.id === deadlinePayload.id);

    if (isEdit) {
      updatedDeadlines = deadlines.map((d) =>
        d.id === deadlinePayload.id ? ({ ...d, ...deadlinePayload } as MarilunaTaxDeadline) : d
      );
    } else {
      const newDeadline: MarilunaTaxDeadline = {
        id: deadlinePayload.id || 'dl-' + Date.now(),
        title: deadlinePayload.title?.trim() || (isNl ? 'Belangrijke datum' : 'Important Date'),
        dueDate: deadlinePayload.dueDate || todayStr,
        type: deadlinePayload.type || 'other',
        completed: false,
        notes: deadlinePayload.notes,
        amount: deadlinePayload.amount,
        reference: deadlinePayload.reference,
        recurring: deadlinePayload.recurring || 'none',
        projectId: deadlinePayload.projectId,
        goalId: deadlinePayload.goalId,
      };
      updatedDeadlines = [newDeadline, ...deadlines];
    }

    onUpdateAdminState({
      ...adminState,
      deadlines: updatedDeadlines,
    });
    setIsDeadlineModalOpen(false);
    setEditingDeadline(null);
  };

  const handleToggleDeadline = (deadlineId: string) => {
    if (!onUpdateAdminState) return;
    onUpdateAdminState({
      ...adminState,
      deadlines: deadlines.map((d) =>
        d.id === deadlineId ? { ...d, completed: !d.completed } : d
      ),
    });
  };

  const handleDeleteDeadline = (deadlineId: string) => {
    if (!onUpdateAdminState) return;
    onUpdateAdminState({
      ...adminState,
      deadlines: deadlines.filter((d) => d.id !== deadlineId),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-normal text-[#2C2825]">
            {isNl ? 'Admin & Boekhouding' : 'Administration & Bookkeeping'}
          </h2>
          <p className="text-xs text-[#7A7167] mt-1 max-w-xl leading-relaxed">
            {isNl
              ? 'Overzicht van verplichtingen, facturen, uitgaven en belangrijke zakelijke data. Helder, discreet en praktisch.'
              : 'Keep track of obligations, invoices, expenses and important business dates calmly and clearly.'}
          </p>
        </div>

        {/* Quick Action Buttons (Mobile-first prioritized) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isNl ? 'Nieuw Item' : 'New Item'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingInvoice(null);
              setIsInvoiceModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D5CABB] bg-[#FAF8F3] text-[#2C2825] text-xs font-medium hover:bg-[#F2ECE1] transition shadow-xs cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>{isNl ? '+ Factuur' : '+ Invoice'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D5CABB] bg-[#FAF8F3] text-[#2C2825] text-xs font-medium hover:bg-[#F2ECE1] transition shadow-xs cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>{isNl ? '+ Uitgave' : '+ Expense'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingDeadline(null);
              setIsDeadlineModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D5CABB] bg-[#FAF8F3] text-[#2C2825] text-xs font-medium hover:bg-[#F2ECE1] transition shadow-xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>{isNl ? '+ Datum' : '+ Date'}</span>
          </button>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#EFE9DD] border border-[#DDD4C5] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#FAF8F3] text-[#2C2825] shadow-xs'
              : 'text-[#7A7167] hover:text-[#2C2825]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isNl ? 'Overzicht & Data' : 'Overview & Dates'}</span>
          {combinedUpcomingDates.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E2D8C9] text-[#2C2825]">
              {combinedUpcomingDates.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-[#FAF8F3] text-[#2C2825] shadow-xs'
              : 'text-[#7A7167] hover:text-[#2C2825]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isNl ? 'Taken & Verplichtingen' : 'Admin Tasks'}</span>
          {adminItems.filter((i) => i.status !== 'completed').length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E2D8C9] text-[#2C2825]">
              {adminItems.filter((i) => i.status !== 'completed').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-[#FAF8F3] text-[#2C2825] shadow-xs'
              : 'text-[#7A7167] hover:text-[#2C2825]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{isNl ? 'Facturen' : 'Invoices'}</span>
          {invoices.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E2D8C9] text-[#2C2825]">
              {invoices.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-[#FAF8F3] text-[#2C2825] shadow-xs'
              : 'text-[#7A7167] hover:text-[#2C2825]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{isNl ? 'Uitgaven' : 'Expenses'}</span>
          {expenses.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E2D8C9] text-[#2C2825]">
              {expenses.length}
            </span>
          )}
        </button>
      </div>

      {/* Financial Pulse Cards (Calculated from user inputs without fictional data) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-semibold text-[#8C7654] tracking-wider block">
            {isNl ? 'Gefactureerd (totaal)' : 'Total Invoiced'}
          </span>
          <div className="font-serif text-lg text-[#2C2825]">
            {invoices.length === 0 ? '—' : `€${totalInvoiced.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          </div>
          <p className="text-[10px] text-[#7A7167]">
            {invoices.length} {invoices.length === 1 ? (isNl ? 'factuur' : 'invoice') : (isNl ? 'facturen' : 'invoices')}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-semibold text-[#8C7654] tracking-wider block">
            {isNl ? 'Betaalde Omzet' : 'Paid Revenue'}
          </span>
          <div className="font-serif text-lg text-[#2C2825]">
            {paidInvoices.length === 0 ? '—' : `€${totalPaidRevenue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          </div>
          <p className="text-[10px] text-[#7A7167]">
            {paidInvoices.length} {isNl ? 'ontvangen' : 'received'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-semibold text-[#8C7654] tracking-wider block">
            {isNl ? 'Openstaand' : 'Open / Unpaid'}
          </span>
          <div className={`font-serif text-lg ${totalOpenAmount > 0 ? 'text-[#8C5E3C]' : 'text-[#2C2825]'}`}>
            {openInvoices.length === 0 ? '€0,00' : `€${totalOpenAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          </div>
          <p className="text-[10px] text-[#7A7167]">
            {openInvoices.length} {isNl ? 'wachtend op betaling' : 'awaiting payment'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-semibold text-[#8C7654] tracking-wider block">
            {isNl ? 'Geregistreerde Kosten' : 'Total Expenses'}
          </span>
          <div className="font-serif text-lg text-[#2C2825]">
            {expenses.length === 0 ? '—' : `€${totalExpenses.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          </div>
          <p className="text-[10px] text-[#7A7167]">
            {expenses.length} {isNl ? 'uitgaven ingevoerd' : 'expenses recorded'}
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. OVERZICHT & BELANGRIJKE DATA                              */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Important Dates & Deadlines */}
          <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8C7654]" />
                <h3 className="font-serif text-base font-medium text-[#2C2825]">
                  {isNl ? 'Belangrijke Zakelijke Data & Deadlines' : 'Important Business Dates & Deadlines'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingDeadline(null);
                  setIsDeadlineModalOpen(true);
                }}
                className="text-xs text-[#8C7654] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{isNl ? 'Datum toevoegen' : 'Add date'}</span>
              </button>
            </div>

            {/* Disclaimer & Context: No fictional Belgian tax dates */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F4EFE6] border border-[#E8E1D3] text-xs text-[#6E6458]">
              <AlertCircle className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isNl
                  ? 'Hier worden uitsluitend door jou ingevoerde datums en verplichtingen getoond (zoals BTW-deadlines, sociale bijdragen, factuurtermijnen of domeinverlengingen). Er worden geen fictieve verplichtingen verzonnen.'
                  : 'Only dates and deadlines entered by you are shown here. No legal or tax obligations are simulated.'}
              </p>
            </div>

            {combinedUpcomingDates.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-[#DCD3C4] text-center space-y-2">
                <p className="text-xs text-[#7A7167] italic">
                  {isNl ? 'Nog geen zakelijke data vastgelegd.' : 'No business dates recorded yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsDeadlineModalOpen(true)}
                  className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
                >
                  {isNl ? '+ Voeg je eerste deadline of vervaldatum toe' : '+ Add your first deadline'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {combinedUpcomingDates.map((item) => {
                  const isUrgent = item.dueDate <= todayStr;
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] flex items-center justify-between gap-3 text-xs hover:border-[#DDD4C5] transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.type === 'deadline' ? (
                          <button
                            type="button"
                            onClick={() => handleToggleDeadline(item.rawId)}
                            className="text-[#A89F91] hover:text-[#2C2825] cursor-pointer"
                            title={isNl ? 'Markeer als voltooid' : 'Mark completed'}
                          >
                            <Circle className="w-4 h-4" />
                          </button>
                        ) : item.type === 'admin_item' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const adminItem = adminItems.find((i) => i.id === item.rawId);
                              if (adminItem) handleToggleAdminItemStatus(adminItem);
                            }}
                            className="text-[#A89F91] hover:text-[#2C2825] cursor-pointer"
                          >
                            <Circle className="w-4 h-4" />
                          </button>
                        ) : (
                          <Receipt className="w-4 h-4 text-[#8C7654] shrink-0" />
                        )}

                        <div className="min-w-0">
                          <span className="font-medium text-[#2C2825] block truncate">
                            {item.title}
                          </span>
                          {item.notes && (
                            <span className="text-[11px] text-[#7A7167] block truncate">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.type === 'deadline' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDeadline(item.rawId)}
                            className="p-1 text-[#A89F91] hover:text-[#A64A38] transition cursor-pointer"
                            title={isNl ? 'Verwijderen' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span
                          className={`font-mono text-[11px] px-2 py-0.5 rounded-md font-medium ${
                            isUrgent
                              ? 'bg-[#F9ECE9] text-[#A64A38]'
                              : 'bg-[#F4EFE6] text-[#6E6458]'
                          }`}
                        >
                          {item.dueDate}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Sparring Prompt for Administration */}
          <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#EAE2D3] text-[#2C2825]">
                <Sparkles className="w-4 h-4 text-[#8C7654]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-medium text-[#2C2825]">
                  {isNl ? 'Boekhouding & Financiële Rust met Alchemy' : 'Financial Peace of Mind'}
                </h4>
                <p className="text-xs text-[#7A7167]">
                  {isNl
                    ? 'Spar met Alchemy over administratieve organisatie, kwartaalritmes en prioriteiten.'
                    : 'Spar with Alchemy on administrative clarity and recurring routines.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onOpenAssistantWithPrompt(
                  isNl
                    ? 'Ik wil graag even rustig mijn zakelijke administratie en komende verplichtingen voor Mariluna doornemen. Help me prioriteren wat als eerste moet gebeuren.'
                    : 'I would like to review my Mariluna administrative obligations and upcoming dates. Help me prioritize.'
                )
              }
              className="px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer shrink-0"
            >
              {isNl ? 'Bespreek met Alchemy' : 'Spar with Alchemy'}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TAKEN & VERPLICHTINGEN                                     */}
      {/* ============================================================ */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-normal text-[#2C2825]">
              {isNl ? 'Administratieve Taken & Terugkerende Verplichtingen' : 'Administrative Items'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Nieuw Item' : 'New Item'}</span>
            </button>
          </div>

          {adminItems.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-[#DCD3C4] text-center space-y-2">
              <p className="text-xs text-[#7A7167] italic">
                {isNl ? 'Nog geen administratieve items.' : 'No administrative items recorded.'}
              </p>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(true)}
                className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
              >
                {isNl ? '+ Voeg administratieve taak of verplichting toe' : '+ Add admin item'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {adminItems.map((item) => {
                const isCompleted = item.status === 'completed';
                const isExpanded = expandedItemId === item.id;
                const relatedProject = projects.find((p) => p.id === item.projectId);
                const relatedGoal = goals.find((g) => g.id === item.goalId);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleAdminItemStatus(item)}
                          className="mt-0.5 text-[#A89F91] hover:text-[#2C2825] transition cursor-pointer shrink-0"
                          title={isCompleted ? (isNl ? 'Heropenen' : 'Reopen') : (isNl ? 'Afronden' : 'Complete')}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-[#8C7654]" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#E8E1D5] text-[#554C42]">
                              {item.category}
                            </span>
                            {item.recurring && item.recurring !== 'none' && (
                              <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EAE2D3] text-[#8C7654] font-medium">
                                <Repeat className="w-3 h-3" />
                                <span>{item.recurring}</span>
                              </span>
                            )}
                            {item.priority === 'high' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F9ECE9] text-[#A64A38] font-medium">
                                {isNl ? 'Hoog' : 'High'}
                              </span>
                            )}
                          </div>

                          <h4
                            className={`font-serif text-base text-[#2C2825] font-medium ${
                              isCompleted ? 'line-through text-[#8C8377]' : ''
                            }`}
                          >
                            {item.title}
                          </h4>

                          {item.description && (
                            <p className="text-xs text-[#7A7167] leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsItemModalOpen(true);
                          }}
                          className="p-1.5 rounded-full hover:bg-[#EAE2D3] text-[#7A7167] hover:text-[#2C2825] transition cursor-pointer"
                          title={isNl ? 'Bewerken' : 'Edit'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdminItem(item.id)}
                          className="p-1.5 rounded-full hover:bg-[#F9ECE9] text-[#A89F91] hover:text-[#A64A38] transition cursor-pointer"
                          title={isNl ? 'Verwijderen' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="p-1.5 rounded-full hover:bg-[#EAE2D3] text-[#7A7167] transition cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Metadata strip */}
                    <div className="flex items-center gap-3 text-xs text-[#7A7167] flex-wrap pt-1 border-t border-[#ECE3D4]/60">
                      {item.dueDate && (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-[#8C7654]">
                          <Calendar className="w-3 h-3" />
                          <span>{item.dueDate}</span>
                        </span>
                      )}
                      {item.amount && (
                        <span className="font-mono text-[11px] text-[#2C2825] font-medium">
                          €{Number(item.amount).toFixed(2)}
                        </span>
                      )}
                      {item.reference && (
                        <span className="text-[11px] text-[#7A7167]">Ref: {item.reference}</span>
                      )}
                      {relatedProject && (
                        <span className="flex items-center gap-1 text-[11px] text-[#6E6458]">
                          <Briefcase className="w-3 h-3 text-[#8C7654]" />
                          <span>{relatedProject.title}</span>
                        </span>
                      )}
                      {relatedGoal && (
                        <span className="flex items-center gap-1 text-[11px] text-[#6E6458]">
                          <Target className="w-3 h-3 text-[#8C7654]" />
                          <span>{relatedGoal.title}</span>
                        </span>
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && item.notes && (
                      <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] text-xs text-[#6E6458] space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-[#8C7654] block">
                          {isNl ? 'Notities' : 'Notes'}
                        </span>
                        <p className="whitespace-pre-line leading-relaxed">{item.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. FACTUREN (Invoices Tracking)                               */}
      {/* ============================================================ */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-normal text-[#2C2825]">
                {isNl ? 'Factuurstatus & Opvolging' : 'Invoice Tracking'}
              </h3>
              <p className="text-xs text-[#7A7167]">
                {isNl
                  ? 'Overzicht van verzonden en openstaande facturen. (Puur opvolging; geen geautomatiseerde verzending).'
                  : 'Tracking of sent and pending invoices.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingInvoice(null);
                setIsInvoiceModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? '+ Factuur' : '+ Invoice'}</span>
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-[#DCD3C4] text-center space-y-2">
              <p className="text-xs text-[#7A7167] italic">
                {isNl ? 'Nog geen facturen toegevoegd.' : 'No invoices tracked yet.'}
              </p>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(true)}
                className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
              >
                {isNl ? '+ Registreer je eerste factuur' : '+ Track your first invoice'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {invoices.map((inv) => {
                const isOverdue = inv.status === 'overdue' || (inv.status === 'sent' && inv.dueDate < todayStr);

                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#2C2825]">
                            {inv.invoiceNumber}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md ${
                              inv.status === 'paid'
                                ? 'bg-[#E5DFD3] text-[#2C2825]'
                                : isOverdue
                                ? 'bg-[#F9ECE9] text-[#A64A38]'
                                : inv.status === 'sent'
                                ? 'bg-[#EAE2D3] text-[#8C7654]'
                                : 'bg-[#EAE5DC] text-[#6E6458]'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <h4 className="font-serif text-base text-[#2C2825] font-medium mt-1">
                          {inv.clientName}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className="font-serif text-lg font-medium text-[#2C2825] block">
                          €{Number(inv.amount).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-[#7A7167]">
                          {isNl ? 'Vervalt' : 'Due'}: {inv.dueDate}
                        </span>
                      </div>
                    </div>

                    {/* Quick status toggle row */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#ECE3D4] text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-[#7A7167] mr-1">Status:</span>
                        {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateInvoiceStatus(inv.id, st)}
                            className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded-md transition cursor-pointer ${
                              inv.status === st
                                ? 'bg-[#2C2825] text-[#FAF8F3]'
                                : 'bg-[#EFE9DD] text-[#7A7167] hover:text-[#2C2825]'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingInvoice(inv);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="p-1.5 rounded-full hover:bg-[#EAE2D3] text-[#7A7167] hover:text-[#2C2825] transition cursor-pointer"
                          title={isNl ? 'Bewerken' : 'Edit'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-full hover:bg-[#F9ECE9] text-[#A89F91] hover:text-[#A64A38] transition cursor-pointer"
                          title={isNl ? 'Verwijderen' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. UITGAVEN (Expenses)                                       */}
      {/* ============================================================ */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-normal text-[#2C2825]">
                {isNl ? 'Zakelijke Uitgaven' : 'Business Expenses'}
              </h3>
              <p className="text-xs text-[#7A7167]">
                {isNl
                  ? 'Handmatig bijgehouden kosten binnen Mariluna. Strikt gescheiden van privé.'
                  : 'Manual business expenses recorded for Mariluna.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? '+ Uitgave' : '+ Expense'}</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-[#DCD3C4] text-center space-y-2">
              <p className="text-xs text-[#7A7167] italic">
                {isNl ? 'Nog geen uitgaven geregistreerd.' : 'No expenses recorded yet.'}
              </p>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
              >
                {isNl ? '+ Registreer je eerste zakelijke uitgave' : '+ Record an expense'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => {
                const relatedProject = projects.find((p) => p.id === exp.projectId);

                return (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] flex items-center justify-between gap-3 text-xs hover:border-[#DDD4C5] transition"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#2C2825] truncate">{exp.description}</span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#F4EFE6] text-[#6E6458]">
                          {exp.category}
                        </span>
                        {relatedProject && (
                          <span className="text-[10px] text-[#8C7654] flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span>{relatedProject.title}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#7A7167]">
                        <span>{exp.date}</span>
                        {exp.vatAmount && (
                          <span>BTW: €{Number(exp.vatAmount).toFixed(2)}</span>
                        )}
                        {exp.receiptRef && <span>Ref: {exp.receiptRef}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-serif text-sm font-semibold text-[#2C2825]">
                        €{Number(exp.amount).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-[#A89F91] hover:text-[#A64A38] transition cursor-pointer"
                        title={isNl ? 'Verwijderen' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADMIN ITEM                                            */}
      {/* ============================================================ */}
      {isItemModalOpen && (
        <AdminItemModal
          item={editingItem}
          projects={projects}
          goals={goals}
          onSave={handleSaveAdminItem}
          onClose={() => {
            setIsItemModalOpen(false);
            setEditingItem(null);
          }}
          isNl={isNl}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: INVOICE                                               */}
      {/* ============================================================ */}
      {isInvoiceModalOpen && (
        <InvoiceModal
          invoice={editingInvoice}
          projects={projects}
          goals={goals}
          onSave={handleSaveInvoice}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setEditingInvoice(null);
          }}
          isNl={isNl}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: EXPENSE                                               */}
      {/* ============================================================ */}
      {isExpenseModalOpen && (
        <ExpenseModal
          expense={editingExpense}
          projects={projects}
          onSave={handleSaveExpense}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
          }}
          isNl={isNl}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: IMPORTANT DATE / DEADLINE                             */}
      {/* ============================================================ */}
      {isDeadlineModalOpen && (
        <DeadlineModal
          deadline={editingDeadline}
          onSave={handleSaveDeadline}
          onClose={() => {
            setIsDeadlineModalOpen(false);
            setEditingDeadline(null);
          }}
          isNl={isNl}
        />
      )}
    </div>
  );
};

// ======================================================================
// SUB-MODAL COMPONENTS
// ======================================================================

interface AdminItemModalProps {
  item: MarilunaAdminItem | null;
  projects: Project[];
  goals: Goal[];
  onSave: (payload: Partial<MarilunaAdminItem>, createCentralTask: boolean) => void;
  onClose: () => void;
  isNl: boolean;
}

const AdminItemModal: React.FC<AdminItemModalProps> = ({
  item,
  projects,
  goals,
  onSave,
  onClose,
  isNl,
}) => {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || 'ADMIN');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>(item?.priority || 'normal');
  const [dueDate, setDueDate] = useState(item?.dueDate || '');
  const [recurring, setRecurring] = useState<AdminItemFrequency>(item?.recurring || 'none');
  const [amount, setAmount] = useState<string>(item?.amount !== undefined ? String(item?.amount) : '');
  const [reference, setReference] = useState(item?.reference || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [projectId, setProjectId] = useState(item?.projectId || '');
  const [goalId, setGoalId] = useState(item?.goalId || '');
  const [createCentralTask, setCreateCentralTask] = useState(false);

  const categories = [
    'ADMIN',
    'INVOICE',
    'EXPENSE',
    'TAX',
    'SOCIAL CONTRIBUTIONS',
    'DOCUMENT',
    'DEADLINE',
    'OTHER',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        id: item?.id,
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim(),
        priority,
        dueDate: dueDate || undefined,
        recurring,
        amount: amount !== '' ? Number(amount) : undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        projectId: projectId || undefined,
        goalId: goalId || undefined,
      },
      createCentralTask
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl text-[#2C2825] max-h-[90vh] overflow-y-auto">
        <h3 className="font-serif text-lg text-[#2C2825]">
          {item ? (isNl ? 'Administratief Item Bewerken' : 'Edit Admin Item') : (isNl ? 'Nieuw Administratief Item' : 'New Admin Item')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
              {isNl ? 'Titel *' : 'Title *'}
            </label>
            <input
              type="text"
              required
              placeholder={isNl ? 'bijv. Kwartaalafsluiting BTW, Jaarlijkse domeinnaam' : 'e.g. Quarterly Review'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Categorie' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Prioriteit' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                <option value="normal">{isNl ? 'Normaal' : 'Normal'}</option>
                <option value="high">{isNl ? 'Hoog' : 'High'}</option>
                <option value="low">{isNl ? 'Laag' : 'Low'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Vervaldatum / Deadline' : 'Due Date'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Herhaling' : 'Recurring'}
              </label>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as AdminItemFrequency)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                <option value="none">{isNl ? 'Eenmalig' : 'One-time'}</option>
                <option value="weekly">{isNl ? 'Wekelijks' : 'Weekly'}</option>
                <option value="monthly">{isNl ? 'Maandelijks' : 'Monthly'}</option>
                <option value="quarterly">{isNl ? 'Per kwartaal' : 'Quarterly'}</option>
                <option value="yearly">{isNl ? 'Jaarlijks' : 'Yearly'}</option>
                <option value="custom">{isNl ? 'Aangepast' : 'Custom'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Bedrag (optioneel in €)' : 'Amount (optional €)'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Referentie / Document' : 'Reference'}
              </label>
              <input
                type="text"
                placeholder={isNl ? 'bijv. Polis #, Factuurref' : 'Document ref'}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Koppel aan Project' : 'Connect Project'}
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
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Koppel aan Doel' : 'Connect Goal'}
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
          </div>

          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
              {isNl ? 'Notities & Instructies' : 'Notes'}
            </label>
            <textarea
              rows={2}
              placeholder={isNl ? 'Nadere details of contactpersoon...' : 'Notes...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          {/* Central task creation checkbox */}
          {!item && (
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4EFE6] border border-[#E8E1D3] cursor-pointer">
              <input
                type="checkbox"
                checked={createCentralTask}
                onChange={(e) => setCreateCentralTask(e.target.checked)}
                className="rounded text-[#2C2825]"
              />
              <span className="text-[11px] text-[#554C42]">
                {isNl
                  ? 'Toon ook als actietaak in de centrale takenlijst & Vandaag'
                  : 'Sync to central task system and Today view'}
              </span>
            </label>
          )}

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
              disabled={!title.trim()}
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

interface InvoiceModalProps {
  invoice: MarilunaInvoice | null;
  projects: Project[];
  goals: Goal[];
  onSave: (payload: Partial<MarilunaInvoice>) => void;
  onClose: () => void;
  isNl: boolean;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  projects,
  goals,
  onSave,
  onClose,
  isNl,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoiceNumber || '');
  const [clientName, setClientName] = useState(invoice?.clientName || '');
  const [amount, setAmount] = useState(invoice?.amount !== undefined ? String(invoice?.amount) : '');
  const [date, setDate] = useState(invoice?.date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(invoice?.dueDate || '');
  const [status, setStatus] = useState<MarilunaInvoice['status']>(invoice?.status || 'sent');
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [projectId, setProjectId] = useState(invoice?.projectId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || amount === '') return;

    onSave({
      id: invoice?.id,
      invoiceNumber: invoiceNumber.trim() || undefined,
      clientName: clientName.trim(),
      amount: Number(amount),
      date,
      dueDate: dueDate || date,
      status,
      notes: notes.trim() || undefined,
      projectId: projectId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
        <h3 className="font-serif text-lg text-[#2C2825]">
          {invoice ? (isNl ? 'Factuur Bewerken' : 'Edit Invoice') : (isNl ? 'Nieuwe Factuur Registreren' : 'Track Invoice')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
              {isNl ? 'Klantnaam *' : 'Client Name *'}
            </label>
            <input
              type="text"
              required
              placeholder={isNl ? 'Naam opdrachtgever of bedrijf' : 'Client name'}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Factuurnummer' : 'Invoice #'}
              </label>
              <input
                type="text"
                placeholder="ML-2026-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Bedrag in € *' : 'Amount in € *'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Factuurdatum' : 'Invoice Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Vervaldatum' : 'Due Date'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Project (optioneel)' : 'Project'}
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
              {isNl ? 'Notities' : 'Notes'}
            </label>
            <textarea
              rows={2}
              placeholder={isNl ? 'Omschrijving van diensten of betaalafspraak...' : 'Notes...'}
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
              disabled={!clientName.trim() || amount === ''}
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

interface ExpenseModalProps {
  expense: MarilunaExpense | null;
  projects: Project[];
  onSave: (payload: Partial<MarilunaExpense>) => void;
  onClose: () => void;
  isNl: boolean;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  expense,
  projects,
  onSave,
  onClose,
  isNl,
}) => {
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount !== undefined ? String(expense?.amount) : '');
  const [vatAmount, setVatAmount] = useState(expense?.vatAmount !== undefined ? String(expense?.vatAmount) : '');
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(expense?.category || 'software');
  const [receiptRef, setReceiptRef] = useState(expense?.receiptRef || '');
  const [projectId, setProjectId] = useState(expense?.projectId || '');
  const [notes, setNotes] = useState(expense?.notes || '');

  const categories = [
    'software',
    'materials',
    'marketing',
    'tax_social',
    'office',
    'subscriptions',
    'equipment',
    'travel',
    'other',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount === '') return;

    onSave({
      id: expense?.id,
      description: description.trim(),
      amount: Number(amount),
      vatAmount: vatAmount !== '' ? Number(vatAmount) : undefined,
      date,
      category,
      receiptRef: receiptRef.trim() || undefined,
      projectId: projectId || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
        <h3 className="font-serif text-lg text-[#2C2825]">
          {expense ? (isNl ? 'Uitgave Bewerken' : 'Edit Expense') : (isNl ? 'Zakelijke Uitgave Registreren' : 'Record Expense')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
              {isNl ? 'Omschrijving *' : 'Description *'}
            </label>
            <input
              type="text"
              required
              placeholder={isNl ? 'bijv. Notion abonnement, Verpakkingsmateriaal' : 'Description'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Bedrag in € *' : 'Amount in € *'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'BTW-bedrag in € (optioneel)' : 'VAT in €'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={vatAmount}
                onChange={(e) => setVatAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Datum' : 'Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Categorie' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Bon / Factuurref' : 'Receipt / Ref'}
              </label>
              <input
                type="text"
                placeholder="REF-1049"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Project (optioneel)' : 'Project'}
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
              disabled={!description.trim() || amount === ''}
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

interface DeadlineModalProps {
  deadline: MarilunaTaxDeadline | null;
  onSave: (payload: Partial<MarilunaTaxDeadline>) => void;
  onClose: () => void;
  isNl: boolean;
}

const DeadlineModal: React.FC<DeadlineModalProps> = ({
  deadline,
  onSave,
  onClose,
  isNl,
}) => {
  const [title, setTitle] = useState(deadline?.title || '');
  const [dueDate, setDueDate] = useState(deadline?.dueDate || '');
  const [type, setType] = useState<MarilunaTaxDeadline['type']>(deadline?.type || 'vat_btw');
  const [notes, setNotes] = useState(deadline?.notes || '');
  const [amount, setAmount] = useState(deadline?.amount !== undefined ? String(deadline?.amount) : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    onSave({
      id: deadline?.id,
      title: title.trim(),
      dueDate,
      type,
      notes: notes.trim() || undefined,
      amount: amount !== '' ? Number(amount) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
        <h3 className="font-serif text-lg text-[#2C2825]">
          {deadline ? (isNl ? 'Datum Bewerken' : 'Edit Date') : (isNl ? 'Belangrijke Zakelijke Datum' : 'Add Business Date')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
              {isNl ? 'Onderwerp / Titel *' : 'Title *'}
            </label>
            <input
              type="text"
              required
              placeholder={isNl ? 'bijv. BTW Aangifte Q3, Sociale bijdrage, Domeinverlenging' : 'Title'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Datum *' : 'Date *'}
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
                {isNl ? 'Type' : 'Type'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                <option value="vat_btw">BTW / VAT</option>
                <option value="income_tax">{isNl ? 'Personenbelasting' : 'Income Tax'}</option>
                <option value="social_contribution">{isNl ? 'Sociale Bijdrage' : 'Social Contribution'}</option>
                <option value="annual_accounts">{isNl ? 'Jaarrekening' : 'Annual Accounts'}</option>
                <option value="subscription">{isNl ? 'Software / Abonnement' : 'Subscription'}</option>
                <option value="insurance">{isNl ? 'Verzekering' : 'Insurance'}</option>
                <option value="domain">{isNl ? 'Domeinnaam / Hosting' : 'Domain'}</option>
                <option value="appointment">{isNl ? 'Zakelijke Afspraak' : 'Appointment'}</option>
                <option value="other">{isNl ? 'Overig' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
              {isNl ? 'Geschat Bedrag (optioneel in €)' : 'Estimated Amount (optional €)'}
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#7A7167] font-medium mb-1">
              {isNl ? 'Notities' : 'Notes'}
            </label>
            <textarea
              rows={2}
              placeholder={isNl ? 'Verwijzing naar document of accountant...' : 'Notes...'}
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
              disabled={!title.trim() || !dueDate}
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

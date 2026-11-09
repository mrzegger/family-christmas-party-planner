import React from 'react';
import {
  CheckSquare,
  Wallet,
  Utensils,
  Users,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Receipt,
} from 'lucide-react';
import { PlannerState } from '../../types/planner';
import { formatCurrency } from '../../lib/storageAdapter';
import { getTaskAssigneeIds } from './TasksTab';

export type HqTabId =
  | 'overview'
  | 'tasks'
  | 'voting'
  | 'budget'
  | 'menu'
  | 'program'
  | 'roster'
  | 'checklists';

interface OverviewTabProps {
  state: PlannerState;
  activeCousinId: string;
  onNavigateTab: (tab: HqTabId) => void;
  onOpenSettings: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  state,
  activeCousinId,
  onNavigateTab,
  onOpenSettings,
}) => {
  const {
    eventConfig,
    cousins,
    guests,
    tasks,
    contributions,
    expenses,
    menuItems,
    games,
    checklistItems,
  } = state;

  const sym = eventConfig.currencySymbol || '₱';

  // Headcount metrics
  const goingGuests = guests.filter((g) => g.rsvpStatus === 'Going');
  const goingAdults = goingGuests.filter((g) => g.ageGroup === 'Adult').length;
  const goingKids = goingGuests.filter((g) => g.ageGroup === 'Kid').length;
  const goingSeniors = goingGuests.filter((g) => g.ageGroup === 'Senior').length;
  const pendingGuests = guests.filter((g) => g.rsvpStatus === 'Pending').length;

  // Tasks metrics
  const doneTasks = tasks.filter((t) => t.status === 'Done').length;
  const taskProgressPct =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const myOpenTasks = tasks.filter(
    (t) =>
      getTaskAssigneeIds(t).includes(activeCousinId) && t.status !== 'Done'
  );

  // Pooled Fund & Reimbursement metrics
  const totalPledged = contributions.reduce((s, c) => s + c.pledgedAmount, 0);
  const totalCollected = contributions.reduce((s, c) => s + c.paidAmount, 0);
  const totalActualSpent = expenses.reduce(
    (s, e) => s + (e.actualCost ?? 0),
    0
  );
  const paidFromPooledPot = expenses
    .filter((e) => e.paidSource === 'Pooled Fund' && e.actualCost !== null)
    .reduce((s, e) => s + (e.actualCost ?? 0), 0);
  const reimbursedCousinExpenses = expenses
    .filter(
      (e) =>
        e.paidSource === 'Cousin Out-of-Pocket' &&
        e.reimbursementStatus === 'Reimbursed' &&
        e.actualCost !== null
    )
    .reduce((s, e) => s + (e.actualCost ?? 0), 0);
  const pendingReimbursements = expenses
    .filter(
      (e) =>
        e.paidSource === 'Cousin Out-of-Pocket' &&
        e.reimbursementStatus === 'Needs Reimbursement' &&
        e.actualCost !== null
    )
    .reduce((s, e) => s + (e.actualCost ?? 0), 0);

  const cashOnHandInPot =
    totalCollected - paidFromPooledPot - reimbursedCousinExpenses;

  // Menu & Checklist metrics
  const totalMenuServings = menuItems
    .filter((m) => m.course === 'Main Dish / Lechon')
    .reduce((s, m) => s + m.servings, 0);
  const packedItemsCount = checklistItems.filter((c) => c.isPacked).length;

  const activeCousin =
    cousins.find((c) => c.id === activeCousinId) || cousins[0];

  // Dietary summary from confirmed guests
  const dietaryAlerts = guests.filter(
    (g) => g.rsvpStatus !== 'Not Going' && g.dietaryNotes.trim().length > 0
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner for Active Cousin */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#DED6C6] bg-gradient-to-r from-[#1B4332] to-[#23533D] p-6 text-white shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E9C46A]/20 px-3 py-0.5 text-xs font-bold text-[#E9C46A]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Cousins Command Center</span>
          </div>
          <h2 className="font-serif-display text-2xl font-bold sm:text-3xl">
            Hey {activeCousin?.name.split(' ')[0] || 'Cousin'}! Let&apos;s make this party legendary.
          </h2>
          {activeCousin?.role && (
            <p className="text-xs text-[#D8E2DC] sm:text-sm">
              Role: <strong className="text-white">{activeCousin.role}</strong>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenSettings}
            className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
          >
            Edit Event &amp; Cousins Roster
          </button>
          <button
            onClick={() => onNavigateTab('tasks')}
            className="flex items-center gap-1.5 rounded-xl bg-[#E9C46A] px-4 py-2 text-xs font-bold text-[#1B4332] shadow-xs transition hover:bg-[#e3b84f]"
          >
            <span>View My Tasks ({myOpenTasks.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Top 4 Executive Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Confirmed Headcount */}
        <button
          onClick={() => onNavigateTab('roster')}
          className="group flex flex-col justify-between rounded-2xl border border-[#DED6C6] bg-white p-5 text-left shadow-2xs transition hover:border-[#1B4332]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C6B64]">
              Family Headcount
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332]/10 text-[#1B4332]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-serif-display text-3xl font-bold text-[#1B4332]">
              {goingGuests.length}{' '}
              <span className="font-sans text-sm font-normal text-[#5C6B64]">
                / {guests.length} Going
              </span>
            </p>
            <p className="mt-1 text-xs text-[#5C6B64]">
              {goingAdults} Adults • {goingSeniors} Seniors • {goingKids} Kids
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#F1ECE1] pt-2.5 text-xs font-semibold text-[#9E2A2B]">
            <span>{pendingGuests} still pending RSVP</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </button>

        {/* Card 2: Pooled Fund & Reimbursements */}
        <button
          onClick={() => onNavigateTab('budget')}
          className="group flex flex-col justify-between rounded-2xl border border-[#DED6C6] bg-white p-5 text-left shadow-2xs transition hover:border-[#1B4332]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C6B64]">
              Pooled Pot &amp; Spend
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-serif-display text-2xl font-bold text-[#1B4332]">
              {formatCurrency(totalCollected, sym)}{' '}
              <span className="font-sans text-xs font-normal text-[#5C6B64]">
                collected of {formatCurrency(totalPledged, sym)}
              </span>
            </p>
            <p className="mt-1 text-xs text-[#5C6B64]">
              Total Spent: <strong>{formatCurrency(totalActualSpent, sym)}</strong> • Cash left:{' '}
              <strong className="text-emerald-700">
                {formatCurrency(cashOnHandInPot, sym)}
              </strong>
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#F1ECE1] pt-2.5 text-xs font-semibold text-amber-800">
            <span>
              {formatCurrency(pendingReimbursements, sym)} owed to cousins
            </span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </button>

        {/* Card 3: Execution Tasks */}
        <button
          onClick={() => onNavigateTab('tasks')}
          className="group flex flex-col justify-between rounded-2xl border border-[#DED6C6] bg-white p-5 text-left shadow-2xs transition hover:border-[#1B4332]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C6B64]">
              Execution Tasks
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9E2A2B]/10 text-[#9E2A2B]">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-serif-display text-3xl font-bold text-[#1B4332]">
              {taskProgressPct}%{' '}
              <span className="font-sans text-sm font-normal text-[#5C6B64]">
                ({doneTasks}/{tasks.length} Done)
              </span>
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F1ECE1]">
              <div
                className="h-full bg-[#1B4332] transition-all"
                style={{ width: `${taskProgressPct}%` }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#F1ECE1] pt-2.5 text-xs font-semibold text-[#1B4332]">
            <span>{myOpenTasks.length} assigned to you</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </button>

        {/* Card 4: Menu & Day-of Packing */}
        <button
          onClick={() => onNavigateTab('menu')}
          className="group flex flex-col justify-between rounded-2xl border border-[#DED6C6] bg-white p-5 text-left shadow-2xs transition hover:border-[#1B4332]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C6B64]">
              Food &amp; Games Readiness
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <Utensils className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-serif-display text-2xl font-bold text-[#1B4332]">
              {menuItems.length} Dishes • {games.length} Games
            </p>
            <p className="mt-1 text-xs text-[#5C6B64]">
              Main Dish Servings: <strong>{totalMenuServings} pax</strong> • Packed:{' '}
              <strong>
                {packedItemsCount}/{checklistItems.length}
              </strong>
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#F1ECE1] pt-2.5 text-xs font-semibold text-[#1B4332]">
            <span>Inspect Menu &amp; Catering</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>

      {/* Bottom 3 Action Panels: My Tasks, Reimbursements Alert, Dietary & Family Notes */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Panel 1: Active Cousin's Priority Tasks */}
        <div className="rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-display text-lg font-bold text-[#1B4332]">
              {activeCousin?.name.split(' ')[0]}&apos;s Open Tasks
            </h3>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs font-bold text-[#9E2A2B] hover:underline"
            >
              All Tasks →
            </button>
          </div>

          {myOpenTasks.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-center text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="mx-auto mb-1.5 h-6 w-6 text-emerald-600" />
              All your assigned tasks are complete!
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {myOpenTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-[#EFE9DC] bg-[#FAF6F0]/70 p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[#1C2826]">
                      {task.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        task.priority === 'High'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#5C6B64]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Due {task.dueDate}
                    </span>
                    <span className="font-semibold text-[#1B4332]">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Cousin Out-of-Pocket Reimbursements Queue */}
        <div className="rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-display text-lg font-bold text-[#1B4332]">
              Cousin Reimbursements Queue
            </h3>
            <button
              onClick={() => onNavigateTab('budget')}
              className="text-xs font-bold text-[#9E2A2B] hover:underline"
            >
              Open Ledger →
            </button>
          </div>
          <p className="mt-1 text-xs text-[#5C6B64]">
            Out-of-pocket expenses advanced by cousins waiting to be reimbursed from the Pooled Pot:
          </p>

          <div className="mt-4 space-y-2.5">
            {expenses
              .filter(
                (e) =>
                  e.paidSource === 'Cousin Out-of-Pocket' &&
                  e.reimbursementStatus === 'Needs Reimbursement' &&
                  e.actualCost !== null
              )
              .map((exp) => {
                const payer = cousins.find((c) => c.id === exp.paidByCousinId);
                return (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#1C2826]">
                        {exp.title}
                      </p>
                      <p className="text-[11px] text-[#5C6B64]">
                        Paid by <strong>{payer?.name || 'Unassigned'}</strong> ({exp.vendor})
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#9E2A2B]">
                      {formatCurrency(exp.actualCost ?? 0, sym)}
                    </span>
                  </div>
                );
              })}

            {expenses.filter(
              (e) =>
                e.paidSource === 'Cousin Out-of-Pocket' &&
                e.reimbursementStatus === 'Needs Reimbursement' &&
                e.actualCost !== null
            ).length === 0 && (
              <div className="rounded-2xl bg-emerald-50 p-4 text-center text-xs font-semibold text-emerald-800">
                <Receipt className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
                Zero pending reimbursements! Every cousin is settled up.
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Family Dietary & Allergy Alerts */}
        <div className="rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-display text-lg font-bold text-[#1B4332]">
              Family Dietary &amp; Health Notes
            </h3>
            <button
              onClick={() => onNavigateTab('menu')}
              className="text-xs font-bold text-[#9E2A2B] hover:underline"
            >
              Check Menu →
            </button>
          </div>
          <p className="mt-1 text-xs text-[#5C6B64]">
            Automatically pulled from Family Guest Portal RSVPs so the organizers don&apos;t miss anyone:
          </p>

          <div className="mt-4 space-y-2.5">
            {dietaryAlerts.map((guest) => (
              <div
                key={guest.id}
                className="flex items-start gap-2.5 rounded-2xl border border-[#EFE9DC] bg-[#FAF6F0] p-3"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B5651D]" />
                <div>
                  <p className="text-xs font-bold text-[#1C2826]">
                    {guest.name}{' '}
                    <span className="font-normal text-[#5C6B64]">
                      ({guest.ageGroup})
                    </span>
                  </p>
                  <p className="text-xs font-semibold text-[#9E2A2B]">
                    {guest.dietaryNotes}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

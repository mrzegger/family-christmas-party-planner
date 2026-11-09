import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  UserCheck,
  Pencil,
  Check,
  X,
  Clock,
} from 'lucide-react';
import {
  FundContribution,
  ExpenseItem,
  Cousin,
  FamilyUnit,
  ExpenseCategory,
  PaidSource,
  ReimbursementStatus,
  ContributionStatus,
} from '../../types/planner';
import { formatCurrency } from '../../lib/storageAdapter';

interface BudgetTabProps {
  currencySymbol: string;
  contributions: FundContribution[];
  expenses: ExpenseItem[];
  cousins: Cousin[];
  familyUnits: FamilyUnit[];
  activeCousinId: string;
  onAddContribution: (item: Omit<FundContribution, 'id'>) => void;
  onUpdateContribution: (
    id: string,
    updates: Partial<FundContribution>
  ) => void;
  onDeleteContribution: (id: string) => void;
  onAddExpense: (item: Omit<ExpenseItem, 'id'>) => void;
  onUpdateExpense: (id: string, updates: Partial<ExpenseItem>) => void;
  onDeleteExpense: (id: string) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Drinks',
  'Games & Prizes',
  'Decor & Venue',
  'Logistics & Tech',
  'Misc',
];

export const BudgetTab: React.FC<BudgetTabProps> = ({
  currencySymbol: sym,
  contributions,
  expenses,
  cousins,
  activeCousinId,
  onAddContribution,
  onUpdateContribution,
  onDeleteContribution,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [showAddContributionModal, setShowAddContributionModal] =
    useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Contribution form states
  const [contributorName, setContributorName] = useState('');
  const [pledgedAmount, setPledgedAmount] = useState(10000);
  const [paidAmount, setPaidAmount] = useState(10000);
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [heldByCousinId, setHeldByCousinId] = useState(
    cousins.find((c) => c.isTreasurer)?.id || ''
  );
  const [contribNotes, setContribNotes] = useState('');

  // Inline edit Contribution state
  const [editingContribId, setEditingContribId] = useState<string | null>(null);
  const [editContribName, setEditContribName] = useState('');
  const [editContribPledged, setEditContribPledged] = useState(0);
  const [editContribPaid, setEditContribPaid] = useState(0);
  const [editContribMethod, setEditContribMethod] = useState('');
  const [editContribHeldBy, setEditContribHeldBy] = useState('');
  const [editContribNotes, setEditContribNotes] = useState('');

  // Expense form states
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] =
    useState<ExpenseCategory>('Food & Drinks');
  const [expEstimated, setExpEstimated] = useState('2000');
  const [expActual, setExpActual] = useState(''); // Blank by default = Planned / Not Yet Paid!
  const [expPaidSource, setExpPaidSource] =
    useState<PaidSource>('Pooled Fund');
  const [expPaidByCousinId, setExpPaidByCousinId] = useState(''); // Default Unassigned
  const [expVendor, setExpVendor] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Inline edit Expense state
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editExpTitle, setEditExpTitle] = useState('');
  const [editExpCategory, setEditExpCategory] =
    useState<ExpenseCategory>('Food & Drinks');
  const [editExpEstimated, setEditExpEstimated] = useState('');
  const [editExpActual, setEditExpActual] = useState('');
  const [editExpPaidSource, setEditExpPaidSource] =
    useState<PaidSource>('Pooled Fund');
  const [editExpPaidBy, setEditExpPaidBy] = useState('');
  const [editExpVendor, setEditExpVendor] = useState('');
  const [editExpNotes, setEditExpNotes] = useState('');

  // Helper to check if an expense has an actual cost recorded
  const hasActualCost = (exp: ExpenseItem) =>
    exp.actualCost !== null && exp.actualCost !== undefined && exp.actualCost > 0;

  // Financial math
  const totalPledged = contributions.reduce((s, c) => s + c.pledgedAmount, 0);
  const totalCollected = contributions.reduce((s, c) => s + c.paidAmount, 0);

  const totalEstimated = expenses.reduce((s, e) => s + e.estimatedCost, 0);
  const totalActualSpent = expenses.reduce(
    (s, e) => s + (e.actualCost || 0),
    0
  );

  const spentDirectlyFromPot = expenses
    .filter((e) => e.paidSource === 'Pooled Fund' && hasActualCost(e))
    .reduce((s, e) => s + (e.actualCost || 0), 0);

  const alreadyReimbursed = expenses
    .filter(
      (e) =>
        e.paidSource === 'Cousin Out-of-Pocket' &&
        e.reimbursementStatus === 'Reimbursed' &&
        hasActualCost(e)
    )
    .reduce((s, e) => s + (e.actualCost || 0), 0);

  const pendingReimbursementsTotal = expenses
    .filter(
      (e) =>
        e.paidSource === 'Cousin Out-of-Pocket' &&
        e.reimbursementStatus === 'Needs Reimbursement' &&
        hasActualCost(e)
    )
    .reduce((s, e) => s + (e.actualCost || 0), 0);

  const cashRemainingInPot =
    totalCollected - spentDirectlyFromPot - alreadyReimbursed;
  const projectedPotAfterReimbursements =
    cashRemainingInPot - pendingReimbursementsTotal;

  // Per-cousin reimbursement summary
  const cousinReimbursementSummary = cousins
    .map((c) => {
      const owed = expenses
        .filter(
          (e) =>
            e.paidSource === 'Cousin Out-of-Pocket' &&
            e.paidByCousinId === c.id &&
            e.reimbursementStatus === 'Needs Reimbursement' &&
            hasActualCost(e)
        )
        .reduce((s, e) => s + (e.actualCost || 0), 0);

      const reimbursed = expenses
        .filter(
          (e) =>
            e.paidSource === 'Cousin Out-of-Pocket' &&
            e.paidByCousinId === c.id &&
            e.reimbursementStatus === 'Reimbursed' &&
            hasActualCost(e)
        )
        .reduce((s, e) => s + (e.actualCost || 0), 0);

      return { cousin: c, owed, reimbursed };
    })
    .filter((item) => item.owed > 0 || item.reimbursed > 0);

  const handleCreateContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributorName.trim()) return;
    const status: ContributionStatus =
      paidAmount >= pledgedAmount && pledgedAmount > 0
        ? 'Collected'
        : paidAmount > 0
        ? 'Partial'
        : 'Pledged';

    onAddContribution({
      contributorName: contributorName.trim(),
      pledgedAmount: Number(pledgedAmount) || 0,
      paidAmount: Number(paidAmount) || 0,
      status,
      paymentMethod: paymentMethod.trim(),
      heldByCousinId,
      notes: contribNotes.trim(),
    });
    setContributorName('');
    setContribNotes('');
    setShowAddContributionModal(false);
  };

  const startEditingContrib = (item: FundContribution) => {
    setEditingContribId(item.id);
    setEditContribName(item.contributorName);
    setEditContribPledged(item.pledgedAmount);
    setEditContribPaid(item.paidAmount);
    setEditContribMethod(item.paymentMethod);
    setEditContribHeldBy(item.heldByCousinId);
    setEditContribNotes(item.notes);
  };

  const saveEditingContrib = (id: string) => {
    if (!editContribName.trim()) return;
    const nextPledged = Number(editContribPledged) || 0;
    const nextPaid = Number(editContribPaid) || 0;
    const nextStatus: ContributionStatus =
      nextPaid >= nextPledged && nextPledged > 0
        ? 'Collected'
        : nextPaid > 0
        ? 'Partial'
        : 'Pledged';

    onUpdateContribution(id, {
      contributorName: editContribName.trim(),
      pledgedAmount: nextPledged,
      paidAmount: nextPaid,
      status: nextStatus,
      paymentMethod: editContribMethod.trim(),
      heldByCousinId: editContribHeldBy,
      notes: editContribNotes.trim(),
    });
    setEditingContribId(null);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) return;
    const parsedActual =
      expActual.trim() === '' ? null : Number(expActual) || 0;
    const hasPaidActual = parsedActual !== null && parsedActual > 0;

    const reimbursementStatus: ReimbursementStatus =
      hasPaidActual && expPaidSource === 'Cousin Out-of-Pocket'
        ? 'Needs Reimbursement'
        : 'N/A';

    onAddExpense({
      title: expTitle.trim(),
      category: expCategory,
      estimatedCost: Number(expEstimated) || 0,
      actualCost: parsedActual,
      paidSource: hasPaidActual ? expPaidSource : 'Unpaid / Planned',
      paidByCousinId: expPaidByCousinId,
      reimbursementStatus,
      vendor: expVendor.trim(),
      notes: expNotes.trim(),
    });
    setExpTitle('');
    setExpVendor('');
    setExpNotes('');
    setExpActual('');
    setShowAddExpenseModal(false);
  };

  const startEditingExp = (exp: ExpenseItem) => {
    setEditingExpId(exp.id);
    setEditExpTitle(exp.title);
    setEditExpCategory(exp.category);
    setEditExpEstimated(String(exp.estimatedCost || 0));
    setEditExpActual(
      exp.actualCost !== null && exp.actualCost !== undefined && exp.actualCost > 0
        ? String(exp.actualCost)
        : ''
    );
    setEditExpPaidSource(
      exp.paidSource === 'Unpaid / Planned' ? 'Pooled Fund' : exp.paidSource
    );
    setEditExpPaidBy(exp.paidByCousinId || '');
    setEditExpVendor(exp.vendor);
    setEditExpNotes(exp.notes);
  };

  const saveEditingExp = (exp: ExpenseItem) => {
    if (!editExpTitle.trim()) return;
    const parsedActual =
      editExpActual.trim() === '' ? null : Number(editExpActual) || 0;
    const hasPaidActual = parsedActual !== null && parsedActual > 0;

    const finalPaidSource: PaidSource = hasPaidActual
      ? editExpPaidSource
      : 'Unpaid / Planned';

    const nextReimbStatus: ReimbursementStatus =
      !hasPaidActual || finalPaidSource === 'Pooled Fund'
        ? 'N/A'
        : exp.reimbursementStatus === 'N/A'
        ? 'Needs Reimbursement'
        : exp.reimbursementStatus;

    onUpdateExpense(exp.id, {
      title: editExpTitle.trim(),
      category: editExpCategory,
      estimatedCost: Number(editExpEstimated) || 0,
      actualCost: parsedActual,
      paidSource: finalPaidSource,
      paidByCousinId: editExpPaidBy,
      reimbursementStatus: nextReimbStatus,
      vendor: editExpVendor.trim(),
      notes: editExpNotes.trim(),
    });
    setEditingExpId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Financial KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#DED6C6] bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C6B64]">
            1. Pooled Pot Collected
          </p>
          <p className="font-serif-display mt-2 text-2xl font-bold text-emerald-800 sm:text-3xl">
            {formatCurrency(totalCollected, sym)}
          </p>
          <p className="mt-1 text-xs text-[#5C6B64]">
            of {formatCurrency(totalPledged, sym)} total pledged by branches
          </p>
        </div>

        <div className="rounded-2xl border border-[#DED6C6] bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C6B64]">
            2. Total Actual Spending
          </p>
          <p className="font-serif-display mt-2 text-2xl font-bold text-[#1B4332] sm:text-3xl">
            {formatCurrency(totalActualSpent, sym)}
          </p>
          <p className="mt-1 text-xs text-[#5C6B64]">
            Estimated budget: {formatCurrency(totalEstimated, sym)}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
            3. Owed to Organizers (Out-of-Pocket)
          </p>
          <p className="font-serif-display mt-2 text-2xl font-bold text-[#9E2A2B] sm:text-3xl">
            {formatCurrency(pendingReimbursementsTotal, sym)}
          </p>
          <p className="mt-1 text-xs text-amber-900">
            Already reimbursed: {formatCurrency(alreadyReimbursed, sym)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#1B4332]/20 bg-[#1B4332] p-5 text-white shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-[#E9C46A]">
            4. Net Cash in Pot (After Reimbursements)
          </p>
          <p className="font-serif-display mt-2 text-2xl font-bold text-white sm:text-3xl">
            {formatCurrency(projectedPotAfterReimbursements, sym)}
          </p>
          <p className="mt-1 text-xs text-[#D8E2DC]">
            Current cash before reimbursements: {formatCurrency(cashRemainingInPot, sym)}
          </p>
        </div>
      </div>

      {/* Cousin Out-of-Pocket Reimbursement Calculator Card */}
      <div className="rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">
              <UserCheck className="h-3.5 w-3.5" />
              Treasurer Settlement Helper
            </span>
            <h3 className="font-serif-display mt-1.5 text-xl font-bold text-[#1B4332]">
              Who Needs to Be Reimbursed from the Pooled Pot?
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setExpPaidSource('Cousin Out-of-Pocket');
              setExpPaidByCousinId(activeCousinId);
              setShowAddExpenseModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#9E2A2B] px-4 py-2 text-xs font-bold text-white hover:bg-[#7D2021]"
          >
            <Plus className="h-4 w-4" />
            <span>Log Out-of-Pocket Expense</span>
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {cousinReimbursementSummary.map(({ cousin, owed, reimbursed }) => (
            <div
              key={cousin.id}
              className="flex items-center justify-between rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0] p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: cousin.avatarColor }}
                >
                  {cousin.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-bold text-[#1C2826]">
                    {cousin.name}
                  </p>
                  <p className="text-[11px] text-[#5C6B64]">
                    Reimbursed so far: {formatCurrency(reimbursed, sym)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono text-sm font-bold ${
                    owed > 0 ? 'text-[#9E2A2B]' : 'text-emerald-700'
                  }`}
                >
                  {owed > 0 ? `Owed ${formatCurrency(owed, sym)}` : 'Settled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Split: Pooled Fund Contributions vs Expenses Ledger */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 5 Cols: Parent / Family Branch Contributions into Pooled Pot */}
        <div className="space-y-4 rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
                Pooled Pot Contributions
              </h3>
              <p className="text-xs text-[#5C6B64]">
                Track funds from parents &amp; family branches
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddContributionModal(true)}
              className="flex items-center gap-1 rounded-xl bg-[#1B4332] px-3 py-2 text-xs font-bold text-white hover:bg-[#143325]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Pot Inflow</span>
            </button>
          </div>

          <div className="space-y-3">
            {contributions.map((item) => {
              const holder = cousins.find(
                (c) => c.id === item.heldByCousinId
              );
              const isEditing = editingContribId === item.id;

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="space-y-2.5 rounded-2xl border border-[#1B4332] bg-[#FAF6F0] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1B4332]">
                        Edit Contribution
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingContribId(null)}
                        className="text-[#5C6B64]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editContribName}
                      onChange={(e) => setEditContribName(e.target.value)}
                      placeholder="Contributor Name"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Pledged ({sym})
                        </label>
                        <input
                          type="number"
                          value={editContribPledged}
                          onChange={(e) =>
                            setEditContribPledged(Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Paid ({sym})
                        </label>
                        <input
                          type="number"
                          value={editContribPaid}
                          onChange={(e) =>
                            setEditContribPaid(Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editContribMethod}
                        onChange={(e) => setEditContribMethod(e.target.value)}
                        placeholder="Payment Method"
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      />
                      <select
                        value={editContribHeldBy}
                        onChange={(e) => setEditContribHeldBy(e.target.value)}
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      >
                        <option value="">Unassigned</option>
                        {cousins.map((c) => (
                          <option key={c.id} value={c.id}>
                            Held by {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={editContribNotes}
                      onChange={(e) => setEditContribNotes(e.target.value)}
                      placeholder="Notes"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingContribId(null)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5C6B64]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditingContrib(item.id)}
                        className="flex items-center gap-1 rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
                      >
                        <Check className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0]/70 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#1C2826]">
                        {item.contributorName}
                      </p>
                      <p className="text-xs text-[#5C6B64]">
                        Via {item.paymentMethod} • Held by{' '}
                        <strong>{holder?.name || 'Unassigned'}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditingContrib(item)}
                        title="Edit contribution"
                        className="rounded p-1 text-[#5C6B64] hover:text-[#1B4332]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteContribution(item.id)}
                        className="rounded p-1 text-[#8C9690] hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="mt-1.5 text-xs text-[#5C6B64] italic">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5DEC9] pt-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#5C6B64]">Paid:</span>
                      <input
                        type="number"
                        aria-label="Paid Amount"
                        value={item.paidAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const nextStatus: ContributionStatus =
                            val >= item.pledgedAmount
                              ? 'Collected'
                              : val > 0
                              ? 'Partial'
                              : 'Pledged';
                          onUpdateContribution(item.id, {
                            paidAmount: val,
                            status: nextStatus,
                          });
                        }}
                        className="w-24 rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 font-mono text-xs font-bold text-[#1B4332]"
                      />
                      <span className="text-[#5C6B64]">
                        / {formatCurrency(item.pledgedAmount, sym)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateContribution(item.id, {
                          paidAmount: item.pledgedAmount,
                          status: 'Collected',
                        })
                      }
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                        item.status === 'Collected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Partial'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-[#E5DEC9] text-[#1C2826] hover:bg-emerald-100'
                      }`}
                    >
                      {item.status === 'Collected'
                        ? '✓ Fully Collected'
                        : `${item.status} (Mark Paid)`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Party Expenses & Reimbursement Ledger */}
        <div className="space-y-4 rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
                Expenses &amp; Reimbursements Ledger
              </h3>
              <p className="text-xs text-[#5C6B64]">
                Leave Actual Cost blank for planned/unpaid expenses, or enter the actual amount once paid.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setExpPaidSource('Pooled Fund');
                setExpPaidByCousinId('');
                setExpActual('');
                setShowAddExpenseModal(true);
              }}
              className="flex items-center gap-1 rounded-xl bg-[#9E2A2B] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#7D2021]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Expense</span>
            </button>
          </div>

          <div className="space-y-3">
            {expenses.map((exp) => {
              const payer = cousins.find((c) => c.id === exp.paidByCousinId);
              const isPaid = hasActualCost(exp);
              const isEditing = editingExpId === exp.id;

              if (isEditing) {
                return (
                  <div
                    key={exp.id}
                    className="space-y-2.5 rounded-2xl border border-[#1B4332] bg-[#FAF6F0] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1B4332]">
                        Edit Expense
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingExpId(null)}
                        className="text-[#5C6B64]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editExpTitle}
                      onChange={(e) => setEditExpTitle(e.target.value)}
                      placeholder="Expense Title"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editExpCategory}
                        onChange={(e) =>
                          setEditExpCategory(e.target.value as ExpenseCategory)
                        }
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editExpVendor}
                        onChange={(e) => setEditExpVendor(e.target.value)}
                        placeholder="Vendor / Store"
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Estimated Cost ({sym})
                        </label>
                        <input
                          type="number"
                          value={editExpEstimated}
                          onChange={(e) => setEditExpEstimated(e.target.value)}
                          className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Actual Cost ({sym}) — Leave blank if unpaid
                        </label>
                        <input
                          type="number"
                          value={editExpActual}
                          onChange={(e) => setEditExpActual(e.target.value)}
                          placeholder="Not yet paid / TBD"
                          className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editExpPaidSource}
                        onChange={(e) =>
                          setEditExpPaidSource(e.target.value as PaidSource)
                        }
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      >
                        <option value="Pooled Fund">Paid from Pooled Pot</option>
                        <option value="Cousin Out-of-Pocket">
                          Out-of-Pocket (Reimburse)
                        </option>
                      </select>
                      <select
                        value={editExpPaidBy}
                        onChange={(e) => setEditExpPaidBy(e.target.value)}
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      >
                        <option value="">Unassigned</option>
                        {cousins.map((c) => (
                          <option key={c.id} value={c.id}>
                            Paid by {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={editExpNotes}
                      onChange={(e) => setEditExpNotes(e.target.value)}
                      placeholder="Notes"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingExpId(null)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5C6B64]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditingExp(exp)}
                        className="flex items-center gap-1 rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
                      >
                        <Check className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={exp.id}
                  className="rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0]/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#1B4332]/10 px-2 py-0.5 text-[10px] font-bold text-[#1B4332]">
                          {exp.category}
                        </span>
                        {!isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                            <Clock className="h-2.5 w-2.5" /> Planned / Not Yet Paid
                          </span>
                        ) : (
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              exp.paidSource === 'Cousin Out-of-Pocket'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {exp.paidSource}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1.5 text-sm font-bold text-[#1C2826]">
                        {exp.title}
                      </h4>
                      <p className="text-xs text-[#5C6B64]">
                        Vendor: <strong>{exp.vendor || 'TBD'}</strong> • Paid by:{' '}
                        <strong>{payer?.name || 'Unassigned'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        {isPaid ? (
                          <>
                            <p className="font-mono text-base font-bold text-[#1B4332]">
                              {formatCurrency(exp.actualCost || 0, sym)}
                            </p>
                            <p className="text-[10px] text-[#5C6B64]">
                              Est: {formatCurrency(exp.estimatedCost, sym)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-bold text-amber-800">
                              Actual: TBD / Unpaid
                            </p>
                            <p className="font-mono text-xs font-semibold text-[#5C6B64]">
                              Est: {formatCurrency(exp.estimatedCost, sym)}
                            </p>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => startEditingExp(exp)}
                        title="Edit expense"
                        className="rounded p-1 text-[#5C6B64] hover:text-[#1B4332]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        className="rounded p-1 text-[#8C9690] hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {exp.notes && (
                    <p className="mt-1.5 text-xs text-[#5C6B64]">{exp.notes}</p>
                  )}

                  {isPaid && exp.paidSource === 'Cousin Out-of-Pocket' && (
                    <div className="mt-3 flex items-center justify-between border-t border-[#E5DEC9] pt-2.5">
                      <span className="text-xs font-semibold text-[#5C6B64]">
                        Reimbursement to {payer?.name || 'Organizer'}:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateExpense(exp.id, {
                            reimbursementStatus:
                              exp.reimbursementStatus === 'Needs Reimbursement'
                                ? 'Reimbursed'
                                : 'Needs Reimbursement',
                          })
                        }
                        className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                          exp.reimbursementStatus === 'Needs Reimbursement'
                            ? 'bg-[#9E2A2B] text-white hover:bg-[#7D2021]'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {exp.reimbursementStatus === 'Needs Reimbursement'
                          ? 'Needs Reimbursement (Click when Paid Back)'
                          : '✓ Reimbursed from Pooled Pot'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Contribution Modal */}
      {showAddContributionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              Add Family / Branch Fund Contribution
            </h3>
            <form onSubmit={handleCreateContribution} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Contributor (Parents / Family Branch)
                </label>
                <input
                  type="text"
                  required
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="e.g., Eldest Family Branch / Sponsor"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Pledged Amount ({sym})
                  </label>
                  <input
                    type="number"
                    required
                    value={pledgedAmount}
                    onChange={(e) => setPledgedAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Paid Amount So Far ({sym})
                  </label>
                  <input
                    type="number"
                    required
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Payment Channel
                  </label>
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="GCash / Bank Transfer / Cash"
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Held By Organizer
                  </label>
                  <select
                    value={heldByCousinId}
                    onChange={(e) => setHeldByCousinId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {cousins.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Notes
                </label>
                <input
                  type="text"
                  value={contribNotes}
                  onChange={(e) => setContribNotes(e.target.value)}
                  placeholder="Reference # or date sent"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContributionModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5C6B64]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1B4332] px-5 py-2 text-xs font-bold text-white"
                >
                  Save Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              Log Party Expense
            </h3>
            <form onSubmit={handleCreateExpense} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Expense Item
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g., Holiday Game Prizes & Gift Bags"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Category
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) =>
                      setExpCategory(e.target.value as ExpenseCategory)
                    }
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Vendor / Store
                  </label>
                  <input
                    type="text"
                    value={expVendor}
                    onChange={(e) => setExpVendor(e.target.value)}
                    placeholder="e.g., Supermarket / Online Shop / Caterer"
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Estimated Cost ({sym})
                  </label>
                  <input
                    type="number"
                    value={expEstimated}
                    onChange={(e) => setExpEstimated(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Actual Cost ({sym}) — Optional
                  </label>
                  <input
                    type="number"
                    value={expActual}
                    onChange={(e) => setExpActual(e.target.value)}
                    placeholder="Leave blank if not yet paid"
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    How Will / Was This Paid?
                  </label>
                  <select
                    value={expPaidSource}
                    onChange={(e) =>
                      setExpPaidSource(e.target.value as PaidSource)
                    }
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    <option value="Pooled Fund">
                      Paid directly from Pooled Pot
                    </option>
                    <option value="Cousin Out-of-Pocket">
                      Out-of-Pocket (Reimburse)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Paid By Organizer
                  </label>
                  <select
                    value={expPaidByCousinId}
                    onChange={(e) => setExpPaidByCousinId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {cousins.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Notes
                </label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Receipt details or delivery notes"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5C6B64]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#9E2A2B] px-5 py-2 text-xs font-bold text-white"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Vote,
  Plus,
  Trash2,
  Trophy,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { PollItem, PollOption, Cousin } from '../../types/planner';
import { formatCurrency } from '../../lib/storageAdapter';

interface VotingTabProps {
  polls: PollItem[];
  cousins: Cousin[];
  activeCousinId: string;
  currencySymbol: string;
  onAddPoll: (poll: Omit<PollItem, 'id'>) => void;
  onUpdatePoll: (id: string, updates: Partial<PollItem>) => void;
  onDeletePoll: (id: string) => void;
}

const DEFAULT_POLL_CATEGORIES = [
  'Catering & Food',
  'Games',
  'Theme & Dress Code',
  'Venue & Setup',
  'Prizes & Gifts',
  'Program & Music',
];

export const VotingTab: React.FC<VotingTabProps> = ({
  polls,
  cousins,
  activeCousinId,
  currencySymbol: sym,
  onAddPoll,
  onUpdatePoll,
  onDeletePoll,
}) => {
  const [showAddPollModal, setShowAddPollModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Catering & Food');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(true);
  const [notes, setNotes] = useState('');
  const [draftOptions, setDraftOptions] = useState<
    { label: string; details: string; costEstimate: string }[]
  >([
    { label: '', details: '', costEstimate: '' },
    { label: '', details: '', costEstimate: '' },
  ]);

  // Quick add option to existing poll
  const [addingOptionPollId, setAddingOptionPollId] = useState<string | null>(
    null
  );
  const [newOptLabel, setNewOptLabel] = useState('');
  const [newOptDetails, setNewOptDetails] = useState('');
  const [newOptCost, setNewOptCost] = useState('');

  // Inline edit poll header state
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [editPollTitle, setEditPollTitle] = useState('');
  const [editPollCat, setEditPollCat] = useState('');
  const [editPollNotes, setEditPollNotes] = useState('');

  // Inline edit poll option state
  const [editingOptionKey, setEditingOptionKey] = useState<string | null>(null);
  const [editOptLabel, setEditOptLabel] = useState('');
  const [editOptDetails, setEditOptDetails] = useState('');
  const [editOptCost, setEditOptCost] = useState('');

  const activeCousin = cousins.find((c) => c.id === activeCousinId);

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Allow 0 options when creating a poll so the topic can be opened for suggestions
    const validOptions: PollOption[] = draftOptions
      .filter((o) => o.label.trim().length > 0)
      .map((o, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        label: o.label.trim(),
        details: o.details.trim() || undefined,
        costEstimate: o.costEstimate ? Number(o.costEstimate) : undefined,
        voterIds: [],
      }));

    const finalCat = isCustomCat
      ? customCatInput.trim() || 'General'
      : category;

    onAddPoll({
      title: title.trim(),
      category: finalCat,
      status: 'Open',
      allowMultipleVotes,
      options: validOptions,
      notes: notes.trim() || undefined,
      createdByCousinId: activeCousinId,
    });

    setTitle('');
    setNotes('');
    setCustomCatInput('');
    setIsCustomCat(false);
    setDraftOptions([
      { label: '', details: '', costEstimate: '' },
      { label: '', details: '', costEstimate: '' },
    ]);
    setShowAddPollModal(false);
  };

  const handleToggleVote = (poll: PollItem, optionId: string) => {
    if (poll.status === 'Finalized') return;

    const updatedOptions = poll.options.map((opt) => {
      const hasVoted = opt.voterIds.includes(activeCousinId);
      if (opt.id === optionId) {
        return {
          ...opt,
          voterIds: hasVoted
            ? opt.voterIds.filter((id) => id !== activeCousinId)
            : [...opt.voterIds, activeCousinId],
        };
      }
      // If single-choice poll, remove activeCousinId from other options
      if (!poll.allowMultipleVotes && hasVoted) {
        return {
          ...opt,
          voterIds: opt.voterIds.filter((id) => id !== activeCousinId),
        };
      }
      return opt;
    });

    onUpdatePoll(poll.id, { options: updatedOptions });
  };

  const handleAddOptionToPoll = (e: React.FormEvent, poll: PollItem) => {
    e.preventDefault();
    if (!newOptLabel.trim()) return;
    const newOpt: PollOption = {
      id: `opt-${Date.now()}`,
      label: newOptLabel.trim(),
      details: newOptDetails.trim() || undefined,
      costEstimate: newOptCost ? Number(newOptCost) : undefined,
      voterIds: [activeCousinId],
    };

    onUpdatePoll(poll.id, {
      options: [...poll.options, newOpt],
    });
    setNewOptLabel('');
    setNewOptDetails('');
    setNewOptCost('');
    setAddingOptionPollId(null);
  };

  const handleDeleteOption = (poll: PollItem, optionId: string) => {
    onUpdatePoll(poll.id, {
      options: poll.options.filter((o) => o.id !== optionId),
    });
  };

  const startEditingOption = (pollId: string, opt: PollOption) => {
    setEditingOptionKey(`${pollId}:${opt.id}`);
    setEditOptLabel(opt.label);
    setEditOptDetails(opt.details || '');
    setEditOptCost(
      opt.costEstimate !== undefined && opt.costEstimate > 0
        ? String(opt.costEstimate)
        : ''
    );
  };

  const saveEditingOption = (poll: PollItem, optionId: string) => {
    if (!editOptLabel.trim()) return;
    const updated = poll.options.map((o) =>
      o.id === optionId
        ? {
            ...o,
            label: editOptLabel.trim(),
            details: editOptDetails.trim() || undefined,
            costEstimate: editOptCost ? Number(editOptCost) : undefined,
          }
        : o
    );
    onUpdatePoll(poll.id, { options: updated });
    setEditingOptionKey(null);
  };

  const startEditingPoll = (poll: PollItem) => {
    setEditingPollId(poll.id);
    setEditPollTitle(poll.title);
    setEditPollCat(poll.category);
    setEditPollNotes(poll.notes || '');
  };

  const saveEditingPoll = (pollId: string) => {
    if (!editPollTitle.trim()) return;
    onUpdatePoll(pollId, {
      title: editPollTitle.trim(),
      category: editPollCat.trim() || 'General',
      notes: editPollNotes.trim() || undefined,
    });
    setEditingPollId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-[#1B4332]">
            Group Voting &amp; Decision Polls
          </h2>
          <p className="text-xs text-[#5C6B64]">
            Open topics for discussion, propose options (games, catering packages, food, theme), and vote as{' '}
            <strong className="text-[#1B4332]">
              {activeCousin?.name || 'Organizer'}
            </strong>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddPollModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#9E2A2B] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#7D2021]"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Poll / Topic</span>
        </button>
      </div>

      {/* Polls Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {polls.map((poll) => {
          const totalVotesCast = poll.options.reduce(
            (sum, o) => sum + o.voterIds.length,
            0
          );
          const maxVotes = Math.max(
            0,
            ...poll.options.map((o) => o.voterIds.length)
          );
          const isEditing = editingPollId === poll.id;

          return (
            <div
              key={poll.id}
              className={`flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-2xs transition ${
                poll.status === 'Finalized'
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-[#DED6C6]'
              }`}
            >
              <div>
                {/* Poll Header */}
                {isEditing ? (
                  <div className="mb-4 space-y-2 rounded-2xl border border-[#1B4332] bg-[#FAF6F0] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1B4332]">
                        Edit Poll Topic
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingPollId(null)}
                        className="text-[#5C6B64]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editPollTitle}
                      onChange={(e) => setEditPollTitle(e.target.value)}
                      placeholder="Poll Question / Topic"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={editPollCat}
                      onChange={(e) => setEditPollCat(e.target.value)}
                      placeholder="Category (e.g., Catering, Games, Theme)"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                    />
                    <input
                      type="text"
                      value={editPollNotes}
                      onChange={(e) => setEditPollNotes(e.target.value)}
                      placeholder="Notes or instructions"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingPollId(null)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5C6B64]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditingPoll(poll.id)}
                        className="flex items-center gap-1 rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
                      >
                        <Check className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2 border-b border-[#EFE9DC] pb-3.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-[#1B4332]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#1B4332]">
                          {poll.category}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            poll.status === 'Finalized'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {poll.status === 'Finalized'
                            ? '✓ Decision Finalized'
                            : poll.allowMultipleVotes
                            ? 'Multi-Vote Open'
                            : 'Single-Vote Open'}
                        </span>
                      </div>
                      <h3 className="font-serif-display mt-1.5 text-lg font-bold text-[#1B4332]">
                        {poll.title}
                      </h3>
                      {poll.notes && (
                        <p className="mt-0.5 text-xs text-[#5C6B64]">
                          {poll.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditingPoll(poll)}
                        title="Edit poll topic"
                        className="rounded p-1 text-[#5C6B64] hover:text-[#1B4332]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePoll(poll.id)}
                        title="Delete poll"
                        className="rounded p-1 text-[#8C9690] hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Poll Options List */}
                <div className="mt-4 space-y-2.5">
                  {poll.options.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#D4CBB8] bg-[#FAF6F0]/60 p-4 text-center">
                      <p className="text-xs font-semibold text-[#1B4332]">
                        No options added yet
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#5C6B64]">
                        Click <strong>+ Add Option</strong> below to suggest the first idea or package!
                      </p>
                    </div>
                  ) : (
                    poll.options.map((opt) => {
                      const votedByMe = opt.voterIds.includes(activeCousinId);
                      const isLeading =
                        maxVotes > 0 && opt.voterIds.length === maxVotes;
                      const isWinner = poll.winnerOptionId === opt.id;
                      const voters = opt.voterIds
                        .map((id) => cousins.find((c) => c.id === id))
                        .filter((c): c is Cousin => Boolean(c));

                      const pct =
                        cousins.length > 0
                          ? Math.round(
                              (opt.voterIds.length / cousins.length) * 100
                            )
                          : 0;

                      const isEditingOpt =
                        editingOptionKey === `${poll.id}:${opt.id}`;

                      if (isEditingOpt) {
                        return (
                          <div
                            key={opt.id}
                            className="space-y-2 rounded-2xl border border-[#1B4332] bg-[#FAF6F0] p-3"
                          >
                            <input
                              type="text"
                              value={editOptLabel}
                              onChange={(e) => setEditOptLabel(e.target.value)}
                              placeholder="Option Name"
                              className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={editOptDetails}
                                onChange={(e) =>
                                  setEditOptDetails(e.target.value)
                                }
                                placeholder="Details / Notes (optional)"
                                className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                              />
                              <input
                                type="number"
                                value={editOptCost}
                                onChange={(e) => setEditOptCost(e.target.value)}
                                placeholder={`Est. Cost (${sym}) optional`}
                                className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                              />
                            </div>
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingOptionKey(null)}
                                className="rounded-lg px-2 py-1 text-xs font-semibold text-[#5C6B64]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEditingOption(poll, opt.id)}
                                className="flex items-center gap-1 rounded-lg bg-[#1B4332] px-2.5 py-1 text-xs font-bold text-white"
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
                          key={opt.id}
                          className={`rounded-2xl border p-3.5 transition ${
                            isWinner
                              ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/30'
                              : votedByMe
                              ? 'border-[#1B4332] bg-[#1B4332]/5'
                              : 'border-[#E5DEC9] bg-[#FAF6F0]/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-bold text-[#1C2826]">
                                  {opt.label}
                                </span>
                                {isLeading && poll.status === 'Open' && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                    <Trophy className="h-2.5 w-2.5" /> Leading
                                  </span>
                                )}
                                {isWinner && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">
                                    <Trophy className="h-2.5 w-2.5" /> Chosen Winner
                                  </span>
                                )}
                                {opt.costEstimate !== undefined &&
                                  opt.costEstimate > 0 && (
                                    <span className="font-mono text-xs font-bold text-[#9E2A2B]">
                                      Est. {formatCurrency(opt.costEstimate, sym)}
                                    </span>
                                  )}
                              </div>
                              {opt.details && (
                                <p className="mt-0.5 text-xs text-[#5C6B64]">
                                  {opt.details}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {poll.status === 'Open' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleVote(poll, opt.id)}
                                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                    votedByMe
                                      ? 'bg-[#1B4332] text-white shadow-2xs'
                                      : 'border border-[#D4CBB8] bg-white text-[#1C2826] hover:bg-[#F3EDE2]'
                                  }`}
                                >
                                  <Vote className="h-3.5 w-3.5" />
                                  <span>
                                    {votedByMe ? 'Voted' : 'Vote'} ({opt.voterIds.length})
                                  </span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => startEditingOption(poll.id, opt)}
                                title="Edit option"
                                className="rounded p-1 text-[#5C6B64] hover:text-[#1B4332]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteOption(poll, opt.id)}
                                title="Remove option"
                                className="rounded p-1 text-[#8C9690] hover:text-red-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Progress Bar & Voter Avatars */}
                          <div className="mt-2.5">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5DEC9]">
                              <div
                                className="h-full bg-[#1B4332] transition-all"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>

                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1">
                                {voters.length === 0 ? (
                                  <span className="text-[10px] text-[#8C9690]">
                                    No votes yet
                                  </span>
                                ) : (
                                  voters.map((v) => (
                                    <span
                                      key={v.id}
                                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#1C2826] shadow-2xs"
                                    >
                                      <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: v.avatarColor }}
                                      />
                                      {v.name}
                                    </span>
                                  ))
                                )}
                              </div>

                              {poll.status === 'Open' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdatePoll(poll.id, {
                                      status: 'Finalized',
                                      winnerOptionId: opt.id,
                                    })
                                  }
                                  className="text-[10px] font-bold text-[#1B4332] hover:underline"
                                >
                                  Lock as Final Decision →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer: Add Option or Reopen Poll */}
              <div className="mt-4 border-t border-[#EFE9DC] pt-3">
                {addingOptionPollId === poll.id ? (
                  <form
                    onSubmit={(e) => handleAddOptionToPoll(e, poll)}
                    className="space-y-2 rounded-xl bg-[#FAF6F0] p-3"
                  >
                    <input
                      type="text"
                      required
                      value={newOptLabel}
                      onChange={(e) => setNewOptLabel(e.target.value)}
                      placeholder="Option Name (e.g., Package A / New Game Idea)"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newOptDetails}
                        onChange={(e) => setNewOptDetails(e.target.value)}
                        placeholder="Details / Pros (optional)"
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                      />
                      <input
                        type="number"
                        value={newOptCost}
                        onChange={(e) => setNewOptCost(e.target.value)}
                        placeholder={`Est. Cost in ${sym} (optional)`}
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingOptionPollId(null)}
                        className="text-xs font-semibold text-[#5C6B64]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
                      >
                        Add Option &amp; Vote
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-[#5C6B64]">
                      Total votes cast: {totalVotesCast}
                    </span>
                    <div className="flex items-center gap-2">
                      {poll.status === 'Finalized' ? (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePoll(poll.id, {
                              status: 'Open',
                              winnerOptionId: undefined,
                            })
                          }
                          className="rounded-xl border border-[#D4CBB8] bg-white px-3 py-1.5 text-xs font-bold text-[#1B4332] hover:bg-[#FAF6F0]"
                        >
                          Reopen Voting
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingOptionPollId(poll.id)}
                          className="flex items-center gap-1 rounded-xl border border-dashed border-[#1B4332]/40 bg-[#1B4332]/5 px-3 py-1.5 text-xs font-bold text-[#1B4332] hover:bg-[#1B4332]/10"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>+ Add Option</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {polls.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-[#D4CBB8] bg-white p-10 text-center">
            <Vote className="mx-auto h-8 w-8 text-[#9E2A2B]" />
            <h3 className="font-serif-display mt-2 text-lg font-bold text-[#1B4332]">
              No Voting Polls Yet
            </h3>
            <p className="mt-1 text-xs text-[#5C6B64]">
              Create a poll to let the organizers suggest options and vote on games, catering packages, food trays, or party themes!
            </p>
          </div>
        )}
      </div>

      {/* Create New Poll Modal */}
      {showAddPollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              Create New Voting Poll
            </h3>
            <form onSubmit={handleCreatePoll} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Topic / Question to Decide
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Catering Options / Party Games Ideas"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Category
                  </label>
                  <select
                    value={isCustomCat ? '__CUSTOM__' : category}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomCat(true);
                      } else {
                        setIsCustomCat(false);
                        setCategory(e.target.value);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    {DEFAULT_POLL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Custom Category...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Voting Rule
                  </label>
                  <select
                    value={allowMultipleVotes ? 'multi' : 'single'}
                    onChange={(e) =>
                      setAllowMultipleVotes(e.target.value === 'multi')
                    }
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    <option value="multi">
                      Allow voting for multiple options
                    </option>
                    <option value="single">Single choice per person</option>
                  </select>
                </div>
              </div>

              {isCustomCat && (
                <input
                  type="text"
                  required
                  value={customCatInput}
                  onChange={(e) => setCustomCatInput(e.target.value)}
                  placeholder="Enter custom category name..."
                  className="w-full rounded-xl border border-[#1B4332] bg-white px-3.5 py-2 text-xs"
                />
              )}

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Notes / Context (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any extra context for voters..."
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              {/* Options Builder (Optional) */}
              <div className="space-y-2 rounded-2xl border border-[#DED6C6] bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1B4332]">
                      Options to Vote On{' '}
                      <span className="font-normal text-[#5C6B64]">
                        (Optional — leave blank to let others add options later)
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftOptions((prev) => [
                        ...prev,
                        { label: '', details: '', costEstimate: '' },
                      ])
                    }
                    className="shrink-0 text-xs font-bold text-[#9E2A2B] hover:underline"
                  >
                    + Add Option Row
                  </button>
                </div>

                {draftOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className="space-y-1.5 rounded-xl bg-[#FAF6F0] p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftOptions((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, label: val } : item
                            )
                          );
                        }}
                        placeholder={`Option ${idx + 1} (optional — e.g., Package A / Game Idea)`}
                        className="flex-1 rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                      />
                      {draftOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraftOptions((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="text-[#8C9690] hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={opt.details}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftOptions((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, details: val } : item
                            )
                          );
                        }}
                        placeholder="Details / Notes (optional)"
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-[11px]"
                      />
                      <input
                        type="number"
                        value={opt.costEstimate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftOptions((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, costEstimate: val } : item
                            )
                          );
                        }}
                        placeholder={`Est. Cost (${sym}) optional`}
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPollModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5C6B64]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1B4332] px-5 py-2 text-xs font-bold text-white"
                >
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

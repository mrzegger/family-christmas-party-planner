import React, { useState } from 'react';
import {
  Clock,
  Gamepad2,
  Plus,
  Trash2,
  Gift,
  ChevronDown,
  ChevronUp,
  Wrench,
  BookOpen,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import {
  ProgramItem,
  GameItem,
  ProgramCategory,
  GameAudience,
  GameStatus,
} from '../../types/planner';
import { formatCurrency } from '../../lib/storageAdapter';

interface ProgramGamesTabProps {
  currencySymbol: string;
  programItems: ProgramItem[];
  games: GameItem[];
  customCategories?: string[];
  onAddCustomCategory: (cat: string) => void;
  onAddProgramItem: (item: Omit<ProgramItem, 'id'>) => void;
  onUpdateProgramItem: (id: string, updates: Partial<ProgramItem>) => void;
  onDeleteProgramItem: (id: string) => void;
  onAddGame: (game: Omit<GameItem, 'id'>) => void;
  onUpdateGame: (id: string, updates: Partial<GameItem>) => void;
  onDeleteGame: (id: string) => void;
}

const DEFAULT_PROGRAM_CATEGORIES: ProgramCategory[] = [
  'Arrival & Cocktails',
  'Welcome & Prayer',
  'Dinner & Feast',
  'Party Game',
  'Gift Exchange & Raffle',
  'Family Photo & Closing',
];

const GAME_STATUSES: GameStatus[] = [
  'Idea / Planning',
  'Props & Prizes Bought',
  'Ready to Host',
];

export const ProgramGamesTab: React.FC<ProgramGamesTabProps> = ({
  currencySymbol: sym,
  programItems,
  games,
  customCategories = [],
  onAddCustomCategory,
  onAddProgramItem,
  onUpdateProgramItem,
  onDeleteProgramItem,
  onAddGame,
  onUpdateGame,
  onDeleteGame,
}) => {
  const allProgramCategories = Array.from(
    new Set([
      ...DEFAULT_PROGRAM_CATEGORIES,
      ...customCategories,
      ...programItems.map((p) => p.category).filter(Boolean),
    ])
  );

  const [expandedGameIds, setExpandedGameIds] = useState<string[]>(
    games.map((g) => g.id)
  );
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);

  // New Program Slot form state
  const [startTime, setStartTime] = useState('21:00');
  const [durationMins, setDurationMins] = useState(25);
  const [slotTitle, setSlotTitle] = useState('');
  const [slotCategory, setSlotCategory] =
    useState<ProgramCategory>('Party Game');
  const [isAddingCustomCat, setIsAddingCustomCat] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const [slotNotes, setSlotNotes] = useState('');

  // Inline edit Program Slot state
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editSlotTime, setEditSlotTime] = useState('');
  const [editSlotDuration, setEditSlotDuration] = useState(25);
  const [editSlotTitle, setEditSlotTitle] = useState('');
  const [editSlotCategory, setEditSlotCategory] =
    useState<ProgramCategory>('Party Game');
  const [isEditingCustomCat, setIsEditingCustomCat] = useState(false);
  const [editCustomCatInput, setEditCustomCatInput] = useState('');
  const [editSlotNotes, setEditSlotNotes] = useState('');

  // New Game Card form state
  const [gameTitle, setGameTitle] = useState('');
  const [gameAudience, setGameAudience] = useState<GameAudience>('Everyone');
  const [gameDuration, setGameDuration] = useState(25);
  const [gameRules, setGameRules] = useState('');
  const [gameMaterials, setGameMaterials] = useState('');
  const [gamePrizes, setGamePrizes] = useState('');
  const [gameBudget, setGameBudget] = useState(1500);

  // Inline edit Game Card state
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editGameTitle, setEditGameTitle] = useState('');
  const [editGameAudience, setEditGameAudience] =
    useState<GameAudience>('Everyone');
  const [editGameDuration, setEditGameDuration] = useState(25);
  const [editGameRules, setEditGameRules] = useState('');
  const [editGameMaterials, setEditGameMaterials] = useState('');
  const [editGamePrizes, setEditGamePrizes] = useState('');
  const [editGameBudget, setEditGameBudget] = useState(0);

  const sortedSchedule = [...programItems].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  const toggleExpandGame = (id: string) => {
    setExpandedGameIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotTitle.trim()) return;
    let finalCategory = slotCategory;
    if (isAddingCustomCat && customCatInput.trim()) {
      finalCategory = customCatInput.trim();
      onAddCustomCategory(finalCategory);
    }
    onAddProgramItem({
      startTime,
      durationMins: Number(durationMins) || 20,
      title: slotTitle.trim(),
      category: finalCategory,
      notes: slotNotes.trim(),
    });
    setSlotTitle('');
    setSlotNotes('');
    setIsAddingCustomCat(false);
    setCustomCatInput('');
    setShowAddSlotModal(false);
  };

  const startEditingSlot = (slot: ProgramItem) => {
    setEditingSlotId(slot.id);
    setEditSlotTime(slot.startTime);
    setEditSlotDuration(slot.durationMins);
    setEditSlotTitle(slot.title);
    setEditSlotCategory(slot.category);
    setIsEditingCustomCat(false);
    setEditCustomCatInput('');
    setEditSlotNotes(slot.notes);
  };

  const saveEditingSlot = (id: string) => {
    if (!editSlotTitle.trim()) return;
    let finalCategory = editSlotCategory;
    if (isEditingCustomCat && editCustomCatInput.trim()) {
      finalCategory = editCustomCatInput.trim();
      onAddCustomCategory(finalCategory);
    }
    onUpdateProgramItem(id, {
      startTime: editSlotTime,
      durationMins: Number(editSlotDuration) || 15,
      title: editSlotTitle.trim(),
      category: finalCategory,
      notes: editSlotNotes.trim(),
    });
    setEditingSlotId(null);
  };

  const handleAddGameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle.trim()) return;
    onAddGame({
      title: gameTitle.trim(),
      audience: gameAudience,
      durationMins: Number(gameDuration) || 20,
      rules: gameRules.trim() || 'Rules TBD',
      materials: gameMaterials.trim() || 'Materials TBD',
      prizes: gamePrizes.trim() || 'Prizes TBD',
      prizeBudget: Number(gameBudget) || 0,
      status: 'Idea / Planning',
    });
    setGameTitle('');
    setGameRules('');
    setGameMaterials('');
    setGamePrizes('');
    setShowAddGameModal(false);
  };

  const startEditingGame = (game: GameItem) => {
    setEditingGameId(game.id);
    setEditGameTitle(game.title);
    setEditGameAudience(game.audience);
    setEditGameDuration(game.durationMins);
    setEditGameRules(game.rules);
    setEditGameMaterials(game.materials);
    setEditGamePrizes(game.prizes);
    setEditGameBudget(game.prizeBudget);
    if (!expandedGameIds.includes(game.id)) {
      setExpandedGameIds((prev) => [...prev, game.id]);
    }
  };

  const saveEditingGame = (id: string) => {
    if (!editGameTitle.trim()) return;
    onUpdateGame(id, {
      title: editGameTitle.trim(),
      audience: editGameAudience,
      durationMins: Number(editGameDuration) || 20,
      rules: editGameRules.trim(),
      materials: editGameMaterials.trim(),
      prizes: editGamePrizes.trim(),
      prizeBudget: Number(editGameBudget) || 0,
    });
    setEditingGameId(null);
  };

  const totalPrizeBudget = games.reduce((s, g) => s + g.prizeBudget, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-[#1B4332]">
            Program Flow &amp; Surprise Games Planner
          </h2>
          <p className="text-xs text-[#5C6B64]">
            Chronological run-of-show timeline with custom segment types + expandable game cards. Click the pencil icon on any slot or game to edit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsAddingCustomCat(false);
              setCustomCatInput('');
              setShowAddSlotModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[#1B4332] bg-white px-4 py-2 text-xs font-bold text-[#1B4332] hover:bg-[#FAF6F0]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Timeline Slot</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddGameModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#9E2A2B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#7D2021]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Party Game Card</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left 5 Cols = Chronological Timeline | Right 7 Cols = Detailed Game Cards */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Chronological Run-of-Show Timeline */}
        <div className="space-y-4 rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[#EFE9DC] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#9E2A2B]" />
              <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
                Party Night Run-of-Show
              </h3>
            </div>
            <span className="rounded-full bg-[#FAF6F0] px-2.5 py-0.5 text-xs font-bold text-[#5C6B64]">
              {sortedSchedule.length} Segments
            </span>
          </div>

          <div className="relative space-y-4 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-0.5 before:bg-[#E5DEC9]">
            {sortedSchedule.map((slot) => {
              const isEditing = editingSlotId === slot.id;

              return (
                <div key={slot.id} className="relative pl-8">
                  <span className="absolute top-3 left-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#1B4332] shadow-2xs" />
                  {isEditing ? (
                    <div className="space-y-2.5 rounded-2xl border border-[#1B4332] bg-[#FAF6F0] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1B4332]">
                          Edit Timeline Segment
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingSlotId(null)}
                          className="text-[#5C6B64]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={editSlotTime}
                          onChange={(e) => setEditSlotTime(e.target.value)}
                          className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          value={editSlotDuration}
                          onChange={(e) =>
                            setEditSlotDuration(Number(e.target.value))
                          }
                          placeholder="Mins"
                          className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                        />
                      </div>
                      <input
                        type="text"
                        value={editSlotTitle}
                        onChange={(e) => setEditSlotTitle(e.target.value)}
                        placeholder="Segment Title"
                        className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                      />
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Segment Type
                        </label>
                        {!isEditingCustomCat ? (
                          <select
                            value={editSlotCategory}
                            onChange={(e) => {
                              if (e.target.value === '__CUSTOM__') {
                                setIsEditingCustomCat(true);
                              } else {
                                setEditSlotCategory(e.target.value);
                              }
                            }}
                            className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                          >
                            {allProgramCategories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                            <option value="__CUSTOM__">
                              + Add Custom Segment Type...
                            </option>
                          </select>
                        ) : (
                          <div className="mt-0.5 flex gap-1.5">
                            <input
                              type="text"
                              value={editCustomCatInput}
                              onChange={(e) =>
                                setEditCustomCatInput(e.target.value)
                              }
                              placeholder="Custom segment type"
                              className="w-full rounded-lg border border-[#1B4332] bg-white px-2 py-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setIsEditingCustomCat(false)}
                              className="rounded-lg border border-[#D4CBB8] bg-white px-2 text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editSlotNotes}
                        onChange={(e) => setEditSlotNotes(e.target.value)}
                        placeholder="Cue or stage notes"
                        className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingSlotId(null)}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5C6B64]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditingSlot(slot.id)}
                          className="flex items-center gap-1 rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
                        >
                          <Check className="h-3 w-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0]/70 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-lg bg-[#1B4332] px-2.5 py-0.5 font-mono text-xs font-bold text-[#E9C46A]">
                            {slot.startTime}
                          </span>
                          <span className="text-[11px] font-semibold text-[#5C6B64]">
                            ({slot.durationMins} mins)
                          </span>
                          <span className="rounded-md bg-[#9E2A2B]/10 px-2 py-0.5 text-[10px] font-bold text-[#9E2A2B]">
                            {slot.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingSlot(slot)}
                            title="Edit timeline slot"
                            className="rounded p-1 text-[#5C6B64] hover:text-[#1B4332]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProgramItem(slot.id)}
                            className="rounded p-1 text-[#8C9690] hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="mt-2 text-sm font-bold text-[#1C2826]">
                        {slot.title}
                      </h4>

                      {slot.notes && (
                        <p className="mt-1 text-xs text-[#5C6B64]">
                          {slot.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Expandable Game Cards */}
        <div className="space-y-4 rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE9DC] pb-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-[#9E2A2B]" />
              <div>
                <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
                  Detailed Party Game Cards
                </h3>
                <p className="text-xs text-[#5C6B64]">
                  Total Prize Pool Allocated:{' '}
                  <strong className="text-[#9E2A2B]">
                    {formatCurrency(totalPrizeBudget, sym)}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {games.map((game) => {
              const isExpanded = expandedGameIds.includes(game.id);
              const isEditing = editingGameId === game.id;

              if (isEditing) {
                return (
                  <div
                    key={game.id}
                    className="space-y-3 rounded-2xl border border-[#1B4332] bg-[#FAF6F0] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1B4332]">
                        Edit Party Game Card
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingGameId(null)}
                        className="text-[#5C6B64]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editGameTitle}
                      onChange={(e) => setEditGameTitle(e.target.value)}
                      placeholder="Game Title"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={editGameAudience}
                        onChange={(e) =>
                          setEditGameAudience(e.target.value as GameAudience)
                        }
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      >
                        <option value="Everyone">Everyone</option>
                        <option value="Adults">Adults</option>
                        <option value="Kids">Kids</option>
                        <option value="Parents / Titos & Titas">
                          Parents / Seniors
                        </option>
                      </select>
                      <input
                        type="number"
                        value={editGameDuration}
                        onChange={(e) =>
                          setEditGameDuration(Number(e.target.value))
                        }
                        placeholder="Mins"
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      />
                      <input
                        type="number"
                        value={editGameBudget}
                        onChange={(e) =>
                          setEditGameBudget(Number(e.target.value))
                        }
                        placeholder="Budget"
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#5C6B64]">
                        Mechanics &amp; Rules
                      </label>
                      <textarea
                        rows={2}
                        value={editGameRules}
                        onChange={(e) => setEditGameRules(e.target.value)}
                        className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Props &amp; Materials
                        </label>
                        <input
                          type="text"
                          value={editGameMaterials}
                          onChange={(e) => setEditGameMaterials(e.target.value)}
                          className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Prizes Breakdown
                        </label>
                        <input
                          type="text"
                          value={editGamePrizes}
                          onChange={(e) => setEditGamePrizes(e.target.value)}
                          className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingGameId(null)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5C6B64]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditingGame(game.id)}
                        className="flex items-center gap-1 rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
                      >
                        <Check className="h-3 w-3" />
                        <span>Save Game</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={game.id}
                  className="overflow-hidden rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0]/80 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div
                      onClick={() => toggleExpandGame(game.id)}
                      className="flex flex-1 cursor-pointer items-start gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4332] text-[#E9C46A]">
                        <Gamepad2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-[#9E2A2B]/15 px-2 py-0.5 text-[10px] font-bold text-[#9E2A2B]">
                            For: {game.audience}
                          </span>
                          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5C6B64]">
                            {game.durationMins} mins
                          </span>
                          <span className="font-mono text-[11px] font-bold text-emerald-800">
                            Prize Budget: {formatCurrency(game.prizeBudget, sym)}
                          </span>
                        </div>
                        <h4 className="mt-1 text-base font-bold text-[#1B4332]">
                          {game.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEditingGame(game)}
                        title="Edit game card"
                        className="rounded-lg p-1.5 text-[#5C6B64] hover:bg-white hover:text-[#1B4332]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpandGame(game.id)}
                        className="flex items-center gap-1 rounded-xl border border-[#DED6C6] bg-white px-2.5 py-1.5 text-xs font-bold text-[#1B4332]"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGame(game.id)}
                        className="rounded p-1.5 text-[#8C9690] hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Body: Mechanics, Props, Prizes & Status */}
                  {isExpanded && (
                    <div className="space-y-3 border-t border-[#E5DEC9] bg-white p-4">
                      <div className="rounded-xl bg-[#FAF6F0] p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B4332]">
                          <BookOpen className="h-3.5 w-3.5 text-[#9E2A2B]" />
                          <span>How to Play / Mechanics</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-[#1C2826]">
                          {game.rules}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-[#EFE9DC] p-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B4332]">
                            <Wrench className="h-3.5 w-3.5 text-[#B5651D]" />
                            <span>Props &amp; Materials Needed</span>
                          </div>
                          <p className="mt-1 text-xs text-[#5C6B64]">
                            {game.materials}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#EFE9DC] p-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B4332]">
                            <Gift className="h-3.5 w-3.5 text-[#9E2A2B]" />
                            <span>Prizes &amp; Winners</span>
                          </div>
                          <p className="mt-1 text-xs text-[#5C6B64]">
                            {game.prizes}
                          </p>
                        </div>
                      </div>

                      {/* Game Readiness Status Pills */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-xs font-semibold text-[#5C6B64]">
                          Game Readiness:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {GAME_STATUSES.map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() =>
                                onUpdateGame(game.id, { status: st })
                              }
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                game.status === st
                                  ? 'bg-[#1B4332] text-white'
                                  : 'bg-[#FAF6F0] text-[#5C6B64] hover:bg-[#E5DEC9]'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Timeline Slot Modal */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              Add Program Schedule Slot
            </h3>
            <form onSubmit={handleAddSlotSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Start Time (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    value={durationMins}
                    onChange={(e) => setDurationMins(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Segment Title
                </label>
                <input
                  type="text"
                  required
                  value={slotTitle}
                  onChange={(e) => setSlotTitle(e.target.value)}
                  placeholder="e.g., Group Trivia / Gift Exchange"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Segment Type
                </label>
                {!isAddingCustomCat ? (
                  <select
                    value={slotCategory}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsAddingCustomCat(true);
                      } else {
                        setSlotCategory(e.target.value);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    {allProgramCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__CUSTOM__">
                      + Add Custom Segment Type...
                    </option>
                  </select>
                ) : (
                  <div className="mt-1 flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      placeholder="Enter custom segment type..."
                      className="w-full rounded-xl border border-[#1B4332] bg-white px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomCat(false)}
                      className="rounded-xl border border-[#D4CBB8] bg-white px-2.5 text-xs text-[#5C6B64]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Cue / Stage Notes
                </label>
                <input
                  type="text"
                  value={slotNotes}
                  onChange={(e) => setSlotNotes(e.target.value)}
                  placeholder="Audio cue or setup reminder"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5C6B64]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1B4332] px-5 py-2 text-xs font-bold text-white"
                >
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Game Modal */}
      {showAddGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              Add Party Game Card
            </h3>
            <form onSubmit={handleAddGameSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Game Title
                </label>
                <input
                  type="text"
                  required
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  placeholder="e.g., Holiday Relay / Musical Bingo"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Target Players
                  </label>
                  <select
                    value={gameAudience}
                    onChange={(e) =>
                      setGameAudience(e.target.value as GameAudience)
                    }
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    <option value="Everyone">Everyone</option>
                    <option value="Adults">Adults</option>
                    <option value="Kids">Kids</option>
                    <option value="Parents / Titos & Titas">
                      Parents / Seniors
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={gameDuration}
                    onChange={(e) => setGameDuration(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Prize Budget ({sym})
                  </label>
                  <input
                    type="number"
                    value={gameBudget}
                    onChange={(e) => setGameBudget(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Game Mechanics &amp; Rules
                </label>
                <textarea
                  rows={2}
                  value={gameRules}
                  onChange={(e) => setGameRules(e.target.value)}
                  placeholder="How the game works and how winners are scored..."
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Materials &amp; Props Needed
                </label>
                <input
                  type="text"
                  value={gameMaterials}
                  onChange={(e) => setGameMaterials(e.target.value)}
                  placeholder="e.g., Plastic cups, ping pong balls, blindfolds"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Prizes Breakdown
                </label>
                <input
                  type="text"
                  value={gamePrizes}
                  onChange={(e) => setGamePrizes(e.target.value)}
                  placeholder="e.g., 1st Place cash prize, consolation gift bags"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGameModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5C6B64]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#9E2A2B] px-5 py-2 text-xs font-bold text-white"
                >
                  Save Game Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

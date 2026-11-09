import React, { useState } from 'react';
import {
  ShoppingBag,
  PackageCheck,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import {
  ChecklistItem,
  Cousin,
  ChecklistCategory,
} from '../../types/planner';

interface ChecklistsTabProps {
  checklistItems: ChecklistItem[];
  cousins: Cousin[];
  activeCousinId: string;
  customCategories?: string[];
  onAddCustomCategory: (cat: string) => void;
  onAddChecklistItem: (item: Omit<ChecklistItem, 'id'>) => void;
  onUpdateChecklistItem: (
    id: string,
    updates: Partial<ChecklistItem>
  ) => void;
  onDeleteChecklistItem: (id: string) => void;
}

const DEFAULT_CATEGORIES: ChecklistCategory[] = [
  'Game Prizes',
  'Game Props & Materials',
  'Audio / Tech & Cables',
  'Decor & Photo Booth',
  'Food & Sharon (Takeout) Supplies',
];

export const ChecklistsTab: React.FC<ChecklistsTabProps> = ({
  checklistItems,
  cousins,
  customCategories = [],
  onAddCustomCategory,
  onAddChecklistItem,
  onUpdateChecklistItem,
  onDeleteChecklistItem,
}) => {
  const allCategories = Array.from(
    new Set([
      ...DEFAULT_CATEGORIES,
      ...customCategories,
      ...checklistItems.map((i) => i.category).filter(Boolean),
    ])
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] =
    useState<ChecklistCategory>('Game Prizes');
  const [isAddingCustomCat, setIsAddingCustomCat] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');

  // Assigned organizer or outside person state
  const [assignedSelection, setAssignedSelection] = useState<string>('');
  const [customAssigneeName, setCustomAssigneeName] = useState('');
  const [quantity, setQuantity] = useState('1 set');
  const [notes, setNotes] = useState('');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] =
    useState<ChecklistCategory>('Game Prizes');
  const [isEditingCustomCat, setIsEditingCustomCat] = useState(false);
  const [editCustomCatInput, setEditCustomCatInput] = useState('');
  const [editAssignedSelection, setEditAssignedSelection] = useState('');
  const [editCustomAssigneeName, setEditCustomAssigneeName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const boughtCount = checklistItems.filter((i) => i.isBought).length;
  const packedCount = checklistItems.filter((i) => i.isPacked).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    let finalCategory = category;
    if (isAddingCustomCat && customCatInput.trim()) {
      finalCategory = customCatInput.trim();
      onAddCustomCategory(finalCategory);
    }

    const isOutsidePerson = assignedSelection === '__OUTSIDE__';
    onAddChecklistItem({
      title: title.trim(),
      category: finalCategory,
      assignedCousinId: isOutsidePerson ? '' : assignedSelection,
      customAssigneeName: isOutsidePerson
        ? customAssigneeName.trim()
        : undefined,
      quantity: quantity.trim() || '1',
      isBought: false,
      isPacked: false,
      notes: notes.trim(),
    });
    setTitle('');
    setNotes('');
    setCustomAssigneeName('');
    setIsAddingCustomCat(false);
    setCustomCatInput('');
    setShowAddModal(false);
  };

  const startEditingItem = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setIsEditingCustomCat(false);
    setEditCustomCatInput('');
    if (item.customAssigneeName) {
      setEditAssignedSelection('__OUTSIDE__');
      setEditCustomAssigneeName(item.customAssigneeName);
    } else {
      setEditAssignedSelection(item.assignedCousinId || '');
      setEditCustomAssigneeName('');
    }
    setEditQuantity(item.quantity);
    setEditNotes(item.notes);
  };

  const saveEditingItem = (id: string) => {
    if (!editTitle.trim()) return;
    let finalCategory = editCategory;
    if (isEditingCustomCat && editCustomCatInput.trim()) {
      finalCategory = editCustomCatInput.trim();
      onAddCustomCategory(finalCategory);
    }
    const isOutsidePerson = editAssignedSelection === '__OUTSIDE__';
    onUpdateChecklistItem(id, {
      title: editTitle.trim(),
      category: finalCategory,
      assignedCousinId: isOutsidePerson ? '' : editAssignedSelection,
      customAssigneeName: isOutsidePerson
        ? editCustomAssigneeName.trim()
        : undefined,
      quantity: editQuantity.trim() || '1',
      notes: editNotes.trim(),
    });
    setEditingId(null);
  };

  const getAssigneeLabel = (item: ChecklistItem): string => {
    if (item.customAssigneeName && item.customAssigneeName.trim()) {
      return item.customAssigneeName.trim();
    }
    if (item.assignedCousinId) {
      const found = cousins.find((c) => c.id === item.assignedCousinId);
      if (found) return found.name;
    }
    return 'Unassigned';
  };

  return (
    <div className="space-y-6">
      {/* Header & Progress */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-[#1B4332]">
            Day-Of Shopping &amp; Car-Trunk Packing Checklists
          </h2>
          <p className="text-xs text-[#5C6B64]">
            Two-stage verification so nothing gets left at home: check <strong>1. Bought/Ready</strong> then <strong>2. Packed for Venue</strong>. Supports custom categories and outside assignees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0] px-4 py-2 text-xs font-bold">
            <span className="text-[#1B4332]">
              Bought: {boughtCount}/{checklistItems.length}
            </span>
            <span className="text-[#D4CBB8]">|</span>
            <span className="text-emerald-800">
              Packed in Car: {packedCount}/{checklistItems.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setAssignedSelection('');
              setCustomAssigneeName('');
              setIsAddingCustomCat(false);
              setCustomCatInput('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#9E2A2B] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#7D2021]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Checklist Item</span>
          </button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {allCategories.map((cat) => {
          const items = checklistItems.filter((i) => i.category === cat);

          return (
            <div
              key={cat}
              className="rounded-3xl border border-[#DED6C6] bg-white p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-[#EFE9DC] pb-3">
                <h3 className="font-serif-display text-lg font-bold text-[#1B4332]">
                  {cat}
                </h3>
                <span className="rounded-full bg-[#FAF6F0] px-2.5 py-0.5 text-xs font-bold text-[#5C6B64]">
                  {items.filter((i) => i.isPacked).length}/{items.length} Packed
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const assigneeLabel = getAssigneeLabel(item);
                  const isEditing = editingId === item.id;

                  if (isEditing) {
                    return (
                      <div
                        key={item.id}
                        className="space-y-2.5 rounded-2xl border border-[#1B4332] bg-[#FAF6F0] p-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1B4332]">
                            Edit Checklist Item
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-[#5C6B64]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Item Description"
                          className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-[#5C6B64]">
                              Category
                            </label>
                            {!isEditingCustomCat ? (
                              <select
                                value={editCategory}
                                onChange={(e) => {
                                  if (e.target.value === '__CUSTOM__') {
                                    setIsEditingCustomCat(true);
                                  } else {
                                    setEditCategory(e.target.value);
                                  }
                                }}
                                className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                              >
                                {allCategories.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                                <option value="__CUSTOM__">
                                  + Custom Category...
                                </option>
                              </select>
                            ) : (
                              <div className="mt-0.5 flex gap-1">
                                <input
                                  type="text"
                                  value={editCustomCatInput}
                                  onChange={(e) =>
                                    setEditCustomCatInput(e.target.value)
                                  }
                                  placeholder="Category name"
                                  className="w-full rounded-lg border border-[#1B4332] bg-white px-2 py-1 text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => setIsEditingCustomCat(false)}
                                  className="rounded border border-[#D4CBB8] bg-white px-1.5 text-[10px]"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#5C6B64]">
                              Quantity
                            </label>
                            <input
                              type="text"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              placeholder="Qty"
                              className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#5C6B64]">
                            Assigned To
                          </label>
                          <select
                            value={editAssignedSelection}
                            onChange={(e) =>
                              setEditAssignedSelection(e.target.value)
                            }
                            className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                          >
                            <option value="">Unassigned</option>
                            {cousins.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} (Committee)
                              </option>
                            ))}
                            <option value="__OUTSIDE__">
                              + Someone Outside Committee (Custom Name)...
                            </option>
                          </select>
                          {editAssignedSelection === '__OUTSIDE__' && (
                            <input
                              type="text"
                              value={editCustomAssigneeName}
                              onChange={(e) =>
                                setEditCustomAssigneeName(e.target.value)
                              }
                              placeholder="Enter person's name"
                              className="mt-1.5 w-full rounded-lg border border-[#1B4332] bg-white px-2.5 py-1 text-xs"
                            />
                          )}
                        </div>

                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notes"
                          className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5C6B64]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditingItem(item.id)}
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
                      className={`rounded-2xl border p-3.5 transition ${
                        item.isPacked
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-[#E5DEC9] bg-[#FAF6F0]/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-[#1B4332]/10 px-2 py-0.5 text-[10px] font-bold text-[#1B4332]">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-[11px] font-semibold text-[#5C6B64]">
                              Assigned to:{' '}
                              <strong className="text-[#1C2826]">
                                {assigneeLabel}
                              </strong>
                            </span>
                          </div>
                          <h4
                            className={`mt-1 text-sm font-bold ${
                              item.isPacked
                                ? 'text-emerald-950 line-through'
                                : 'text-[#1C2826]'
                            }`}
                          >
                            {item.title}
                          </h4>
                          {item.notes && (
                            <p className="mt-0.5 text-xs text-[#5C6B64]">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingItem(item)}
                            title="Edit checklist item"
                            className="rounded p-1 text-[#5C6B64] hover:text-[#1B4332]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteChecklistItem(item.id)}
                            className="rounded p-1 text-[#8C9690] hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Two-Stage Checkboxes */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E5DEC9]/80 pt-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateChecklistItem(item.id, {
                              isBought: !item.isBought,
                              isPacked: item.isBought ? false : item.isPacked,
                            })
                          }
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            item.isBought
                              ? 'border-[#1B4332] bg-[#1B4332] text-white'
                              : 'border-[#D4CBB8] bg-white text-[#5C6B64] hover:bg-[#F3EDE2]'
                          }`}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>
                            {item.isBought ? '✓ 1. Bought / Ready' : '1. Mark Bought'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateChecklistItem(item.id, {
                              isBought: !item.isPacked ? true : item.isBought,
                              isPacked: !item.isPacked,
                            })
                          }
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            item.isPacked
                              ? 'border-emerald-700 bg-emerald-700 text-white'
                              : 'border-[#D4CBB8] bg-white text-[#5C6B64] hover:bg-[#F3EDE2]'
                          }`}
                        >
                          <PackageCheck className="h-3.5 w-3.5" />
                          <span>
                            {item.isPacked
                              ? '✓ 2. Packed for Venue!'
                              : '2. Mark Packed in Car'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Checklist Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              Add Shopping / Packing Item
            </h3>
            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Item Description
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 2 Rolls Gift Wrapping Paper + Tape"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Category
                  </label>
                  {!isAddingCustomCat ? (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsAddingCustomCat(true);
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                    >
                      {allCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__CUSTOM__">
                        + Add Custom Category...
                      </option>
                    </select>
                  ) : (
                    <div className="mt-1 flex gap-1">
                      <input
                        type="text"
                        required
                        value={customCatInput}
                        onChange={(e) => setCustomCatInput(e.target.value)}
                        placeholder="Custom category..."
                        className="w-full rounded-xl border border-[#1B4332] bg-white px-2.5 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomCat(false)}
                        className="rounded-xl border border-[#D4CBB8] bg-white px-2 text-xs text-[#5C6B64]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Quantity
                  </label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g., 3 packs"
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Assigned Person (Committee or Outside Helper)
                </label>
                <select
                  value={assignedSelection}
                  onChange={(e) => setAssignedSelection(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                >
                  <option value="">Unassigned</option>
                  {cousins.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Committee)
                    </option>
                  ))}
                  <option value="__OUTSIDE__">
                    + Someone Outside Committee (Enter Name)...
                  </option>
                </select>
                {assignedSelection === '__OUTSIDE__' && (
                  <input
                    type="text"
                    required
                    value={customAssigneeName}
                    onChange={(e) => setCustomAssigneeName(e.target.value)}
                    placeholder="Enter name of person bringing this item..."
                    className="mt-2 w-full rounded-xl border border-[#1B4332] bg-white px-3.5 py-2 text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Where to buy or storage note"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5C6B64]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1B4332] px-5 py-2 text-xs font-bold text-white"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

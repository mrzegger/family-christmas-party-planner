import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  UserPlus,
  Home,
  GitBranch,
  Heart,
  CornerDownRight,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import {
  FamilyUnit,
  Guest,
  AgeGroup,
  RsvpStatus,
} from '../../types/planner';

interface RosterTabProps {
  familyUnits: FamilyUnit[];
  guests: Guest[];
  onAddFamilyUnit: (unit: Omit<FamilyUnit, 'id'>) => void;
  onUpdateFamilyUnit: (id: string, updates: Partial<FamilyUnit>) => void;
  onDeleteFamilyUnit: (id: string) => void;
  onAddGuest: (
    familyUnitId: string,
    name: string,
    ageGroup: AgeGroup,
    rsvpStatus: RsvpStatus,
    dietaryNotes: string,
    options?: {
      subFamilyName?: string;
      isPlusOne?: boolean;
      plusOneOfGuestId?: string;
    }
  ) => void;
  onUpdateGuest: (id: string, updates: Partial<Guest>) => void;
  onDeleteGuest: (id: string) => void;
}

export const RosterTab: React.FC<RosterTabProps> = ({
  familyUnits,
  guests,
  onAddFamilyUnit,
  onUpdateFamilyUnit,
  onDeleteFamilyUnit,
  onAddGuest,
  onUpdateGuest,
  onDeleteGuest,
}) => {
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchLabel, setBranchLabel] = useState('');
  const [branchNotes, setBranchNotes] = useState('');

  // Inline Edit Branch state
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchLabel, setEditBranchLabel] = useState('');
  const [editBranchNotes, setEditBranchNotes] = useState('');

  // Inline Edit Sub-Family name state
  const [editingSubFamily, setEditingSubFamily] = useState<{
    branchId: string;
    oldName: string;
    newName: string;
  } | null>(null);

  // Inline Edit Member state
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestDietary, setEditGuestDietary] = useState('');
  const [editGuestIsPlusOne, setEditGuestIsPlusOne] = useState(false);
  const [editGuestPlusOneOf, setEditGuestPlusOneOf] = useState('');

  // Quick add member state per branch (or sub-family)
  const [addingToTarget, setAddingToTarget] = useState<{
    branchId: string;
    subFamilyName?: string;
    plusOneOfGuestId?: string;
  } | null>(null);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestAge, setNewGuestAge] = useState<AgeGroup>('Adult');
  const [newGuestDietary, setNewGuestDietary] = useState('');
  const [newGuestIsPlusOne, setNewGuestIsPlusOne] = useState(false);
  const [newGuestPlusOneOf, setNewGuestPlusOneOf] = useState('');

  // Add Sub-Family state per branch
  const [addingSubFamilyBranchId, setAddingSubFamilyBranchId] = useState<
    string | null
  >(null);
  const [newSubFamilyTitle, setNewSubFamilyTitle] = useState('');
  const [selectedExistingMemberToMove, setSelectedExistingMemberToMove] =
    useState<string>('');

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;
    onAddFamilyUnit({
      name: branchName.trim(),
      branchLabel: branchLabel.trim() || 'Family Branch',
      subFamilies: [],
      notes: branchNotes.trim(),
    });
    setBranchName('');
    setBranchLabel('');
    setBranchNotes('');
    setShowAddBranchModal(false);
  };

  const startEditingBranch = (unit: FamilyUnit) => {
    setEditingBranchId(unit.id);
    setEditBranchName(unit.name);
    setEditBranchLabel(unit.branchLabel);
    setEditBranchNotes(unit.notes || '');
  };

  const saveEditingBranch = (e: React.FormEvent, unitId: string) => {
    e.preventDefault();
    if (!editBranchName.trim()) return;
    onUpdateFamilyUnit(unitId, {
      name: editBranchName.trim(),
      branchLabel: editBranchLabel.trim() || 'Family Branch',
      notes: editBranchNotes.trim(),
    });
    setEditingBranchId(null);
  };

  const saveRenameSubFamily = (unit: FamilyUnit) => {
    if (!editingSubFamily) return;
    const cleanNew = editingSubFamily.newName.trim();
    const oldName = editingSubFamily.oldName;
    if (!cleanNew || cleanNew === oldName) {
      setEditingSubFamily(null);
      return;
    }

    const updatedSubs = (unit.subFamilies || []).map((s) =>
      s === oldName ? cleanNew : s
    );
    if (!updatedSubs.includes(cleanNew)) {
      updatedSubs.push(cleanNew);
    }
    onUpdateFamilyUnit(unit.id, { subFamilies: updatedSubs });

    // Update all guests in that sub-family
    guests
      .filter(
        (g) => g.familyUnitId === unit.id && g.subFamilyName === oldName
      )
      .forEach((g) => {
        onUpdateGuest(g.id, { subFamilyName: cleanNew });
      });

    setEditingSubFamily(null);
  };

  const startEditingGuest = (member: Guest) => {
    setEditingGuestId(member.id);
    setEditGuestName(member.name);
    setEditGuestDietary(member.dietaryNotes || '');
    setEditGuestIsPlusOne(Boolean(member.isPlusOne || member.plusOneOfGuestId));
    setEditGuestPlusOneOf(member.plusOneOfGuestId || '');
  };

  const saveEditingGuest = (memberId: string) => {
    if (!editGuestName.trim()) return;
    onUpdateGuest(memberId, {
      name: editGuestName.trim(),
      dietaryNotes: editGuestDietary.trim(),
      isPlusOne: editGuestIsPlusOne || Boolean(editGuestPlusOneOf),
      plusOneOfGuestId: editGuestIsPlusOne
        ? editGuestPlusOneOf || undefined
        : undefined,
    });
    setEditingGuestId(null);
  };

  const openAddMemberForm = (
    branchId: string,
    subFamilyName?: string,
    plusOneForGuest?: Guest
  ) => {
    setAddingToTarget({
      branchId,
      subFamilyName,
      plusOneOfGuestId: plusOneForGuest?.id,
    });
    setNewGuestName(plusOneForGuest ? `${plusOneForGuest.name}'s +1` : '');
    setNewGuestAge('Adult');
    setNewGuestDietary('');
    setNewGuestIsPlusOne(Boolean(plusOneForGuest));
    setNewGuestPlusOneOf(plusOneForGuest?.id || '');
  };

  const handleQuickAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingToTarget || !newGuestName.trim()) return;
    onAddGuest(
      addingToTarget.branchId,
      newGuestName.trim(),
      newGuestAge,
      'Going',
      newGuestDietary.trim(),
      {
        subFamilyName: addingToTarget.subFamilyName,
        isPlusOne: newGuestIsPlusOne || Boolean(newGuestPlusOneOf),
        plusOneOfGuestId: newGuestPlusOneOf || undefined,
      }
    );
    setNewGuestName('');
    setNewGuestDietary('');
    setNewGuestIsPlusOne(false);
    setNewGuestPlusOneOf('');
    setAddingToTarget(null);
  };

  const handleCreateSubFamily = (e: React.FormEvent, unit: FamilyUnit) => {
    e.preventDefault();
    const cleanName = newSubFamilyTitle.trim();
    if (!cleanName) return;

    const existingSubs = unit.subFamilies || [];
    if (!existingSubs.includes(cleanName)) {
      onUpdateFamilyUnit(unit.id, {
        subFamilies: [...existingSubs, cleanName],
      });
    }

    if (selectedExistingMemberToMove) {
      onUpdateGuest(selectedExistingMemberToMove, {
        subFamilyName: cleanName,
      });
    }

    setNewSubFamilyTitle('');
    setSelectedExistingMemberToMove('');
    setAddingSubFamilyBranchId(null);
  };

  const handleDeleteSubFamily = (unit: FamilyUnit, subName: string) => {
    const nextSubs = (unit.subFamilies || []).filter((s) => s !== subName);
    onUpdateFamilyUnit(unit.id, { subFamilies: nextSubs });
    guests
      .filter(
        (g) => g.familyUnitId === unit.id && g.subFamilyName === subName
      )
      .forEach((g) => {
        onUpdateGuest(g.id, { subFamilyName: undefined });
      });
  };

  const goingCount = guests.filter((g) => g.rsvpStatus === 'Going').length;
  const maybeCount = guests.filter((g) => g.rsvpStatus === 'Maybe').length;
  const pendingCount = guests.filter((g) => g.rsvpStatus === 'Pending').length;
  const notGoingCount = guests.filter(
    (g) => g.rsvpStatus === 'Not Going'
  ).length;

  const renderMemberRow = (
    member: Guest,
    unit: FamilyUnit,
    allUnitSubFamilies: string[],
    branchMembers: Guest[],
    isIndentedPlusOne = false
  ) => {
    const linkedPartner = member.plusOneOfGuestId
      ? branchMembers.find((m) => m.id === member.plusOneOfGuestId)
      : undefined;

    const isEditingThisGuest = editingGuestId === member.id;

    if (isEditingThisGuest) {
      return (
        <div
          key={member.id}
          className="my-1.5 rounded-xl border border-[#1B4332]/30 bg-[#FAF6F0] p-3 space-y-2"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold text-[#5C6B64]">
                Guest Name
              </label>
              <input
                type="text"
                value={editGuestName}
                onChange={(e) => setEditGuestName(e.target.value)}
                placeholder="Full Name"
                className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#5C6B64]">
                Dietary / Allergy Notes
              </label>
              <input
                type="text"
                value={editGuestDietary}
                onChange={(e) => setEditGuestDietary(e.target.value)}
                placeholder="e.g., No pork, vegetarian"
                className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#9E2A2B]">
                <input
                  type="checkbox"
                  checked={editGuestIsPlusOne}
                  onChange={(e) => {
                    setEditGuestIsPlusOne(e.target.checked);
                    if (!e.target.checked) setEditGuestPlusOneOf('');
                  }}
                  className="accent-[#9E2A2B]"
                />
                <span>+1 / Partner</span>
              </label>

              {editGuestIsPlusOne && (
                <select
                  value={editGuestPlusOneOf}
                  onChange={(e) => setEditGuestPlusOneOf(e.target.value)}
                  className="rounded border border-[#D4CBB8] bg-white px-2 py-0.5 text-[11px]"
                >
                  <option value="">Unlinked +1</option>
                  {branchMembers
                    .filter((m) => m.id !== member.id && !m.isPlusOne)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        Partner / +1 of {m.name}
                      </option>
                    ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditingGuestId(null)}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5C6B64] hover:bg-[#E5DEC9]/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveEditingGuest(member.id)}
                className="flex items-center gap-1 rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
              >
                <Check className="h-3 w-3" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={member.id}
        className={`flex flex-wrap items-center justify-between gap-2 py-2.5 ${
          isIndentedPlusOne
            ? 'ml-5 border-l-2 border-[#9E2A2B]/25 pl-3 bg-[#FAF6F0]/50 rounded-r-xl'
            : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {isIndentedPlusOne && (
            <CornerDownRight className="h-3.5 w-3.5 text-[#9E2A2B]" />
          )}
          <span className="text-xs font-bold text-[#1C2826]">
            {member.name}
          </span>

          {/* +1 / Partner badge */}
          {(member.isPlusOne || member.plusOneOfGuestId) && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#9E2A2B]/12 px-2 py-0.5 text-[10px] font-bold text-[#9E2A2B]">
              <Heart className="h-2.5 w-2.5 fill-current" />
              {linkedPartner ? `${linkedPartner.name}'s +1` : '+1 / Partner'}
            </span>
          )}

          {/* Age Group selector */}
          <select
            aria-label="Age Group"
            value={member.ageGroup}
            onChange={(e) =>
              onUpdateGuest(member.id, {
                ageGroup: e.target.value as AgeGroup,
              })
            }
            className="rounded bg-[#FAF6F0] px-1.5 py-0.5 text-[10px] font-semibold text-[#5C6B64]"
          >
            <option value="Adult">Adult</option>
            <option value="Kid">Kid</option>
            <option value="Senior">Senior</option>
          </select>

          {/* Move between Main Branch & Sub-Families dropdown */}
          {allUnitSubFamilies.length > 0 && !isIndentedPlusOne && (
            <select
              aria-label="Assign Sub-Family"
              value={member.subFamilyName || ''}
              onChange={(e) => {
                const nextSub = e.target.value || undefined;
                onUpdateGuest(member.id, { subFamilyName: nextSub });
                branchMembers
                  .filter((m) => m.plusOneOfGuestId === member.id)
                  .forEach((plusOne) =>
                    onUpdateGuest(plusOne.id, { subFamilyName: nextSub })
                  );
              }}
              title="Move member to a Sub-Family or Main Branch"
              className="rounded border border-[#E5DEC9] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#1B4332]"
            >
              <option value="">Main ({unit.name})</option>
              {allUnitSubFamilies.map((sf) => (
                <option key={sf} value={sf}>
                  Sub: {sf}
                </option>
              ))}
            </select>
          )}

          {/* Quick "+1" button for non-+1 adult members */}
          {!member.isPlusOne && !member.plusOneOfGuestId && (
            <button
              type="button"
              onClick={() =>
                openAddMemberForm(unit.id, member.subFamilyName, member)
              }
              title={`Add Partner / +1 for ${member.name}`}
              className="inline-flex items-center gap-0.5 rounded-md border border-[#DED6C6] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#9E2A2B] hover:bg-[#FAF6F0]"
            >
              <Plus className="h-2.5 w-2.5" />
              <span>+1</span>
            </button>
          )}

          {member.dietaryNotes && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
              {member.dietaryNotes}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <select
            aria-label="RSVP Status"
            value={member.rsvpStatus}
            onChange={(e) =>
              onUpdateGuest(member.id, {
                rsvpStatus: e.target.value as RsvpStatus,
              })
            }
            className={`rounded-lg border px-2 py-1 text-[11px] font-bold ${
              member.rsvpStatus === 'Going'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : member.rsvpStatus === 'Maybe'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : member.rsvpStatus === 'Not Going'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-[#DED6C6] bg-[#FAF6F0] text-[#5C6B64]'
            }`}
          >
            <option value="Going">Going</option>
            <option value="Maybe">Maybe</option>
            <option value="Pending">Pending</option>
            <option value="Not Going">Not Going</option>
          </select>

          <button
            type="button"
            onClick={() => startEditingGuest(member)}
            title="Edit member name, dietary notes, or +1 link"
            className="rounded p-1 text-[#5C6B64] hover:bg-[#FAF6F0] hover:text-[#1B4332]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteGuest(member.id)}
            title="Remove member"
            className="rounded p-1 text-[#8C9690] hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderMemberGroupWithPlusOnes = (
    groupMembers: Guest[],
    unit: FamilyUnit,
    allUnitSubFamilies: string[],
    allBranchMembers: Guest[]
  ) => {
    const primaryMembers = groupMembers.filter(
      (m) =>
        !m.plusOneOfGuestId ||
        !groupMembers.some((other) => other.id === m.plusOneOfGuestId)
    );

    return primaryMembers.map((member) => {
      const attachedPlusOnes = groupMembers.filter(
        (m) => m.plusOneOfGuestId === member.id
      );
      return (
        <React.Fragment key={member.id}>
          {renderMemberRow(
            member,
            unit,
            allUnitSubFamilies,
            allBranchMembers,
            false
          )}
          {attachedPlusOnes.map((plusOne) =>
            renderMemberRow(
              plusOne,
              unit,
              allUnitSubFamilies,
              allBranchMembers,
              true
            )
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Headcount Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-[#1B4332]">
            Family Branches &amp; Guest Roster Manager
          </h2>
          <p className="text-xs text-[#5C6B64]">
            Organize main family branches, nested sub-families, and +1 partners. Click the pencil icon on any branch, sub-family, or guest to edit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0] px-3.5 py-2 text-xs font-bold">
            <span className="text-emerald-800">{goingCount} Going</span>
            <span>•</span>
            <span className="text-amber-800">{maybeCount} Maybe</span>
            <span>•</span>
            <span className="text-[#5C6B64]">{pendingCount} Pending</span>
            <span>•</span>
            <span className="text-red-800">{notGoingCount} No</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddBranchModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#1B4332] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#143325]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Family Branch</span>
          </button>
        </div>
      </div>

      {/* Family Units Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {familyUnits.map((unit) => {
          const branchMembers = guests.filter(
            (g) => g.familyUnitId === unit.id
          );
          const unitGoing = branchMembers.filter(
            (m) => m.rsvpStatus === 'Going'
          ).length;

          const subFamilySet = new Set<string>(unit.subFamilies || []);
          branchMembers.forEach((m) => {
            if (m.subFamilyName) subFamilySet.add(m.subFamilyName);
          });
          const allUnitSubFamilies = Array.from(subFamilySet);

          const mainHouseholdMembers = branchMembers.filter(
            (m) => !m.subFamilyName
          );

          const isEditingThisBranch = editingBranchId === unit.id;

          return (
            <div
              key={unit.id}
              className="flex flex-col justify-between rounded-3xl border border-[#DED6C6] bg-white p-5 shadow-2xs"
            >
              <div>
                {/* Branch Header (or Inline Edit Branch Form) */}
                {isEditingThisBranch ? (
                  <form
                    onSubmit={(e) => saveEditingBranch(e, unit.id)}
                    className="mb-3 space-y-2.5 rounded-2xl border border-[#1B4332]/30 bg-[#FAF6F0] p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1B4332]">
                        Edit Family Branch Details
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingBranchId(null)}
                        className="text-[#5C6B64] hover:text-[#1C2826]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Branch / Household Name
                        </label>
                        <input
                          type="text"
                          required
                          value={editBranchName}
                          onChange={(e) => setEditBranchName(e.target.value)}
                          placeholder="e.g., Main Household Name"
                          className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Subtitle / Label
                        </label>
                        <input
                          type="text"
                          value={editBranchLabel}
                          onChange={(e) => setEditBranchLabel(e.target.value)}
                          placeholder="e.g., Eldest Branch"
                          className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#5C6B64]">
                        Household Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={editBranchNotes}
                        onChange={(e) => setEditBranchNotes(e.target.value)}
                        placeholder="e.g., Bringing extra coolers"
                        className="mt-0.5 w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingBranchId(null)}
                        className="rounded-lg px-3 py-1 text-xs font-semibold text-[#5C6B64]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Save Branch</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-2 border-b border-[#EFE9DC] pb-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1B4332]/10 text-[#1B4332]">
                        <Home className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-serif-display text-lg font-bold text-[#1B4332]">
                          {unit.name}
                        </h3>
                        <p className="text-xs text-[#5C6B64]">
                          {unit.branchLabel}
                        </p>
                        {unit.notes && (
                          <p className="mt-0.5 text-[11px] text-[#9E2A2B]">
                            Note: {unit.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-[#FAF6F0] px-2.5 py-1 text-xs font-bold text-[#1B4332]">
                        {unitGoing}/{branchMembers.length} Going
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditingBranch(unit)}
                        title="Edit family branch name, label, or notes"
                        className="rounded p-1 text-[#5C6B64] hover:bg-[#FAF6F0] hover:text-[#1B4332]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteFamilyUnit(unit.id)}
                        title="Delete family branch"
                        className="rounded p-1 text-[#8C9690] hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Household Members */}
                <div className="mt-3 divide-y divide-[#F1ECE1]">
                  {renderMemberGroupWithPlusOnes(
                    mainHouseholdMembers,
                    unit,
                    allUnitSubFamilies,
                    branchMembers
                  )}
                </div>

                {/* Nested Sub-Families Sections */}
                {allUnitSubFamilies.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {allUnitSubFamilies.map((subName) => {
                      const subMembers = branchMembers.filter(
                        (m) => m.subFamilyName === subName
                      );
                      const subGoing = subMembers.filter(
                        (m) => m.rsvpStatus === 'Going'
                      ).length;

                      const isRenamingThisSub =
                        editingSubFamily?.branchId === unit.id &&
                        editingSubFamily?.oldName === subName;

                      return (
                        <div
                          key={subName}
                          className="rounded-2xl border border-[#DED6C6] bg-[#FAF6F0]/70 p-3.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DEC9] pb-2">
                            {isRenamingThisSub ? (
                              <div className="flex flex-1 items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingSubFamily.newName}
                                  onChange={(e) =>
                                    setEditingSubFamily({
                                      ...editingSubFamily,
                                      newName: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-[#1B4332] bg-white px-2 py-1 text-xs font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => saveRenameSubFamily(unit)}
                                  className="rounded-lg bg-[#1B4332] p-1.5 text-white"
                                  title="Save Sub-Family Name"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubFamily(null)}
                                  className="rounded-lg bg-[#E5DEC9] p-1.5 text-[#5C6B64]"
                                  title="Cancel"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-3.5 w-3.5 text-[#1B4332]" />
                                <span className="font-serif-display text-sm font-bold text-[#1B4332]">
                                  {subName}
                                </span>
                                <span className="rounded-md bg-[#1B4332]/10 px-2 py-0.5 text-[10px] font-bold text-[#1B4332]">
                                  Sub-Family ({subGoing}/{subMembers.length})
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openAddMemberForm(unit.id, subName)
                                }
                                className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-[#1B4332] shadow-2xs hover:bg-[#F1ECE1]"
                              >
                                <UserPlus className="h-3 w-3 text-[#9E2A2B]" />
                                <span>+ Member</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingSubFamily({
                                    branchId: unit.id,
                                    oldName: subName,
                                    newName: subName,
                                  })
                                }
                                title="Rename Sub-Family"
                                className="rounded p-1 text-[#5C6B64] hover:text-[#1B4332]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteSubFamily(unit, subName)
                                }
                                title="Remove Sub-Family grouping (keeps members in main branch)"
                                className="rounded p-1 text-[#8C9690] hover:text-red-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2 divide-y divide-[#E5DEC9]/70">
                            {subMembers.length > 0 ? (
                              renderMemberGroupWithPlusOnes(
                                subMembers,
                                unit,
                                allUnitSubFamilies,
                                branchMembers
                              )
                            ) : (
                              <p className="py-2 text-center text-[11px] text-[#5C6B64]">
                                No members in {subName} yet — click{' '}
                                <strong>+ Member</strong> or move an existing member using their dropdown.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Create Sub-Family Form */}
                {addingSubFamilyBranchId === unit.id && (
                  <form
                    onSubmit={(e) => handleCreateSubFamily(e, unit)}
                    className="mt-4 space-y-2.5 rounded-2xl border border-[#1B4332]/30 bg-[#FAF6F0] p-3.5"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B4332]">
                      <GitBranch className="h-3.5 w-3.5 text-[#9E2A2B]" />
                      <span>New Sub-Family under {unit.name}</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={newSubFamilyTitle}
                      onChange={(e) => setNewSubFamilyTitle(e.target.value)}
                      placeholder="e.g., Married Couple / Second Household Name"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-3 py-1.5 text-xs"
                    />
                    {mainHouseholdMembers.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-semibold text-[#5C6B64]">
                          Optionally move an existing member into this Sub-Family:
                        </label>
                        <select
                          value={selectedExistingMemberToMove}
                          onChange={(e) =>
                            setSelectedExistingMemberToMove(e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs"
                        >
                          <option value="">-- None (I&apos;ll add/move members after) --</option>
                          {mainHouseholdMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              Move {m.name} into this Sub-Family
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingSubFamilyBranchId(null)}
                        className="text-xs font-semibold text-[#5C6B64]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
                      >
                        Create Sub-Family
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Add Member / Add Sub-Family Footer */}
              <div className="mt-4 border-t border-[#EFE9DC] pt-3">
                {addingToTarget?.branchId === unit.id ? (
                  <form
                    onSubmit={handleQuickAddGuest}
                    className="space-y-2.5 rounded-2xl border border-[#1B4332]/25 bg-[#FAF6F0] p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1B4332]">
                        {addingToTarget.subFamilyName
                          ? `Add to Sub-Family: ${addingToTarget.subFamilyName}`
                          : `Add Member to ${unit.name}`}
                      </span>
                      {addingToTarget.subFamilyName && (
                        <span className="rounded bg-[#1B4332]/10 px-2 py-0.5 text-[10px] font-bold text-[#1B4332]">
                          Sub-Family
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        placeholder="Member Full Name"
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs"
                      />
                      <select
                        value={newGuestAge}
                        onChange={(e) =>
                          setNewGuestAge(e.target.value as AgeGroup)
                        }
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs"
                      >
                        <option value="Adult">Adult</option>
                        <option value="Kid">Kid</option>
                        <option value="Senior">Senior</option>
                      </select>
                    </div>

                    {/* Optional +1 / Partner Linker */}
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E5DEC9] bg-white px-2.5 py-1.5">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#9E2A2B]">
                        <input
                          type="checkbox"
                          checked={newGuestIsPlusOne}
                          onChange={(e) => {
                            setNewGuestIsPlusOne(e.target.checked);
                            if (!e.target.checked) setNewGuestPlusOneOf('');
                          }}
                          className="accent-[#9E2A2B]"
                        />
                        <span>Is a +1 (Partner / Guest)?</span>
                      </label>

                      {newGuestIsPlusOne && (
                        <select
                          value={newGuestPlusOneOf}
                          onChange={(e) => setNewGuestPlusOneOf(e.target.value)}
                          className="ml-auto rounded border border-[#D4CBB8] bg-[#FAF6F0] px-2 py-0.5 text-[11px] font-semibold text-[#1C2826]"
                        >
                          <option value="">Linked to (Optional)...</option>
                          {branchMembers
                            .filter((m) => !m.isPlusOne)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                +1 of {m.name}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>

                    <input
                      type="text"
                      value={newGuestDietary}
                      onChange={(e) => setNewGuestDietary(e.target.value)}
                      placeholder="Dietary notes (optional)"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingToTarget(null)}
                        className="text-xs font-semibold text-[#5C6B64]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
                      >
                        Save Member
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openAddMemberForm(unit.id)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#C9B9A6] py-2 text-xs font-bold text-[#1B4332] hover:bg-[#FAF6F0]"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-[#9E2A2B]" />
                      <span>+ Add Member / +1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAddingSubFamilyBranchId(unit.id);
                        setNewSubFamilyTitle('');
                        setSelectedExistingMemberToMove('');
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#1B4332]/40 bg-[#1B4332]/5 py-2 text-xs font-bold text-[#1B4332] hover:bg-[#1B4332]/10"
                    >
                      <GitBranch className="h-3.5 w-3.5 text-[#1B4332]" />
                      <span>+ Add Sub-Family</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Family Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              Add Family Branch / Household
            </h3>
            <form onSubmit={handleCreateBranch} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Household / Family Branch Name
                </label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g., Santos Family / Eldest Branch"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Branch Subtitle / Description
                </label>
                <input
                  type="text"
                  value={branchLabel}
                  onChange={(e) => setBranchLabel(e.target.value)}
                  placeholder="e.g., Family Branch"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Household Notes
                </label>
                <input
                  type="text"
                  value={branchNotes}
                  onChange={(e) => setBranchNotes(e.target.value)}
                  placeholder="e.g., Arriving around 6:30 PM"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5C6B64]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1B4332] px-5 py-2 text-xs font-bold text-white"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

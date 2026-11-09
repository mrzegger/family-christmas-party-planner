import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Shirt,
  Sparkles,
  Users,
  CheckCircle2,
  HelpCircle,
  XCircle,
  UserPlus,
  ExternalLink,
  Megaphone,
  Utensils,
  PartyPopper,
  HeartHandshake,
  GitBranch,
  CornerDownRight,
  Heart,
  Gift,
  Music,
  Camera,
} from 'lucide-react';
import {
  EventConfig,
  FamilyUnit,
  Guest,
  AgeGroup,
  RsvpStatus,
  Cousin,
  GuestHighlightIcon,
} from '../../types/planner';
import { SEED_PLANNER_STATE } from '../../data/seedData';

interface GuestPortalViewProps {
  eventConfig: EventConfig;
  familyUnits: FamilyUnit[];
  guests: Guest[];
  cousins: Cousin[];
  onUpdateGuestRsvp: (
    guestId: string,
    status: RsvpStatus,
    dietaryNotes: string
  ) => void;
  onBulkUpdateBranchRsvp: (familyUnitId: string, status: RsvpStatus) => void;
  onAddFamilyMember: (
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
}

export const GuestPortalView: React.FC<GuestPortalViewProps> = ({
  eventConfig,
  familyUnits,
  guests,
  cousins,
  onUpdateGuestRsvp,
  onBulkUpdateBranchRsvp,
  onAddFamilyMember,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    familyUnits[0]?.id || ''
  );

  // Add missing member form state
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAgeGroup, setNewMemberAgeGroup] = useState<AgeGroup>('Adult');
  const [newMemberDietary, setNewMemberDietary] = useState('');
  const [newMemberSubFamily, setNewMemberSubFamily] = useState('');
  const [newMemberPlusOneOf, setNewMemberPlusOneOf] = useState('');
  const [rsvpSavedBanner, setRsvpSavedBanner] = useState<string | null>(null);

  // Countdown calculation
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    mins: 0,
  });

  useEffect(() => {
    const updateTimer = () => {
      const target = new Date(eventConfig.eventDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setCountdown({ days, hours, mins });
    };
    updateTimer();
    const timer = setInterval(updateTimer, 30000);
    return () => clearInterval(timer);
  }, [eventConfig.eventDate]);

  useEffect(() => {
    if (!selectedBranchId && familyUnits.length > 0) {
      setSelectedBranchId(familyUnits[0].id);
    }
  }, [familyUnits, selectedBranchId]);

  const selectedBranch = familyUnits.find((f) => f.id === selectedBranchId);
  const branchGuests = guests.filter((g) => g.familyUnitId === selectedBranchId);

  const goingGuests = guests.filter((g) => g.rsvpStatus === 'Going');
  const maybeGuests = guests.filter((g) => g.rsvpStatus === 'Maybe');
  const pendingGuests = guests.filter((g) => g.rsvpStatus === 'Pending');

  const formattedEventDate = (() => {
    try {
      const d = new Date(eventConfig.eventDate);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return eventConfig.eventDate;
    }
  })();

  const formattedEventTime = (() => {
    try {
      const d = new Date(eventConfig.eventDate);
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '6:00 PM';
    }
  })();

  const triggerSavedToast = (msg: string) => {
    setRsvpSavedBanner(msg);
    setTimeout(() => {
      setRsvpSavedBanner(null);
    }, 3000);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !selectedBranchId) return;
    onAddFamilyMember(
      selectedBranchId,
      newMemberName.trim(),
      newMemberAgeGroup,
      'Going',
      newMemberDietary.trim(),
      {
        subFamilyName: newMemberSubFamily.trim() || undefined,
        isPlusOne: Boolean(newMemberPlusOneOf),
        plusOneOfGuestId: newMemberPlusOneOf || undefined,
      }
    );
    setNewMemberName('');
    setNewMemberDietary('');
    setNewMemberSubFamily('');
    setNewMemberPlusOneOf('');
    setShowAddMemberForm(false);
    triggerSavedToast(`Added ${newMemberName.trim()} to ${selectedBranch?.name}!`);
  };

  // Collect all sub-family names in the selected branch
  const branchSubFamilies = (() => {
    if (!selectedBranch) return [];
    const set = new Set<string>(selectedBranch.subFamilies || []);
    branchGuests.forEach((g) => {
      if (g.subFamilyName) set.add(g.subFamilyName);
    });
    return Array.from(set);
  })();

  const mainHouseholdGuests = branchGuests.filter((g) => !g.subFamilyName);

  // Render an individual guest row (with optional indentation if they are a linked +1)
  const renderGuestRsvpRow = (member: Guest, isIndentedPlusOne = false) => {
    const linkedPartner = member.plusOneOfGuestId
      ? branchGuests.find((g) => g.id === member.plusOneOfGuestId)
      : undefined;

    return (
      <div
        key={member.id}
        className={`flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
          isIndentedPlusOne
            ? 'ml-6 border-l-2 border-[#9E2A2B]/25 bg-white/60 pl-3.5 pr-2 rounded-r-xl my-1'
            : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {isIndentedPlusOne && (
            <CornerDownRight className="h-4 w-4 shrink-0 text-[#9E2A2B]" />
          )}
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              member.rsvpStatus === 'Going'
                ? 'bg-emerald-700 text-white'
                : member.rsvpStatus === 'Maybe'
                ? 'bg-amber-600 text-white'
                : member.rsvpStatus === 'Not Going'
                ? 'bg-stone-400 text-white'
                : 'bg-[#E5DEC9] text-[#5C6B64]'
            }`}
          >
            {member.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[#1C2826]">
                {member.name}
              </span>
              <span className="rounded-md bg-[#E5DEC9]/80 px-2 py-0.5 text-[10px] font-semibold text-[#5C6B64]">
                {member.ageGroup}
              </span>
              {(member.isPlusOne || member.plusOneOfGuestId) && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#9E2A2B]/15 px-2 py-0.5 text-[10px] font-bold text-[#9E2A2B]">
                  <Heart className="h-2.5 w-2.5 fill-current" />
                  {linkedPartner
                    ? `${linkedPartner.name}'s +1`
                    : '+1 Guest'}
                </span>
              )}
            </div>
            <input
              type="text"
              value={member.dietaryNotes}
              onChange={(e) =>
                onUpdateGuestRsvp(
                  member.id,
                  member.rsvpStatus,
                  e.target.value
                )
              }
              placeholder="Add dietary note / allergy (e.g., No pork, low sugar)..."
              className="mt-1 w-full min-w-[230px] rounded-lg border border-transparent bg-white/80 px-2.5 py-1 text-xs text-[#1C2826] placeholder-[#8C9690] focus:border-[#1B4332] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* RSVP Status Toggle Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {(
            [
              {
                status: 'Going',
                icon: CheckCircle2,
                activeClass:
                  'bg-emerald-700 text-white border-emerald-700 shadow-2xs',
              },
              {
                status: 'Maybe',
                icon: HelpCircle,
                activeClass:
                  'bg-amber-600 text-white border-amber-600 shadow-2xs',
              },
              {
                status: 'Not Going',
                icon: XCircle,
                activeClass:
                  'bg-red-700 text-white border-red-700 shadow-2xs',
              },
            ] as const
          ).map(({ status, icon: Icon, activeClass }) => {
            const isActive = member.rsvpStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  onUpdateGuestRsvp(member.id, status, member.dietaryNotes);
                  triggerSavedToast(
                    `Updated ${member.name}'s RSVP to ${status}`
                  );
                }}
                className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? activeClass
                    : 'border-[#DED6C6] bg-white text-[#5C6B64] hover:bg-[#F3EDE2]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{status}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Collates a list of guests so that any linked +1s appear directly underneath their partner
  const renderCollatedGuestGroup = (groupMembers: Guest[]) => {
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
          {renderGuestRsvpRow(member, false)}
          {attachedPlusOnes.map((plusOne) =>
            renderGuestRsvpRow(plusOne, true)
          )}
        </React.Fragment>
      );
    });
  };

  const renderHighlightIcon = (icon: GuestHighlightIcon) => {
    switch (icon) {
      case 'utensils':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#9E2A2B]/15 text-[#9E2A2B]">
            <Utensils className="h-4 w-4" />
          </div>
        );
      case 'party':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1B4332]/15 text-[#1B4332]">
            <PartyPopper className="h-4 w-4" />
          </div>
        );
      case 'heart':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4A373]/25 text-[#8C5828]">
            <HeartHandshake className="h-4 w-4" />
          </div>
        );
      case 'gift':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#9E2A2B]/15 text-[#9E2A2B]">
            <Gift className="h-4 w-4" />
          </div>
        );
      case 'music':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1B4332]/15 text-[#1B4332]">
            <Music className="h-4 w-4" />
          </div>
        );
      case 'camera':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4A373]/25 text-[#8C5828]">
            <Camera className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1B4332]/15 text-[#1B4332]">
            <Sparkles className="h-4 w-4" />
          </div>
        );
    }
  };

  // Card configuration & order
  const portalCards =
    eventConfig.guestPortalCards && eventConfig.guestPortalCards.length > 0
      ? eventConfig.guestPortalCards
      : SEED_PLANNER_STATE.eventConfig.guestPortalCards!;

  const enabledCards = portalCards.filter((c) => c.enabled);
  const isRsvpEnabled = enabledCards.some((c) => c.id === 'rsvp');
  const enabledSideCards = enabledCards.filter((c) => c.id !== 'rsvp');
  const rsvpFirst =
    enabledCards.findIndex((c) => c.id === 'rsvp') <=
    enabledCards.findIndex((c) => c.id !== 'rsvp');

  const highlightsTitle =
    eventConfig.highlightsCardTitle ?? 'Sit Back & Enjoy This Year!';
  const highlightsSubtitle =
    eventConfig.highlightsCardSubtitle ??
    'The parents tasked the cousins to plan and execute the entire celebration. Here’s how we’ve got you covered:';
  const highlightItems = (
    eventConfig.highlightItems && eventConfig.highlightItems.length > 0
      ? eventConfig.highlightItems
      : SEED_PLANNER_STATE.eventConfig.highlightItems!
  ).filter((item) => item.enabled);

  const committeeTitle =
    eventConfig.committeeCardTitle ?? 'Your Organizing Committee';

  const rsvpSectionElement = (
    <section
      key="rsvp"
      className={`space-y-5 ${
        enabledSideCards.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'
      }`}
    >
      <div className="rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EFE9DC] pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9E2A2B]/10 px-3 py-1 text-xs font-bold text-[#9E2A2B]">
              <Users className="h-3.5 w-3.5" />
              Step 1: Household RSVP
            </span>
            <h2 className="font-serif-display mt-2 text-2xl font-bold text-[#1B4332]">
              Confirm Your Family Branch Attendance
            </h2>
            <p className="mt-1 text-xs text-[#5C6B64] sm:text-sm">
              Pick your family unit below to toggle attendance and note any dietary restrictions for your household.
            </p>
          </div>

          {rsvpSavedBanner && (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{rsvpSavedBanner}</span>
            </div>
          )}
        </div>

        {/* Family Branch Selector Pills */}
        <div className="mt-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6B64]">
            Select Your Family Branch / Household
          </label>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {familyUnits.map((unit) => {
              const unitMembers = guests.filter(
                (g) => g.familyUnitId === unit.id
              );
              const unitGoing = unitMembers.filter(
                (g) => g.rsvpStatus === 'Going'
              ).length;
              const isSelected = unit.id === selectedBranchId;

              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedBranchId(unit.id)}
                  className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-[#1B4332] bg-[#1B4332]/5 ring-2 ring-[#1B4332]/20'
                      : 'border-[#E5DEC9] bg-[#FAF6F0]/60 hover:border-[#C9B9A6] hover:bg-[#FAF6F0]'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-[#1B4332]">
                      {unit.name}
                    </p>
                    <p className="text-xs text-[#5C6B64]">{unit.branchLabel}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      unitGoing === unitMembers.length && unitMembers.length > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#E5DEC9]/70 text-[#1C2826]'
                    }`}
                  >
                    {unitGoing}/{unitMembers.length} Going
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Family Branch Member List */}
        {selectedBranch && (
          <div className="mt-6 rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DEC9] pb-4">
              <div>
                <h3 className="font-serif-display text-lg font-bold text-[#1B4332]">
                  {selectedBranch.name}
                </h3>
                {selectedBranch.notes && (
                  <p className="text-xs text-[#5C6B64]">
                    {selectedBranch.notes}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onBulkUpdateBranchRsvp(selectedBranch.id, 'Going');
                    triggerSavedToast(
                      `Marked everyone in ${selectedBranch.name} as Going!`
                    );
                  }}
                  className="rounded-xl bg-[#1B4332] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#143325]"
                >
                  Mark All Going
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMemberForm((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#1B4332]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#1B4332] hover:bg-[#F3EDE2]"
                >
                  <UserPlus className="h-3.5 w-3.5 text-[#9E2A2B]" />
                  <span>+ Add Missing Member / +1</span>
                </button>
              </div>
            </div>

            {/* 1. Main Household Members */}
            {mainHouseholdGuests.length > 0 && (
              <div className="mt-3 divide-y divide-[#E5DEC9]">
                {renderCollatedGuestGroup(mainHouseholdGuests)}
              </div>
            )}

            {/* 2. Nested Sub-Family Sections */}
            {branchSubFamilies.length > 0 && (
              <div className="mt-5 space-y-4">
                {branchSubFamilies.map((subName) => {
                  const subMembers = branchGuests.filter(
                    (g) => g.subFamilyName === subName
                  );
                  if (subMembers.length === 0) return null;
                  const subGoing = subMembers.filter(
                    (g) => g.rsvpStatus === 'Going'
                  ).length;

                  return (
                    <div
                      key={subName}
                      className="rounded-2xl border border-[#DED6C6] bg-white/80 p-4 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE9DC] pb-2.5">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-[#1B4332]" />
                          <h4 className="font-serif-display text-base font-bold text-[#1B4332]">
                            {subName}
                          </h4>
                          <span className="rounded-md bg-[#1B4332]/10 px-2 py-0.5 text-[10px] font-bold text-[#1B4332]">
                            Sub-Family ({subGoing}/{subMembers.length} Going)
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 divide-y divide-[#EFE9DC]">
                        {renderCollatedGuestGroup(subMembers)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline Add Missing Family Member / +1 Form */}
            {showAddMemberForm && (
              <form
                onSubmit={handleAddMemberSubmit}
                className="mt-4 rounded-xl border border-[#1B4332]/25 bg-white p-4 shadow-xs"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B4332]">
                  Add Family Member or +1 to {selectedBranch.name}
                </h4>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C6B64]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g., Full Name"
                      className="mt-1 w-full rounded-lg border border-[#D4CBB8] px-3 py-1.5 text-xs focus:border-[#1B4332] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C6B64]">
                      Age Group
                    </label>
                    <select
                      value={newMemberAgeGroup}
                      onChange={(e) =>
                        setNewMemberAgeGroup(e.target.value as AgeGroup)
                      }
                      className="mt-1 w-full rounded-lg border border-[#D4CBB8] px-3 py-1.5 text-xs focus:border-[#1B4332] focus:outline-none"
                    >
                      <option value="Adult">Adult</option>
                      <option value="Kid">Kid</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C6B64]">
                      Dietary Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={newMemberDietary}
                      onChange={(e) => setNewMemberDietary(e.target.value)}
                      placeholder="e.g., No seafood"
                      className="mt-1 w-full rounded-lg border border-[#D4CBB8] px-3 py-1.5 text-xs focus:border-[#1B4332] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Optional Sub-Family or +1 Link selectors */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {branchSubFamilies.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C6B64]">
                        Group Under (Main Branch or Sub-Family)
                      </label>
                      <select
                        value={newMemberSubFamily}
                        onChange={(e) => setNewMemberSubFamily(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#D4CBB8] px-3 py-1.5 text-xs focus:border-[#1B4332] focus:outline-none"
                      >
                        <option value="">
                          Main Household ({selectedBranch.name})
                        </option>
                        {branchSubFamilies.map((sf) => (
                          <option key={sf} value={sf}>
                            Sub-Family: {sf}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C6B64]">
                      Is this person a +1 / Partner? (Optional)
                    </label>
                    <select
                      value={newMemberPlusOneOf}
                      onChange={(e) => setNewMemberPlusOneOf(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#D4CBB8] px-3 py-1.5 text-xs focus:border-[#1B4332] focus:outline-none"
                    >
                      <option value="">No — Regular Family Member</option>
                      {branchGuests
                        .filter((g) => !g.isPlusOne)
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            Yes — Partner / +1 of {g.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberForm(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#5C6B64] hover:bg-[#FAF6F0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#9E2A2B] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#7D2021]"
                  >
                    Add &amp; Mark Going
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );

  const renderSideCard = (cardId: 'highlights' | 'committee') => {
    if (cardId === 'highlights') {
      return (
        <div
          key="highlights"
          className="rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-xs"
        >
          {highlightsTitle && (
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              {highlightsTitle}
            </h3>
          )}
          {highlightsSubtitle && (
            <p className="mt-1.5 text-xs leading-relaxed text-[#5C6B64]">
              {highlightsSubtitle}
            </p>
          )}

          {highlightItems.length > 0 && (
            <div className="mt-4 space-y-3.5">
              {highlightItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-2xl bg-[#FAF6F0] p-3.5"
                >
                  {renderHighlightIcon(item.icon)}
                  <div>
                    <h4 className="text-xs font-bold text-[#1C2826]">
                      {item.title}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-[#5C6B64]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key="committee"
        className="rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif-display text-lg font-bold text-[#1B4332]">
            {committeeTitle}
          </h3>
          <span className="rounded-full bg-[#1B4332]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#1B4332]">
            {cousins.length} Organizers
          </span>
        </div>
        <div className="mt-4 space-y-2.5">
          {cousins.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-[#EFE9DC] bg-[#FAF6F0]/60 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: c.avatarColor }}
                >
                  {c.name.charAt(0)}
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1C2826]">
                    {c.name}
                    {c.isTreasurer && (
                      <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                        Treasurer
                      </span>
                    )}
                  </p>
                  {c.role && (
                    <p className="text-[11px] text-[#5C6B64]">{c.role}</p>
                  )}
                </div>
              </div>
              {c.committee && (
                <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-[#1B4332] shadow-2xs">
                  {c.committee}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const sideColumnElement =
    enabledSideCards.length > 0 ? (
      <aside
        key="sidebar"
        className={`space-y-6 ${
          isRsvpEnabled
            ? 'lg:col-span-4'
            : 'lg:col-span-12 grid gap-6 lg:grid-cols-2 lg:space-y-0'
        }`}
      >
        {enabledSideCards.map((c) =>
          renderSideCard(c.id as 'highlights' | 'committee')
        )}
      </aside>
    ) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Festive Hero Card */}
      <section className="relative overflow-hidden rounded-3xl border border-[#DED6C6] bg-gradient-to-br from-[#1B4332] via-[#173A2B] to-[#0F291E] p-6 text-[#FAF6F0] shadow-xl sm:p-10">
        {/* Decorative warm glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#E9C46A]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#9E2A2B]/25 blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E9C46A]/30 bg-[#E9C46A]/10 px-3.5 py-1 text-xs font-semibold text-[#E9C46A]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{eventConfig.subtitle}</span>
            </div>

            <h1 className="font-serif-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              {eventConfig.title}
            </h1>

            {/* Announcement Note */}
            <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
              <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-[#E9C46A]" />
              <p className="text-xs leading-relaxed text-[#F4EAE0] sm:text-sm">
                {eventConfig.announcement}
              </p>
            </div>

            {/* Key Event Details Grid */}
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#E9C46A]">
                  <Calendar className="h-4 w-4" />
                  <span>Date &amp; Time</span>
                </div>
                <p className="mt-1 text-sm font-bold text-white">
                  {formattedEventDate}
                </p>
                <p className="text-xs text-[#D8E2DC]">Starts at {formattedEventTime}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#E9C46A]">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>Venue</span>
                  </span>
                  {eventConfig.mapUrl && (
                    <a
                      href={eventConfig.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] underline hover:text-white"
                    >
                      <span>Map</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="mt-1 text-sm font-bold text-white">
                  {eventConfig.venueName}
                </p>
                <p className="text-xs text-[#D8E2DC]">{eventConfig.venueAddress}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#E9C46A]">
                  <Shirt className="h-4 w-4" />
                  <span>Dress Code &amp; Palette</span>
                </div>
                <p className="mt-1 text-xs font-medium text-white">
                  {eventConfig.dressCode}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  {eventConfig.dressColors.map((col) => (
                    <span
                      key={col.name}
                      title={col.name}
                      className="h-5 w-5 rounded-full border border-white/40 shadow-xs"
                      style={{ backgroundColor: col.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Countdown & Family Attendance Summary */}
          <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-white/15 bg-black/25 p-5 backdrop-blur-xs lg:col-span-4">
            <div>
              <p className="text-center text-xs font-bold uppercase tracking-widest text-[#E9C46A]">
                Countdown to Christmas Party
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/10 p-3">
                  <span className="font-serif-display block text-3xl font-extrabold text-white">
                    {countdown.days}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#D8E2DC]">
                    Days
                  </span>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <span className="font-serif-display block text-3xl font-extrabold text-white">
                    {countdown.hours}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#D8E2DC]">
                    Hours
                  </span>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <span className="font-serif-display block text-3xl font-extrabold text-white">
                    {countdown.mins}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#D8E2DC]">
                    Mins
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/15 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#D8E2DC]">Confirmed Family Headcount:</span>
                <span className="font-bold text-[#E9C46A]">
                  {goingGuests.length} Going / {guests.length} Invited
                </span>
              </div>
              <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="bg-emerald-400 transition-all duration-500"
                  style={{
                    width: `${
                      guests.length > 0
                        ? Math.round((goingGuests.length / guests.length) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#D8E2DC]">
                <span>{maybeGuests.length} Maybe</span>
                <span>{pendingGuests.length} Awaiting RSVP</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#9E2A2B]/90 px-3.5 py-2.5 text-center text-xs font-semibold text-white shadow-xs">
              RSVP Deadline: {eventConfig.rsvpDeadline}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Guest Portal Cards Grid (Order & Visibility controlled from Cousins HQ Settings) */}
      {enabledCards.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-12">
          {rsvpFirst ? (
            <>
              {isRsvpEnabled && rsvpSectionElement}
              {sideColumnElement}
            </>
          ) : (
            <>
              {sideColumnElement}
              {isRsvpEnabled && rsvpSectionElement}
            </>
          )}
        </div>
      )}
    </div>
  );
};

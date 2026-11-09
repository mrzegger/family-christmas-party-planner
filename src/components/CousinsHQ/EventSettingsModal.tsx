import React, { useState } from 'react';
import {
  X,
  Settings,
  UserPlus,
  Trash2,
  RotateCcw,
  Eraser,
  ArrowUp,
  ArrowDown,
  Plus,
  Eye,
  EyeOff,
  LayoutGrid,
} from 'lucide-react';
import {
  EventConfig,
  Cousin,
  GuestHighlightItem,
  GuestHighlightIcon,
  GuestPortalCardConfig,
} from '../../types/planner';
import { SEED_PLANNER_STATE } from '../../data/seedData';

interface EventSettingsModalProps {
  eventConfig: EventConfig;
  cousins: Cousin[];
  onClose: () => void;
  onUpdateEventConfig: (updates: Partial<EventConfig>) => void;
  onAddCousin: (cousin: Omit<Cousin, 'id'>) => void;
  onUpdateCousin: (id: string, updates: Partial<Cousin>) => void;
  onDeleteCousin: (id: string) => void;
  onResetToSampleData: () => void;
  onClearAllItemsForBlankStart: () => void;
}

const AVATAR_COLORS = [
  '#1B4332',
  '#9E2A2B',
  '#B5651D',
  '#2D6A4F',
  '#722F37',
  '#3A5A40',
  '#5F0F40',
];

const HIGHLIGHT_ICONS: { value: GuestHighlightIcon; label: string }[] = [
  { value: 'utensils', label: 'Food & Utensils' },
  { value: 'party', label: 'Party Popper / Games' },
  { value: 'heart', label: 'Heart / Pooled Pot' },
  { value: 'gift', label: 'Gift / Prizes' },
  { value: 'music', label: 'Music / Program' },
  { value: 'camera', label: 'Photo / Memories' },
  { value: 'sparkles', label: 'Sparkles / Special' },
];

export const EventSettingsModal: React.FC<EventSettingsModalProps> = ({
  eventConfig,
  cousins,
  onClose,
  onUpdateEventConfig,
  onAddCousin,
  onUpdateCousin,
  onDeleteCousin,
  onResetToSampleData,
  onClearAllItemsForBlankStart,
}) => {
  const [title, setTitle] = useState(eventConfig.title);
  const [subtitle, setSubtitle] = useState(eventConfig.subtitle);
  const [eventDate, setEventDate] = useState(
    eventConfig.eventDate.slice(0, 16)
  );
  const [venueName, setVenueName] = useState(eventConfig.venueName);
  const [venueAddress, setVenueAddress] = useState(eventConfig.venueAddress);
  const [mapUrl, setMapUrl] = useState(eventConfig.mapUrl);
  const [dressCode, setDressCode] = useState(eventConfig.dressCode);
  const [announcement, setAnnouncement] = useState(eventConfig.announcement);
  const [rsvpDeadline, setRsvpDeadline] = useState(eventConfig.rsvpDeadline);
  const [currencySymbol, setCurrencySymbol] = useState(
    eventConfig.currencySymbol
  );
  const [hqPin, setHqPin] = useState(eventConfig.hqPin);

  // Guest Portal Cards & "Sit Back & Enjoy" Editor State
  const [guestPortalCards, setGuestPortalCards] = useState<
    GuestPortalCardConfig[]
  >(
    eventConfig.guestPortalCards && eventConfig.guestPortalCards.length > 0
      ? eventConfig.guestPortalCards
      : SEED_PLANNER_STATE.eventConfig.guestPortalCards!
  );

  const [highlightsCardTitle, setHighlightsCardTitle] = useState(
    eventConfig.highlightsCardTitle ?? 'Sit Back & Enjoy This Year!'
  );
  const [highlightsCardSubtitle, setHighlightsCardSubtitle] = useState(
    eventConfig.highlightsCardSubtitle ??
      'The parents tasked the cousins to plan and execute the entire celebration. Here’s how we’ve got you covered:'
  );
  const [highlightItems, setHighlightItems] = useState<GuestHighlightItem[]>(
    eventConfig.highlightItems && eventConfig.highlightItems.length > 0
      ? eventConfig.highlightItems
      : SEED_PLANNER_STATE.eventConfig.highlightItems!
  );
  const [committeeCardTitle, setCommitteeCardTitle] = useState(
    eventConfig.committeeCardTitle ?? 'Your Organizing Committee'
  );

  // Add cousin state
  const [newCousinName, setNewCousinName] = useState('');
  const [newCousinRole, setNewCousinRole] = useState('');
  const [newCousinTreasurer, setNewCousinTreasurer] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEventConfig({
      title: title.trim() || 'Family Christmas Party',
      subtitle: subtitle.trim(),
      eventDate: new Date(eventDate).toISOString(),
      venueName: venueName.trim(),
      venueAddress: venueAddress.trim(),
      mapUrl: mapUrl.trim(),
      dressCode: dressCode.trim(),
      announcement: announcement.trim(),
      rsvpDeadline: rsvpDeadline.trim(),
      currencySymbol: currencySymbol.trim() || '₱',
      hqPin: hqPin.trim() || '1225',
      guestPortalCards,
      highlightsCardTitle: highlightsCardTitle.trim(),
      highlightsCardSubtitle: highlightsCardSubtitle.trim(),
      highlightItems,
      committeeCardTitle:
        committeeCardTitle.trim() || 'Your Organizing Committee',
    });
    onClose();
  };

  const handleAddCousinClick = () => {
    if (!newCousinName.trim()) return;
    onAddCousin({
      name: newCousinName.trim(),
      role: newCousinRole.trim(),
      committee: '',
      avatarColor: AVATAR_COLORS[cousins.length % AVATAR_COLORS.length],
      isTreasurer: newCousinTreasurer,
    });
    setNewCousinName('');
    setNewCousinRole('');
    setNewCousinTreasurer(false);
  };

  // Card reordering & toggling helpers
  const togglePortalCard = (index: number) => {
    setGuestPortalCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const movePortalCard = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= guestPortalCards.length) return;
    setGuestPortalCards((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  // Highlight items helpers
  const updateHighlightItem = (
    id: string,
    updates: Partial<GuestHighlightItem>
  ) => {
    setHighlightItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const moveHighlightItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= highlightItems.length) return;
    setHighlightItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const addHighlightItem = () => {
    setHighlightItems((prev) => [
      ...prev,
      {
        id: `hl-${Date.now()}`,
        icon: 'sparkles',
        title: 'New Highlight Title',
        description: 'Describe what guests should know or expect...',
        enabled: true,
      },
    ]);
  };

  const deleteHighlightItem = (id: string) => {
    setHighlightItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E5DEC9] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B4332] text-[#E9C46A]">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
                Party Settings, Guest Portal Layout &amp; Cousins Roster
              </h3>
              <p className="text-xs text-[#5C6B64]">
                Customize event details, toggle &amp; arrange Family Guest Portal cards, edit the &ldquo;Sit Back &amp; Enjoy&rdquo; card, or manage organizers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#5C6B64] hover:bg-[#E5DEC9]/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="mt-5 space-y-6">
          {/* Section 1: Event Details */}
          <div className="space-y-3 rounded-2xl border border-[#DED6C6] bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B4332]">
              1. Event Details &amp; Security
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Party Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Subtitle / Host Tagline
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Party Date &amp; Start Time
                </label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  RSVP Deadline Label
                </label>
                <input
                  type="text"
                  value={rsvpDeadline}
                  onChange={(e) => setRsvpDeadline(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Venue Address
                </label>
                <input
                  type="text"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Dress Code Description
                </label>
                <input
                  type="text"
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Currency Symbol
                </label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 text-xs"
                >
                  <option value="₱">₱ (Philippine Peso - PHP)</option>
                  <option value="$">$ (US Dollar - USD)</option>
                  <option value="€">€ (Euro - EUR)</option>
                  <option value="£">£ (British Pound - GBP)</option>
                  <option value="A$">A$ (Australian Dollar - AUD)</option>
                  <option value="C$">C$ (Canadian Dollar - CAD)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Cousins HQ Passcode / PIN
                </label>
                <input
                  type="text"
                  value={hqPin}
                  onChange={(e) => setHqPin(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 font-mono text-xs font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C2826]">
                Welcome Announcement on Family Guest Portal
              </label>
              <textarea
                rows={2}
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D4CBB8] px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Section 2: Guest Portal Card Order & Visibility + "Sit Back & Enjoy" Editor */}
          <div className="space-y-4 rounded-2xl border border-[#DED6C6] bg-white p-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-[#9E2A2B]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B4332]">
                2. Family Guest Portal Cards (Toggle On/Off &amp; Arrange Order)
              </h4>
            </div>
            <p className="text-xs text-[#5C6B64]">
              Choose which cards are visible on the public Family Guest Portal and use the Up/Down arrows to arrange their order.
            </p>

            {/* Card Order & Visibility List */}
            <div className="space-y-2">
              {guestPortalCards.map((card, idx) => (
                <div
                  key={card.id}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 transition ${
                    card.enabled
                      ? 'border-[#1B4332]/30 bg-[#FAF6F0]'
                      : 'border-[#E5DEC9] bg-stone-100/70 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4332] text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#1C2826]">
                        {card.label}
                      </p>
                      <p className="text-[10px] text-[#5C6B64]">
                        {card.enabled
                          ? 'Visible on Family Guest Portal'
                          : 'Hidden from Family Guest Portal'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => movePortalCard(idx, -1)}
                      title="Move Up"
                      className="rounded-lg border border-[#DED6C6] bg-white p-1.5 text-[#1C2826] hover:bg-[#F3EDE2] disabled:opacity-35"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === guestPortalCards.length - 1}
                      onClick={() => movePortalCard(idx, 1)}
                      title="Move Down"
                      className="rounded-lg border border-[#DED6C6] bg-white p-1.5 text-[#1C2826] hover:bg-[#F3EDE2] disabled:opacity-35"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePortalCard(idx)}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        card.enabled
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-300 text-stone-700'
                      }`}
                    >
                      {card.enabled ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>Shown</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Customize "Sit Back & Enjoy This Year!" Card Content */}
            <div className="mt-4 space-y-3 rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0]/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h5 className="text-xs font-bold text-[#1B4332]">
                    Customize &ldquo;{highlightsCardTitle || 'Highlights'}&rdquo; Card Content
                  </h5>
                  <p className="text-[11px] text-[#5C6B64]">
                    Edit the heading, intro text, and individual highlight items shown to family guests.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addHighlightItem}
                  className="flex items-center gap-1 rounded-xl bg-[#1B4332] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#143325]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add Highlight Item</span>
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#1C2826]">
                    Card Heading
                  </label>
                  <input
                    type="text"
                    value={highlightsCardTitle}
                    onChange={(e) => setHighlightsCardTitle(e.target.value)}
                    placeholder="e.g., Sit Back & Enjoy This Year!"
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1C2826]">
                    Organizing Committee Card Heading
                  </label>
                  <input
                    type="text"
                    value={committeeCardTitle}
                    onChange={(e) => setCommitteeCardTitle(e.target.value)}
                    placeholder="e.g., Your Organizing Committee"
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1C2826]">
                  Card Subtitle / Intro Paragraph
                </label>
                <textarea
                  rows={2}
                  value={highlightsCardSubtitle}
                  onChange={(e) => setHighlightsCardSubtitle(e.target.value)}
                  placeholder="Introductory message under the card heading..."
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-1.5 text-xs"
                />
              </div>

              {/* Individual Highlight Items */}
              <div className="space-y-2.5 pt-1">
                {highlightItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 transition ${
                      item.enabled
                        ? 'border-[#DED6C6] bg-white'
                        : 'border-[#E5DEC9] bg-stone-100/70 opacity-65'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <select
                          aria-label="Highlight Icon"
                          value={item.icon}
                          onChange={(e) =>
                            updateHighlightItem(item.id, {
                              icon: e.target.value as GuestHighlightIcon,
                            })
                          }
                          className="rounded-lg border border-[#D4CBB8] bg-[#FAF6F0] px-2 py-1 text-xs font-semibold text-[#1B4332]"
                        >
                          {HIGHLIGHT_ICONS.map((ic) => (
                            <option key={ic.value} value={ic.value}>
                              {ic.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            updateHighlightItem(item.id, {
                              title: e.target.value,
                            })
                          }
                          placeholder="Highlight Title"
                          className="min-w-[180px] flex-1 rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs font-bold text-[#1C2826]"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveHighlightItem(idx, -1)}
                          title="Move Up"
                          className="rounded border border-[#DED6C6] p-1 text-[#5C6B64] hover:bg-[#FAF6F0] disabled:opacity-35"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === highlightItems.length - 1}
                          onClick={() => moveHighlightItem(idx, 1)}
                          title="Move Down"
                          className="rounded border border-[#DED6C6] p-1 text-[#5C6B64] hover:bg-[#FAF6F0] disabled:opacity-35"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateHighlightItem(item.id, {
                              enabled: !item.enabled,
                            })
                          }
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                            item.enabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {item.enabled ? 'Shown' : 'Hidden'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHighlightItem(item.id)}
                          title="Delete highlight item"
                          className="rounded p-1 text-[#8C9690] hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) =>
                        updateHighlightItem(item.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Highlight description..."
                      className="mt-2 w-full rounded-lg border border-[#D4CBB8] bg-[#FAF6F0]/50 px-2.5 py-1.5 text-xs text-[#5C6B64]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Cousins Committee Roster */}
          <div className="space-y-3 rounded-2xl border border-[#DED6C6] bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B4332]">
              3. Organizing Committee Roster ({cousins.length})
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {cousins.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#EFE9DC] bg-[#FAF6F0] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        aria-label="Organizer Name"
                        value={c.name}
                        onChange={(e) =>
                          onUpdateCousin(c.id, { name: e.target.value })
                        }
                        className="w-36 rounded border border-transparent bg-white/70 px-1.5 py-0.5 text-xs font-bold text-[#1C2826] focus:border-[#D4CBB8] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCousin(c.id, {
                            isTreasurer: !c.isTreasurer,
                          })
                        }
                        title="Toggle Treasurer badge"
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                          c.isTreasurer
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-white/60 text-[#8C9690] hover:bg-amber-50'
                        }`}
                      >
                        {c.isTreasurer ? 'Treasurer' : 'Set Treasurer'}
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <input
                        type="text"
                        value={c.role}
                        onChange={(e) =>
                          onUpdateCousin(c.id, { role: e.target.value })
                        }
                        placeholder="Role (optional)"
                        className="w-48 rounded border border-transparent bg-white/70 px-1.5 py-0.5 text-[10px] text-[#5C6B64] focus:border-[#D4CBB8] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  {cousins.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCousin(c.id)}
                      className="rounded p-1 text-[#8C9690] hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add a cousin inline */}
            <div className="grid gap-2 pt-2 sm:grid-cols-3">
              <input
                type="text"
                value={newCousinName}
                onChange={(e) => setNewCousinName(e.target.value)}
                placeholder="Organizer Name"
                className="rounded-xl border border-[#D4CBB8] px-3 py-1.5 text-xs"
              />
              <input
                type="text"
                value={newCousinRole}
                onChange={(e) => setNewCousinRole(e.target.value)}
                placeholder="Role (optional)"
                className="rounded-xl border border-[#D4CBB8] px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCousinClick}
                className="flex items-center justify-center gap-1 rounded-xl bg-[#1B4332] px-3 py-1.5 text-xs font-bold text-white"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Organizer</span>
              </button>
            </div>
          </div>

          {/* Section 4: Reset / Clear Sample Data */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                4. Quick Data Reset Tools
              </h4>
              <p className="text-[11px] text-amber-900">
                Restore default starter data or clear tasks/expenses/menu for a fresh blank slate.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetToSampleData();
                  onClose();
                }}
                className="flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restore Starter Sample Data</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllItemsForBlankStart();
                  onClose();
                }}
                className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>Clear Tasks &amp; Expenses (Blank Slate)</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#5C6B64]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#1B4332] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#143325]"
            >
              Save Event Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

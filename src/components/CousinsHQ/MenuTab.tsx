import React, { useState } from 'react';
import {
  Utensils,
  Plus,
  Trash2,
  AlertTriangle,
  Pencil,
  Check,
  X,
  ChefHat,
} from 'lucide-react';
import {
  MenuItem,
  CatererPackage,
  Cousin,
  Guest,
  MenuCourse,
  MenuFulfillment,
  MenuStatus,
} from '../../types/planner';
import { formatCurrency } from '../../lib/storageAdapter';

interface MenuTabProps {
  currencySymbol: string;
  catererPackages: CatererPackage[];
  menuItems: MenuItem[];
  cousins: Cousin[];
  guests: Guest[];
  activeCousinId: string;
  onAddCatererPackage: (pkg: Omit<CatererPackage, 'id'>) => void;
  onUpdateCatererPackage: (id: string, updates: Partial<CatererPackage>) => void;
  onDeleteCatererPackage: (id: string) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  onDeleteMenuItem: (id: string) => void;
}

const COURSES: MenuCourse[] = [
  'Main Dish / Lechon',
  'Pasta & Noodles',
  'Sides & Salads',
  'Desserts & Kakanin',
  'Drinks & Bar',
  'Tableware & Ice',
];

const MENU_STATUSES: MenuStatus[] = [
  'Planned',
  'Ordered',
  'Confirmed',
  'Ready',
];

export const MenuTab: React.FC<MenuTabProps> = ({
  currencySymbol: sym,
  catererPackages,
  menuItems,
  cousins,
  guests,
  activeCousinId,
  onAddCatererPackage,
  onUpdateCatererPackage,
  onDeleteCatererPackage,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}) => {
  // Add Full-Spread Caterer Modal state
  const [showAddCatererModal, setShowAddCatererModal] = useState(false);
  const [catererName, setCatererName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [dishesIncluded, setDishesIncluded] = useState('');
  const [paxCount, setPaxCount] = useState(30);
  const [totalCost, setTotalCost] = useState(25000);
  const [contactInfo, setContactInfo] = useState('');
  const [catererCoordId, setCatererCoordId] = useState('');
  const [catererNotes, setCatererNotes] = useState('');

  // Inline edit Caterer Package state
  const [editingCatererId, setEditingCatererId] = useState<string | null>(null);
  const [editCatererName, setEditCatererName] = useState('');
  const [editPackageName, setEditPackageName] = useState('');
  const [editDishesIncluded, setEditDishesIncluded] = useState('');
  const [editPaxCount, setEditPaxCount] = useState(30);
  const [editTotalCost, setEditTotalCost] = useState(0);
  const [editContactInfo, setEditContactInfo] = useState('');
  const [editCatererCoordId, setEditCatererCoordId] = useState('');
  const [editCatererNotes, setEditCatererNotes] = useState('');

  // Add Individual Dish Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [course, setCourse] = useState<MenuCourse>('Main Dish / Lechon');
  const [fulfillment, setFulfillment] =
    useState<MenuFulfillment>('Catered / Ordered');
  const [vendorOrAssignee, setVendorOrAssignee] = useState('');
  const [responsibleCousinId, setResponsibleCousinId] = useState('');
  const [servings, setServings] = useState(20);
  const [estimatedCost, setEstimatedCost] = useState(3000);
  const [dietaryInfo, setDietaryInfo] = useState('');
  const [notes, setNotes] = useState('');

  // Inline edit Individual Dish state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCourse, setEditCourse] =
    useState<MenuCourse>('Main Dish / Lechon');
  const [editFulfillment, setEditFulfillment] =
    useState<MenuFulfillment>('Catered / Ordered');
  const [editVendor, setEditVendor] = useState('');
  const [editCousinId, setEditCousinId] = useState('');
  const [editServings, setEditServings] = useState(20);
  const [editCost, setEditCost] = useState(0);
  const [editDietary, setEditDietary] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const confirmedHeadcount = guests.filter(
    (g) => g.rsvpStatus === 'Going'
  ).length;
  const totalMenuCost =
    menuItems.reduce((s, m) => s + m.estimatedCost, 0) +
    catererPackages.reduce((s, c) => s + c.totalCost, 0);
  const dietaryAlerts = guests.filter(
    (g) => g.rsvpStatus !== 'Not Going' && g.dietaryNotes.trim().length > 0
  );

  const handleAddCatererSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catererName.trim()) return;
    onAddCatererPackage({
      catererName: catererName.trim(),
      packageName: packageName.trim() || 'Full Catering Package',
      dishesIncluded: dishesIncluded.trim(),
      paxCount: Number(paxCount) || 30,
      totalCost: Number(totalCost) || 0,
      status: 'Planned',
      contactInfo: contactInfo.trim(),
      responsibleCousinId: catererCoordId,
      notes: catererNotes.trim(),
    });
    setCatererName('');
    setPackageName('');
    setDishesIncluded('');
    setContactInfo('');
    setCatererNotes('');
    setShowAddCatererModal(false);
  };

  const startEditingCaterer = (pkg: CatererPackage) => {
    setEditingCatererId(pkg.id);
    setEditCatererName(pkg.catererName);
    setEditPackageName(pkg.packageName);
    setEditDishesIncluded(pkg.dishesIncluded);
    setEditPaxCount(pkg.paxCount);
    setEditTotalCost(pkg.totalCost);
    setEditContactInfo(pkg.contactInfo);
    setEditCatererCoordId(pkg.responsibleCousinId || '');
    setEditCatererNotes(pkg.notes);
  };

  const saveEditingCaterer = (id: string) => {
    if (!editCatererName.trim()) return;
    onUpdateCatererPackage(id, {
      catererName: editCatererName.trim(),
      packageName: editPackageName.trim(),
      dishesIncluded: editDishesIncluded.trim(),
      paxCount: Number(editPaxCount) || 0,
      totalCost: Number(editTotalCost) || 0,
      contactInfo: editContactInfo.trim(),
      responsibleCousinId: editCatererCoordId,
      notes: editCatererNotes.trim(),
    });
    setEditingCatererId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddMenuItem({
      name: name.trim(),
      course,
      fulfillment,
      vendorOrAssignee: vendorOrAssignee.trim() || 'TBD',
      responsibleCousinId,
      servings: Number(servings) || 20,
      estimatedCost: Number(estimatedCost) || 0,
      status: 'Planned',
      dietaryInfo: dietaryInfo.trim(),
      notes: notes.trim(),
    });
    setName('');
    setVendorOrAssignee('');
    setDietaryInfo('');
    setNotes('');
    setShowAddModal(false);
  };

  const startEditingItem = (item: MenuItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCourse(item.course);
    setEditFulfillment(item.fulfillment);
    setEditVendor(item.vendorOrAssignee);
    setEditCousinId(item.responsibleCousinId);
    setEditServings(item.servings);
    setEditCost(item.estimatedCost);
    setEditDietary(item.dietaryInfo);
    setEditNotes(item.notes);
  };

  const saveEditingItem = (id: string) => {
    if (!editName.trim()) return;
    onUpdateMenuItem(id, {
      name: editName.trim(),
      course: editCourse,
      fulfillment: editFulfillment,
      vendorOrAssignee: editVendor.trim() || 'TBD',
      responsibleCousinId: editCousinId,
      servings: Number(editServings) || 0,
      estimatedCost: Number(editCost) || 0,
      dietaryInfo: editDietary.trim(),
      notes: editNotes.trim(),
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Headcount vs Menu Servings Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-[#1B4332]">
            Menu &amp; Catering Planner
          </h2>
          <p className="text-xs text-[#5C6B64]">
            Hire one or multiple full-spread caterers, or plan individual dishes and drinks across courses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0] px-4 py-2 text-xs">
            <span className="text-[#5C6B64]">Confirmed Guests: </span>
            <strong className="text-[#1B4332]">{confirmedHeadcount} pax</strong>
            <span className="mx-2 text-[#D4CBB8]">|</span>
            <span className="text-[#5C6B64]">Total Food Est: </span>
            <strong className="text-[#9E2A2B]">
              {formatCurrency(totalMenuCost, sym)}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => {
              setCatererCoordId(activeCousinId);
              setShowAddCatererModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#1B4332] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#143325]"
          >
            <ChefHat className="h-4 w-4 text-[#E9C46A]" />
            <span>+ Add Full-Spread Caterer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setResponsibleCousinId(activeCousinId);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#9E2A2B] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#7D2021]"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Individual Dish / Drink</span>
          </button>
        </div>
      </div>

      {/* Dietary Watchlist Strip */}
      {dietaryAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span>
              Dietary Restrictions from RSVPs ({dietaryAlerts.length}):
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {dietaryAlerts.map((g) => (
              <span
                key={g.id}
                className="rounded-xl border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-[#1C2826]"
              >
                <strong>{g.name}:</strong> {g.dietaryNotes}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Full-Spread Catering Packages Section */}
      <div className="rounded-3xl border border-[#DED6C6] bg-white p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE9DC] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332] text-[#E9C46A]">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-display text-lg font-bold text-[#1B4332]">
                Full-Spread Catering Packages ({catererPackages.length})
              </h3>
              <p className="text-xs text-[#5C6B64]">
                Hiring one or multiple caterers for the whole spread? Log their packages, included dishes, and pax count here.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCatererCoordId(activeCousinId);
              setShowAddCatererModal(true);
            }}
            className="rounded-xl border border-[#1B4332]/30 bg-[#FAF6F0] px-3 py-1.5 text-xs font-bold text-[#1B4332] hover:bg-[#F1ECE1]"
          >
            + Add Caterer Package
          </button>
        </div>

        {catererPackages.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#D4CBB8] bg-[#FAF6F0]/50 p-5 text-center text-xs text-[#5C6B64]">
            No full-spread caterers added yet. Click <strong>+ Add Full-Spread Caterer</strong> if you are hiring one or more caterers to handle the spread!
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {catererPackages.map((pkg) => {
              const coord = cousins.find(
                (c) => c.id === pkg.responsibleCousinId
              );
              const isEditing = editingCatererId === pkg.id;

              if (isEditing) {
                return (
                  <div
                    key={pkg.id}
                    className="space-y-2.5 rounded-2xl border border-[#1B4332] bg-[#FAF6F0] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1B4332]">
                        Edit Caterer Package
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingCatererId(null)}
                        className="text-[#5C6B64]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editCatererName}
                        onChange={(e) => setEditCatererName(e.target.value)}
                        placeholder="Caterer Name"
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={editPackageName}
                        onChange={(e) => setEditPackageName(e.target.value)}
                        placeholder="Package Name / Tier"
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={editDishesIncluded}
                      onChange={(e) => setEditDishesIncluded(e.target.value)}
                      placeholder="Included dishes, drinks, or buffet setup..."
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Pax Count
                        </label>
                        <input
                          type="number"
                          value={editPaxCount}
                          onChange={(e) =>
                            setEditPaxCount(Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C6B64]">
                          Total Package Cost ({sym})
                        </label>
                        <input
                          type="number"
                          value={editTotalCost}
                          onChange={(e) =>
                            setEditTotalCost(Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editContactInfo}
                        onChange={(e) => setEditContactInfo(e.target.value)}
                        placeholder="Contact # / Link"
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      />
                      <select
                        value={editCatererCoordId}
                        onChange={(e) => setEditCatererCoordId(e.target.value)}
                        className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                      >
                        <option value="">Unassigned</option>
                        {cousins.map((c) => (
                          <option key={c.id} value={c.id}>
                            Coordinator: {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={editCatererNotes}
                      onChange={(e) => setEditCatererNotes(e.target.value)}
                      placeholder="Setup time / notes"
                      className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingCatererId(null)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5C6B64]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditingCaterer(pkg.id)}
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
                  key={pkg.id}
                  className="rounded-2xl border border-[#1B4332]/25 bg-[#FAF6F0] p-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-md bg-[#1B4332] px-2.5 py-0.5 text-[10px] font-bold text-[#E9C46A]">
                        Full-Spread Caterer • {pkg.packageName}
                      </span>
                      <h4 className="mt-1.5 text-base font-bold text-[#1B4332]">
                        {pkg.catererName}
                      </h4>
                      <p className="text-xs text-[#5C6B64]">
                        Coordinator: <strong>{coord?.name || 'Unassigned'}</strong>
                        {pkg.contactInfo ? ` • Contact: ${pkg.contactInfo}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditingCaterer(pkg)}
                        title="Edit caterer package"
                        className="rounded p-1 text-[#5C6B64] hover:text-[#1B4332]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCatererPackage(pkg.id)}
                        title="Delete caterer package"
                        className="rounded p-1 text-[#8C9690] hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {pkg.dishesIncluded && (
                    <div className="mt-2.5 rounded-xl bg-white p-3 text-xs text-[#1C2826]">
                      <strong className="text-[#1B4332]">Included Spread: </strong>
                      {pkg.dishesIncluded}
                    </div>
                  )}

                  {pkg.notes && (
                    <p className="mt-1.5 text-xs text-[#5C6B64] italic">
                      {pkg.notes}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5DEC9] pt-2.5">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-[#1B4332]">
                        Good for {pkg.paxCount} pax
                      </span>
                      <span className="font-mono text-sm font-bold text-[#9E2A2B]">
                        {formatCurrency(pkg.totalCost, sym)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {MENU_STATUSES.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            onUpdateCatererPackage(pkg.id, { status: st })
                          }
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                            pkg.status === st
                              ? 'bg-[#1B4332] text-white'
                              : 'bg-white text-[#5C6B64] hover:bg-[#E5DEC9]/60'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual Course Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {COURSES.map((courseName) => {
          const items = menuItems.filter((m) => m.course === courseName);
          const courseServings = items.reduce((s, i) => s + i.servings, 0);

          return (
            <div
              key={courseName}
              className="rounded-3xl border border-[#DED6C6] bg-white p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-[#EFE9DC] pb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-[#9E2A2B]" />
                  <h3 className="font-serif-display text-lg font-bold text-[#1B4332]">
                    {courseName}
                  </h3>
                </div>
                <span className="rounded-full bg-[#FAF6F0] px-3 py-0.5 text-xs font-bold text-[#5C6B64]">
                  {items.length} items • {courseServings} total servings
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const cousin = cousins.find(
                    (c) => c.id === item.responsibleCousinId
                  );
                  const isEditing = editingId === item.id;

                  if (isEditing) {
                    return (
                      <div
                        key={item.id}
                        className="space-y-2.5 rounded-2xl border border-[#1B4332] bg-[#FAF6F0] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1B4332]">
                            Edit Menu Item
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
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Dish / Drink Name"
                          className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1.5 text-xs font-bold"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={editCourse}
                            onChange={(e) =>
                              setEditCourse(e.target.value as MenuCourse)
                            }
                            className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                          >
                            {COURSES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editFulfillment}
                            onChange={(e) =>
                              setEditFulfillment(
                                e.target.value as MenuFulfillment
                              )
                            }
                            className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                          >
                            <option value="Catered / Ordered">
                              Catered / Ordered
                            </option>
                            <option value="Store-Bought">Store-Bought</option>
                            <option value="Home-Cooked">Home-Cooked</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editVendor}
                            onChange={(e) => setEditVendor(e.target.value)}
                            placeholder="Supplier / Restaurant"
                            className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                          />
                          <select
                            value={editCousinId}
                            onChange={(e) => setEditCousinId(e.target.value)}
                            className="rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                          >
                            <option value="">Unassigned</option>
                            {cousins.map((c) => (
                              <option key={c.id} value={c.id}>
                                Organizer: {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-[#5C6B64]">
                              Servings (pax)
                            </label>
                            <input
                              type="number"
                              value={editServings}
                              onChange={(e) =>
                                setEditServings(Number(e.target.value))
                              }
                              className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#5C6B64]">
                              Estimated Cost ({sym})
                            </label>
                            <input
                              type="number"
                              value={editCost}
                              onChange={(e) =>
                                setEditCost(Number(e.target.value))
                              }
                              className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editDietary}
                          onChange={(e) => setEditDietary(e.target.value)}
                          placeholder="Dietary tag (e.g., No Pork, Vegetarian)"
                          className="w-full rounded-lg border border-[#D4CBB8] bg-white px-2.5 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Delivery / pickup notes"
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
                      className="rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0]/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-[#1B4332]/10 px-2 py-0.5 text-[10px] font-bold text-[#1B4332]">
                              {item.fulfillment}
                            </span>
                            {item.dietaryInfo && (
                              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                {item.dietaryInfo}
                              </span>
                            )}
                          </div>
                          <h4 className="mt-1.5 text-sm font-bold text-[#1C2826]">
                            {item.name}
                          </h4>
                          <p className="mt-0.5 text-xs text-[#5C6B64]">
                            Supplier/Source:{' '}
                            <strong>{item.vendorOrAssignee}</strong> • Assigned:{' '}
                            <strong>{cousin?.name || 'Unassigned'}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingItem(item)}
                            title="Edit menu item"
                            className="rounded p-1 text-[#5C6B64] hover:text-[#1B4332]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMenuItem(item.id)}
                            className="rounded p-1 text-[#8C9690] hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.notes && (
                        <p className="mt-1.5 text-xs text-[#5C6B64] italic">
                          {item.notes}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5DEC9] pt-2.5">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-semibold text-[#1B4332]">
                            Good for {item.servings} pax
                          </span>
                          <span className="font-mono font-bold text-[#9E2A2B]">
                            {formatCurrency(item.estimatedCost, sym)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {MENU_STATUSES.map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() =>
                                onUpdateMenuItem(item.id, { status: st })
                              }
                              className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                                item.status === st
                                  ? 'bg-[#1B4332] text-white'
                                  : 'bg-white text-[#5C6B64] hover:bg-[#E5DEC9]/60'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <p className="py-4 text-center text-xs text-[#5C6B64]">
                    No items added under {courseName} yet.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Full-Spread Caterer Modal */}
      {showAddCatererModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              Add Full-Spread Caterer Package
            </h3>
            <p className="text-xs text-[#5C6B64]">
              Use this when hiring a caterer (or multiple caterers) to provide a complete buffet or multi-dish spread.
            </p>
            <form onSubmit={handleAddCatererSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Caterer / Restaurant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={catererName}
                    onChange={(e) => setCatererName(e.target.value)}
                    placeholder="e.g., Premier Events Catering"
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Package Name / Set
                  </label>
                  <input
                    type="text"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="e.g., Holiday Buffet Package A"
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Dishes &amp; Services Included in Spread
                </label>
                <textarea
                  rows={3}
                  value={dishesIncluded}
                  onChange={(e) => setDishesIncluded(e.target.value)}
                  placeholder="e.g., Roast Beef, Baked Salmon, Truffle Pasta, Mixed Veggies, 2 Desserts, Iced Tea, Chafing Dishes & 2 Waitstaff"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Pax Count Covered
                  </label>
                  <input
                    type="number"
                    value={paxCount}
                    onChange={(e) => setPaxCount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Total Package Cost ({sym})
                  </label>
                  <input
                    type="number"
                    value={totalCost}
                    onChange={(e) => setTotalCost(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Contact Person / Number
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Phone / Viber / Email"
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Point Person / Organizer
                  </label>
                  <select
                    value={catererCoordId}
                    onChange={(e) => setCatererCoordId(e.target.value)}
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
                  Setup / Delivery Notes
                </label>
                <input
                  type="text"
                  value={catererNotes}
                  onChange={(e) => setCatererNotes(e.target.value)}
                  placeholder="e.g., Ingress at 4:00 PM, 50% downpayment due Dec 10"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatererModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5C6B64]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1B4332] px-5 py-2 text-xs font-bold text-white"
                >
                  Save Caterer Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Individual Menu Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              Add Individual Dish or Drink Item
            </h3>
            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Dish / Drink Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Roast Beef Platter (Large)"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Course Category
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value as MenuCourse)}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Fulfillment Type
                  </label>
                  <select
                    value={fulfillment}
                    onChange={(e) =>
                      setFulfillment(e.target.value as MenuFulfillment)
                    }
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    <option value="Catered / Ordered">Catered / Ordered</option>
                    <option value="Store-Bought">Store-Bought</option>
                    <option value="Home-Cooked">Home-Cooked</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Supplier / Restaurant / Cook
                  </label>
                  <input
                    type="text"
                    value={vendorOrAssignee}
                    onChange={(e) => setVendorOrAssignee(e.target.value)}
                    placeholder="e.g., Catering Supplier / Bakery"
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    In-Charge Organizer
                  </label>
                  <select
                    value={responsibleCousinId}
                    onChange={(e) => setResponsibleCousinId(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Estimated Servings (Pax)
                  </label>
                  <input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Estimated Cost ({sym})
                  </label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Dietary Tag (Optional)
                </label>
                <input
                  type="text"
                  value={dietaryInfo}
                  onChange={(e) => setDietaryInfo(e.target.value)}
                  placeholder="e.g., No Pork, Sugar-Free, Vegetarian"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Pickup / Delivery Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Schedule delivery for 4:30 PM"
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
                  Save Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

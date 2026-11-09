import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Vote,
  Wallet,
  Utensils,
  Gamepad2,
  Users,
  PackageCheck,
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  PlannerState,
  RsvpStatus,
  AgeGroup,
  TaskItem,
  FundContribution,
  ExpenseItem,
  MenuItem,
  CatererPackage,
  PollItem,
  ProgramItem,
  GameItem,
  FamilyUnit,
  Guest,
  ChecklistItem,
  EventConfig,
  Cousin,
} from './types/planner';
import { SEED_PLANNER_STATE } from './data/seedData';
import {
  loadLocalState,
  saveLocalState,
  createDynamicSupabaseClient,
  fetchFromSupabaseOrSeed,
  pushStateToSupabase,
  SyncStatus,
} from './lib/storageAdapter';
import { Navbar } from './components/Navbar';
import { GuestPortalView } from './components/GuestPortal/GuestPortalView';
import { OverviewTab, HqTabId } from './components/CousinsHQ/OverviewTab';
import { TasksTab } from './components/CousinsHQ/TasksTab';
import { VotingTab } from './components/CousinsHQ/VotingTab';
import { BudgetTab } from './components/CousinsHQ/BudgetTab';
import { MenuTab } from './components/CousinsHQ/MenuTab';
import { ProgramGamesTab } from './components/CousinsHQ/ProgramGamesTab';
import { RosterTab } from './components/CousinsHQ/RosterTab';
import { ChecklistsTab } from './components/CousinsHQ/ChecklistsTab';
import { EventSettingsModal } from './components/CousinsHQ/EventSettingsModal';

export function App() {
  const [state, setState] = useState<PlannerState>(() => loadLocalState());
  const [activeMode, setActiveMode] = useState<'guest' | 'hq'>('guest');
  const [isHqUnlocked, setIsHqUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('fcpp_hq_unlocked') === 'true';
  });
  const [activeHqTab, setActiveHqTab] = useState<HqTabId>('overview');
  const [activeCousinId, setActiveCousinId] = useState<string>(
    () => state.cousins[0]?.id || 'c1'
  );
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Dual-Mode Supabase Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [syncError, setSyncError] = useState<string | undefined>(undefined);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const connectSupabaseIfConfigured = useCallback(async () => {
    const client = createDynamicSupabaseClient();
    supabaseRef.current = client;

    if (!client) {
      setSyncStatus('local');
      setSyncError(undefined);
      return;
    }

    setSyncStatus('connecting');
    const localSnapshot = loadLocalState();
    const { state: mergedState, error } = await fetchFromSupabaseOrSeed(
      client,
      localSnapshot
    );

    if (error) {
      setSyncStatus('error');
      setSyncError(error);
    } else {
      setState(mergedState);
      setSyncStatus('synced');
      setSyncError(undefined);
    }
  }, []);

  useEffect(() => {
    connectSupabaseIfConfigured();
  }, [connectSupabaseIfConfigured]);

  // Subscribe to Supabase Realtime updates if connected
  useEffect(() => {
    const client = supabaseRef.current;
    if (!client || syncStatus !== 'synced') return;

    const channel = client
      .channel('party-planner-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'party_planner_state',
          filter: 'id=eq.default_party',
        },
        (payload) => {
          const nextRow = payload.new as { payload?: PlannerState } | undefined;
          if (nextRow?.payload) {
            saveLocalState(nextRow.payload);
            setState(nextRow.payload);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [syncStatus]);

  // Unified state updater that saves locally AND pushes to Supabase if active
  const commitState = useCallback(
    (updater: (prev: PlannerState) => PlannerState) => {
      setState((prev) => {
        const next: PlannerState = {
          ...updater(prev),
          lastUpdated: new Date().toISOString(),
        };
        saveLocalState(next);

        if (supabaseRef.current) {
          const activeCousin = prev.cousins.find(
            (c) => c.id === activeCousinId
          );
          pushStateToSupabase(
            supabaseRef.current,
            next,
            activeCousin?.name || 'Family Member'
          ).then(({ error }) => {
            if (error) {
              setSyncStatus('error');
              setSyncError(error);
            } else {
              setSyncStatus('synced');
              setSyncError(undefined);
            }
          });
        }

        return next;
      });
    },
    [activeCousinId]
  );

  // Guest Portal & Roster Handlers
  const handleUpdateGuestRsvp = (
    guestId: string,
    rsvpStatus: RsvpStatus,
    dietaryNotes: string
  ) => {
    commitState((prev) => ({
      ...prev,
      guests: prev.guests.map((g) =>
        g.id === guestId
          ? {
              ...g,
              rsvpStatus,
              dietaryNotes,
              updatedAt: new Date().toISOString(),
            }
          : g
      ),
    }));
  };

  const handleBulkUpdateBranchRsvp = (
    familyUnitId: string,
    rsvpStatus: RsvpStatus
  ) => {
    commitState((prev) => ({
      ...prev,
      guests: prev.guests.map((g) =>
        g.familyUnitId === familyUnitId
          ? { ...g, rsvpStatus, updatedAt: new Date().toISOString() }
          : g
      ),
    }));
  };

  const handleAddFamilyMember = (
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
  ) => {
    const newGuest: Guest = {
      id: `g-${Date.now()}`,
      familyUnitId,
      name,
      ageGroup,
      rsvpStatus,
      dietaryNotes,
      subFamilyName: options?.subFamilyName,
      isPlusOne: options?.isPlusOne ?? activeMode === 'guest',
      plusOneOfGuestId: options?.plusOneOfGuestId,
      updatedAt: new Date().toISOString(),
    };
    commitState((prev) => ({
      ...prev,
      guests: [...prev.guests, newGuest],
    }));
  };

  const handleUpdateFamilyUnit = (id: string, updates: Partial<FamilyUnit>) => {
    commitState((prev) => ({
      ...prev,
      familyUnits: prev.familyUnits.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    }));
  };

  const handleUpdateGuest = (id: string, updates: Partial<Guest>) => {
    commitState((prev) => ({
      ...prev,
      guests: prev.guests.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  };

  const handleDeleteGuest = (id: string) => {
    commitState((prev) => ({
      ...prev,
      guests: prev.guests.filter((g) => g.id !== id),
    }));
  };

  const handleAddFamilyUnit = (unit: Omit<FamilyUnit, 'id'>) => {
    const newUnit: FamilyUnit = {
      ...unit,
      id: `fam-${Date.now()}`,
    };
    commitState((prev) => ({
      ...prev,
      familyUnits: [...prev.familyUnits, newUnit],
    }));
  };

  const handleDeleteFamilyUnit = (id: string) => {
    commitState((prev) => ({
      ...prev,
      familyUnits: prev.familyUnits.filter((f) => f.id !== id),
      guests: prev.guests.filter((g) => g.familyUnitId !== id),
    }));
  };

  // Tasks & Custom Categories Handlers
  const handleAddTask = (task: Omit<TaskItem, 'id'>) => {
    commitState((prev) => ({
      ...prev,
      tasks: [{ ...task, id: `t-${Date.now()}` }, ...prev.tasks],
    }));
  };

  const handleUpdateTask = (id: string, updates: Partial<TaskItem>) => {
    commitState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const handleDeleteTask = (id: string) => {
    commitState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  const handleAddCustomTaskCategory = (cat: string) => {
    commitState((prev) => ({
      ...prev,
      eventConfig: {
        ...prev.eventConfig,
        customTaskCategories: Array.from(
          new Set([...(prev.eventConfig.customTaskCategories || []), cat])
        ),
      },
    }));
  };

  // Voting / Polls Handlers
  const handleAddPoll = (poll: Omit<PollItem, 'id'>) => {
    commitState((prev) => ({
      ...prev,
      polls: [{ ...poll, id: `pl-${Date.now()}` }, ...(prev.polls || [])],
    }));
  };

  const handleUpdatePoll = (id: string, updates: Partial<PollItem>) => {
    commitState((prev) => ({
      ...prev,
      polls: (prev.polls || []).map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  const handleDeletePoll = (id: string) => {
    commitState((prev) => ({
      ...prev,
      polls: (prev.polls || []).filter((p) => p.id !== id),
    }));
  };

  // Budget & Pooled Fund Handlers
  const handleAddContribution = (item: Omit<FundContribution, 'id'>) => {
    commitState((prev) => ({
      ...prev,
      contributions: [
        ...prev.contributions,
        { ...item, id: `fc-${Date.now()}` },
      ],
    }));
  };

  const handleUpdateContribution = (
    id: string,
    updates: Partial<FundContribution>
  ) => {
    commitState((prev) => ({
      ...prev,
      contributions: prev.contributions.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  };

  const handleDeleteContribution = (id: string) => {
    commitState((prev) => ({
      ...prev,
      contributions: prev.contributions.filter((c) => c.id !== id),
    }));
  };

  const handleAddExpense = (item: Omit<ExpenseItem, 'id'>) => {
    commitState((prev) => ({
      ...prev,
      expenses: [{ ...item, id: `ex-${Date.now()}` }, ...prev.expenses],
    }));
  };

  const handleUpdateExpense = (id: string, updates: Partial<ExpenseItem>) => {
    commitState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  };

  const handleDeleteExpense = (id: string) => {
    commitState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  // Menu & Full-Spread Caterer Handlers
  const handleAddCatererPackage = (pkg: Omit<CatererPackage, 'id'>) => {
    commitState((prev) => ({
      ...prev,
      catererPackages: [
        ...(prev.catererPackages || []),
        { ...pkg, id: `cp-${Date.now()}` },
      ],
    }));
  };

  const handleUpdateCatererPackage = (
    id: string,
    updates: Partial<CatererPackage>
  ) => {
    commitState((prev) => ({
      ...prev,
      catererPackages: (prev.catererPackages || []).map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  };

  const handleDeleteCatererPackage = (id: string) => {
    commitState((prev) => ({
      ...prev,
      catererPackages: (prev.catererPackages || []).filter((c) => c.id !== id),
    }));
  };

  const handleAddMenuItem = (item: Omit<MenuItem, 'id'>) => {
    commitState((prev) => ({
      ...prev,
      menuItems: [...prev.menuItems, { ...item, id: `m-${Date.now()}` }],
    }));
  };

  const handleUpdateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    commitState((prev) => ({
      ...prev,
      menuItems: prev.menuItems.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  };

  const handleDeleteMenuItem = (id: string) => {
    commitState((prev) => ({
      ...prev,
      menuItems: prev.menuItems.filter((m) => m.id !== id),
    }));
  };

  // Program & Games Handlers
  const handleAddProgramItem = (item: Omit<ProgramItem, 'id'>) => {
    commitState((prev) => ({
      ...prev,
      programItems: [
        ...prev.programItems,
        { ...item, id: `p-${Date.now()}` },
      ],
    }));
  };

  const handleUpdateProgramItem = (
    id: string,
    updates: Partial<ProgramItem>
  ) => {
    commitState((prev) => ({
      ...prev,
      programItems: prev.programItems.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  const handleDeleteProgramItem = (id: string) => {
    commitState((prev) => ({
      ...prev,
      programItems: prev.programItems.filter((p) => p.id !== id),
    }));
  };

  const handleAddCustomProgramCategory = (cat: string) => {
    commitState((prev) => ({
      ...prev,
      eventConfig: {
        ...prev.eventConfig,
        customProgramCategories: Array.from(
          new Set([...(prev.eventConfig.customProgramCategories || []), cat])
        ),
      },
    }));
  };

  const handleAddGame = (game: Omit<GameItem, 'id'>) => {
    commitState((prev) => ({
      ...prev,
      games: [...prev.games, { ...game, id: `gm-${Date.now()}` }],
    }));
  };

  const handleUpdateGame = (id: string, updates: Partial<GameItem>) => {
    commitState((prev) => ({
      ...prev,
      games: prev.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  };

  const handleDeleteGame = (id: string) => {
    commitState((prev) => ({
      ...prev,
      games: prev.games.filter((g) => g.id !== id),
    }));
  };

  // Checklists Handlers
  const handleAddChecklistItem = (item: Omit<ChecklistItem, 'id'>) => {
    commitState((prev) => ({
      ...prev,
      checklistItems: [
        ...prev.checklistItems,
        { ...item, id: `ck-${Date.now()}` },
      ],
    }));
  };

  const handleUpdateChecklistItem = (
    id: string,
    updates: Partial<ChecklistItem>
  ) => {
    commitState((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  };

  const handleDeleteChecklistItem = (id: string) => {
    commitState((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((c) => c.id !== id),
    }));
  };

  const handleAddCustomChecklistCategory = (cat: string) => {
    commitState((prev) => ({
      ...prev,
      eventConfig: {
        ...prev.eventConfig,
        customChecklistCategories: Array.from(
          new Set([...(prev.eventConfig.customChecklistCategories || []), cat])
        ),
      },
    }));
  };

  // Settings & Data Reset Handlers
  const handleUpdateEventConfig = (updates: Partial<EventConfig>) => {
    commitState((prev) => ({
      ...prev,
      eventConfig: { ...prev.eventConfig, ...updates },
    }));
  };

  const handleAddCousin = (cousin: Omit<Cousin, 'id'>) => {
    commitState((prev) => ({
      ...prev,
      cousins: [...prev.cousins, { ...cousin, id: `c-${Date.now()}` }],
    }));
  };

  const handleUpdateCousin = (id: string, updates: Partial<Cousin>) => {
    commitState((prev) => ({
      ...prev,
      cousins: prev.cousins.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const handleDeleteCousin = (id: string) => {
    commitState((prev) => ({
      ...prev,
      cousins: prev.cousins.filter((c) => c.id !== id),
    }));
  };

  const handleResetToSampleData = () => {
    commitState(() => ({
      ...SEED_PLANNER_STATE,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleClearAllItemsForBlankStart = () => {
    commitState((prev) => ({
      ...prev,
      tasks: [],
      contributions: [],
      expenses: [],
      catererPackages: [],
      menuItems: [],
      polls: [],
      programItems: [],
      games: [],
      checklistItems: [],
    }));
  };

  const hqNavigationTabs: {
    id: HqTabId;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string | number;
  }[] = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    {
      id: 'tasks',
      label: 'Tasks & Categories',
      icon: CheckSquare,
      badge: state.tasks.filter((t) => t.status !== 'Done').length,
    },
    {
      id: 'voting',
      label: 'Voting',
      icon: Vote,
      badge: (state.polls || []).filter((p) => p.status === 'Open').length,
    },
    { id: 'budget', label: 'Pooled Fund & Budget', icon: Wallet },
    {
      id: 'menu',
      label: 'Menu & Catering',
      icon: Utensils,
      badge: state.menuItems.length + (state.catererPackages || []).length,
    },
    {
      id: 'program',
      label: 'Program & Games',
      icon: Gamepad2,
      badge: state.games.length,
    },
    {
      id: 'roster',
      label: 'Family Roster & RSVPs',
      icon: Users,
      badge: `${state.guests.filter((g) => g.rsvpStatus === 'Going').length}/${state.guests.length}`,
    },
    {
      id: 'checklists',
      label: 'Shopping & Packing',
      icon: PackageCheck,
      badge: `${state.checklistItems.filter((c) => c.isPacked).length}/${state.checklistItems.length}`,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        activeMode={activeMode}
        isHqUnlocked={isHqUnlocked}
        hqPin={state.eventConfig.hqPin}
        onSelectMode={(m) => setActiveMode(m)}
        onUnlockHq={() => {
          sessionStorage.setItem('fcpp_hq_unlocked', 'true');
          setIsHqUnlocked(true);
        }}
        onLockHq={() => {
          sessionStorage.removeItem('fcpp_hq_unlocked');
          setIsHqUnlocked(false);
          setActiveMode('guest');
        }}
        cousins={state.cousins}
        activeCousinId={activeCousinId}
        onChangeActiveCousin={setActiveCousinId}
        syncStatus={syncStatus}
        syncError={syncError}
        onReconnectSupabase={connectSupabaseIfConfigured}
        onOpenSettings={() => setShowSettingsModal(true)}
        partyTitle={state.eventConfig.title}
      />

      {activeMode === 'guest' || !isHqUnlocked ? (
        <main className="flex-1">
          <GuestPortalView
            eventConfig={state.eventConfig}
            familyUnits={state.familyUnits}
            guests={state.guests}
            cousins={state.cousins}
            onUpdateGuestRsvp={handleUpdateGuestRsvp}
            onBulkUpdateBranchRsvp={handleBulkUpdateBranchRsvp}
            onAddFamilyMember={handleAddFamilyMember}
          />
        </main>
      ) : (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {/* Cousins HQ Sub-Navigation Bar */}
          <nav
            aria-label="Cousins HQ Modules"
            className="mb-6 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-[#DED6C6] bg-white p-1.5 shadow-2xs"
          >
            {hqNavigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeHqTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveHqTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#1B4332] text-white shadow-xs'
                      : 'text-[#5C6B64] hover:bg-[#FAF6F0] hover:text-[#1C2826]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-[#E9C46A]' : 'text-[#9E2A2B]'
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F1ECE1] text-[#1B4332]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active HQ Module Content */}
          {activeHqTab === 'overview' && (
            <OverviewTab
              state={state}
              activeCousinId={activeCousinId}
              onNavigateTab={setActiveHqTab}
              onOpenSettings={() => setShowSettingsModal(true)}
            />
          )}

          {activeHqTab === 'tasks' && (
            <TasksTab
              tasks={state.tasks}
              cousins={state.cousins}
              activeCousinId={activeCousinId}
              customCategories={state.eventConfig.customTaskCategories}
              onAddCustomCategory={handleAddCustomTaskCategory}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeHqTab === 'voting' && (
            <VotingTab
              polls={state.polls || []}
              cousins={state.cousins}
              activeCousinId={activeCousinId}
              currencySymbol={state.eventConfig.currencySymbol}
              onAddPoll={handleAddPoll}
              onUpdatePoll={handleUpdatePoll}
              onDeletePoll={handleDeletePoll}
            />
          )}

          {activeHqTab === 'budget' && (
            <BudgetTab
              currencySymbol={state.eventConfig.currencySymbol}
              contributions={state.contributions}
              expenses={state.expenses}
              cousins={state.cousins}
              familyUnits={state.familyUnits}
              activeCousinId={activeCousinId}
              onAddContribution={handleAddContribution}
              onUpdateContribution={handleUpdateContribution}
              onDeleteContribution={handleDeleteContribution}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeHqTab === 'menu' && (
            <MenuTab
              currencySymbol={state.eventConfig.currencySymbol}
              catererPackages={state.catererPackages || []}
              menuItems={state.menuItems}
              cousins={state.cousins}
              guests={state.guests}
              activeCousinId={activeCousinId}
              onAddCatererPackage={handleAddCatererPackage}
              onUpdateCatererPackage={handleUpdateCatererPackage}
              onDeleteCatererPackage={handleDeleteCatererPackage}
              onAddMenuItem={handleAddMenuItem}
              onUpdateMenuItem={handleUpdateMenuItem}
              onDeleteMenuItem={handleDeleteMenuItem}
            />
          )}

          {activeHqTab === 'program' && (
            <ProgramGamesTab
              currencySymbol={state.eventConfig.currencySymbol}
              programItems={state.programItems}
              games={state.games}
              customCategories={state.eventConfig.customProgramCategories}
              onAddCustomCategory={handleAddCustomProgramCategory}
              onAddProgramItem={handleAddProgramItem}
              onUpdateProgramItem={handleUpdateProgramItem}
              onDeleteProgramItem={handleDeleteProgramItem}
              onAddGame={handleAddGame}
              onUpdateGame={handleUpdateGame}
              onDeleteGame={handleDeleteGame}
            />
          )}

          {activeHqTab === 'roster' && (
            <RosterTab
              familyUnits={state.familyUnits}
              guests={state.guests}
              onAddFamilyUnit={handleAddFamilyUnit}
              onUpdateFamilyUnit={handleUpdateFamilyUnit}
              onDeleteFamilyUnit={handleDeleteFamilyUnit}
              onAddGuest={handleAddFamilyMember}
              onUpdateGuest={handleUpdateGuest}
              onDeleteGuest={handleDeleteGuest}
            />
          )}

          {activeHqTab === 'checklists' && (
            <ChecklistsTab
              checklistItems={state.checklistItems}
              cousins={state.cousins}
              activeCousinId={activeCousinId}
              customCategories={state.eventConfig.customChecklistCategories}
              onAddCustomCategory={handleAddCustomChecklistCategory}
              onAddChecklistItem={handleAddChecklistItem}
              onUpdateChecklistItem={handleUpdateChecklistItem}
              onDeleteChecklistItem={handleDeleteChecklistItem}
            />
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-[#E5DEC9] bg-[#F4EFE6] py-6 text-center text-xs text-[#5C6B64]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 sm:px-6">
          <span>
            <strong>{state.eventConfig.title}</strong> • Built for the Cousins Organizing Committee
          </span>
          <span>
            Default Cousins HQ PIN: <code className="font-mono font-bold text-[#9E2A2B]">{state.eventConfig.hqPin}</code>
          </span>
        </div>
      </footer>

      {showSettingsModal && (
        <EventSettingsModal
          eventConfig={state.eventConfig}
          cousins={state.cousins}
          onClose={() => setShowSettingsModal(false)}
          onUpdateEventConfig={handleUpdateEventConfig}
          onAddCousin={handleAddCousin}
          onUpdateCousin={handleUpdateCousin}
          onDeleteCousin={handleDeleteCousin}
          onResetToSampleData={handleResetToSampleData}
          onClearAllItemsForBlankStart={handleClearAllItemsForBlankStart}
        />
      )}
    </div>
  );
}
export default App;

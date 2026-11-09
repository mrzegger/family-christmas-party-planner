import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Unlock,
  Users,
  Cloud,
  HardDrive,
  Settings,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
  Copy,
  Check,
  Database,
} from 'lucide-react';
import { Cousin } from '../types/planner';
import {
  SyncStatus,
  getSupabaseRuntimeConfig,
  saveSupabaseRuntimeConfig,
} from '../lib/storageAdapter';

interface NavbarProps {
  activeMode: 'guest' | 'hq';
  isHqUnlocked: boolean;
  hqPin: string;
  onSelectMode: (mode: 'guest' | 'hq') => void;
  onUnlockHq: () => void;
  onLockHq: () => void;
  cousins: Cousin[];
  activeCousinId: string;
  onChangeActiveCousin: (id: string) => void;
  syncStatus: SyncStatus;
  syncError?: string;
  onReconnectSupabase: () => void;
  onOpenSettings: () => void;
  partyTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMode,
  isHqUnlocked,
  hqPin,
  onSelectMode,
  onUnlockHq,
  onLockHq,
  cousins,
  activeCousinId,
  onChangeActiveCousin,
  syncStatus,
  syncError,
  onReconnectSupabase,
  onOpenSettings,
  partyTitle,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [showCloudModal, setShowCloudModal] = useState(false);
  const existingCfg = getSupabaseRuntimeConfig();
  const [sbUrl, setSbUrl] = useState(existingCfg?.url || '');
  const [sbKey, setSbKey] = useState(existingCfg?.anonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);

  const handleHqClick = () => {
    if (isHqUnlocked) {
      onSelectMode('hq');
    } else {
      setPinInput('');
      setPinError('');
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === hqPin) {
      setShowPinModal(false);
      onUnlockHq();
      onSelectMode('hq');
    } else {
      setPinError(`Incorrect PIN! (Tip: Default Cousins PIN is ${hqPin})`);
    }
  };

  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseRuntimeConfig({ url: sbUrl, anonKey: sbKey });
    setShowCloudModal(false);
    onReconnectSupabase();
  };

  const handleDisconnectCloud = () => {
    saveSupabaseRuntimeConfig(null);
    setSbUrl('');
    setSbKey('');
    setShowCloudModal(false);
    onReconnectSupabase();
  };

  const quickSqlSnippet = `create table if not exists public.party_planner_state (
  id text primary key default 'default_party',
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.party_planner_state enable row level security;
create policy "Allow public read/write to party_planner_state"
  on public.party_planner_state for all using (true) with check (true);
alter publication supabase_realtime add table public.party_planner_state;`;

  const copySql = () => {
    navigator.clipboard.writeText(quickSqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const activeCousin = cousins.find((c) => c.id === activeCousinId) || cousins[0];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#E5DEC9] bg-[#FAF6F0]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectMode('guest')}
              className="group flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B4332] text-[#E9C46A] shadow-sm transition-transform group-hover:scale-105">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif-display text-lg font-bold tracking-tight text-[#1B4332]">
                    {partyTitle}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#5C6B64]">
                  Family Portal &amp; Cousins Planning Hub
                </p>
              </div>
            </button>
          </div>

          {/* Center Mode Switcher: Family Guest Portal vs Cousins HQ */}
          <div className="flex items-center rounded-xl border border-[#DED6C6] bg-[#F1ECE1] p-1 shadow-inner">
            <button
              onClick={() => onSelectMode('guest')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                activeMode === 'guest'
                  ? 'bg-white text-[#1B4332] shadow-sm'
                  : 'text-[#5C6B64] hover:text-[#1C2826]'
              }`}
            >
              <Users className="h-4 w-4 text-[#9E2A2B]" />
              <span>Family Guest Portal</span>
            </button>

            <button
              onClick={handleHqClick}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                activeMode === 'hq'
                  ? 'bg-[#1B4332] text-[#FAF6F0] shadow-sm'
                  : 'text-[#5C6B64] hover:text-[#1C2826]'
              }`}
            >
              {isHqUnlocked ? (
                <Unlock className="h-3.5 w-3.5 text-[#E9C46A]" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-[#9E2A2B]" />
              )}
              <span>Cousins HQ</span>
              {!isHqUnlocked && (
                <span className="rounded bg-[#9E2A2B]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#9E2A2B]">
                  PIN
                </span>
              )}
            </button>
          </div>

          {/* Right Controls: Active Cousin Switcher (when in HQ), Sync Status, Settings */}
          <div className="flex items-center gap-2">
            {activeMode === 'hq' && isHqUnlocked && (
              <>
                {activeCousin && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-[#DED6C6] bg-white px-2.5 py-1.5 shadow-2xs">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: activeCousin.avatarColor }}
                    >
                      {activeCousin.name.charAt(0)}
                    </span>
                    <span className="hidden text-xs text-[#5C6B64] md:inline">
                      Working as:
                    </span>
                    <select
                      aria-label="Select active cousin"
                      value={activeCousinId}
                      onChange={(e) => onChangeActiveCousin(e.target.value)}
                      className="cursor-pointer bg-transparent text-xs font-bold text-[#1B4332] focus:outline-none"
                    >
                      {cousins.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dual-Mode Sync Badge (Only shown inside Cousins HQ) */}
                <button
                  onClick={() => {
                    const current = getSupabaseRuntimeConfig();
                    setSbUrl(current?.url || '');
                    setSbKey(current?.anonKey || '');
                    setShowCloudModal(true);
                  }}
                  title="Configure Supabase Cloud Sync or Local Storage"
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    syncStatus === 'synced'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : syncStatus === 'error'
                      ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
                      : 'border-[#DED6C6] bg-white text-[#5C6B64] hover:bg-[#F3EDE2]'
                  }`}
                >
                  {syncStatus === 'synced' ? (
                    <>
                      <Cloud className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Supabase Live</span>
                    </>
                  ) : syncStatus === 'error' ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                      <span className="hidden sm:inline">Sync Issue</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="h-3.5 w-3.5 text-[#B5651D]" />
                      <span className="hidden sm:inline">Local Mode</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onOpenSettings}
                  title="Party Settings & Roster Reset"
                  className="flex items-center gap-1.5 rounded-xl border border-[#DED6C6] bg-white p-2 text-[#1B4332] transition-colors hover:bg-[#F3EDE2]"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={onLockHq}
                  title="Lock Cousins HQ"
                  className="rounded-xl border border-[#DED6C6] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#9E2A2B] transition-colors hover:bg-red-50"
                >
                  Lock
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* PIN Unlock Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#9E2A2B] text-white">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
                    Unlock Cousins HQ
                  </h3>
                  <p className="text-xs text-[#5C6B64]">
                    Organizer dashboard for tasks, budget, menu &amp; surprise games
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPinModal(false)}
                className="rounded-lg p-1 text-[#5C6B64] hover:bg-[#E5DEC9]/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePinSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5C6B64]">
                  Enter Cousins Passcode / PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="mt-1.5 w-full rounded-xl border border-[#D4CBB8] bg-white px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-[#1B4332] focus:border-[#1B4332] focus:outline-none"
                />
                <p className="mt-1.5 text-center text-xs text-[#5C6B64]">
                  For Organizing Committee members only
                </p>
                {pinError && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-semibold text-red-700">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#5C6B64] hover:bg-[#E5DEC9]/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-[#1B4332] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#143325]"
                >
                  <Unlock className="h-4 w-4 text-[#E9C46A]" />
                  <span>Enter Cousins HQ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dual-Mode Supabase Cloud Sync Modal */}
      {showCloudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B4332] text-[#E9C46A]">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
                    Dual-Mode Storage &amp; Supabase Cloud Sync
                  </h3>
                  <p className="text-xs text-[#5C6B64]">
                    Works locally out-of-the-box, or syncs live across all cousins&apos; phones via Supabase
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCloudModal(false)}
                className="rounded-lg p-1 text-[#5C6B64] hover:bg-[#E5DEC9]/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#DED6C6] bg-white p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold">
                {syncStatus === 'synced' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-800">
                      Connected to Supabase Postgres — Real-time sync is active!
                    </span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-800">
                      Supabase Connection Error: {syncError || 'Check URL, Anon Key, or run the SQL table script below.'}
                    </span>
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4 text-[#B5651D]" />
                    <span className="text-[#1C2826]">
                      Currently running in instant Local Storage Mode (all changes saved in this browser).
                    </span>
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveCloudConfig} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs text-[#1C2826] focus:border-[#1B4332] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Supabase Anon / Public Key
                </label>
                <input
                  type="password"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 font-mono text-xs text-[#1C2826] focus:border-[#1B4332] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-[#5C6B64]">
                  You can also set <code className="rounded bg-[#E5DEC9]/60 px-1">VITE_SUPABASE_URL</code> and{' '}
                  <code className="rounded bg-[#E5DEC9]/60 px-1">VITE_SUPABASE_ANON_KEY</code> in your <code className="rounded bg-[#E5DEC9]/60 px-1">.env</code> file.
                </p>
              </div>

              <div className="rounded-xl border border-[#E5DEC9] bg-[#F3EDE2] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1B4332]">
                    1-Click Supabase SQL Setup (Run in Supabase SQL Editor)
                  </span>
                  <button
                    type="button"
                    onClick={copySql}
                    className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1B4332] shadow-2xs hover:bg-[#FAF6F0]"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-[#1C2826] p-2.5 font-mono text-[10px] leading-relaxed text-[#FAF6F0]">
                  {quickSqlSnippet}
                </pre>
                <p className="mt-1.5 text-[11px] text-[#5C6B64]">
                  Full normalized tables are also saved in <code className="font-mono">supabase/schema.sql</code> in your project folder.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {existingCfg ? (
                  <button
                    type="button"
                    onClick={handleDisconnectCloud}
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Switch Back to Local Mode
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCloudModal(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5C6B64] hover:bg-[#E5DEC9]/50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#1B4332] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#143325]"
                  >
                    Save &amp; Connect Supabase
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

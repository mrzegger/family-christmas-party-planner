import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PlannerState } from '../types/planner';
import { SEED_PLANNER_STATE } from '../data/seedData';

const LOCAL_STORAGE_STATE_KEY = 'fcpp_planner_state_v1';
const LOCAL_STORAGE_SUPABASE_CONFIG_KEY = 'fcpp_supabase_config_v1';
const SUPABASE_ROW_ID = 'default_party';

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'error';

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig | null {
  // 1. Check runtime override saved in browser (if user connected via UI modal)
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SupabaseRuntimeConfig;
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {
    // ignore JSON error
  }

  // 2. Check Vite environment variables
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (
    envUrl &&
    envKey &&
    envUrl !== 'https://your-project-id.supabase.co' &&
    envKey !== 'your-anon-key-here'
  ) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }

  return null;
}

export function sanitizeSupabaseUrl(url: string): string {
  let cleaned = url.trim();
  // Strip trailing slash
  cleaned = cleaned.replace(/\/+$/, '');
  // Strip /rest/v1 if the user copied the REST endpoint
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  return cleaned;
}

export function saveSupabaseRuntimeConfig(config: SupabaseRuntimeConfig | null): void {
  if (!config || !config.url.trim() || !config.anonKey.trim()) {
    localStorage.removeItem(LOCAL_STORAGE_SUPABASE_CONFIG_KEY);
  } else {
    localStorage.setItem(
      LOCAL_STORAGE_SUPABASE_CONFIG_KEY,
      JSON.stringify({
        url: sanitizeSupabaseUrl(config.url),
        anonKey: config.anonKey.trim(),
      })
    );
  }
}

export function createDynamicSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseRuntimeConfig();
  if (!cfg) return null;
  try {
    return createClient(sanitizeSupabaseUrl(cfg.url), cfg.anonKey);
  } catch {
    return null;
  }
}

export function loadLocalState(): PlannerState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(SEED_PLANNER_STATE));
      return SEED_PLANNER_STATE;
    }
    const parsed = JSON.parse(raw) as PlannerState;
    const cleanedCousins = (parsed.cousins || SEED_PLANNER_STATE.cousins).map(
      (c) => ({
        ...c,
        name: c.name.replace(/\s*\(Lead\)\s*/gi, '').trim(),
      })
    );
    return {
      ...SEED_PLANNER_STATE,
      ...parsed,
      cousins: cleanedCousins,
      catererPackages: parsed.catererPackages || [],
      polls: parsed.polls || SEED_PLANNER_STATE.polls || [],
      eventConfig: {
        ...SEED_PLANNER_STATE.eventConfig,
        ...(parsed.eventConfig || {}),
      },
    };
  } catch {
    return SEED_PLANNER_STATE;
  }
}

export function saveLocalState(state: PlannerState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

export async function fetchFromSupabaseOrSeed(
  client: SupabaseClient,
  fallbackState: PlannerState
): Promise<{ state: PlannerState; error?: string }> {
  try {
    const { data, error } = await client
      .from('party_planner_state')
      .select('payload, updated_at')
      .eq('id', SUPABASE_ROW_ID)
      .maybeSingle();

    if (error) {
      return { state: fallbackState, error: error.message };
    }

    if (data && data.payload) {
      const remoteState = data.payload as PlannerState;
      saveLocalState(remoteState);
      return { state: remoteState };
    }

    // Row does not exist yet — seed it with current local state
    const { error: upsertErr } = await client.from('party_planner_state').upsert({
      id: SUPABASE_ROW_ID,
      payload: fallbackState,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      return { state: fallbackState, error: upsertErr.message };
    }

    return { state: fallbackState };
  } catch (err) {
    return {
      state: fallbackState,
      error: err instanceof Error ? err.message : 'Failed to connect to Supabase',
    };
  }
}

export async function pushStateToSupabase(
  client: SupabaseClient,
  state: PlannerState,
  updatedBy?: string
): Promise<{ error?: string }> {
  try {
    const { error } = await client.from('party_planner_state').upsert({
      id: SUPABASE_ROW_ID,
      payload: state,
      updated_at: state.lastUpdated,
      updated_by: updatedBy || 'Cousin',
    });

    if (error) {
      return { error: error.message };
    }
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to push update to Supabase',
    };
  }
}

export function formatCurrency(amount: number, symbol = '₱'): string {
  const formatted = Math.abs(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

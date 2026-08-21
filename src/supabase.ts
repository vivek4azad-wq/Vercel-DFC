import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { TABLE_CONFIGS, TableKey, SupabaseRow } from './types';

export const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://elnvsjeahxjqqtrfytgs.supabase.co';
export const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_E670CYfKDgkTOZY3B6ouww_hQi6Z4sN';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export interface LiveChangeEvent {
  table: string;
  tableKey?: TableKey;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRecord?: SupabaseRow;
  oldRecord?: SupabaseRow;
  timestamp: string;
}

type LiveChangeCallback = (event: LiveChangeEvent) => void;

class SupabaseDataEngine {
  private channel: RealtimeChannel | null = null;
  private changeListeners: Set<LiveChangeCallback> = new Set();
  private statusListeners: Set<(connected: boolean, msg?: string) => void> = new Set();
  private isConnected = false;
  private statusMessage = 'Connecting to Supabase PostgreSQL...';
  private tableCache: Map<TableKey, SupabaseRow[]> = new Map();
  private countsCache: Record<string, number> = {};

  constructor() {
    this.initRealtime();
  }

  private initRealtime() {
    try {
      this.channel = supabase
        .channel('supabase-live-portal-cdc')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload: any) => {
            const table = payload.table;
            const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            const raw = payload.new && Object.keys(payload.new).length > 0 ? payload.new : payload.old;
            const record = this.formatRecord(raw);

            // Find matching tableKey
            const tableKey = (Object.keys(TABLE_CONFIGS) as TableKey[]).find(
              k => TABLE_CONFIGS[k].tableName === table
            );

            // Update cache
            if (tableKey) {
              const currentList = this.tableCache.get(tableKey) || [];
              if (eventType === 'DELETE') {
                this.tableCache.set(tableKey, currentList.filter(r => r.id !== record.id));
              } else if (eventType === 'INSERT') {
                this.tableCache.set(tableKey, [record, ...currentList.filter(r => r.id !== record.id)]);
              } else if (eventType === 'UPDATE') {
                this.tableCache.set(tableKey, currentList.map(r => r.id === record.id ? record : r));
              }
            }

            const evt: LiveChangeEvent = {
              table,
              tableKey,
              eventType,
              newRecord: payload.new ? this.formatRecord(payload.new) : undefined,
              oldRecord: payload.old ? this.formatRecord(payload.old) : undefined,
              timestamp: new Date().toISOString()
            };

            this.changeListeners.forEach(fn => fn(evt));
          }
        )
        .subscribe((status: string, err?: any) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.statusMessage = 'Live Supabase Connected (PostgreSQL WebSockets Active)';
            this.statusListeners.forEach(fn => fn(true, this.statusMessage));
            this.refreshCounts().catch(console.warn);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.isConnected = false;
            this.statusMessage = `Connection issue: ${err?.message || status}`;
            this.statusListeners.forEach(fn => fn(false, this.statusMessage));
          }
        });
    } catch (e: any) {
      console.warn('Realtime init error:', e);
      this.statusMessage = e?.message || 'Error initializing real-time connection';
      this.statusListeners.forEach(fn => fn(false, this.statusMessage));
    }
  }

  public formatRecord(row: any): SupabaseRow {
    if (!row) return {} as SupabaseRow;
    let payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
    return {
      id: String(row.id || ''),
      name: String(row.name || payload.name || payload.itemName || payload.officerName || payload.title || ''),
      code: String(row.code || payload.code || payload.itemCode || payload.bridgeNo || payload.pointNo || payload.gateNo || ''),
      category: String(row.category || payload.category || payload.type || payload.role || ''),
      section: String(row.section || payload.section || payload.sectionCode || payload.blockSection || ''),
      station: String(row.station || payload.station || payload.stationName || ''),
      chainage_km: row.chainage_km !== null && row.chainage_km !== undefined ? Number(row.chainage_km) : (payload.km ?? payload.chainage ?? null),
      status: String(row.status || payload.status || (payload.isActive ? 'ACTIVE' : '')),
      payload: { ...payload, ...row },
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  public onLiveChange(callback: LiveChangeCallback): () => void {
    this.changeListeners.add(callback);
    return () => this.changeListeners.delete(callback);
  }

  public onStatusChange(callback: (connected: boolean, msg?: string) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.isConnected, this.statusMessage);
    return () => this.statusListeners.delete(callback);
  }

  public async fetchTable(key: TableKey, forceRefresh = false): Promise<SupabaseRow[]> {
    if (!forceRefresh && this.tableCache.has(key)) {
      return this.tableCache.get(key)!;
    }

    const config = TABLE_CONFIGS[key];
    if (!config) return [];

    try {
      const { data, error } = await supabase
        .from(config.tableName)
        .select('*')
        .order('chainage_km', { ascending: true, nullsFirst: false })
        .limit(2500);

      if (error) {
        console.error(`Error fetching ${config.tableName}:`, error.message);
        return [];
      }

      const formatted = (data || []).map(r => this.formatRecord(r));
      this.tableCache.set(key, formatted);
      this.countsCache[config.tableName] = formatted.length;
      return formatted;
    } catch (err) {
      console.error(`Network error on ${key}:`, err);
      return [];
    }
  }

  public async upsertRow(key: TableKey, row: Partial<SupabaseRow>): Promise<{ success: boolean; error?: string }> {
    const config = TABLE_CONFIGS[key];
    if (!config) return { success: false, error: 'Invalid table' };

    try {
      const payloadData = row.payload || {};
      const record = {
        id: String(row.id || `${config.key}_${Date.now()}`),
        name: String(row.name || ''),
        code: String(row.code || ''),
        category: String(row.category || ''),
        section: String(row.section || ''),
        station: String(row.station || ''),
        chainage_km: row.chainage_km !== null && row.chainage_km !== undefined ? Number(row.chainage_km) : null,
        status: String(row.status || 'ACTIVE'),
        payload: { ...payloadData, id: row.id, name: row.name, code: row.code, category: row.category },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from(config.tableName).upsert(record, { onConflict: 'id' });
      if (error) throw error;

      // Update cache
      const cached = this.tableCache.get(key) || [];
      const updatedList = [record, ...cached.filter(c => c.id !== record.id)];
      this.tableCache.set(key, updatedList);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to save record' };
    }
  }

  public async deleteRow(key: TableKey, id: string): Promise<{ success: boolean; error?: string }> {
    const config = TABLE_CONFIGS[key];
    if (!config) return { success: false, error: 'Invalid table' };

    try {
      const { error } = await supabase.from(config.tableName).delete().eq('id', id);
      if (error) throw error;

      // Update cache
      const cached = this.tableCache.get(key) || [];
      this.tableCache.set(key, cached.filter(c => c.id !== id));

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to delete record' };
    }
  }

  public async refreshCounts(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    await Promise.all(
      Object.values(TABLE_CONFIGS).map(async cfg => {
        try {
          const { count } = await supabase
            .from(cfg.tableName)
            .select('*', { count: 'exact', head: true });
          if (typeof count === 'number') {
            results[cfg.tableName] = count;
          }
        } catch {
          // ignore
        }
      })
    );
    this.countsCache = results;
    return results;
  }

  public getCounts(): Record<string, number> {
    return { ...this.countsCache };
  }
}

export const dbEngine = new SupabaseDataEngine();

/**
 * Supabase Real-Time Client & Dual-Tier Synchronization Service
 *
 * Provides direct integration with Supabase PostgreSQL tables:
 * - Live real-time channel subscriptions via WebSockets (Postgres Changes)
 * - Automatic background pulling & bi-directional sync
 * - Payload unpacking (preserves rich JSONB attributes & railway metadata)
 * - Diagnostic connection monitoring and table statistics
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { CollectionName } from '../types/index.ts';

// Default Supabase Project Configuration (fallback to environment variables)
export const DEFAULT_SUPABASE_URL = 'https://elnvsjeahxjqqtrfytgs.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_E670CYfKDgkTOZY3B6ouww_hQi6Z4sN';

export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;

// Mapping between Local Collection Names and Supabase PostgreSQL Table Names
export const COLLECTION_TO_SUPABASE_TABLE: Partial<Record<CollectionName, string>> = {
  bridges: 'dfc_bridges',
  points_crossings: 'dfc_points_crossings',
  curves: 'dfc_curves',
  level_crossings: 'dfc_level_crossings',
  track_defects: 'dfc_track_defects',
  officers_staff: 'dfc_officers_staff',
  store_items: 'dfc_store_items',
  store_transactions: 'dfc_store_transactions',
  store_inventory: 'dfc_store_inventory',
  store_categories: 'dfc_store_categories',
  patrol_shifts: 'dfc_patrol_shifts',
  keymen: 'dfc_keymen',
  lwr: 'dfc_lwr',
  sej: 'dfc_sej',
  jurisdiction: 'dfc_jurisdiction',
  users: 'dfc_users',
  bridge_watchmen: 'dfc_bridge_watchmen',
  stations: 'dfc_stations',
  staff_attendance: 'dfc_staff_attendance',
  attendance_holidays: 'dfc_attendance_holidays',
  pway_daily_progress: 'dfc_pway_daily_progress',
  pway_monthly_program: 'dfc_pway_monthly_program',
  pway_week_program: 'dfc_pway_week_program',
  pway_inspections: 'dfc_pway_inspections',
  gang_work_types: 'dfc_gang_work_types'
};

export const SUPABASE_TABLE_TO_COLLECTION: Record<string, CollectionName> = Object.entries(
  COLLECTION_TO_SUPABASE_TABLE
).reduce((acc, [col, tbl]) => {
  if (tbl) {
    acc[tbl] = col as CollectionName;
  }
  return acc;
}, {} as Record<string, CollectionName>);

export type SupabaseConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';

export interface SupabaseSyncEvent {
  table: string;
  collection: CollectionName | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  record: any;
  timestamp: string;
}

export type SupabaseChangeCallback = (event: SupabaseSyncEvent) => void;

class SupabaseSyncService {
  private client: SupabaseClient | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private listeners: Set<SupabaseChangeCallback> = new Set();
  private statusListeners: Set<(status: SupabaseConnectionStatus, msg?: string) => void> = new Set();
  private connectionStatus: SupabaseConnectionStatus = 'CONNECTING';
  private statusMessage: string = 'Initializing Supabase connection...';
  private lastSyncedAt: string | null = null;
  private tableCounts: Record<string, number> = {};

  constructor() {
    this.initClient();
  }

  /**
   * Initializes Supabase Client & Real-Time Listener
   */
  public initClient(customUrl?: string, customKey?: string): void {
    const url = customUrl || SUPABASE_URL;
    const key = customKey || SUPABASE_ANON_KEY;

    if (!url || !key) {
      this.setStatus('ERROR', 'Missing Supabase URL or Anon Key');
      return;
    }

    try {
      this.client = createClient(url, key, {
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

      this.setStatus('CONNECTING', 'Connecting to Supabase...');
      this.setupRealtimeSubscription();
    } catch (err: any) {
      console.error('Supabase Client initialization error:', err);
      this.setStatus('ERROR', err?.message || 'Failed to initialize Supabase client');
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public getStatus(): { status: SupabaseConnectionStatus; message: string; lastSyncedAt: string | null } {
    return {
      status: this.connectionStatus,
      message: this.statusMessage,
      lastSyncedAt: this.lastSyncedAt
    };
  }

  public getTableCounts(): Record<string, number> {
    return { ...this.tableCounts };
  }

  private setStatus(status: SupabaseConnectionStatus, message?: string): void {
    this.connectionStatus = status;
    if (message) this.statusMessage = message;
    this.statusListeners.forEach(fn => fn(this.connectionStatus, this.statusMessage));
  }

  public onStatusChange(callback: (status: SupabaseConnectionStatus, msg?: string) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.connectionStatus, this.statusMessage);
    return () => this.statusListeners.delete(callback);
  }

  public onDataChange(callback: SupabaseChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(event: SupabaseSyncEvent): void {
    this.lastSyncedAt = new Date().toLocaleTimeString();
    this.listeners.forEach(fn => {
      try {
        fn(event);
      } catch (err) {
        console.error('Error in Supabase data change listener:', err);
      }
    });
  }

  /**
   * Subscribes to PostgreSQL Change Data Capture (CDC) events across all dfc_* tables
   */
  private setupRealtimeSubscription(): void {
    if (!this.client) return;

    try {
      if (this.realtimeChannel) {
        this.client.removeChannel(this.realtimeChannel);
      }

      this.realtimeChannel = this.client
        .channel('public:db-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public'
          },
          (payload: any) => {
            const table = payload.table;
            const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            const rawRecord = payload.new && Object.keys(payload.new).length > 0 ? payload.new : payload.old;
            const unpackedDoc = this.unpackRecord(rawRecord);
            const collection = SUPABASE_TABLE_TO_COLLECTION[table] || null;

            console.log(`[Supabase Realtime] ${eventType} on ${table}:`, unpackedDoc);

            this.notifyListeners({
              table,
              collection,
              eventType,
              record: unpackedDoc,
              timestamp: new Date().toISOString()
            });
          }
        )
        .subscribe((status: string, err?: any) => {
          if (status === 'SUBSCRIBED') {
            this.setStatus('CONNECTED', 'Live Supabase real-time channel active');
            console.log('✅ Supabase Realtime channel connected successfully');
            this.refreshTableStatistics().catch(console.warn);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.setStatus('DISCONNECTED', `Realtime channel disconnected: ${err?.message || status}`);
          }
        });
    } catch (e: any) {
      console.warn('Realtime subscription setup error:', e);
      this.setStatus('ERROR', e?.message || 'Realtime subscription error');
    }
  }

  /**
   * Unpacks a Supabase row into standard app entity format.
   * If payload JSONB exists, it merges payload attributes with root columns.
   */
  public unpackRecord(row: any): any {
    if (!row) return null;

    let merged: any = {};
    if (row.payload && typeof row.payload === 'object') {
      merged = { ...row.payload };
    }

    // Overlay root columns if present
    if (row.id !== undefined) merged.id = row.id;
    if (row.name !== undefined && !merged.name) merged.name = row.name;
    if (row.code !== undefined && !merged.code) merged.code = row.code;
    if (row.category !== undefined && !merged.category) merged.category = row.category;
    if (row.section !== undefined && !merged.section) merged.section = row.section;
    if (row.station !== undefined && !merged.station) merged.station = row.station;
    if (row.chainage_km !== undefined && row.chainage_km !== null) {
      merged.chainage_km = Number(row.chainage_km);
      if (merged.km === undefined) merged.km = merged.chainage_km;
      if (merged.chainage === undefined) merged.chainage = merged.chainage_km;
    }
    if (row.status !== undefined && !merged.status) merged.status = row.status;
    if (row.created_at !== undefined) merged.createdAt = row.created_at;
    if (row.updated_at !== undefined) merged.updatedAt = row.updated_at;

    return merged;
  }

  /**
   * Serializes a document into Supabase row structure
   */
  public packRecord(doc: any): any {
    const id = doc.id || doc.userId || doc.code || doc.itemCode || doc.bridgeNo || doc.gateNo || doc.pointNo || String(Date.now());
    const name = doc.name || doc.itemName || doc.officerName || doc.designation || doc.description || doc.title || '';
    const code = doc.code || doc.itemCode || doc.sapMaterial || doc.bridgeNo || doc.curveNo || doc.pointNo || doc.gateNo || doc.userId || '';
    const category = doc.category || doc.type || doc.role || doc.department || doc.dutyType || '';
    const section = doc.section || doc.sectionCode || doc.blockSection || doc.unit || '';
    const station = doc.station || doc.stationName || '';

    let km: number | null = null;
    if (typeof doc.chainage === 'number') km = doc.chainage;
    else if (typeof doc.km === 'number') km = doc.km;
    else if (typeof doc.startKm === 'number') km = doc.startKm;
    else if (typeof doc.fromKm === 'number') km = doc.fromKm;
    else if (typeof doc.chainage_km === 'number') km = doc.chainage_km;
    else if (typeof doc.chainage === 'string') {
      const num = parseFloat(doc.chainage.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) km = num;
    }

    const status = doc.status || (doc.isActive ? 'ACTIVE' : (doc.isActive === false ? 'INACTIVE' : ''));

    return {
      id: String(id),
      name: String(name),
      code: String(code),
      category: String(category),
      section: String(section),
      station: String(station),
      chainage_km: km,
      status: String(status),
      payload: doc,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Fetch all records for a collection directly from Supabase
   */
  public async fetchCollection<T = any>(collection: CollectionName): Promise<T[]> {
    if (!this.client) return [];

    const tableName = COLLECTION_TO_SUPABASE_TABLE[collection];
    if (!tableName) return [];

    try {
      const { data, error } = await this.client
        .from(tableName)
        .select('*')
        .order('id', { ascending: true })
        .limit(2000);

      if (error) {
        console.warn(`Supabase fetch error for ${tableName}:`, error.message);
        return [];
      }

      if (Array.isArray(data)) {
        this.tableCounts[tableName] = data.length;
        return data.map(r => this.unpackRecord(r)) as T[];
      }

      return [];
    } catch (e: any) {
      console.warn(`Supabase network error for ${collection}:`, e);
      return [];
    }
  }

  /**
   * Upsert a document into Supabase
   */
  public async upsertDocument(collection: CollectionName, doc: any): Promise<boolean> {
    if (!this.client) return false;

    const tableName = COLLECTION_TO_SUPABASE_TABLE[collection];
    if (!tableName) return false;

    try {
      const row = this.packRecord(doc);
      const { error } = await this.client.from(tableName).upsert(row, { onConflict: 'id' });

      if (error) {
        console.error(`Supabase upsert error in ${tableName}:`, error.message);
        return false;
      }

      this.lastSyncedAt = new Date().toLocaleTimeString();
      return true;
    } catch (e) {
      console.error(`Supabase write error for ${collection}:`, e);
      return false;
    }
  }

  /**
   * Delete a document from Supabase
   */
  public async deleteDocument(collection: CollectionName, id: string): Promise<boolean> {
    if (!this.client) return false;

    const tableName = COLLECTION_TO_SUPABASE_TABLE[collection];
    if (!tableName) return false;

    try {
      const { error } = await this.client.from(tableName).delete().eq('id', id);

      if (error) {
        console.error(`Supabase delete error in ${tableName}:`, error.message);
        return false;
      }

      this.lastSyncedAt = new Date().toLocaleTimeString();
      return true;
    } catch (e) {
      console.error(`Supabase delete error for ${collection}:`, e);
      return false;
    }
  }

  /**
   * Bulk Sync / Upsert a whole collection to Supabase
   */
  public async syncCollection(collection: CollectionName, docs: any[]): Promise<{ count: number }> {
    if (!this.client || !docs || docs.length === 0) return { count: 0 };

    const tableName = COLLECTION_TO_SUPABASE_TABLE[collection];
    if (!tableName) return { count: 0 };

    try {
      const rows = docs.map(doc => this.packRecord(doc));
      // Upsert in batches of 50
      const batchSize = 50;
      let total = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await this.client.from(tableName).upsert(batch, { onConflict: 'id' });
        if (error) {
          console.error(`Supabase batch upsert error in ${tableName}:`, error.message);
        } else {
          total += batch.length;
        }
      }

      this.lastSyncedAt = new Date().toLocaleTimeString();
      return { count: total };
    } catch (e) {
      console.error(`Supabase batch sync error for ${collection}:`, e);
      return { count: 0 };
    }
  }

  /**
   * Refresh record counts across all core tables
   */
  public async refreshTableStatistics(): Promise<Record<string, number>> {
    if (!this.client) return {};

    const tables = Object.values(COLLECTION_TO_SUPABASE_TABLE).filter(Boolean) as string[];
    const results: Record<string, number> = {};

    await Promise.all(
      tables.map(async tbl => {
        try {
          const { count, error } = await this.client!
            .from(tbl)
            .select('*', { count: 'exact', head: true });

          if (!error && typeof count === 'number') {
            results[tbl] = count;
          }
        } catch {
          // ignore individual table head errors
        }
      })
    );

    this.tableCounts = results;
    this.setStatus('CONNECTED', `Live Supabase Connected (${Object.values(results).reduce((a, b) => a + b, 0)} items indexed)`);
    return results;
  }
}

export const supabaseService = new SupabaseSyncService();

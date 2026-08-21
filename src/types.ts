export interface SupabaseRow {
  id: string;
  name: string;
  code: string;
  category: string;
  section: string;
  station: string;
  chainage_km: number | null;
  status: string;
  payload: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export type TableKey =
  | 'bridges'
  | 'level_crossings'
  | 'points_crossings'
  | 'curves'
  | 'officers_staff'
  | 'store_items'
  | 'track_defects'
  | 'keymen'
  | 'patrol_shifts'
  | 'lwr'
  | 'sej'
  | 'users'
  | 'jurisdiction';

export interface TableConfig {
  key: TableKey;
  tableName: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  columns: { key: string; label: string; width?: string; isTag?: boolean }[];
}

export const TABLE_CONFIGS: Record<TableKey, TableConfig> = {
  bridges: {
    key: 'bridges',
    tableName: 'dfc_bridges',
    label: 'Bridges & Culverts',
    icon: '🌉',
    description: 'Major/Minor Bridges, RUBs, ROBs & FOBs along WDFC corridor',
    color: '#6366f1',
    columns: [
      { key: 'code', label: 'Bridge No.', width: 'w-28' },
      { key: 'category', label: 'Type', width: 'w-24', isTag: true },
      { key: 'chainage_km', label: 'Km Location', width: 'w-28' },
      { key: 'section', label: 'Section', width: 'w-28' },
      { key: 'name', label: 'Span & Structure' },
      { key: 'status', label: 'Status', width: 'w-24', isTag: true }
    ]
  },
  level_crossings: {
    key: 'level_crossings',
    tableName: 'dfc_level_crossings',
    label: 'Level Crossings (LC Gates)',
    icon: '🚧',
    description: 'Manned/Interlocked LC Gates, TVU census & Gatemen assignments',
    color: '#ec4899',
    columns: [
      { key: 'code', label: 'Gate No.', width: 'w-28' },
      { key: 'category', label: 'Class', width: 'w-24', isTag: true },
      { key: 'chainage_km', label: 'Km Location', width: 'w-28' },
      { key: 'section', label: 'Section', width: 'w-28' },
      { key: 'name', label: 'Road & Location' },
      { key: 'status', label: 'Status', width: 'w-24', isTag: true }
    ]
  },
  points_crossings: {
    key: 'points_crossings',
    tableName: 'dfc_points_crossings',
    label: 'Points & Crossings',
    icon: '🔀',
    description: 'Station Turnouts, Switch Layouts, Point Nos & Angles',
    color: '#06b6d4',
    columns: [
      { key: 'code', label: 'Point No.', width: 'w-28' },
      { key: 'station', label: 'Station', width: 'w-24', isTag: true },
      { key: 'chainage_km', label: 'Km Location', width: 'w-28' },
      { key: 'category', label: 'Angle / Type', width: 'w-28', isTag: true },
      { key: 'name', label: 'Track / Line Info' },
      { key: 'status', label: 'Status', width: 'w-24', isTag: true }
    ]
  },
  curves: {
    key: 'curves',
    tableName: 'dfc_curves',
    label: 'Curves & Transitions',
    icon: '📐',
    description: 'Horizontal track curves, degree, radius & cant (SE)',
    color: '#8b5cf6',
    columns: [
      { key: 'code', label: 'Curve No.', width: 'w-28' },
      { key: 'chainage_km', label: 'From Km', width: 'w-28' },
      { key: 'category', label: 'Degree / Radius', width: 'w-32', isTag: true },
      { key: 'section', label: 'Section / Yard', width: 'w-32' },
      { key: 'name', label: 'Cant & Specifications' },
      { key: 'status', label: 'Status', width: 'w-24', isTag: true }
    ]
  },
  officers_staff: {
    key: 'officers_staff',
    tableName: 'dfc_officers_staff',
    label: 'Officers & Personnel',
    icon: '👥',
    description: 'DFCCIL Officers, Engineers, Supervisors & Outsourced Staff',
    color: '#10b981',
    columns: [
      { key: 'name', label: 'Staff Name' },
      { key: 'code', label: 'Emp / AWPO ID', width: 'w-32' },
      { key: 'category', label: 'Designation / Role', width: 'w-36', isTag: true },
      { key: 'section', label: 'Duty Unit / Station', width: 'w-32' },
      { key: 'status', label: 'Status', width: 'w-24', isTag: true }
    ]
  },
  store_items: {
    key: 'store_items',
    tableName: 'dfc_store_items',
    label: 'IMSD Store & Inventory',
    icon: '📦',
    description: 'Track materials, P-Way fittings, tools, plant & spares ledger',
    color: '#f59e0b',
    columns: [
      { key: 'code', label: 'Material Code', width: 'w-32' },
      { key: 'name', label: 'Item Description' },
      { key: 'category', label: 'Category', width: 'w-32', isTag: true },
      { key: 'station', label: 'Store Location', width: 'w-28' },
      { key: 'status', label: 'Stock Status', width: 'w-28', isTag: true }
    ]
  },
  track_defects: {
    key: 'track_defects',
    tableName: 'dfc_track_defects',
    label: 'Track Defects & DFWO',
    icon: '⚠️',
    description: 'Ultrasonic (USFD) flaws, weld defects, joint gaps & restrictions',
    color: '#ef4444',
    columns: [
      { key: 'code', label: 'Defect Code', width: 'w-28' },
      { key: 'category', label: 'Severity', width: 'w-24', isTag: true },
      { key: 'chainage_km', label: 'Km Location', width: 'w-28' },
      { key: 'section', label: 'Section', width: 'w-28' },
      { key: 'name', label: 'Defect Details & Action' },
      { key: 'status', label: 'Lifecycle', width: 'w-28', isTag: true }
    ]
  },
  keymen: {
    key: 'keymen',
    tableName: 'dfc_keymen',
    label: 'Keymen Roster & Beats',
    icon: '🛡️',
    description: 'Daily keymen patrolling beats, jurisdiction and contact details',
    color: '#14b8a6',
    columns: [
      { key: 'code', label: 'Beat No.', width: 'w-28' },
      { key: 'name', label: 'Keyman Name' },
      { key: 'chainage_km', label: 'From Km', width: 'w-28' },
      { key: 'section', label: 'Beat Section', width: 'w-28' },
      { key: 'status', label: 'Duty Status', width: 'w-28', isTag: true }
    ]
  },
  patrol_shifts: {
    key: 'patrol_shifts',
    tableName: 'dfc_patrol_shifts',
    label: 'Patrol Shifts (Hot / Cold)',
    icon: '👮',
    description: 'Track patrolling shifts, hot weather, cold weather & monsoon',
    color: '#3b82f6',
    columns: [
      { key: 'code', label: 'Shift Code', width: 'w-28' },
      { key: 'name', label: 'Patrolman / Gang' },
      { key: 'category', label: 'Shift Type', width: 'w-28', isTag: true },
      { key: 'section', label: 'Patrol Section', width: 'w-28' },
      { key: 'status', label: 'Shift Status', width: 'w-28', isTag: true }
    ]
  },
  lwr: {
    key: 'lwr',
    tableName: 'dfc_lwr',
    label: 'LWR / CWR Registers',
    icon: '📏',
    description: 'Long Welded Rails, destressing history and gap records',
    color: '#a855f7',
    columns: [
      { key: 'code', label: 'LWR No.', width: 'w-28' },
      { key: 'chainage_km', label: 'Start Km', width: 'w-28' },
      { key: 'section', label: 'Section', width: 'w-32' },
      { key: 'name', label: 'LWR Details & Glued Joint' },
      { key: 'status', label: 'Status', width: 'w-24', isTag: true }
    ]
  },
  sej: {
    key: 'sej',
    tableName: 'dfc_sej',
    label: 'SEJ (Switch Expansion Joints)',
    icon: '🔗',
    description: 'SEJ gap measurements, thermal movements and oiling records',
    color: '#f97316',
    columns: [
      { key: 'code', label: 'SEJ No.', width: 'w-28' },
      { key: 'chainage_km', label: 'Chainage Km', width: 'w-28' },
      { key: 'section', label: 'Section', width: 'w-32' },
      { key: 'name', label: 'Drawing No. & Temp' },
      { key: 'status', label: 'Status', width: 'w-24', isTag: true }
    ]
  },
  users: {
    key: 'users',
    tableName: 'dfc_users',
    label: 'System Access Accounts',
    icon: '🔑',
    description: 'Authorized user profiles, role-based access, and PIN credentials',
    color: '#64748b',
    columns: [
      { key: 'name', label: 'User Name' },
      { key: 'code', label: 'User ID / Email', width: 'w-36' },
      { key: 'category', label: 'App Role', width: 'w-32', isTag: true },
      { key: 'section', label: 'Department', width: 'w-32' },
      { key: 'status', label: 'Account Status', width: 'w-28', isTag: true }
    ]
  },
  jurisdiction: {
    key: 'jurisdiction',
    tableName: 'dfc_jurisdiction',
    label: 'Jurisdiction & Sections',
    icon: '🗺️',
    description: 'Track corridor boundaries (Km 1167.210 – 1249.720 + Link Line)',
    color: '#0284c7',
    columns: [
      { key: 'code', label: 'Section Code', width: 'w-32' },
      { key: 'name', label: 'Section Description' },
      { key: 'chainage_km', label: 'Start Km', width: 'w-28' },
      { key: 'category', label: 'Jurisdiction Unit', width: 'w-32', isTag: true }
    ]
  }
};

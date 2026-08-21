/**
 * Beat Routes Master Definition for DFCCIL IMSD SMUN Unit
 * Covers:
 * - 12 Day Security Patrol Beats (SPD-01 to SPD-12)
 * - 12 Night Security Patrol Beats (SPN-01 to SPN-12)
 */

export interface BeatRouteInfo {
  fromKm: number;
  toKm: number;
  section: string;
  shiftHoursDay: string;
  shiftHoursNight: string;
}

export const DEFAULT_BEAT_ROUTES: Record<string, BeatRouteInfo> = {
  'SPD-01': { fromKm: 1162.170, toKm: 1170.160, section: 'B 1162/17 to C 1170/16', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-02': { fromKm: 1170.160, toKm: 1178.120, section: 'B 1170/16 to C 1178/12', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-03': { fromKm: 1178.120, toKm: 1186.090, section: 'B 1178/12 to C 1186/9', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-04': { fromKm: 1186.090, toKm: 1194.070, section: 'B 1186/9 to C 1194/7', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-05': { fromKm: 1194.070, toKm: 1202.060, section: 'B 1194/7 to C 1202/6', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-06': { fromKm: 1202.060, toKm: 1210.050, section: 'B 1202/6 to C 1210/5', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-07': { fromKm: 1210.050, toKm: 1218.020, section: 'B 1210/5 to C 1218/2', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-08': { fromKm: 1218.020, toKm: 1226.010, section: 'B 1218/2 to C 1226/1', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-09': { fromKm: 1226.010, toKm: 1233.160, section: 'B 1226/1 to C 1233/16', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-10': { fromKm: 1233.160, toKm: 1241.150, section: 'B 1233/16 to C 1241/15', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-11': { fromKm: 1241.150, toKm: 1249.150, section: 'B 1241/15 to C 1249/15', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-12': { fromKm: 1170.090, toKm: 1178.040, section: 'B 1170/9 to C 1178/4', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-01': { fromKm: 1162.170, toKm: 1170.160, section: 'B 1162/17 to C 1170/16', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-02': { fromKm: 1170.160, toKm: 1178.120, section: 'B 1170/16 to C 1178/12', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-03': { fromKm: 1178.120, toKm: 1186.090, section: 'B 1178/12 to C 1186/9', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-04': { fromKm: 1186.090, toKm: 1194.070, section: 'B 1186/9 to C 1194/7', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-05': { fromKm: 1194.070, toKm: 1202.060, section: 'B 1194/7 to C 1202/6', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-06': { fromKm: 1202.060, toKm: 1210.050, section: 'B 1202/6 to C 1210/5', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-07': { fromKm: 1210.050, toKm: 1218.020, section: 'B 1210/5 to C 1218/2', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-08': { fromKm: 1218.020, toKm: 1226.010, section: 'B 1218/2 to C 1226/1', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-09': { fromKm: 1226.010, toKm: 1233.160, section: 'B 1226/1 to C 1233/16', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-10': { fromKm: 1233.160, toKm: 1241.150, section: 'B 1233/16 to C 1241/15', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-11': { fromKm: 1241.150, toKm: 1249.150, section: 'B 1241/15 to C 1249/15', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-12': { fromKm: 1170.090, toKm: 1178.040, section: 'B 1170/9 to C 1178/4', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' }
};

/**
 * Resolves exact fromKm and toKm for any patrol shift record
 */
export function getPatrolShiftBounds(p: { beatCode?: string | null; id?: string | null; shiftType?: string | null; fromKm?: number; toKm?: number }): { fromKm: number; toKm: number; section: string; shiftHours: string } {
  const code = (p.beatCode || p.id || '').toUpperCase().trim();
  const numMatch = code.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 0;
  const isNight = p.shiftType === 'NIGHT' || code.includes('NIGHT') || code.includes('SPN');
  const normalizedKey = num > 0 ? `${isNight ? 'SPN' : 'SPD'}-${String(num).padStart(2, '0')}` : code;

  if (DEFAULT_BEAT_ROUTES[normalizedKey]) {
    const route = DEFAULT_BEAT_ROUTES[normalizedKey];
    return {
      fromKm: route.fromKm,
      toKm: route.toKm,
      section: route.section,
      shiftHours: isNight ? route.shiftHoursNight : route.shiftHoursDay
    };
  }

  if (DEFAULT_BEAT_ROUTES[code]) {
    const route = DEFAULT_BEAT_ROUTES[code];
    return {
      fromKm: route.fromKm,
      toKm: route.toKm,
      section: route.section,
      shiftHours: isNight ? route.shiftHoursNight : route.shiftHoursDay
    };
  }

  // Fallback: If numbers are valid Km
  const f = typeof p.fromKm === 'number' ? p.fromKm : parseFloat(String(p.fromKm || 0));
  const t = typeof p.toKm === 'number' ? p.toKm : parseFloat(String(p.toKm || 0));

  if (f > 1000 && t > 1000) {
    return {
      fromKm: Math.min(f, t),
      toKm: Math.max(f, t),
      section: `Km ${f.toFixed(3)} – ${t.toFixed(3)}`,
      shiftHours: isNight ? '23:00 - 07:00' : '15:00 - 23:00'
    };
  }

  if (f > 1000 && t < 100) {
    return {
      fromKm: f,
      toKm: f + 8.0,
      section: `Km ${f.toFixed(3)} – ${(f + 8.0).toFixed(3)}`,
      shiftHours: isNight ? '23:00 - 07:00' : '15:00 - 23:00'
    };
  }

  return {
    fromKm: f || 1167.210,
    toKm: t || 1249.720,
    section: 'IMSD SMUN Section',
    shiftHours: isNight ? '23:00 - 07:00' : '15:00 - 23:00'
  };
}

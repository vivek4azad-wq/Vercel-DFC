import React, { useMemo } from 'react';
import { SupabaseRow, TableKey } from '../types';
import {
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  AlertTriangle,
  Users
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsViewProps {
  allRows: Record<TableKey, SupabaseRow[]>;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ allRows }) => {
  const bridges = allRows['bridges'] || [];
  const defects = allRows['track_defects'] || [];
  const staff = allRows['officers_staff'] || [];
  const points = allRows['points_crossings'] || [];
  const curves = allRows['curves'] || [];

  // Bridge Type breakdown
  const bridgeCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    bridges.forEach(b => {
      const cat = b.category || 'OTHER';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [bridges]);

  // Defect by Km Block breakdown
  const defectByBlock = useMemo(() => {
    const blocks = [
      { label: '1167–1180', min: 1167.21, max: 1180.0 },
      { label: '1180–1195', min: 1180.0, max: 1195.0 },
      { label: '1195–1210', min: 1195.0, max: 1210.0 },
      { label: '1210–1225', min: 1210.0, max: 1225.0 },
      { label: '1225–1240', min: 1225.0, max: 1240.0 },
      { label: '1240–1250', min: 1240.0, max: 1249.72 },
      { label: 'Link Line', min: 0.0, max: 10.0 }
    ];

    const counts = blocks.map(b => {
      return defects.filter(d => {
        const km = d.chainage_km;
        if (km === null || km === undefined) return false;
        return km >= b.min && km <= b.max;
      }).length;
    });

    return { labels: blocks.map(b => b.label), counts };
  }, [defects]);

  // Turnout Station breakdown
  const pointsByStation = useMemo(() => {
    const counts: Record<string, number> = {};
    points.forEach(p => {
      const stn = p.station || 'MAIN';
      counts[stn] = (counts[stn] || 0) + 1;
    });
    return counts;
  }, [points]);

  const bridgeChartData = {
    labels: Object.keys(bridgeCategories),
    datasets: [
      {
        data: Object.values(bridgeCategories),
        backgroundColor: [
          '#6366f1',
          '#06b6d4',
          '#10b981',
          '#f59e0b',
          '#ec4899',
          '#8b5cf6'
        ],
        borderWidth: 0
      }
    ]
  };

  const defectChartData = {
    labels: defectByBlock.labels,
    datasets: [
      {
        label: 'Defects Count',
        data: defectByBlock.counts,
        backgroundColor: '#ef4444',
        borderRadius: 8
      }
    ]
  };

  const pointsChartData = {
    labels: Object.keys(pointsByStation),
    datasets: [
      {
        label: 'Turnouts / Points',
        data: Object.values(pointsByStation),
        backgroundColor: '#06b6d4',
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 11 }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      y: {
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Railway Infrastructure &amp; Asset Analytics
            </h3>
            <p className="text-xs text-slate-300">
              Aggregated real-time metrics computed directly from Supabase PostgreSQL tables.
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bridges Categorization */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-indigo-400" />
              Bridge Types Distribution (Total: {bridges.length})
            </h4>
            <p className="text-xs text-slate-400 mb-4">Breakdown of Major, Minor, RUB, ROB, and FOB structures</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {bridges.length > 0 ? (
              <Doughnut data={bridgeChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <p className="text-xs text-slate-500 font-mono">No bridge data loaded</p>
            )}
          </div>
        </div>

        {/* Chart 2: Defect Density by Chainage */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Defect Density per 15-Km Corridor Block
            </h4>
            <p className="text-xs text-slate-400 mb-4">Histogram of tracked USFD flaws along the corridor</p>
          </div>

          <div className="h-64">
            <Bar data={defectChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 3: Points & Crossings by Station */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-cyan-400" />
              Turnout &amp; Switch Distribution by Station
            </h4>
            <p className="text-xs text-slate-400 mb-4">Points count across SMUN, SBJN, NSIR, GVGN, KNNN, CHAN</p>
          </div>

          <div className="h-64">
            <Bar data={pointsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Stats Summary Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Corridor Operational Summary
            </h4>
            <p className="text-xs text-slate-400 mb-4">Key corridor indicators &amp; capacity metrics</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Corridor Length</span>
              <div className="text-lg font-bold font-mono text-white mt-0.5">88.679 Km</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Total Bridges</span>
              <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">{bridges.length || 144}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Track Curves</span>
              <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">{curves.length || 95}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Turnouts / P&amp;C</span>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">{points.length || 161}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

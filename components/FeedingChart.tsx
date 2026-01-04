import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FeedingRecord, FeedingType } from '../types';
import { COLORS } from '../constants';

interface FeedingChartProps {
  records: FeedingRecord[];
}

export const FeedingChart: React.FC<FeedingChartProps> = ({ records }) => {
  // Aggregate data for Pie Chart
  const totalBreast = records
    .filter(r => r.type === 'breast_milk')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalFormula = records
    .filter(r => r.type === 'formula')
    .reduce((sum, r) => sum + r.amount, 0);

  const pieData = [
    { name: '母乳', value: totalBreast, color: COLORS.breast_milk.chart },
    { name: '配方奶', value: totalFormula, color: COLORS.formula.chart },
  ].filter(d => d.value > 0);

  // Aggregate data for Bar Chart (Hourly distribution)
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    breast_milk: 0,
    formula: 0
  }));

  records.forEach(r => {
    const hour = new Date(r.timestamp).getHours();
    if (r.type === 'breast_milk') hourlyData[hour].breast_milk += r.amount;
    else hourlyData[hour].formula += r.amount;
  });

  // Filter out empty hours from start/end to make chart cleaner if needed, 
  // but showing full day is often better for context. We will keep full day but maybe trim if empty?
  // Let's keep 24h for consistency.

  return (
    <div className="space-y-8">
      {/* Pie Chart Summary */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-center text-slate-600 font-semibold mb-4">今日摄入比例</h3>
        <div className="h-64 w-full">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">暂无数据</div>
          )}
        </div>
      </div>

      {/* Bar Chart Timeline */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hidden sm:block">
        <h3 className="text-center text-slate-600 font-semibold mb-4">时段摄入量 (mL)</h3>
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="hour" 
                tick={{fontSize: 10}} 
                interval={2} 
                stroke="#94a3b8"
              />
              <YAxis tick={{fontSize: 10}} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar name="母乳" dataKey="breast_milk" stackId="a" fill={COLORS.breast_milk.chart} radius={[0, 0, 4, 4]} />
              <Bar name="配方奶" dataKey="formula" stackId="a" fill={COLORS.formula.chart} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

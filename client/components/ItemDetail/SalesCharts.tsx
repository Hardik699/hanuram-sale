import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import { useState } from "react";

interface MonthlyData {
  month: string;
  zomatoQty: number;
  swiggyQty: number;
  diningQty: number;
  parcelQty: number;
  zomatoVariations?: { [name: string]: number };
  swiggyVariations?: { [name: string]: number };
  diningVariations?: { [name: string]: number };
  parcelVariations?: { [name: string]: number };
  totalQty: number;
}

interface DateWiseData {
  date: string;
  zomatoQty: number;
  swiggyQty: number;
  diningQty: number;
  parcelQty: number;
  totalQty: number;
}

interface SalesChartsProps {
  monthlyData: MonthlyData[];
  dateWiseData?: DateWiseData[];
  restaurantSales?: { [key: string]: number };
  selectedYear?: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Custom monthly tooltip with dark theme and breakdown
const CustomMonthlyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as MonthlyData;
    const monthLabel = data.month.includes('-') ? MONTH_NAMES[parseInt(data.month.split('-')[1]) - 1] : data.month;

    return (
      <div className="bg-[#0b0e14] border border-[#1f2937] rounded-xl shadow-2xl p-4 min-w-[220px] backdrop-blur-sm">
        <p className="font-black text-gray-200 mb-3 text-sm border-b border-[#1f2937] pb-2 flex items-center gap-2 uppercase tracking-widest">
          📅 {monthLabel}
        </p>

        <div className="space-y-4">
          {[
            { key: 'zomato', name: 'Zomato', color: '#a78bfa', qty: data.zomatoQty, variations: data.zomatoVariations },
            { key: 'swiggy', name: 'Swiggy', color: '#f97316', qty: data.swiggyQty, variations: data.swiggyVariations },
            { key: 'dining', name: 'Dining', color: '#3b82f6', qty: data.diningQty, variations: data.diningVariations },
            { key: 'parcel', name: 'Parcel', color: '#10b981', qty: data.parcelQty, variations: data.parcelVariations },
          ].map((area) => (
            area.qty > 0 && (
              <div key={area.key} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs" style={{ color: area.color }}>{area.name}</span>
                  <span className="font-black text-xs text-white">{area.qty.toLocaleString()}</span>
                </div>
                {area.variations && Object.keys(area.variations).length > 0 && (
                  <div className="pl-3 border-l border-[#1f2937] space-y-0.5">
                    {Object.entries(area.variations).map(([name, val]) => (
                      <div key={name} className="flex justify-between text-[10px] text-gray-400 font-medium">
                        <span className="truncate max-w-[140px] opacity-70">{name}</span>
                        <span className="text-gray-300">{val.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-[#1f2937] flex justify-between items-center">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Monthly Qty</span>
          <span className="text-base font-black text-orange-400">{data.totalQty.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip for daily chart (dark theme)
const CustomDailyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as DateWiseData;
    return (
      <div className="bg-[#0b0e14] border border-[#1f2937] rounded-lg shadow-2xl p-4 min-w-[160px]">
        <p className="text-[#9ca3af] font-medium text-xs mb-3 border-b border-[#1f2937] pb-2">
          {data.date}
        </p>
        <div className="space-y-3">
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm font-bold text-[#f59e0b]">Daily Sales</span>
            <span className="text-sm font-black text-white">{data.totalQty.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm font-bold text-[#a78bfa]">Zomato Trend</span>
            <span className="text-sm font-black text-white">{data.zomatoQty.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function SalesCharts({ monthlyData, dateWiseData, restaurantSales = {}, selectedYear }: SalesChartsProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const selectedChannels = {
    zomato: true,
    swiggy: true,
    dining: true,
    parcel: true,
  };

  // Create data for all 12 months (fill missing months with 0)
  const allMonthsData = MONTH_NAMES.map((monthName, index) => {
    const monthNum = (index + 1).toString().padStart(2, '0');

    // The server sends month as "YYYY-MM" (e.g., "2025-01")
    // If selectedYear is not provided, we might have multiple years, but
    // the current implementation focuses on one year at a time.
    const found = monthlyData.find(d => {
      // Check if it's already a month name (for backward compatibility if server changes)
      if (d.month === monthName) return true;

      // Check if it's in YYYY-MM format
      if (d.month.includes('-')) {
        const parts = d.month.split('-');
        return parts[1] === monthNum;
      }

      return false;
    });

    return {
      month: monthName,
      zomatoQty: found?.zomatoQty || 0,
      swiggyQty: found?.swiggyQty || 0,
      diningQty: found?.diningQty || 0,
      parcelQty: found?.parcelQty || 0,
      zomatoVariations: found?.zomatoVariations || {},
      swiggyVariations: found?.swiggyVariations || {},
      diningVariations: found?.diningVariations || {},
      parcelVariations: found?.parcelVariations || {},
      totalQty: found?.totalQty || 0,
    };
  });

  // Convert restaurantSales object to array for pie chart
  const restaurantData = Object.entries(restaurantSales || {})
    .map(([name, quantity]) => ({ name, value: quantity }))
    .sort((a, b) => b.value - a.value);

  // Filter date-wise data if a month is selected
  const filteredDateWiseData = selectedMonth && dateWiseData
    ? dateWiseData.filter(d => {
        const monthIndex = MONTH_NAMES.indexOf(selectedMonth);
        if (monthIndex === -1) return true;
        const monthStr = (monthIndex + 1).toString().padStart(2, '0');
        return d.date.includes(`-${monthStr}-`);
      })
    : dateWiseData;

  return (
    <div className="space-y-8">
      {/* Monthly Sales Quantity Chart - Styled with requested UI/UX style */}
      <div className="bg-[#0b0e14] rounded-2xl border border-[#1f2937] p-8 shadow-2xl overflow-hidden relative group">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl shadow-lg shadow-orange-500/10">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Monthly Performance Summary
            </h2>
            <p className="text-xs text-gray-500 font-black uppercase tracking-widest mt-1">
              📊 PERIOD ANALYSIS: {selectedYear || 'SELECTED YEAR'}
            </p>
          </div>
        </div>

        <div className="w-full h-[400px] bg-[#0b0e14]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={allMonthsData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  setSelectedMonth(data.activeLabel);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="monthlyBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#4b5563"
                tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#4b5563"
                tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
                label={{ value: 'Qty', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#9ca3af', fontWeight: 700, fontSize: 13 } }}
              />
              <Tooltip
                content={<CustomMonthlyTooltip />}
                cursor={{ fill: "rgba(245, 158, 11, 0.05)" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "40px" }}
                content={({ payload }) => (
                  <div className="flex justify-center items-center gap-8 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-lg shadow-orange-500/20" />
                      <span className="text-sm font-bold text-gray-300">Monthly Sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-lg shadow-purple-500/20" />
                      <span className="text-sm font-bold text-gray-300">Zomato Trend</span>
                    </div>
                  </div>
                )}
              />
              <Bar
                dataKey="totalQty"
                name="Monthly Sales"
                fill="url(#monthlyBarGradient)"
                barSize={45}
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={800}
              />
              <Line
                type="monotone"
                dataKey="zomatoQty"
                name="Zomato Trend"
                stroke="#a78bfa"
                strokeWidth={3}
                dot={{ fill: "#a78bfa", strokeWidth: 2, r: 4, stroke: "#0b0e14" }}
                activeDot={{ r: 6, stroke: "#a78bfa", strokeWidth: 2, fill: "#0b0e14" }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 p-4 bg-gray-900/50 border border-[#1f2937] rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Top Performing Month</p>
              <p className="text-xl font-black text-white mt-1">
                {(() => {
                  const top = [...allMonthsData].sort((a, b) => b.totalQty - a.totalQty)[0];
                  return top?.totalQty > 0 ? `${top.month} (${top.totalQty.toLocaleString()} Qty)` : 'N/A';
                })()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Avg Monthly Sale</p>
              <p className="text-xl font-black text-orange-400 mt-1">
                {(() => {
                  const nonZero = allMonthsData.filter(d => d.totalQty > 0);
                  const avg = nonZero.length > 0 ? nonZero.reduce((s, d) => s + d.totalQty, 0) / nonZero.length : 0;
                  return avg.toFixed(1);
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date-wise Daily Sales Chart - Styled as requested */}
      {dateWiseData && dateWiseData.length > 0 && filteredDateWiseData && filteredDateWiseData.length > 0 && (
        <div className="bg-[#0b0e14] rounded-2xl border border-[#1f2937] p-8 shadow-2xl overflow-hidden relative group">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl shadow-lg shadow-orange-500/10">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Daily Sales Breakdown
                </h2>
                {selectedMonth ? (
                  <p className="text-xs text-orange-400 font-black uppercase tracking-widest mt-1">📅 FILTERED: {selectedMonth}</p>
                ) : (
                  <p className="text-xs text-gray-500 font-black uppercase tracking-widest mt-1">📊 FULL PERIOD ANALYSIS</p>
                )}
              </div>
            </div>
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-orange-400 rounded-lg border border-orange-500/20 text-xs font-black transition-all uppercase tracking-widest flex items-center gap-2"
              >
                ✕ Reset View
              </button>
            )}
          </div>

          <div className="w-full h-[450px] bg-[#0b0e14]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={filteredDateWiseData}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="dailyBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#4b5563"
                  tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={Math.ceil(filteredDateWiseData.length / 15)}
                />
                <YAxis
                  stroke="#4b5563"
                  tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
                  label={{ value: 'Qty', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#9ca3af', fontWeight: 700, fontSize: 13 } }}
                />
                <Tooltip
                  content={<CustomDailyTooltip />}
                  cursor={{ fill: "rgba(245, 158, 11, 0.05)" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "40px" }}
                  content={({ payload }) => (
                    <div className="flex justify-center items-center gap-8 mt-4">
                      {payload?.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex items-center gap-2">
                          <div
                            className={`w-3.5 h-3.5 rounded-full`}
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm font-bold text-gray-300">
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Bar
                  dataKey="totalQty"
                  name="Daily Sales"
                  fill="url(#dailyBarGradient)"
                  barSize={40}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="zomatoQty"
                  name="Zomato Trend"
                  stroke="#a78bfa"
                  strokeWidth={3}
                  dot={{ fill: "#a78bfa", strokeWidth: 2, r: 4, stroke: "#0b0e14" }}
                  activeDot={{ r: 6, stroke: "#a78bfa", strokeWidth: 2, fill: "#0b0e14" }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111827]/50 border border-[#1f2937] p-4 rounded-xl flex items-center justify-between">
              <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Total Period Volume</span>
              <span className="text-xl font-black text-orange-400">
                {filteredDateWiseData.reduce((sum, d) => sum + d.totalQty, 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-[#111827]/50 border border-[#1f2937] p-4 rounded-xl flex items-center justify-between">
              <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Zomato Market Share</span>
              <span className="text-xl font-black text-purple-400">
                {((filteredDateWiseData.reduce((sum, d) => sum + d.zomatoQty, 0) /
                  (filteredDateWiseData.reduce((sum, d) => sum + d.totalQty, 0) || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

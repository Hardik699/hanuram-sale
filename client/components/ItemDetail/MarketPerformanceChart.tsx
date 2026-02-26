import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DateWiseData {
  date: string;
  zomatoQty: number;
  swiggyQty: number;
  diningQty: number;
  parcelQty: number;
  totalQty: number;
}

interface MarketPerformanceChartProps {
  dateWiseData?: DateWiseData[];
  dateRange: { start: string; end: string };
  onDateRangeChange: (start: string, end: string) => void;
}

const CHANNEL_COLORS = {
  zomatoQty: "#ef4444",
  swiggyQty: "#f97316",
  diningQty: "#3b82f6",
  parcelQty: "#10b981",
};

export default function MarketPerformanceChart({
  dateWiseData = [],
  dateRange,
  onDateRangeChange,
}: MarketPerformanceChartProps) {
  const [startDate, setStartDate] = useState(dateRange.start);
  const [endDate, setEndDate] = useState(dateRange.end);

  const chartData = useMemo(() => {
    if (!dateWiseData || dateWiseData.length === 0) return [];
    return dateWiseData.slice(0, 15); // Limit to last 15 days for readability
  }, [dateWiseData]);

  const totalQuantity = chartData.reduce((sum, item) => sum + item.totalQty, 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string }>;
  }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-xs font-bold text-gray-300 mb-2">
            {payload[0].payload.date}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-semibold" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
          <p className="text-xs font-bold text-white mt-2 border-t border-gray-600 pt-2">
            Total: {total.toLocaleString()} qty
          </p>
        </div>
      );
    }
    return null;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-gray-900/30 rounded-xl p-12 border border-gray-800 text-center">
        <p className="text-gray-500 font-bold">No daily sales data available for selected period</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            Daily Sales Breakdown
          </h3>
          <p className="text-gray-400 text-sm font-medium mt-1">
            Total quantity sold: {totalQuantity.toLocaleString()} units
          </p>
        </div>
      </div>

      {/* Date Range Section */}
      <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                onDateRangeChange(e.target.value, endDate);
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white font-semibold text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            />
          </div>
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                onDateRangeChange(startDate, e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white font-semibold text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 shadow-inner">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <defs>
              <linearGradient id="zomatoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="swiggyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="diningGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="parcelGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: "12px", fontWeight: 600 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
              label={{ value: "Qty", angle: -90, position: "insideLeft" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "12px",
                fontWeight: 600,
              }}
              iconType="square"
            />
            <Bar
              dataKey="zomatoQty"
              stackId="sales"
              fill="url(#zomatoGradient)"
              name="Zomato"
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
            />
            <Bar
              dataKey="swiggyQty"
              stackId="sales"
              fill="url(#swiggyGradient)"
              name="Swiggy"
              isAnimationActive={true}
            />
            <Bar
              dataKey="diningQty"
              stackId="sales"
              fill="url(#diningGradient)"
              name="Dining"
              isAnimationActive={true}
            />
            <Bar
              dataKey="parcelQty"
              stackId="sales"
              fill="url(#parcelGradient)"
              name="Parcel"
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Channel Legend</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }}></div>
            <span className="text-xs text-gray-300 font-medium">Zomato</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f97316" }}></div>
            <span className="text-xs text-gray-300 font-medium">Swiggy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
            <span className="text-xs text-gray-300 font-medium">Dining</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#10b981" }}></div>
            <span className="text-xs text-gray-300 font-medium">Parcel</span>
          </div>
        </div>
      </div>
    </div>
  );
}

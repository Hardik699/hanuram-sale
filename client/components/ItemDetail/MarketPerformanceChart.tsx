import { useState, useMemo } from "react";
import { Calendar, TrendingUp } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
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
  zomatoValue?: number;
  swiggyValue?: number;
  diningValue?: number;
  parcelValue?: number;
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

    // Filter data based on selected date range
    const filteredData = dateWiseData.filter(item => {
      return item.date >= startDate && item.date <= endDate;
    });

    return filteredData;
  }, [dateWiseData, startDate, endDate]);

  const totalQuantity = chartData.reduce((sum, item) => sum + item.totalQty, 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string; payload: DateWiseData }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = data.zomatoQty + data.swiggyQty + data.diningQty + data.parcelQty;

      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg min-w-max">
          <p className="text-xs font-bold text-gray-300 mb-3 border-b border-gray-600 pb-2">
            {data.date}
          </p>

          {/* Zomato */}
          <div className="mb-2">
            <p className="text-xs font-semibold text-red-400">
              🔴 Zomato: <span className="text-white">{data.zomatoQty.toLocaleString()} qty</span>
            </p>
            {data.zomatoValue && <p className="text-xs text-gray-400">₹{data.zomatoValue.toLocaleString()}</p>}
          </div>

          {/* Swiggy */}
          <div className="mb-2">
            <p className="text-xs font-semibold text-orange-400">
              🟠 Swiggy: <span className="text-white">{data.swiggyQty.toLocaleString()} qty</span>
            </p>
            {data.swiggyValue && <p className="text-xs text-gray-400">₹{data.swiggyValue.toLocaleString()}</p>}
          </div>

          {/* Dining */}
          <div className="mb-2">
            <p className="text-xs font-semibold text-blue-400">
              🔵 Dining: <span className="text-white">{data.diningQty.toLocaleString()} qty</span>
            </p>
            {data.diningValue && <p className="text-xs text-gray-400">₹{data.diningValue.toLocaleString()}</p>}
          </div>

          {/* Parcel */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-green-400">
              🟢 Parcel: <span className="text-white">{data.parcelQty.toLocaleString()} qty</span>
            </p>
            {data.parcelValue && <p className="text-xs text-gray-400">₹{data.parcelValue.toLocaleString()}</p>}
          </div>

          <p className="text-xs font-bold text-yellow-400 border-t border-gray-600 pt-2">
            📊 Total: {total.toLocaleString()} qty
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
      {/* Header with Stats - Light Theme */}
      <div className="bg-gradient-to-br from-white via-orange-50/30 to-orange-50 rounded-2xl border border-orange-200/60 p-8 shadow-lg hover:shadow-xl transition">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900">
              Daily Sales Breakdown
            </h3>
            <p className="text-xs text-orange-600 font-semibold mt-0.5">Daily-wise sales analytics</p>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 mt-4">
          Total quantity sold: <span className="font-bold text-orange-600">{totalQuantity.toLocaleString()}</span> units
        </p>
      </div>

      {/* Date Range Section - Light Theme */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Select Date Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-600 text-xs font-semibold">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                onDateRangeChange(e.target.value, endDate);
              }}
              className="w-full px-3 py-3 pt-6 rounded-lg border border-gray-300 bg-white text-gray-900 font-semibold text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all cursor-pointer hover:bg-gray-50"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-600 text-xs font-semibold">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                onDateRangeChange(startDate, e.target.value);
              }}
              className="w-full px-3 py-3 pt-6 rounded-lg border border-gray-300 bg-white text-gray-900 font-semibold text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all cursor-pointer hover:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Chart - Light Theme */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-lg">
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart
            data={chartData}
            margin={{ top: 30, right: 30, left: 0, bottom: 70 }}
          >
            <defs>
              <linearGradient id="shipmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.2} />
              </linearGradient>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: "12px", fontWeight: 600 }}
              angle={-45}
              textAnchor="end"
              height={90}
              tick={{ fill: "#6b7280" }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
              label={{ value: "Qty", angle: -90, position: "insideLeft", fill: "#6b7280", offset: 10 }}
              tick={{ fill: "#6b7280" }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(249, 115, 22, 0.1)" }} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
              iconType="circle"
              verticalAlign="top"
            />
            <Bar
              dataKey="totalQty"
              fill="url(#shipmentGradient)"
              name="Daily Sales"
              radius={[12, 12, 4, 4]}
              isAnimationActive={true}
              animationDuration={800}
              filter="url(#shadow)"
            />
            <Line
              type="monotone"
              dataKey="zomatoQty"
              stroke="#a78bfa"
              strokeWidth={3}
              name="Zomato Trend"
              dot={{
                fill: "#a78bfa",
                r: 6,
                strokeWidth: 2,
                stroke: "#6d28d9",
              }}
              activeDot={{ r: 8 }}
              isAnimationActive={true}
              animationDuration={800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend Info - Light Theme */}
      <div className="bg-gradient-to-r from-orange-50 via-orange-100/30 to-orange-50 rounded-xl p-6 border border-orange-200/60">
        <p className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-600"></span>
          Legend & Metrics
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-orange-100 hover:border-orange-300 transition">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#f97316" }}></div>
            <span className="text-sm font-semibold text-gray-700">Daily Sales</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-orange-100 hover:border-orange-300 transition">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#a78bfa" }}></div>
            <span className="text-sm font-semibold text-gray-700">Zomato Trend</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-orange-100 hover:border-orange-300 transition">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#ef4444" }}></div>
            <span className="text-sm font-semibold text-gray-700">Zomato</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-orange-100 hover:border-orange-300 transition">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#3b82f6" }}></div>
            <span className="text-sm font-semibold text-gray-700">Other Areas</span>
          </div>
        </div>
      </div>
    </div>
  );
}

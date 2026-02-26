import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";
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
    return dateWiseData.slice(0, 15); // Limit to last 15 days for readability
  }, [dateWiseData]);

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
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <defs>
              <linearGradient id="shipmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" verticalPoints={[0]} />
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
              iconType="circle"
            />
            <Bar
              dataKey="totalQty"
              fill="url(#shipmentGradient)"
              name="Daily Sales"
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="zomatoQty"
              stroke="#a78bfa"
              strokeWidth={3}
              name="Zomato Trend"
              dot={{
                fill: "#a78bfa",
                r: 5,
                strokeWidth: 2,
                stroke: "#6d28d9",
              }}
              activeDot={{ r: 7 }}
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sales Breakdown</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#fbbf24" }}></div>
            <span className="text-xs text-gray-300 font-medium">Daily Sales Qty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#a78bfa" }}></div>
            <span className="text-xs text-gray-300 font-medium">Zomato Trend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f97316" }}></div>
            <span className="text-xs text-gray-300 font-medium">Swiggy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
            <span className="text-xs text-gray-300 font-medium">Dining & Parcel</span>
          </div>
        </div>
      </div>
    </div>
  );
}

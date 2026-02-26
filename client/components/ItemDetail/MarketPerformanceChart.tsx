import { useState, useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";
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

interface SalesData {
  date: string;
  shipment: number;
  delivery: number;
}

interface MarketPerformanceChartProps {
  salesData?: Array<{
    date: string;
    quantity?: number;
    amount?: number;
    channel?: string;
  }>;
  dateRange: { start: string; end: string };
  onDateRangeChange: (start: string, end: string) => void;
}

const generateDemoData = (days: number): SalesData[] => {
  const data: SalesData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });

    // Generate realistic demo data
    data.push({
      date: dateStr,
      shipment: Math.floor(Math.random() * 40 + 5), // 5-45%
      delivery: Math.floor(Math.random() * 30 + 10), // 10-40%
    });
  }

  return data;
};

const calculateDateRange = (days: number) => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  return {
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0],
  };
};

export default function MarketPerformanceChart({
  salesData = [],
  dateRange,
  onDateRangeChange,
}: MarketPerformanceChartProps) {
  const [selectedRange, setSelectedRange] = useState("30d");
  const [startDate, setStartDate] = useState(dateRange.start);
  const [endDate, setEndDate] = useState(dateRange.end);

  const handleQuickSelect = (days: string) => {
    setSelectedRange(days);
    let numDays: number;

    switch (days) {
      case "7d":
        numDays = 7;
        break;
      case "30d":
        numDays = 30;
        break;
      case "90d":
        numDays = 90;
        break;
      case "1y":
        numDays = 365;
        break;
      default:
        numDays = 30;
    }

    const range = calculateDateRange(numDays);
    setStartDate(range.start);
    setEndDate(range.end);
    onDateRangeChange(range.start, range.end);
  };

  const chartData = useMemo(() => {
    // Determine number of days to show
    let days = 10;
    if (selectedRange === "7d") days = 7;
    else if (selectedRange === "30d") days = 30;
    else if (selectedRange === "90d") days = 10; // Show 10 bars for readability
    else if (selectedRange === "1y") days = 12; // Show 12 months

    return generateDemoData(Math.min(days, 10)); // Limit to 10 for chart readability
  }, [selectedRange]);

  const totalDeliveries = chartData.reduce((sum, item) => sum + item.delivery, 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-xs font-bold text-gray-300 mb-2">
            {payload[0].payload.date}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-semibold" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            Market Performance
          </h3>
          <p className="text-gray-400 text-sm font-medium mt-1">
            Total number of deliveries {totalDeliveries.toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Restaurant */}
        <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
            Source Restaurant
          </label>
          <select className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-gray-700">
            <option>All Registered Locations</option>
            <option>Restaurant 1</option>
            <option>Restaurant 2</option>
          </select>
        </div>

        {/* Reporting Interval */}
        <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Reporting Interval
          </label>
          <div className="space-y-3">
            {/* Date Range Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSelectedRange("custom");
                    onDateRangeChange(e.target.value, endDate);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white font-semibold text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedRange("custom");
                    onDateRangeChange(startDate, e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white font-semibold text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Selected Range Info */}
            {selectedRange === "custom" && (
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-2">
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Selected Range
                </p>
                <p className="text-emerald-300 text-xs font-semibold mt-1">
                  {startDate} to {endDate}
                </p>
              </div>
            )}
          </div>

          {/* Quick Select */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Quick Select
            </p>
            <div className="grid grid-cols-4 gap-2">
              {["7d", "30d", "90d", "1y"].map((range) => (
                <button
                  key={range}
                  onClick={() => handleQuickSelect(range)}
                  className={`px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all duration-300 ${
                    selectedRange === range
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300 border border-gray-700"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 shadow-inner">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="shipmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              verticalPoints={[0]}
            />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: "12px", fontWeight: 600 }}
            />
            <YAxis
              stroke="#9ca3af"
              label={{ value: "%", angle: -90, position: "insideLeft" }}
              style={{ fontSize: "12px" }}
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
              dataKey="shipment"
              fill="url(#shipmentGradient)"
              name="Shipment"
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="delivery"
              stroke="#a78bfa"
              strokeWidth={3}
              name="Delivery"
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
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Edit, RotateCcw } from "lucide-react";
import SalesSummaryCards from "@/components/ItemDetail/SalesSummaryCards";
import DateFilter from "@/components/ItemDetail/DateFilter";
import SalesDataTable from "@/components/ItemDetail/SalesDataTable";
import SalesCharts from "@/components/ItemDetail/SalesCharts";

console.log("📄 ItemDetail module loaded");

// Helper function to calculate auto pricing
const calculateAutoPrices = (basePrice: number) => {
  if (basePrice <= 0) return { Zomato: 0, Swiggy: 0, GS1: 0 };

  // Round to nearest 5
  const roundToNearest5 = (price: number) => {
    return Math.round(price / 5) * 5;
  };

  // Add 15% markup for Zomato and Swiggy
  const priceWith15Percent = basePrice * 1.15;
  const autoPriceZomato = roundToNearest5(priceWith15Percent);
  const autoPriceSwiggy = roundToNearest5(priceWith15Percent);

  // Add 20% markup for GS1
  const priceWith20Percent = basePrice * 1.20;
  const autoPriceGS1 = roundToNearest5(priceWith20Percent);

  return { Zomato: autoPriceZomato, Swiggy: autoPriceSwiggy, GS1: autoPriceGS1 };
};

export default function ItemDetail() {
  console.log("🎯 ItemDetail component rendering");
  const params = useParams<{ itemId: string }>();
  const itemId = params.itemId;
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "sales">("details");

  // Initialize with default date range (last 365 days)
  const getDefaultDateRange = () => {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    return { start: startDate, end: endDate };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [restaurants, setRestaurants] = useState<string[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Debug logging
  console.log("🔧 ItemDetail mounted, params:", params, "itemId:", itemId);

  // Fetch unique restaurants (non-blocking)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchRestaurants = async () => {
      try {
        if (!isMounted) return;
        setRestaurantsLoading(true);

        // Set timeout for 15 seconds
        timeoutId = setTimeout(() => {
          if (!isMounted) return;
          controller.abort();
        }, 15000);

        const response = await fetch("/api/sales/restaurants", {
          signal: controller.signal,
        });

        if (!isMounted) return;
        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn("⚠️ Failed to fetch restaurants:", response.status);
          if (isMounted) setRestaurants([]);
          return;
        }

        const result = await response.json();
        if (isMounted) {
          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            setRestaurants(result.data);
            console.log(`📝 Found ${result.data.length} restaurants`);
          } else {
            setRestaurants([]);
          }
        }
      } catch (error) {
        // Only log non-abort errors
        if (error instanceof Error && error.name !== "AbortError") {
          console.warn("⚠️ Restaurant fetch failed (non-critical):", error);
        }
        if (isMounted) {
          setRestaurants([]);
        }
      } finally {
        if (isMounted) {
          setRestaurantsLoading(false);
        }
      }
    };

    fetchRestaurants();

    // Cleanup function - just mark as unmounted, don't abort
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🔍 Fetching item with ID: "${itemId}"`);

        // Fetch all items and find the one we need with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("/api/items", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ API returned ${response.status}: ${response.statusText}`,
          );
          console.error("Response:", errorText);
          throw new Error(
            `Failed to fetch items: ${response.status} ${response.statusText}`,
          );
        }

        const items = await response.json();

        if (!Array.isArray(items)) {
          console.error(
            "❌ Invalid response format, expected array but got:",
            typeof items,
          );
          throw new Error("Invalid response format from server");
        }

        console.log(`📦 Received ${items.length} items from API`);
        console.log(
          "Available item IDs:",
          items.map((i: any) => i.itemId).join(", "),
        );

        const foundItem = items.find((i: any) => i.itemId === itemId);

        if (!foundItem) {
          console.error(`❌ Item with ID "${itemId}" not found in database`);
          setError(
            `Item with ID "${itemId}" not found. Make sure you've created this item first.`,
          );
          setItem(null);
        } else {
          console.log(`✅ Found item: ${foundItem.itemName}`);
          setItem(foundItem);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch item";
        console.error("❌ Error fetching item:", errorMessage);
        console.error("Full error:", error);
        setError(errorMessage);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const response = await fetch(`/api/items/${itemId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          navigate("/items");
        }
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    }
  };

  const handleResetSalesData = async () => {
    try {
      setIsResetting(true);
      const response = await fetch(`/api/sales/item/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        setShowResetConfirm(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`❌ Failed to reset data: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to reset sales data:", error);
      alert("❌ Error resetting sales data");
    } finally {
      setIsResetting(false);
    }
  };

  // Fetch real sales data from API
  const [salesData, setSalesData] = useState<any>(null);
  const [salesLoading, setSalesLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    let isCleanup = false;

    const fetchSalesData = async () => {
      if (!itemId || !dateRange.start || !dateRange.end) {
        if (isMounted) setSalesData(null);
        return;
      }

      try {
        if (isMounted) setSalesLoading(true);
        const url = new URL(
          `/api/sales/item/${itemId}`,
          window.location.origin,
        );
        url.searchParams.set("startDate", dateRange.start);
        url.searchParams.set("endDate", dateRange.end);
        if (selectedRestaurant) {
          url.searchParams.set("restaurant", selectedRestaurant);
        }

        console.log(`🔄 Fetching sales data: ${url.toString()}`);

        // Increase timeout to 60 seconds for large datasets
        timeoutId = setTimeout(() => {
          if (!isCleanup) {
            console.warn("⚠️ Sales data fetch timeout after 60 seconds");
            controller.abort();
          }
        }, 60000);

        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ Sales API returned ${response.status}: ${response.statusText}`,
          );
          console.error("Error details:", errorText);
          return;
        }

        const result = await response.json();
        console.log("✅ Sales data response:", result);

        if (result.success && result.data && isMounted) {
          // The server now returns pre-aggregated data!
          const data = result.data;
          console.log("✅ Pre-aggregated data from server:", {
            monthlyData: data.monthlyData?.length || 0,
            dateWiseData: data.dateWiseData?.length || 0,
            restaurantSales: Object.keys(data.restaurantSales || {}).length,
          });

          // Transform monthly data from YYYY-MM format to month names
          const monthlyData = (data.monthlyData || []).map((item: any) => {
            const [year, month] = item.month.split("-");
            const monthNum = parseInt(month) - 1;
            const monthName = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ][monthNum];
            return {
              month: monthName,
              zomatoQty: item.zomatoQty || 0,
              swiggyQty: item.swiggyQty || 0,
              diningQty: item.diningQty || 0,
              parcelQty: item.parcelQty || 0,
              totalQty: item.totalQty || 0,
            };
          });

          // Use pre-aggregated date-wise data
          const dateWiseDataWithTotals = (data.dateWiseData || []).map(
            (item: any) => ({
              date: item.date,
              zomatoQty: item.zomatoQty || 0,
              swiggyQty: item.swiggyQty || 0,
              diningQty: item.diningQty || 0,
              parcelQty: item.parcelQty || 0,
              totalQty: item.totalQty || 0,
            }),
          );

          const restaurantSales = data.restaurantSales || {};

          // Create sales data table from aggregated area data
          const salesTableData: any[] = [];
          const addedVariations = new Set<string>();
          const allVariations = new Set<string>();

          // Collect all variation names
          [
            data.zomatoData,
            data.swiggyData,
            data.diningData,
            data.parcelData,
          ].forEach((areaData: any) => {
            if (areaData?.variations) {
              areaData.variations.forEach((v: any) =>
                allVariations.add(v.name),
              );
            }
          });

          // Build table rows
          allVariations.forEach((variationName) => {
            if (!addedVariations.has(variationName)) {
              addedVariations.add(variationName);
              const zomatoVar = data.zomatoData?.variations?.find(
                (v: any) => v.name === variationName,
              );
              const swiggyVar = data.swiggyData?.variations?.find(
                (v: any) => v.name === variationName,
              );
              const diningVar = data.diningData?.variations?.find(
                (v: any) => v.name === variationName,
              );
              const parcelVar = data.parcelData?.variations?.find(
                (v: any) => v.name === variationName,
              );

              salesTableData.push({
                variationName,
                sapCode: variationName,
                zomato: {
                  quantity: zomatoVar?.quantity || 0,
                  value: zomatoVar?.value || 0,
                },
                swiggy: {
                  quantity: swiggyVar?.quantity || 0,
                  value: swiggyVar?.value || 0,
                },
                dining: {
                  quantity: diningVar?.quantity || 0,
                  value: diningVar?.value || 0,
                },
                parcel: {
                  quantity: parcelVar?.quantity || 0,
                  value: parcelVar?.value || 0,
                },
                total: {
                  quantity:
                    (zomatoVar?.quantity || 0) +
                    (swiggyVar?.quantity || 0) +
                    (diningVar?.quantity || 0) +
                    (parcelVar?.quantity || 0),
                  value:
                    (zomatoVar?.value || 0) +
                    (swiggyVar?.value || 0) +
                    (diningVar?.value || 0) +
                    (parcelVar?.value || 0),
                },
              });
            }
          });

          setSalesData({
            monthlyData,
            dateWiseData: dateWiseDataWithTotals,
            zomatoData: data.zomatoData || {
              quantity: 0,
              value: 0,
              variations: [],
            },
            swiggyData: data.swiggyData || {
              quantity: 0,
              value: 0,
              variations: [],
            },
            diningData: data.diningData || {
              quantity: 0,
              value: 0,
              variations: [],
            },
            parcelData: data.parcelData || {
              quantity: 0,
              value: 0,
              variations: [],
            },
            salesTableData,
            restaurantSales,
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          if (!isCleanup) {
            console.error("❌ Sales data fetch was aborted (timeout or cancelled)");
          }
        } else {
          console.error("Error fetching sales data:", error);
        }
        if (isMounted) setSalesData(null);
      } finally {
        if (isMounted) setSalesLoading(false);
      }
    };

    fetchSalesData();

    // Cleanup function
    return () => {
      isCleanup = true;
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      // Don't abort the controller during cleanup to avoid AbortError
    };
  }, [itemId, dateRange, selectedRestaurant]);

  if (loading) {
    return (
      <div className="flex-1 p-3 xs:p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate("/items")}
          className="flex items-center gap-2 text-primary hover:opacity-80 mb-4 sm:mb-6 font-medium text-sm sm:text-base transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Items
        </button>
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-8 text-center">
          <p className="text-gray-500 text-sm sm:text-base">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex-1 p-3 xs:p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate("/items")}
          className="flex items-center gap-2 text-primary hover:opacity-80 mb-4 sm:mb-6 font-medium text-sm sm:text-base transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Items
        </button>
        <div className="bg-white rounded-lg sm:rounded-xl border border-red-200 p-4 sm:p-8">
          <div className="text-red-600 mb-6">
            <p className="font-semibold text-lg">⚠️ Item Not Found</p>
            <p className="text-sm mt-2">{error || "Item not found"}</p>
            <p className="text-xs mt-2 text-red-500 font-mono bg-red-50 p-2 rounded">
              Looking for ID: {itemId}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-900 mb-2">
              <strong>Common causes:</strong>
            </p>
            <ul className="text-sm text-yellow-800 space-y-1 ml-4 list-disc">
              <li>The item might not be properly saved in the database</li>
              <li>MongoDB connection might be failing</li>
              <li>The item ID might have changed</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 mb-2">
              <strong>What to do:</strong>
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              <li>Open browser console (F12) and check for error messages</li>
              <li>Go back to Items list and create a new item</li>
              <li>Check if MongoDB is accessible and working</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/items")}
              className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
            >
              Return to Items List
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CHANNELS = ["Dining", "Parcale", "Swiggy", "Zomato", "GS1"];

  return (
    <div className="flex-1 p-3 xs:p-4 sm:p-6 lg:p-8">
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 max-w-md w-full mx-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              Reset Sales Data?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              This will permanently delete all sales history for{" "}
              <strong>{item?.itemName}</strong> across all variations. This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSalesData}
                disabled={isResetting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResetting ? "Resetting..." : "Reset Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate("/items")}
        className="flex items-center gap-2 text-[#7c3aed] hover:opacity-80 mb-6 font-semibold text-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Items
      </button>

      {/* Main Item Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        {/* Card Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-black text-slate-900 mb-2 capitalize">
                {item.itemName}
              </h1>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => navigate(`/items/${itemId}/edit`)}
                className="p-2.5 hover:bg-emerald-50 rounded-xl transition-all text-emerald-500 border border-emerald-100"
                title="Edit item"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="p-2.5 hover:bg-emerald-50 rounded-xl transition-all text-emerald-500 border border-emerald-100"
                title="Reset sales data"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2.5 hover:bg-red-50 rounded-xl transition-all text-red-500 border border-red-100"
                title="Delete item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 mt-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeTab === "details"
                  ? "text-emerald-500"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Item Details
              {activeTab === "details" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeTab === "sales"
                  ? "text-emerald-500"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Sales Information
              {activeTab === "sales" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6 sm:p-8">
          {activeTab === "details" ? (
            /* Details Tab Content */
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Section - Images */}
                <div className="lg:col-span-4">
                  <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center relative group">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={typeof item.images[0] === 'string' ? item.images[0] : (item.images[0].url || item.images[0].preview)}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-400 font-medium text-sm">No images</span>
                    )}
                  </div>
                </div>

                {/* Right Section - Item Info */}
                <div className="lg:col-span-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[
                      { label: "Item ID", value: item.itemId },
                      { label: "Short Code", value: item.shortCode },
                      { label: "Group", value: item.group },
                      { label: "Category", value: item.category },
                      { label: "Item Type", value: item.itemType },
                      { label: "Unit Type", value: item.unitType },
                      { label: "HSN Code", value: item.hsnCode || "-" },
                      { label: "GST (%)", value: `${item.gst || 0}%`, highlight: true },
                      { label: "Profit Margin (%)", value: `${item.profitMargin || 0}%`, highlight: true },
                    ].map((info, idx) => (
                      <div
                        key={idx}
                        className="bg-[#f0fdf4] p-5 rounded-2xl border border-[#dcfce7] flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow duration-300"
                      >
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {info.label}
                        </span>
                        <span className={`text-lg font-black ${info.highlight ? "text-emerald-500" : "text-slate-900"}`}>
                          {info.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Variations Section */}
              <div className="pt-8 border-t border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  Variations
                  <span className="text-sm font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                    {item.variations?.length || 0}
                  </span>
                </h2>

                {item.variations && item.variations.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {item.variations.map((variation: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                          {[
                            { label: "Variation Value", value: variation.value, highlight: true },
                            { label: "Base Price", value: `₹${variation.price}`, highlight: true },
                            { label: "SAP Code", value: variation.sapCode || "-" },
                            { label: "Profit Margin (%)", value: `${variation.profitMargin || 0}%`, highlight: true },
                            { label: "Sale Type", value: variation.saleType || "QTY" },
                          ].map((vInfo, vIdx) => (
                            <div key={vIdx} className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {vInfo.label}
                              </span>
                              <span className={`text-base font-bold ${vInfo.highlight ? "text-emerald-600" : "text-slate-900"}`}>
                                {vInfo.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Channel Prices */}
                        <div className="pt-6 border-t border-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                            Channel Prices
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {["Dining", "Parcale", "Swiggy", "Zomato", "GS1"].map((channel) => {
                              const isAutoCalculated = ["Zomato", "Swiggy", "GS1"].includes(channel);
                              let displayPrice = variation.channels?.[channel];

                              if (!displayPrice || displayPrice === 0) {
                                if (isAutoCalculated && variation.price) {
                                  const autoPrices = calculateAutoPrices(variation.price);
                                  displayPrice = autoPrices[channel as keyof typeof autoPrices];
                                } else {
                                  displayPrice = variation.price || "-";
                                }
                              }

                              return (
                                <div
                                  key={channel}
                                  className={`rounded-xl p-4 transition-all duration-300 border ${
                                    isAutoCalculated
                                      ? "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50"
                                      : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-500">
                                      {channel}
                                      {isAutoCalculated && <span className="text-emerald-500 ml-1">(auto)</span>}
                                    </span>
                                    <span className={`text-lg font-black ${isAutoCalculated ? "text-emerald-600" : "text-slate-900"}`}>
                                      ₹{displayPrice}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No variations found for this item.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Sales Tab Content - Kept original logic but updated styling */
            <div className="space-y-8">
              {/* Restaurant & Date Filter */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    Select Restaurant
                  </label>
                  <select
                    value={selectedRestaurant}
                    onChange={(e) => setSelectedRestaurant(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white transition-all font-medium text-slate-700"
                  >
                    <option value="">All Restaurants</option>
                    {restaurants.map((restaurant) => (
                      <option key={restaurant} value={restaurant}>
                        {restaurant}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    Date Range
                  </label>
                  <DateFilter
                    onDateRangeChange={(start, end) => {
                      setDateRange({ start, end });
                    }}
                  />
                </div>
              </div>

              {salesLoading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">Fetching sales data...</p>
                </div>
              ) : salesData ? (
                <div className="space-y-12">
                  <SalesSummaryCards
                    zomatoData={salesData.zomatoData}
                    swiggyData={salesData.swiggyData}
                    diningData={salesData.diningData}
                    parcelData={salesData.parcelData}
                    saleType={item?.variations?.[0]?.saleType || "QTY"}
                  />

                  <SalesDataTable
                    data={salesData.salesTableData}
                    itemName={item.itemName}
                    saleType={item?.variations?.[0]?.saleType || "QTY"}
                  />

                  <SalesCharts
                    monthlyData={salesData.monthlyData}
                    dateWiseData={salesData.dateWiseData}
                    restaurantSales={salesData.restaurantSales}
                  />
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">
                    {dateRange.start && dateRange.end
                      ? "No sales data found for the selected range"
                      : "Please select a date range"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

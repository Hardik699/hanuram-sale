import { useState, useEffect, useMemo } from "react";
import { Plus, Download, Search } from "lucide-react";
import ItemForm from "@/components/Items/ItemForm";
import ItemsTable from "@/components/Items/ItemsTable";

export default function Items() {
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.itemName?.toLowerCase().includes(lowerSearch) ||
        item.itemId?.toLowerCase().includes(lowerSearch) ||
        item.group?.toLowerCase().includes(lowerSearch) ||
        item.category?.toLowerCase().includes(lowerSearch)
    );
  }, [items, searchTerm]);

  // Fetch items from MongoDB on component mount
  useEffect(() => {
    const fetchItems = async (retryCount = 0) => {
      try {
        setLoading(true);
        console.log(`🔄 Fetching items (attempt ${retryCount + 1})...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("/api/items", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `API returned ${response.status} ${response.statusText}`,
          );
        }
        const data = await response.json();
        console.log(`✅ Loaded ${data.length} items from MongoDB`);
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Failed to fetch items:", error);

        // Retry once after 2 seconds if it's a network error
        if (
          retryCount < 1 &&
          error instanceof TypeError &&
          error.message.includes("Failed to fetch")
        ) {
          console.log("⏳ Retrying in 2 seconds...");
          setTimeout(() => fetchItems(retryCount + 1), 2000);
          return;
        }

        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleAddItem = (newItem: any) => {
    // Item is already saved in MongoDB via API
    // Just add it to the local state for immediate UI update
    setItems([...items, newItem]);
    setShowForm(false);
  };

  // Migrate existing items to add GS1 channel (runs once on mount)
  useEffect(() => {
    const migrateGS1 = async () => {
      try {
        const response = await fetch("/api/items/migrate/add-gs1", {
          method: "POST",
        });
        if (response.ok) {
          const result = await response.json();
          console.log("✅ GS1 migration completed:", result);
        }
      } catch (error) {
        console.error("GS1 migration failed (non-critical):", error);
      }
    };

    migrateGS1();
  }, []);

  const handleDownload = () => {
    // Export items as CSV/Excel
    const csv = convertToCSV(items);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "items.csv";
    a.click();
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";

    // Define the columns to export
    const headers = [
      "Item ID",
      "Item Name",
      "Short Code",
      "Description",
      "HSN Code",
      "Group",
      "Category",
      "Profit Margin (%)",
      "GST (%)",
      "Item Type",
      "Unit Type",
      "Variations",
      "Images Count",
    ];

    const rows = data.map((item) => [
      item.itemId,
      item.itemName,
      item.shortCode,
      item.description || "",
      item.hsnCode || "",
      item.group,
      item.category,
      item.profitMargin || 0,
      item.gst || 0,
      item.itemType,
      item.unitType,
      item.variations?.map((v: any) => `${v.name}: ${v.value}`).join("; ") ||
        "",
      item.images?.length || 0,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = String(cell || "");
            return value.includes(",") ||
              value.includes('"') ||
              value.includes("\n")
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(","),
      ),
    ].join("\n");

    return csv;
  };

  return (
    <div className="flex-1 p-3 xs:p-4 sm:p-6 lg:p-8 bg-gray-950 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="w-full sm:w-auto group cursor-default">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-600/50">
              <span className="text-white text-xl font-bold">📦</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Items
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm font-medium mt-1">
                Manage your product items and variations
              </p>
              {loading && (
                <p className="text-gray-500 text-xs mt-2 transition-colors duration-300">
                  Loading items from MongoDB...
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 w-full sm:w-auto">
          {/* Search bar - Desktop */}
          <div className="relative w-full max-w-xs hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-white text-xs sm:text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-600/20 hover:border-slate-500"
            />
          </div>

          {items.length > 0 && !loading && (
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 sm:px-6 py-2.5 bg-blue-600/20 border border-blue-600/60 text-blue-300 rounded-lg hover:bg-blue-600/30 hover:border-blue-500 font-semibold transition-all duration-300 text-xs xs:text-sm sm:text-base whitespace-nowrap shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-500/40 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
              <Download className="w-3.5 h-3.5 xs:w-4 xs:h-4 relative z-10" />
              <span className="hidden xs:inline relative z-10">Download</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 font-semibold transition-all duration-300 text-xs xs:text-sm sm:text-base whitespace-nowrap shadow-lg shadow-blue-600/50 hover:shadow-xl hover:shadow-blue-500/80 hover:scale-[1.02] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
            <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4 relative z-10" />
            <span className="hidden xs:inline relative z-10">Add Item</span>
            <span className="xs:hidden relative z-10">Add</span>
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-blue-600/30">
            <ItemForm
              onSuccess={handleAddItem}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Search bar - Mobile only */}
      <div className="mb-4 sm:hidden relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-600/20 hover:border-slate-500"
        />
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl p-4 sm:p-8 text-center shadow-lg shadow-blue-600/10">
          <p className="text-gray-400 text-xs sm:text-sm font-medium">Loading items from MongoDB...</p>
        </div>
      ) : (
        <ItemsTable items={filteredItems} />
      )}
    </div>
  );
}

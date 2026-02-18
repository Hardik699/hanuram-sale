import { useState, useEffect } from "react";
import { Plus, Download } from "lucide-react";
import ItemForm from "@/components/Items/ItemForm";
import ItemsTable from "@/components/Items/ItemsTable";

export default function Items() {
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="flex-1 p-6 sm:p-8">
      {/* Header */}
      <div className="flex justify-between items-start gap-6 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Items
          </h1>
          <p className="text-gray-600 text-sm">
            Manage your product items and variations
          </p>
          {loading && (
            <div className="mt-3 flex items-center gap-2 text-purple-600 text-xs font-medium">
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
              Loading items from database...
            </div>
          )}
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          {items.length > 0 && !loading && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 font-medium transition text-xs sm:text-sm shadow-sm hover:shadow-md"
              title="Download items as CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition text-xs sm:text-sm shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ItemForm
              onSuccess={handleAddItem}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Items Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-purple-100 rounded-full">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading items from database...</p>
          <p className="text-gray-400 text-xs mt-2">This may take a moment</p>
        </div>
      ) : (
        <ItemsTable items={items} />
      )}
    </div>
  );
}

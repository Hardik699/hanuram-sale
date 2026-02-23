import { useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CHANNELS = ["Dining", "Parcale", "Swiggy", "Zomato"];

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

interface ItemsTableProps {
  items: any[];
}

export default function ItemsTable({ items }: ItemsTableProps) {
  const navigate = useNavigate();
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIdx = currentPage * itemsPerPage;
  const paginatedItems = items.slice(startIdx, startIdx + itemsPerPage);

  const uniqueVariationValues = Array.from(
    new Set(
      items.flatMap((item) =>
        (item.variations || []).map((v: any) => v.value)
      )
    )
  ).sort((a, b) => {
    // Basic numeric sort for strings like "250 Gms", "1 Kg"
    const parseNum = (s: string) => {
      const n = parseFloat(s.match(/\d+/)?.[0] || "0");
      if (s.toLowerCase().includes("kg") || s.toLowerCase().includes("l")) return n * 1000;
      return n;
    };
    return parseNum(a) - parseNum(b);
  });

  const getPrice = (item: any, variationValue: string, channel: string) => {
    const variation = (item.variations || []).find((v: any) => v.value === variationValue);
    if (!variation) return "-";

    // Standardized channel name handling (map from user image labels if necessary)
    const channelMap: Record<string, string> = {
      "Dining": "Dining",
      "parcal": "Parcale",
      "Swiggy": "Swiggy",
      "zomato": "Zomato"
    };
    const internalChannel = channelMap[channel] || channel;

    let price = variation.channels?.[internalChannel];

    // Auto calculate if not set
    if (!price || price === 0) {
      if (["Zomato", "Swiggy"].includes(internalChannel)) {
        const autoPrices = calculateAutoPrices(variation.price || 0);
        price = autoPrices[internalChannel as keyof typeof autoPrices];
      } else {
        price = variation.price;
      }
    }

    return price && price > 0 ? `₹${price}` : "-";
  };

  const toggleRowSelection = (itemId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedItems.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedItems.map((item) => item.itemId)));
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-8 text-center">
        <p className="text-gray-500 text-xs sm:text-sm">No items added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Responsive Table */}
      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full min-w-full border-collapse">
            {/* Table Header */}
            <thead>
              {/* Row 1: Basic Info and Variyation (merged) */}
              <tr className="bg-gray-100 text-gray-700 text-[10px] xs:text-xs sm:text-sm font-bold border-b border-gray-200">
                <th rowSpan={3} className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-r border-gray-200 sticky left-0 z-30 bg-gray-100">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      selectedRows.size === paginatedItems.length
                    }
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 xs:w-4 xs:h-4 cursor-pointer"
                  />
                </th>
                <th rowSpan={3} className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-r border-gray-200 sticky left-8 xs:left-10 sm:left-12 z-30 bg-gray-100 min-w-[120px] xs:min-w-[140px] sm:min-w-[150px]">
                  Item Name
                </th>
                <th rowSpan={3} className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-r border-gray-200 bg-gray-100 hidden xs:table-cell">
                  Group
                </th>
                <th rowSpan={3} className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-r border-gray-200 bg-gray-100 hidden sm:table-cell">
                  Category
                </th>
                {uniqueVariationValues.length > 0 && (
                  <th colSpan={uniqueVariationValues.length * 4} className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-b border-gray-200 bg-gray-100 uppercase tracking-widest font-bold text-xs sm:text-sm lg:text-base">
                    Variyation
                  </th>
                )}
              </tr>

              {/* Row 2: Variation Values (e.g., 250 Gms, 500 Gms) */}
              <tr className="bg-white text-gray-600 text-[8px] xs:text-[9px] sm:text-xs font-bold border-b border-gray-200 uppercase tracking-wider">
                {uniqueVariationValues.map((v) => (
                  <th key={v} colSpan={4} className="px-1 xs:px-1.5 sm:px-2 py-1.5 xs:py-2 sm:py-2 text-center border-r border-gray-200 bg-gray-50">
                    {v}
                  </th>
                ))}
              </tr>

              {/* Row 3: Channels (Dining, parcal, Swiggy, zomato) */}
              <tr className="bg-white text-gray-500 text-[7px] xs:text-[8px] sm:text-[9px] font-bold border-b border-gray-200 uppercase tracking-tighter">
                {uniqueVariationValues.map((v) => (
                  <React.Fragment key={`${v}-channels`}>
                    <th className="px-0.5 xs:px-1 sm:px-1.5 py-1 xs:py-1.5 sm:py-2 text-center border-r border-gray-200 min-w-[50px] xs:min-w-[55px] sm:min-w-[60px]">Dining</th>
                    <th className="px-0.5 xs:px-1 sm:px-1.5 py-1 xs:py-1.5 sm:py-2 text-center border-r border-gray-200 min-w-[50px] xs:min-w-[55px] sm:min-w-[60px]">Parcal</th>
                    <th className="px-0.5 xs:px-1 sm:px-1.5 py-1 xs:py-1.5 sm:py-2 text-center border-r border-gray-200 min-w-[50px] xs:min-w-[55px] sm:min-w-[60px]">Swiggy</th>
                    <th className="px-0.5 xs:px-1 sm:px-1.5 py-1 xs:py-1.5 sm:py-2 text-center border-r border-gray-200 min-w-[50px] xs:min-w-[55px] sm:min-w-[60px]">Zomato</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedItems.map((item) => (
                <tr
                  key={item.itemId}
                  onClick={() => navigate(`/items/${item.itemId}`)}
                  className={`border-b border-gray-200 hover:bg-purple-50 transition cursor-pointer text-[8px] xs:text-[9px] sm:text-xs whitespace-nowrap ${
                    selectedRows.has(item.itemId) ? "bg-purple-50" : ""
                  }`}
                >
                  {/* Checkbox - Sticky */}
                  <td className={`px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-r border-gray-200 sticky left-0 z-10 transition-colors ${selectedRows.has(item.itemId) ? "bg-purple-50" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.itemId)}
                      onChange={() => toggleRowSelection(item.itemId)}
                      className="w-3.5 h-3.5 xs:w-4 xs:h-4"
                    />
                  </td>

                  {/* Basic Info - Sticky Item Name */}
                  <td className={`px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-900 font-bold xs:font-black sticky left-8 xs:left-10 sm:left-12 z-10 border-r border-gray-200 min-w-[120px] xs:min-w-[140px] sm:min-w-[150px] first-letter:capitalize transition-colors ${selectedRows.has(item.itemId) ? "bg-purple-50" : "bg-white"}`}>
                    {item.itemName}
                  </td>
                  <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-700 border-r border-gray-200 text-center font-bold hidden xs:table-cell">
                    {item.group}
                  </td>
                  <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-700 border-r border-gray-200 text-center font-bold hidden sm:table-cell">
                    {item.category}
                  </td>

                  {/* Variation Prices */}
                  {uniqueVariationValues.map((v) => (
                    <React.Fragment key={`${item.itemId}-${v}-prices`}>
                      <td className="px-0.5 xs:px-1 sm:px-1.5 py-2 xs:py-2.5 sm:py-3 text-center border-r border-gray-100 font-medium text-gray-700">{getPrice(item, v, "Dining")}</td>
                      <td className="px-0.5 xs:px-1 sm:px-1.5 py-2 xs:py-2.5 sm:py-3 text-center border-r border-gray-100 font-medium text-gray-700">{getPrice(item, v, "Parcal")}</td>
                      <td className="px-0.5 xs:px-1 sm:px-1.5 py-2 xs:py-2.5 sm:py-3 text-center border-r border-gray-100 font-medium text-purple-600 font-semibold">{getPrice(item, v, "Swiggy")}</td>
                      <td className="px-0.5 xs:px-1 sm:px-1.5 py-2 xs:py-2.5 sm:py-3 text-center border-r border-gray-300 font-medium text-purple-600 font-semibold">{getPrice(item, v, "Zomato")}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="px-3 xs:px-4 sm:px-6 py-3 xs:py-4 border-t border-gray-200 flex flex-col gap-3 xs:gap-4">
          {/* Info Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600">
              {selectedRows.size > 0 && (
                <span className="font-medium">{selectedRows.size} selected · </span>
              )}
              <span className="hidden xs:inline">Showing {startIdx + 1} to{" "}</span>
              {Math.min(startIdx + itemsPerPage, items.length)}<span className="hidden xs:inline"> of {items.length}</span>
            </div>

            <div className="flex items-center gap-1.5 xs:gap-2">
              <span className="text-[9px] xs:text-xs sm:text-sm text-gray-500">Rows:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="text-[9px] xs:text-xs sm:text-sm border border-gray-300 rounded px-1.5 xs:px-2 py-0.5 xs:py-1 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
              >
                {[5, 10, 15, 20, 30, 50].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-1 xs:gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-1 xs:p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-0.5 xs:gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                // Show first 5 pages or adjust for current page context
                const displayIdx = totalPages <= 5 ? idx : Math.max(0, Math.min(idx + Math.max(0, currentPage - 2), totalPages - 5)) + idx;

                return (
                  <button
                    key={displayIdx}
                    onClick={() => setCurrentPage(displayIdx)}
                    className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded text-[9px] xs:text-xs sm:text-sm font-medium transition ${
                      currentPage === displayIdx
                        ? "bg-primary text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {displayIdx + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-1 xs:p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition"
            >
              <ChevronRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

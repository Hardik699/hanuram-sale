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
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl p-4 sm:p-8 text-center shadow-lg shadow-blue-600/10">
        <p className="text-gray-400 text-xs sm:text-sm font-medium">No items added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Responsive Table */}
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden shadow-lg shadow-blue-600/20">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          <table className="w-full min-w-full border-collapse">
            {/* Table Header */}
            <thead>
              {/* Row 1: Basic Info and Variyation (merged) */}
              <tr className="bg-gradient-to-r from-slate-700/80 to-slate-700/50 text-gray-200 text-[10px] xs:text-xs sm:text-sm font-bold border-b border-slate-700 transition-colors duration-300">
                <th rowSpan={3} className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-r border-slate-700 sticky left-0 z-30 bg-slate-700/80 transition-colors duration-300">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      selectedRows.size === paginatedItems.length
                    }
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 xs:w-4 xs:h-4 cursor-pointer accent-blue-600"
                  />
                </th>
                <th rowSpan={3} className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-r border-slate-700 sticky left-8 xs:left-10 sm:left-12 z-30 bg-slate-700/80 transition-colors duration-300 min-w-[120px] xs:min-w-[140px] sm:min-w-[150px]">
                  Item Name
                </th>
                <th rowSpan={3} className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-r border-slate-700 bg-slate-700/80 transition-colors duration-300 hidden xs:table-cell">
                  Group
                </th>
                <th rowSpan={3} className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-r border-slate-700 bg-slate-700/80 transition-colors duration-300 hidden sm:table-cell">
                  Category
                </th>
                {uniqueVariationValues.length > 0 && (
                  <th colSpan={uniqueVariationValues.length * 4} className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-b border-slate-700 bg-slate-700/80 transition-colors duration-300 uppercase tracking-widest font-bold text-xs sm:text-sm lg:text-base text-blue-300">
                    Variyation
                  </th>
                )}
              </tr>

              {/* Row 2: Variation Values (e.g., 250 Gms, 500 Gms) */}
              <tr className="bg-slate-700/50 text-gray-300 text-[8px] xs:text-[9px] sm:text-xs font-bold border-b border-slate-700 uppercase tracking-wider transition-colors duration-300">
                {uniqueVariationValues.map((v) => (
                  <th key={v} colSpan={4} className="px-1 xs:px-1.5 sm:px-2 py-1.5 xs:py-2 sm:py-2 text-center border-r border-slate-700 bg-slate-700/50 transition-colors duration-300">
                    {v}
                  </th>
                ))}
              </tr>

              {/* Row 3: Channels (Dining, parcal, Swiggy, zomato) */}
              <tr className="bg-slate-800/50 text-gray-400 text-[7px] xs:text-[8px] sm:text-[9px] font-bold border-b border-slate-700 uppercase tracking-tighter transition-colors duration-300">
                {uniqueVariationValues.map((v) => (
                  <React.Fragment key={`${v}-channels`}>
                    <th className="px-0.5 xs:px-1 sm:px-1.5 py-1 xs:py-1.5 sm:py-2 text-center border-r border-slate-700 min-w-[50px] xs:min-w-[55px] sm:min-w-[60px]">Dining</th>
                    <th className="px-0.5 xs:px-1 sm:px-1.5 py-1 xs:py-1.5 sm:py-2 text-center border-r border-slate-700 min-w-[50px] xs:min-w-[55px] sm:min-w-[60px]">Parcal</th>
                    <th className="px-0.5 xs:px-1 sm:px-1.5 py-1 xs:py-1.5 sm:py-2 text-center border-r border-slate-700 min-w-[50px] xs:min-w-[55px] sm:min-w-[60px]">Swiggy</th>
                    <th className="px-0.5 xs:px-1 sm:px-1.5 py-1 xs:py-1.5 sm:py-2 text-center border-r border-slate-700 min-w-[50px] xs:min-w-[55px] sm:min-w-[60px]">Zomato</th>
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
                  className={`border-b border-slate-700 transition-colors duration-300 cursor-pointer text-[8px] xs:text-[9px] sm:text-xs whitespace-nowrap ${
                    selectedRows.has(item.itemId) ? "bg-blue-600/20" : "bg-slate-800/50 hover:bg-slate-700/50"
                  }`}
                >
                  {/* Checkbox - Sticky */}
                  <td className={`px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center border-r border-slate-700 sticky left-0 z-10 transition-colors duration-300 ${selectedRows.has(item.itemId) ? "bg-blue-600/20" : "bg-slate-800/50"}`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.itemId)}
                      onChange={() => toggleRowSelection(item.itemId)}
                      className="w-3.5 h-3.5 xs:w-4 xs:h-4 accent-blue-500"
                    />
                  </td>

                  {/* Basic Info - Sticky Item Name */}
                  <td className={`px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-white font-bold xs:font-black sticky left-8 xs:left-10 sm:left-12 z-10 border-r border-slate-700 min-w-[120px] xs:min-w-[140px] sm:min-w-[150px] first-letter:capitalize transition-colors duration-300 ${selectedRows.has(item.itemId) ? "bg-blue-600/20" : "bg-slate-800/50"}`}>
                    {item.itemName}
                  </td>
                  <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-300 border-r border-slate-700 text-center font-bold hidden xs:table-cell transition-colors duration-300">
                    {item.group}
                  </td>
                  <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-300 border-r border-slate-700 text-center font-bold hidden sm:table-cell transition-colors duration-300">
                    {item.category}
                  </td>

                  {/* Variation Prices */}
                  {uniqueVariationValues.map((v) => (
                    <React.Fragment key={`${item.itemId}-${v}-prices`}>
                      <td className="px-0.5 xs:px-1 sm:px-1.5 py-2 xs:py-2.5 sm:py-3 text-center border-r border-slate-700 font-semibold text-gray-300">{getPrice(item, v, "Dining")}</td>
                      <td className="px-0.5 xs:px-1 sm:px-1.5 py-2 xs:py-2.5 sm:py-3 text-center border-r border-slate-700 font-semibold text-gray-300">{getPrice(item, v, "Parcal")}</td>
                      <td className="px-0.5 xs:px-1 sm:px-1.5 py-2 xs:py-2.5 sm:py-3 text-center border-r border-slate-700 font-bold text-blue-400">{getPrice(item, v, "Swiggy")}</td>
                      <td className="px-0.5 xs:px-1 sm:px-1.5 py-2 xs:py-2.5 sm:py-3 text-center border-r border-slate-700 font-bold text-orange-400">{getPrice(item, v, "Zomato")}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="px-3 xs:px-4 sm:px-6 py-3 xs:py-4 border-t border-slate-700 flex flex-col gap-3 xs:gap-4 bg-slate-800/30 transition-colors duration-300">
          {/* Info Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-[10px] xs:text-xs sm:text-sm text-gray-400 transition-colors duration-300">
              {selectedRows.size > 0 && (
                <span className="font-medium text-blue-300">{selectedRows.size} selected · </span>
              )}
              <span className="hidden xs:inline">Showing {startIdx + 1} to{" "}</span>
              {Math.min(startIdx + itemsPerPage, items.length)}<span className="hidden xs:inline"> of {items.length}</span>
            </div>

            <div className="flex items-center gap-1.5 xs:gap-2">
              <span className="text-[9px] xs:text-xs sm:text-sm text-gray-500 transition-colors duration-300">Rows:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="text-[9px] xs:text-xs sm:text-sm border border-slate-600 rounded px-1.5 xs:px-2 py-0.5 xs:py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white transition-colors duration-300"
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
              className="p-1 xs:p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors duration-300 text-gray-400 hover:text-gray-300"
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
                    className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded text-[9px] xs:text-xs sm:text-sm font-medium transition-all duration-300 ${
                      currentPage === displayIdx
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/60"
                        : "hover:bg-slate-700 text-gray-400 hover:text-gray-300"
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
              className="p-1 xs:p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors duration-300 text-gray-400 hover:text-gray-300"
            >
              <ChevronRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

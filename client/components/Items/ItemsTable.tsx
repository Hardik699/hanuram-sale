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
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40 border border-slate-700/50 rounded-2xl p-8 sm:p-12 text-center shadow-lg shadow-slate-900/50 transition-all duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm sm:text-base font-medium">No items added yet</p>
          <p className="text-gray-500 text-xs sm:text-sm">Start by creating your first item to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Responsive Table */}
      <div className="bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl shadow-slate-900/50 transition-all duration-300">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-transparent">
          <table className="w-full min-w-full border-collapse">
            {/* Table Header */}
            <thead>
              {/* Row 1: Basic Info and Variation (merged) */}
              <tr className="bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/80 text-gray-100 text-[10px] xs:text-xs sm:text-sm font-bold border-b-2 border-slate-700/60 transition-colors duration-300">
                <th rowSpan={3} className="px-3 xs:px-4 sm:px-5 py-3 xs:py-4 sm:py-5 text-center border-r border-slate-700/50 sticky left-0 z-30 bg-gradient-to-r from-slate-900/90 to-slate-800/80 transition-colors duration-300 hover:bg-slate-800/90">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedItems.length > 0 &&
                        selectedRows.size === paginatedItems.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 xs:w-5 xs:h-5 cursor-pointer accent-blue-500 rounded"
                    />
                  </div>
                </th>
                <th rowSpan={3} className="px-3 xs:px-4 sm:px-5 py-3 xs:py-4 sm:py-5 text-left border-r-2 border-blue-500/40 sticky left-11 xs:left-12 sm:left-16 z-30 bg-gradient-to-r from-slate-900/90 to-slate-800/80 transition-colors duration-300 hover:bg-slate-800/90 min-w-[140px] xs:min-w-[160px] sm:min-w-[180px] font-semibold text-white">
                  Item Name
                </th>
                <th rowSpan={3} className="px-3 xs:px-4 sm:px-5 py-3 xs:py-4 sm:py-5 text-center border-r-2 border-blue-500/40 bg-gradient-to-r from-slate-800/70 to-slate-900/70 transition-colors duration-300 hover:bg-slate-800/80 hidden xs:table-cell font-semibold text-gray-100">
                  Group
                </th>
                <th rowSpan={3} className="px-3 xs:px-4 sm:px-5 py-3 xs:py-4 sm:py-5 text-center border-r-2 border-blue-500/40 bg-gradient-to-r from-slate-800/70 to-slate-900/70 transition-colors duration-300 hover:bg-slate-800/80 hidden sm:table-cell font-semibold text-gray-100">
                  Category
                </th>
                {uniqueVariationValues.length > 0 && (
                  <th colSpan={uniqueVariationValues.length * 4} className="px-6 xs:px-8 sm:px-10 py-4 xs:py-5 sm:py-6 text-center bg-gradient-to-r from-blue-950/40 via-blue-900/30 to-blue-950/40 border-b-2 border-blue-500/30 transition-colors duration-300 uppercase tracking-wider font-bold text-xs sm:text-sm text-blue-100">
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      Pricing by Variation
                    </span>
                  </th>
                )}
              </tr>

              {/* Row 2: Variation Values (e.g., 250 Gms, 500 Gms) */}
              <tr className="bg-gradient-to-r from-slate-800/30 via-slate-800/40 to-slate-800/30 text-gray-200 text-[8px] xs:text-[9px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300">
                {uniqueVariationValues.map((v, idx) => (
                  <th key={v} colSpan={4} className="px-3 xs:px-4 sm:px-5 py-3 xs:py-4 sm:py-5 text-center bg-gradient-to-b from-blue-900/40 to-blue-900/20 border border-blue-500/30 rounded-xl transition-all duration-300 hover:bg-blue-900/50 hover:border-blue-500/50 mx-1 shadow-sm">
                    <span className="text-blue-100 font-semibold flex items-center justify-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      {v}
                    </span>
                  </th>
                ))}
              </tr>

              {/* Row 3: Channels (Dining, parcal, Swiggy, zomato) */}
              <tr className="bg-gradient-to-r from-slate-800/20 via-slate-800/30 to-slate-800/20 text-gray-300 text-[7px] xs:text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-colors duration-300">
                {uniqueVariationValues.map((v, idx) => (
                  <React.Fragment key={`${v}-channels`}>
                    <th className="px-1 xs:px-1.5 sm:px-2 py-2 xs:py-3 sm:py-3.5 text-center border border-blue-500/25 min-w-[55px] xs:min-w-[65px] sm:min-w-[75px] mx-0.5 rounded-lg bg-blue-900/20 hover:bg-blue-900/40 transition-colors duration-300 font-semibold text-blue-100">Dining</th>
                    <th className="px-1 xs:px-1.5 sm:px-2 py-2 xs:py-3 sm:py-3.5 text-center border border-blue-500/25 min-w-[55px] xs:min-w-[65px] sm:min-w-[75px] mx-0.5 rounded-lg bg-blue-900/20 hover:bg-blue-900/40 transition-colors duration-300 font-semibold text-blue-100">Parcal</th>
                    <th className="px-1 xs:px-1.5 sm:px-2 py-2 xs:py-3 sm:py-3.5 text-center border border-purple-500/25 min-w-[55px] xs:min-w-[65px] sm:min-w-[75px] mx-0.5 rounded-lg bg-purple-900/20 hover:bg-purple-900/40 transition-colors duration-300 font-semibold text-purple-100">Swiggy</th>
                    <th className="px-1 xs:px-1.5 sm:px-2 py-2 xs:py-3 sm:py-3.5 text-center border border-red-500/25 min-w-[55px] xs:min-w-[65px] sm:min-w-[75px] mx-0.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 transition-colors duration-300 font-semibold text-red-100">Zomato</th>
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
                  className={`border-b border-slate-700/30 transition-all duration-300 cursor-pointer text-[8px] xs:text-[9px] sm:text-xs whitespace-nowrap group hover:shadow-lg hover:shadow-blue-500/10 ${
                    selectedRows.has(item.itemId) ? "bg-blue-600/15 hover:bg-blue-600/25" : "bg-slate-800/30 hover:bg-slate-800/60"
                  }`}
                >
                  {/* Checkbox - Sticky */}
                  <td className={`px-3 xs:px-4 sm:px-5 py-3 xs:py-4 sm:py-5 text-center border-r border-slate-700/30 sticky left-0 z-10 transition-all duration-300 ${selectedRows.has(item.itemId) ? "bg-blue-600/15" : "bg-slate-800/30 group-hover:bg-slate-800/60"}`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.itemId)}
                      onChange={() => toggleRowSelection(item.itemId)}
                      className="w-4 h-4 xs:w-5 xs:h-5 accent-blue-500 rounded cursor-pointer"
                    />
                  </td>

                  {/* Basic Info - Sticky Item Name */}
                  <td className={`px-3 xs:px-4 sm:px-5 py-3 xs:py-4 sm:py-5 text-white font-semibold xs:font-bold sticky left-11 xs:left-12 sm:left-16 z-10 border-r border-slate-700/30 min-w-[140px] xs:min-w-[160px] sm:min-w-[180px] first-letter:capitalize transition-all duration-300 ${selectedRows.has(item.itemId) ? "bg-blue-600/15" : "bg-slate-800/30 group-hover:bg-slate-800/60"}`}>
                    <span className="truncate block">{item.itemName}</span>
                  </td>
                  <td className="px-3 xs:px-4 sm:px-5 py-3 xs:py-4 sm:py-5 text-gray-300 border-r border-slate-700/30 text-center font-medium hidden xs:table-cell transition-colors duration-300 group-hover:text-gray-200">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-slate-700/40 group-hover:bg-slate-700/60 transition-colors">{item.group}</span>
                  </td>
                  <td className="px-3 xs:px-4 sm:px-5 py-3 xs:py-4 sm:py-5 text-gray-300 border-r border-slate-700/30 text-center font-medium hidden sm:table-cell transition-colors duration-300 group-hover:text-gray-200">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-slate-700/40 group-hover:bg-slate-700/60 transition-colors">{item.category}</span>
                  </td>

                  {/* Variation Prices */}
                  {uniqueVariationValues.map((v, idx) => (
                    <React.Fragment key={`${item.itemId}-${v}-prices`}>
                      <td className="px-1 xs:px-1.5 sm:px-2 py-3 xs:py-4 sm:py-5 text-center border border-slate-700/20 font-semibold text-gray-200 mx-0.5 rounded-lg bg-blue-900/15 hover:bg-blue-900/30 transition-colors duration-300">{getPrice(item, v, "Dining")}</td>
                      <td className="px-1 xs:px-1.5 sm:px-2 py-3 xs:py-4 sm:py-5 text-center border border-slate-700/20 font-semibold text-gray-200 mx-0.5 rounded-lg bg-blue-900/15 hover:bg-blue-900/30 transition-colors duration-300">{getPrice(item, v, "Parcal")}</td>
                      <td className="px-1 xs:px-1.5 sm:px-2 py-3 xs:py-4 sm:py-5 text-center border border-slate-700/20 font-bold text-purple-300 mx-0.5 rounded-lg bg-purple-900/15 hover:bg-purple-900/30 transition-colors duration-300">{getPrice(item, v, "Swiggy")}</td>
                      <td className="px-1 xs:px-1.5 sm:px-2 py-3 xs:py-4 sm:py-5 text-center border border-slate-700/20 font-bold text-red-300 mx-0.5 rounded-lg bg-red-900/15 hover:bg-red-900/30 transition-colors duration-300">{getPrice(item, v, "Zomato")}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="px-4 xs:px-6 sm:px-8 py-4 xs:py-5 sm:py-6 border-t-2 border-slate-700/50 flex flex-col gap-4 xs:gap-5 bg-gradient-to-r from-slate-800/40 via-slate-800/30 to-slate-800/40 transition-colors duration-300">
          {/* Info Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[10px] xs:text-xs sm:text-sm text-gray-300 transition-colors duration-300 font-medium">
              {selectedRows.size > 0 && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span className="text-blue-200">{selectedRows.size} selected</span>
                </span>
              )}
              {!selectedRows.size && (
                <span>
                  <span className="hidden xs:inline">Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, items.length)} of </span>
                  <span className="font-semibold text-gray-100">{items.length} items</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 xs:gap-3">
              <span className="text-[9px] xs:text-xs sm:text-sm text-gray-400 font-medium">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="text-[9px] xs:text-xs sm:text-sm border border-slate-600/60 rounded-lg px-2.5 xs:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-gray-100 font-medium hover:bg-slate-700/70 transition-colors duration-300"
              >
                {[5, 10, 15, 20, 30, 50].map((value) => (
                  <option key={value} value={value} className="bg-slate-800">
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-1.5 xs:p-2 hover:bg-slate-700/70 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 text-gray-400 hover:text-gray-300 border border-slate-700/50 hover:border-slate-600/60"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                // Show first 5 pages or adjust for current page context
                const displayIdx = totalPages <= 5 ? idx : Math.max(0, Math.min(idx + Math.max(0, currentPage - 2), totalPages - 5)) + idx;

                return (
                  <button
                    key={displayIdx}
                    onClick={() => setCurrentPage(displayIdx)}
                    className={`min-w-[32px] h-8 xs:min-w-[36px] xs:h-9 sm:min-w-[40px] sm:h-10 rounded-lg text-[9px] xs:text-xs sm:text-sm font-semibold transition-all duration-300 border ${
                      currentPage === displayIdx
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500 shadow-lg shadow-blue-500/40 scale-105"
                        : "border-slate-700/50 hover:border-slate-600/60 text-gray-400 hover:text-gray-300 hover:bg-slate-700/40"
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
              className="p-1.5 xs:p-2 hover:bg-slate-700/70 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 text-gray-400 hover:text-gray-300 border border-slate-700/50 hover:border-slate-600/60"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

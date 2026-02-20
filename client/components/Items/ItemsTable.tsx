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
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No items added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Responsive Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full min-w-full border-collapse">
            {/* Table Header */}
            <thead>
              {/* Row 1: Basic Info and Variyation (merged) */}
              <tr className="bg-gray-100 text-gray-700 text-xs sm:text-sm font-bold border-b border-gray-200">
                <th rowSpan={3} className="px-2 sm:px-4 py-3 text-center border-r border-gray-200 sticky left-0 z-30 bg-gray-100">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      selectedRows.size === paginatedItems.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th rowSpan={3} className="px-2 sm:px-4 py-3 text-center border-r border-gray-200 sticky left-10 z-30 bg-gray-100 min-w-[150px]">
                  Item Name
                </th>
                <th rowSpan={3} className="px-2 sm:px-4 py-3 text-center border-r border-gray-200 bg-gray-100">
                  Group
                </th>
                <th rowSpan={3} className="px-2 sm:px-4 py-3 text-center border-r border-gray-200 bg-gray-100">
                  Category
                </th>
                {uniqueVariationValues.length > 0 && (
                  <th colSpan={uniqueVariationValues.length * 4} className="px-2 sm:px-4 py-3 text-center border-b border-gray-200 bg-gray-100 uppercase tracking-widest font-black text-lg">
                    Variyation
                  </th>
                )}
              </tr>

              {/* Row 2: Variation Values (e.g., 250 Gms, 500 Gms) */}
              <tr className="bg-white text-gray-600 text-[10px] sm:text-xs font-bold border-b border-gray-200 uppercase tracking-wider">
                {uniqueVariationValues.map((v) => (
                  <th key={v} colSpan={4} className="px-2 sm:px-4 py-2 text-center border-r border-gray-200 bg-gray-50">
                    {v}
                  </th>
                ))}
              </tr>

              {/* Row 3: Channels (Dining, parcal, Swiggy, zomato) */}
              <tr className="bg-white text-gray-500 text-[9px] sm:text-[10px] font-bold border-b border-gray-200 uppercase tracking-tighter">
                {uniqueVariationValues.map((v) => (
                  <React.Fragment key={`${v}-channels`}>
                    <th className="px-1 sm:px-2 py-2 text-center border-r border-gray-200 min-w-[60px]">Dining</th>
                    <th className="px-1 sm:px-2 py-2 text-center border-r border-gray-200 min-w-[60px]">parcal</th>
                    <th className="px-1 sm:px-2 py-2 text-center border-r border-gray-200 min-w-[60px]">Swiggy</th>
                    <th className="px-1 sm:px-2 py-2 text-center border-r border-gray-200 min-w-[60px]">zomato</th>
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
                  className={`border-b border-gray-200 hover:bg-blue-50 transition cursor-pointer text-[10px] sm:text-xs whitespace-nowrap ${
                    selectedRows.has(item.itemId) ? "bg-blue-100" : ""
                  }`}
                >
                  {/* Checkbox - Sticky */}
                  <td className={`px-2 sm:px-4 py-3 text-center border-r border-gray-200 sticky left-0 z-10 transition-colors ${selectedRows.has(item.itemId) ? "bg-blue-100" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.itemId)}
                      onChange={() => toggleRowSelection(item.itemId)}
                      className="w-4 h-4"
                    />
                  </td>

                  {/* Basic Info - Sticky Item Name */}
                  <td className={`px-2 sm:px-4 py-3 text-gray-900 font-black sticky left-10 z-10 border-r border-gray-200 min-w-[150px] first-letter:capitalize transition-colors ${selectedRows.has(item.itemId) ? "bg-blue-100" : "bg-white"}`}>
                    {item.itemName}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-gray-700 border-r border-gray-200 text-center font-bold">
                    {item.group}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-gray-700 border-r border-gray-200 text-center font-bold">
                    {item.category}
                  </td>

                  {/* Variation Prices */}
                  {uniqueVariationValues.map((v) => (
                    <React.Fragment key={`${item.itemId}-${v}-prices`}>
                      <td className="px-1 sm:px-2 py-3 text-center border-r border-gray-100 font-medium">{getPrice(item, v, "Dining")}</td>
                      <td className="px-1 sm:px-2 py-3 text-center border-r border-gray-100 font-medium">{getPrice(item, v, "parcal")}</td>
                      <td className="px-1 sm:px-2 py-3 text-center border-r border-gray-100 font-medium text-blue-600 font-black">{getPrice(item, v, "Swiggy")}</td>
                      <td className="px-1 sm:px-2 py-3 text-center border-r border-gray-300 font-medium text-orange-600 font-black">{getPrice(item, v, "zomato")}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <div className="text-xs sm:text-sm text-gray-600">
              {selectedRows.size > 0 && (
                <span className="font-medium">{selectedRows.size} selected · </span>
              )}
              Showing {startIdx + 1} to{" "}
              {Math.min(startIdx + itemsPerPage, items.length)} of {items.length}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-500">Rows:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
              >
                {[5, 10, 15, 20, 30, 50].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition ${
                    currentPage === idx
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CHANNELS = ["Dining", "Parcale", "Swiggy", "Zomato"];
const ITEMS_PER_PAGE = 5;

interface ItemsTableProps {
  items: any[];
}

export default function ItemsTable({ items }: ItemsTableProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const allVariations = Array.from(
    new Set(
      items.flatMap((item) =>
        item.variations.map((v: any) => JSON.stringify({ name: v.name, value: v.value }))
      )
    )
  ).map((v) => JSON.parse(v));

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
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-gray-100 rounded-full">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-600 font-semibold">No items yet</p>
        <p className="text-gray-500 text-sm mt-1">Create your first item to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Responsive Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full min-w-full">
            {/* Table Header */}
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 text-xs sm:text-sm whitespace-nowrap">
                {/* Checkbox - Sticky */}
                <th className="px-2 sm:px-4 py-4 text-left w-10 sticky left-0 z-20 bg-gradient-to-r from-purple-50 to-purple-100">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      selectedRows.size === paginatedItems.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer accent-purple-600"
                  />
                </th>

                {/* Basic Info - Sticky */}
                <th className="px-2 sm:px-4 py-4 text-left font-semibold text-gray-900 bg-gradient-to-r from-purple-50 to-purple-100 sticky left-10 z-20">
                  Item ID
                </th>
                <th className="px-2 sm:px-4 py-4 text-left font-semibold text-gray-900 bg-gradient-to-r from-purple-50 to-purple-100 hidden sm:table-cell">
                  Group
                </th>
                <th className="px-2 sm:px-4 py-4 text-left font-semibold text-gray-900 bg-gradient-to-r from-purple-50 to-purple-100 hidden md:table-cell">
                  Category
                </th>
                <th className="px-2 sm:px-4 py-4 text-left font-semibold text-gray-900 bg-gradient-to-r from-purple-50 to-purple-100 hidden lg:table-cell">
                  Item Name
                </th>

                {/* Variation Columns - Show all variations with better spacing */}
                {allVariations.map((variation, idx) => (
                  <th
                    key={`${variation.name}-${variation.value}`}
                    colSpan={4}
                    className={`px-3 sm:px-4 py-4 text-center text-sm font-bold text-purple-900 border-l border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100`}
                  >
                    {variation.value}
                  </th>
                ))}
              </tr>

              {/* Sub-header for Channels - Show all variations */}
              {allVariations.length > 0 && (
                <tr className="bg-purple-100 border-b border-purple-200 text-xs whitespace-nowrap">
                  <th colSpan={5} className="px-2 sm:px-4 py-0 sticky left-10 z-20 bg-purple-100"></th>
                  {allVariations.map((variation, idx) => (
                    <React.Fragment key={`${variation.name}-${variation.value}`}>
                      {CHANNELS.map((channel) => (
                        <th
                          key={`${variation.value}-${channel}`}
                          className={`px-3 sm:px-4 py-3 text-center font-semibold text-gray-700 border-r border-purple-200 bg-purple-100`}
                        >
                          {channel}
                        </th>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
              )}
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedItems.map((item) => (
                <tr
                  key={item.itemId}
                  onClick={() => navigate(`/items/${item.itemId}`)}
                  className={`border-b border-gray-100 hover:bg-purple-50 transition cursor-pointer text-xs sm:text-sm whitespace-nowrap ${
                    selectedRows.has(item.itemId) ? "bg-purple-100" : "bg-white"
                  }`}
                >
                  {/* Checkbox - Sticky */}
                  <td className="px-2 sm:px-4 py-4 text-center w-10 sticky left-0 z-10 bg-inherit" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.itemId)}
                      onChange={() => toggleRowSelection(item.itemId)}
                      className="w-4 h-4 accent-purple-600"
                    />
                  </td>

                  {/* Basic Info - Sticky */}
                  <td className="px-2 sm:px-4 py-4 text-gray-900 font-bold bg-inherit sticky left-10 z-10">
                    <span className="sm:hidden">ID: </span>
                    {item.itemId}
                  </td>
                  <td className="px-2 sm:px-4 py-4 text-gray-700 bg-inherit hidden sm:table-cell">
                    {item.group}
                  </td>
                  <td className="px-2 sm:px-4 py-4 text-gray-700 hidden md:table-cell">
                    {item.category}
                  </td>
                  <td className="px-2 sm:px-4 py-4 text-gray-900 font-medium hidden lg:table-cell max-w-xs truncate">
                    {item.itemName}
                  </td>

                  {/* Variation Prices - Show all variations and channels */}
                  {allVariations.map((variation, idx) => {
                    const itemVariation = item.variations.find(
                      (v: any) =>
                        v.name === variation.name && v.value === variation.value
                    );

                    return (
                      <React.Fragment
                        key={`${item.itemId}-${variation.value}`}
                      >
                        {CHANNELS.map((channel) => (
                          <td
                            key={`${item.itemId}-${variation.value}-${channel}`}
                            className={`px-3 sm:px-4 py-4 text-center font-semibold border-r border-gray-100 bg-inherit text-gray-900`}
                          >
                            {itemVariation && itemVariation.channels[channel]
                              ? `₹${itemVariation.channels[channel]}`
                              : "-"}
                          </td>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="px-4 sm:px-6 py-5 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs sm:text-sm text-gray-700 font-medium">
            {selectedRows.size > 0 && (
              <span className="font-semibold text-purple-600">{selectedRows.size} selected</span>
            )}
            {selectedRows.size > 0 && " · "}
            <span>Showing {startIdx + 1} to{" "}
            {Math.min(startIdx + ITEMS_PER_PAGE, items.length)} of {items.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:hover:bg-gray-50 transition text-gray-700"
              title="Previous page"
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
                      ? "bg-purple-600 text-white shadow-md"
                      : "hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:hover:bg-gray-50 transition text-gray-700"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No items added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Responsive Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            {/* Table Header */}
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs sm:text-sm">
                {/* Checkbox */}
                <th className="px-2 sm:px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      selectedRows.size === paginatedItems.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                </th>

                {/* Basic Info */}
                <th className="px-2 sm:px-4 py-3 text-left font-semibold text-gray-700 bg-gray-100">
                  Item ID
                </th>
                <th className="px-2 sm:px-4 py-3 text-left font-semibold text-gray-700 bg-gray-100 hidden sm:table-cell">
                  Group
                </th>
                <th className="px-2 sm:px-4 py-3 text-left font-semibold text-gray-700 bg-gray-100 hidden md:table-cell">
                  Category
                </th>
                <th className="px-2 sm:px-4 py-3 text-left font-semibold text-gray-700 bg-gray-100 hidden lg:table-cell">
                  Item Name
                </th>

                {/* Variation Columns - Hidden on small screens */}
                {allVariations.slice(0, 2).map((variation) => (
                  <th
                    key={`${variation.name}-${variation.value}`}
                    colSpan={2}
                    className="px-2 sm:px-4 py-3 text-center text-xs font-semibold text-gray-700 border-l border-gray-200 hidden md:table-cell"
                  >
                    {variation.value}
                  </th>
                ))}
              </tr>

              {/* Sub-header for Channels - Hidden on small screens */}
              {allVariations.length > 0 && (
                <tr className="bg-gray-50 border-b border-gray-200 hidden md:table-row">
                  <th colSpan={4} className="px-2 sm:px-4 py-3"></th>
                  {allVariations.slice(0, 2).map((variation) => (
                    <React.Fragment key={`${variation.name}-${variation.value}`}>
                      {CHANNELS.slice(0, 2).map((channel) => (
                        <th
                          key={`${variation.value}-${channel}`}
                          className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-600 border-l border-gray-200"
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
                  className={`border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer text-xs sm:text-sm ${
                    selectedRows.has(item.itemId) ? "bg-blue-50" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-2 sm:px-4 py-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.itemId)}
                      onChange={() => toggleRowSelection(item.itemId)}
                      className="w-4 h-4"
                    />
                  </td>

                  {/* Basic Info */}
                  <td className="px-2 sm:px-4 py-3 text-gray-900 font-medium bg-gray-50">
                    <span className="sm:hidden">ID: </span>
                    {item.itemId}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-gray-700 bg-gray-50 hidden sm:table-cell">
                    {item.group}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-gray-700 hidden md:table-cell">
                    {item.category}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-gray-900 font-medium hidden lg:table-cell max-w-xs truncate">
                    {item.itemName}
                  </td>

                  {/* Variation Prices - Only show first 2 variations on mobile */}
                  {allVariations.slice(0, 2).map((variation) => {
                    const itemVariation = item.variations.find(
                      (v: any) =>
                        v.name === variation.name && v.value === variation.value
                    );

                    return (
                      <React.Fragment
                        key={`${item.itemId}-${variation.value}`}
                      >
                        {CHANNELS.slice(0, 2).map((channel) => (
                          <td
                            key={`${item.itemId}-${variation.value}-${channel}`}
                            className="px-2 sm:px-4 py-3 text-center font-medium text-gray-900 border-l border-gray-200 hidden md:table-cell"
                          >
                            {itemVariation
                              ? `₹${itemVariation.channels[channel] || "-"}`
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
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs sm:text-sm text-gray-600">
            {selectedRows.size > 0 && (
              <span className="font-medium">{selectedRows.size} selected · </span>
            )}
            Showing {startIdx + 1} to{" "}
            {Math.min(startIdx + ITEMS_PER_PAGE, items.length)} of {items.length}
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

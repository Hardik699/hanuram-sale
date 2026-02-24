import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

interface ItemsTableProps {
  items: any[];
}

export default function ItemsTable({ items }: ItemsTableProps) {
  const navigate = useNavigate();
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIdx = currentPage * itemsPerPage;
  const paginatedItems = items.slice(startIdx, startIdx + itemsPerPage);

  // Get stock status
  const getStockStatus = (item: any) => {
    const totalUnits = item.variations?.reduce((sum: number, v: any) => sum + (v.units || 0), 0) || 0;
    if (totalUnits === 0) return { label: "Out of Stock", color: "bg-red-500/20 text-red-300 border-red-500/30" };
    if (totalUnits < 100) return { label: "Low Stock", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
    return { label: "In Stock", color: "bg-green-500/20 text-green-300 border-green-500/30" };
  };

  // Format date
  const formatDate = (date: any) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "-";
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
      {/* Simple Table */}
      <div className="bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl shadow-slate-900/50 transition-all duration-300">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-transparent">
          <table className="w-full border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/80 text-gray-100 text-xs sm:text-sm font-bold border-b-2 border-slate-700/60">
                <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-100 sticky left-0 z-10 bg-gradient-to-r from-slate-900/90 to-slate-800/80">Item ID</th>
                <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-100">Item Name</th>
                <th className="px-4 sm:px-6 py-4 text-center font-semibold text-gray-100 hidden sm:table-cell">Category</th>
                <th className="px-4 sm:px-6 py-4 text-center font-semibold text-gray-100 hidden xs:table-cell">Units</th>
                <th className="px-4 sm:px-6 py-4 text-center font-semibold text-gray-100 hidden md:table-cell">Date Added</th>
                <th className="px-4 sm:px-6 py-4 text-center font-semibold text-gray-100">Status</th>
                <th className="px-4 sm:px-6 py-4 text-center font-semibold text-gray-100 sticky right-0 z-10 bg-gradient-to-l from-slate-800/80 to-transparent w-12"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedItems.map((item, idx) => {
                const status = getStockStatus(item);
                const totalUnits = item.variations?.reduce((sum: number, v: any) => sum + (v.units || 0), 0) || 0;
                
                return (
                  <tr
                    key={item.itemId}
                    onClick={() => navigate(`/items/${item.itemId}`)}
                    className="border-b border-slate-700/30 transition-all duration-300 cursor-pointer group hover:bg-slate-800/60 bg-slate-800/30"
                  >
                    <td className="px-4 sm:px-6 py-4 text-sm font-bold text-blue-300 sticky left-0 z-10 bg-slate-800/30 group-hover:bg-slate-800/60">
                      {item.itemId}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-white truncate max-w-xs">
                      {item.itemName}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-300 text-center hidden sm:table-cell">
                      <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-700/50 text-gray-100 font-medium">
                        {item.category || "-"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-300 text-center font-medium hidden xs:table-cell">
                      {totalUnits} units
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-400 text-center hidden md:table-cell">
                      {formatDate(item.createdAt || item.updatedAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center sticky right-0 z-10 bg-slate-800/30 group-hover:bg-slate-800/60" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-gray-400 hover:text-gray-300">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="px-4 sm:px-6 py-4 border-t-2 border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-800/40 via-slate-800/30 to-slate-800/40">
          {/* Info */}
          <div className="text-xs sm:text-sm text-gray-400 font-medium">
            Showing <span className="text-gray-100 font-semibold">{startIdx + 1}</span> to{" "}
            <span className="text-gray-100 font-semibold">{Math.min(startIdx + itemsPerPage, items.length)}</span> of{" "}
            <span className="text-gray-100 font-semibold">{items.length}</span> items
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-1.5 hover:bg-slate-700/50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-400 hover:text-gray-300 border border-slate-700/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                const displayIdx = totalPages <= 5 ? idx : Math.max(0, Math.min(idx + Math.max(0, currentPage - 2), totalPages - 5)) + idx;

                return (
                  <button
                    key={displayIdx}
                    onClick={() => setCurrentPage(displayIdx)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all border ${
                      currentPage === displayIdx
                        ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/40"
                        : "border-slate-700/50 text-gray-400 hover:text-gray-300 hover:bg-slate-700/40"
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
              className="p-1.5 hover:bg-slate-700/50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-400 hover:text-gray-300 border border-slate-700/50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Rows per page */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700/50 ml-2">
              <span className="text-xs text-gray-500">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="text-xs border border-slate-600/60 rounded px-2 py-1 bg-slate-700/50 text-gray-100 font-medium hover:bg-slate-700/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[5, 10, 15, 20, 30].map((value) => (
                  <option key={value} value={value} className="bg-slate-800">
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Upload } from "lucide-react";
import UploadTab from "@/components/UploadTab";

const UPLOAD_TYPES = [
  { id: "petpooja", label: "Petpooja Upload", color: "bg-blue-600" },
  { id: "pain_lebs", label: "Pain Labs Upload", color: "bg-orange-600" },
  { id: "website", label: "Website Upload", color: "bg-blue-500" }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const currentTab = UPLOAD_TYPES[activeTab];

  return (
    <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-slate-900">
      {/* Header Section */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm transition-colors duration-300">
        <div className="px-6 sm:px-8 py-5 sm:py-6 flex justify-between items-center gap-4">
          <div className="group cursor-default flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-md shadow-blue-600/30">
                <Upload className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-300">
                Data Upload
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium ml-11 mt-1 transition-colors duration-300">
              Manage and monitor your uploads
            </p>
          </div>
          <button
            onClick={() => navigate("/items")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/40 font-semibold transition-all duration-300 text-xs sm:text-sm hover:scale-105 group relative overflow-hidden whitespace-nowrap hover:bg-blue-700"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <Package className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span className="relative">Items</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 sm:px-8 py-8 max-w-7xl mx-auto">
        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-3 scroll-smooth">
            {UPLOAD_TYPES.map((tab, idx) => {
              const isActive = activeTab === idx;
              const tabColor = isActive ? "bg-blue-600" : "bg-slate-100 dark:bg-slate-800";
              const tabTextColor = isActive ? "text-white" : "text-slate-600 dark:text-slate-400";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 sm:px-6 py-2.5 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 flex items-center gap-2 group relative overflow-hidden ${
                    isActive
                      ? `${tabColor} ${tabTextColor} shadow-md hover:shadow-lg transform`
                      : `${tabColor} ${tabTextColor} hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700`
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  {tab.label}
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <UploadTab type={currentTab.id} />
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-8 transition-colors duration-300">
        <div className="px-6 sm:px-8 py-4 text-center">
          <p className="text-slate-500 dark:text-slate-500 text-xs transition-colors duration-300">
            Hanuram Data Management • All Rights Reserved © 2024
          </p>
        </div>
      </div>
    </div>
  );
}

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
      <div className="border-b-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-lg transition-colors duration-300">
        <div className="px-6 sm:px-8 py-8 sm:py-10 flex justify-between items-center gap-6">
          <div className="group cursor-default">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-600/50">
                <Upload className="w-7 h-7 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white transition-colors duration-300 tracking-tight">
                Data Upload
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium ml-12 transition-colors duration-300">
              ✨ Manage and monitor your data uploads with ease
            </p>
          </div>
          <button
            onClick={() => navigate("/items")}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-blue-500/50 font-bold transition-all duration-300 text-sm sm:text-base hover:scale-110 group relative overflow-hidden whitespace-nowrap hover:bg-blue-700"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <Package className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="relative">Items Page</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 sm:px-8 py-8 max-w-7xl mx-auto">
        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scroll-smooth">
            {UPLOAD_TYPES.map((tab, idx) => {
              const isActive = activeTab === idx;
              const tabColor = isActive ? "bg-blue-600" : "bg-slate-100 dark:bg-slate-800";
              const tabTextColor = isActive ? "text-white" : "text-slate-600 dark:text-slate-400";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`px-6 sm:px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base whitespace-nowrap transition-all duration-300 flex items-center gap-2.5 group relative overflow-hidden ${
                    isActive
                      ? `${tabColor} ${tabTextColor} shadow-xl hover:shadow-2xl scale-105 transform`
                      : `${tabColor} ${tabTextColor} hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border-2 border-slate-200 dark:border-slate-700 hover:scale-105 transform`
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  {tab.label}
                  {isActive && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce"></div>
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
      <div className="border-t-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 mt-12 transition-colors duration-300">
        <div className="px-6 sm:px-8 py-8 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium transition-colors duration-300">
            🏢 Hanuram Data Management System • All Rights Reserved © 2024
          </p>
        </div>
      </div>
    </div>
  );
}

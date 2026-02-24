import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Upload } from "lucide-react";
import UploadTab from "@/components/UploadTab";

const UPLOAD_TYPES = [
  { id: "petpooja", label: "Petpooja Upload", color: "bg-green-600" },
  { id: "pain_lebs", label: "Pain Labs Upload", color: "bg-orange-600" },
  { id: "website", label: "Website Upload", color: "bg-green-500" }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const currentTab = UPLOAD_TYPES[activeTab];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Section */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="px-6 sm:px-8 py-5 sm:py-6 flex justify-between items-center gap-4">
          <div className="group cursor-default flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-400 to-green-500 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/50">
                <Upload className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Data Upload
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1 transition-colors duration-300">
                  Manage and monitor your uploads
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/items")}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-slate-950 rounded-lg hover:shadow-lg hover:shadow-green-500/60 font-semibold transition-all duration-300 text-xs sm:text-sm hover:scale-105 group relative overflow-hidden whitespace-nowrap hover:bg-green-400"
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
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 sm:px-6 py-2.5 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 flex items-center gap-2 group relative overflow-hidden ${
                    isActive
                      ? `bg-green-500 text-slate-950 shadow-lg hover:shadow-xl shadow-green-500/50 transform hover:scale-105`
                      : `bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700`
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  {tab.label}
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-slate-950 animate-pulse"></div>
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
      <div className="border-t border-slate-800 bg-slate-900 mt-8">
        <div className="px-6 sm:px-8 py-4 text-center">
          <p className="text-slate-500 text-xs font-medium tracking-wide">
            Hanuram Data Management • All Rights Reserved © 2024
          </p>
        </div>
      </div>
    </div>
  );
}

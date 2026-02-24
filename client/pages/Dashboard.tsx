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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 sm:px-8 py-6 sm:py-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-orange-500 p-2.5 rounded-xl">
                <Upload className="w-7 h-7 text-white" />
              </div>
              Data Upload Portal
            </h1>
            <p className="text-slate-300 text-sm mt-2">Manage and monitor your data uploads</p>
          </div>
          <button
            onClick={() => navigate("/items")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 font-bold transition-all duration-300 text-sm sm:text-base hover:scale-105"
          >
            <Package className="w-5 h-5" />
            Items Page
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 sm:px-8 py-8 max-w-7xl mx-auto">
        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4">
            {UPLOAD_TYPES.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`px-5 sm:px-6 py-3 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                  activeTab === idx
                    ? `${tab.color} text-white shadow-lg shadow-blue-500/30`
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {tab.label}
                {activeTab === idx && (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <UploadTab type={currentTab.id} />
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 bg-slate-900/50 mt-12">
        <div className="px-6 sm:px-8 py-6 text-center">
          <p className="text-slate-400 text-sm">
            Hanuram Data Management System • All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
}

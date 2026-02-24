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
      <div className="border-b-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 sm:py-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3 transition-colors duration-300">
              <div className="bg-blue-600 p-2.5 rounded-xl">
                <Upload className="w-7 h-7 text-white" />
              </div>
              Data Upload Portal
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 transition-colors duration-300">Manage and monitor your data uploads</p>
          </div>
          <button
            onClick={() => navigate("/items")}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:shadow-xl hover:shadow-blue-400/40 font-bold transition-all duration-300 text-sm sm:text-base hover:scale-105"
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
                    ? `${tab.color} text-white shadow-lg`
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border-2 border-slate-200 dark:border-slate-700"
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
      <div className="border-t-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 mt-12 transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm transition-colors duration-300">
            Hanuram Data Management System • All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
}

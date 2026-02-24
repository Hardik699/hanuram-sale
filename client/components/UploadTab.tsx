import { useState, useEffect } from "react";
import { Upload, FileUp, AlertCircle, CheckCircle2, X, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { UPLOAD_FORMATS, validateFileFormat } from "@shared/formats";
import type { UploadType } from "@shared/formats";
import UploadLoader from "./UploadLoader";
import ConfirmUploadDialog from "./ConfirmUploadDialog";
import DeleteDataDialog from "./DeleteDataDialog";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface MonthStatus {
  month: number;
  status: "uploaded" | "pending";
}

interface UploadTabProps {
  type: UploadType | string;
}

interface ValidationResult {
  validCount: number;
  invalidCount: number;
  validRows: any[];
  invalidRows: any[];
}

export default function UploadTab({ type }: UploadTabProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [monthsStatus, setMonthsStatus] = useState<MonthStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedValidRowIndices, setSelectedValidRowIndices] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMonth, setDeleteMonth] = useState<number | null>(null);
  const [deleteYear, setDeleteYear] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Fetch month statuses when type or selectedYear changes
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    let isCleanup = false;

    const fetchMonthStatus = async () => {
      try {
        console.log(`Fetching month status for ${type} year ${selectedYear}`);

        const response = await fetch(`/api/uploads?type=${type}&year=${selectedYear}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          console.warn(`API returned status ${response.status}`);
          if (isMounted) {
            setMonthsStatus(Array.from({ length: 12 }, (_, i) => ({
              month: i + 1,
              status: "pending" as const
            })));
          }
          return;
        }

        const data = await response.json();
        if (isMounted && data.data && Array.isArray(data.data)) {
          setMonthsStatus(data.data);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          if (!isCleanup) {
            console.error("❌ Fetch was aborted (timeout or cancelled)");
          }
          return; // Ignore aborts
        }
        console.error("Failed to fetch month status:", error);
        // Set default pending status on fetch error - don't block UI
        if (isMounted) {
          setMonthsStatus(Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            status: "pending" as const
          })));
        }
      }
    };

    fetchMonthStatus();

    return () => {
      isCleanup = true;
      isMounted = false;
      // Don't abort the controller during cleanup to avoid AbortError if something is still in flight
      // This matches the pattern in ItemDetail.tsx that fixed similar AbortErrors
    };
  }, [type, selectedYear]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          setMessage({ type: "error", text: "CSV/Excel file must contain at least header row and 1 row of data" });
          return;
        }

        // Get headers from first row
        const headers = jsonData[0] as string[];

        // Validate file format
        const validation = validateFileFormat(headers, type as UploadType);

        if (!validation.valid) {
          setMessage({
            type: "error",
            text: `Invalid file format. Missing columns: ${validation.missing.join(", ")}. Expected columns: ${UPLOAD_FORMATS[type as UploadType].requiredColumns.join(", ")}`
          });
          return;
        }

        const parsedFileData = {
          rows: jsonData.length - 1,
          columns: jsonData[0]?.length || 0,
          data: jsonData
        };

        setFileData(parsedFileData);
        setShowUploadForm(true);

        // Validate data against database
        if (type === "petpooja") {
          await validateData(jsonData);
        } else {
          setMessage(null);
        }
      } catch (error) {
        setMessage({ type: "error", text: "Failed to parse file. Please use valid CSV/Excel format." });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const simulateProgress = (duration: number = 2000) => {
    setUploadProgress(0);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 95);
      setUploadProgress(Math.round(progress));
      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 100);
  };

  const validateData = async (fullData: any[]) => {
    try {
      setIsValidating(true);
      setMessage(null);

      if (!fullData || fullData.length < 2) {
        setIsValidating(false);
        return;
      }

      const headers = fullData[0] as string[];

      // Find indices of columns we need for validation
      const getColumnIndex = (name: string) =>
        headers.findIndex((h) => h?.toLowerCase().trim() === name.toLowerCase().trim());

      const restaurantIdx = getColumnIndex("restaurant_name");
      const sapCodeIdx = getColumnIndex("sap_code");

      if (restaurantIdx === -1 || sapCodeIdx === -1) {
        console.warn("Validation columns not found in file");
        setIsValidating(false);
        return;
      }

      // Create a minimal version of the data for validation to save bandwidth/memory
      const minimalData = fullData.map((row, idx) => {
        if (idx === 0) return headers; // Keep headers for server-side index discovery
        return [row[restaurantIdx], row[sapCodeIdx]];
      });

      console.log(`Starting validation for ${minimalData.length - 1} rows (minimal payload)`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for validation

      const response = await fetch("/api/upload/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          data: minimalData,
          isMinimal: true,
          originalIndices: { restaurantIdx, sapCodeIdx }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorText = "Validation failed";
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorText;
        } catch (e) {}

        setMessage({ type: "error", text: errorText });
        setIsValidating(false);
        return;
      }

      const result = await response.json();

      if (result.invalidCount > 0) {
        // Map minimal row data back to original row data for display
        const mappedInvalidRows = result.invalidRows.map((invalidRow: any) => {
          const originalRow = fullData[invalidRow.rowIndex - 1]; // rowIndex is 1-based
          return {
            ...invalidRow,
            data: originalRow
          };
        });

        setValidationResult({
          ...result,
          invalidRows: mappedInvalidRows
        });

        // Select all valid rows by default
        setSelectedValidRowIndices(result.validRows.map((r: any) => r.rowIndex));
        setMessage({
          type: "warning",
          text: `Found ${result.invalidCount} invalid row(s) that will be removed on upload. Review and confirm below.`
        });
      } else {
        setValidationResult(null);
        setSelectedValidRowIndices([]);
        setMessage(null);
      }
      setIsValidating(false);
    } catch (error) {
      console.error("Validation error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        setMessage({ type: "error", text: "Validation took too long. The server might be busy. Please try again." });
      } else if (error instanceof TypeError && error.message === "Failed to fetch") {
        setMessage({
          type: "error",
          text: "Connection failed during validation. This could be due to a large file or server timeout. Try refreshing the page."
        });
      } else {
        setMessage({ type: "error", text: `Failed to validate data: ${error instanceof Error ? error.message : "Unknown error"}` });
      }
      setIsValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedYear || !selectedMonth || !fileData) {
      setMessage({ type: "error", text: "Please select year, month and upload a file" });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setMessage(null);
    simulateProgress(2000);

    try {
      console.log("Starting upload for", type, selectedYear, selectedMonth);

      // Prepare upload body
      const uploadBody: any = {
        type,
        year: selectedYear,
        month: selectedMonth,
        rows: fileData.rows,
        columns: fileData.columns,
        data: fileData.data
      };

      // If there are invalid rows, pass the valid row indices
      if (validationResult && selectedValidRowIndices.length > 0) {
        uploadBody.validRowIndices = selectedValidRowIndices;
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadBody)
      });

      console.log("Upload response status:", response.status);

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        result = { error: "Invalid response from server" };
      }

      if (response.status === 409) {
        setIsLoading(false);
        setShowConfirmDialog(true);
        setMessage(null);
      } else if (response.ok) {
        setUploadProgress(100);
        setMessage({ type: "success", text: "Data uploaded successfully!" });
        setFileData(null);
        setSelectedMonth(null);
        setShowUploadForm(false);
        setIsLoading(false);

        // Fetch updated status to refresh table immediately
        try {
          const statusResponse = await fetch(`/api/uploads?type=${type}&year=${selectedYear}`);
          if (statusResponse.ok) {
            const data = await statusResponse.json();
            if (data.data) {
              setMonthsStatus(data.data);
            }
          }
        } catch (statusError) {
          console.error("Failed to refresh status:", statusError);
        }
      } else {
        const errorText = result.error || `Upload failed with status ${response.status}`;
        console.error("Upload failed:", errorText);
        setMessage({ type: "error", text: errorText });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setIsLoading(false);

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setMessage({
          type: "error",
          text: "Cannot connect to server. Please check your internet connection and try again."
        });
      } else {
        setMessage({
          type: "error",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error during upload"}`
        });
      }
    }
  };

  const handleConfirmUpdate = async () => {
    if (!selectedYear || !selectedMonth || !fileData) {
      setMessage({ type: "error", text: "Please select year, month and upload a file" });
      return;
    }

    setIsUpdatingExisting(true);
    setUploadProgress(0);
    setMessage(null);
    simulateProgress(2000);

    try {
      console.log("Updating existing data for", type, selectedYear, selectedMonth);

      // Prepare update body
      const updateBody: any = {
        type,
        year: selectedYear,
        month: selectedMonth,
        rows: fileData.rows,
        columns: fileData.columns,
        data: fileData.data
      };

      // If there are invalid rows, pass the valid row indices
      if (validationResult && selectedValidRowIndices.length > 0) {
        updateBody.validRowIndices = selectedValidRowIndices;
      }

      const response = await fetch("/api/upload", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody)
      });

      console.log("Update response status:", response.status);

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        result = { error: "Invalid response from server" };
      }

      if (response.ok) {
        setUploadProgress(100);
        setShowConfirmDialog(false);
        setMessage({ type: "success", text: "Data updated successfully!" });
        setFileData(null);
        setSelectedMonth(null);
        setShowUploadForm(false);
        setIsUpdatingExisting(false);

        // Fetch updated status to refresh table immediately
        try {
          const statusResponse = await fetch(`/api/uploads?type=${type}&year=${selectedYear}`);
          if (statusResponse.ok) {
            const data = await statusResponse.json();
            if (data.data) {
              setMonthsStatus(data.data);
            }
          }
        } catch (statusError) {
          console.error("Failed to refresh status:", statusError);
        }
      } else {
        const errorText = result.error || `Update failed with status ${response.status}`;
        console.error("Update failed:", errorText);
        setMessage({ type: "error", text: errorText });
        setShowConfirmDialog(false);
        setIsUpdatingExisting(false);
      }
    } catch (error) {
      console.error("Update error:", error);
      setShowConfirmDialog(false);
      setIsUpdatingExisting(false);

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setMessage({
          type: "error",
          text: "Cannot connect to server. Please check your internet connection and try again."
        });
      } else {
        setMessage({
          type: "error",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error during update"}`
        });
      }
    }
  };

  const getMonthStatus = (monthNum: number) => {
    return monthsStatus.find(m => m.month === monthNum)?.status || "pending";
  };

  const format = UPLOAD_FORMATS[type as UploadType];

  const getDemoData = () => {
    const headers = UPLOAD_FORMATS.petpooja.requiredColumns;
    const demoRows = [
      ["Hanuram", "INV001", "2026-02-15", "2026-02-15", "12:30", "UPI", "Swiggy", "Completed", "South Delhi", "Hanuram", "Main", "Staff", "9876543210", "John Doe", "South Delhi", "2", "", "850", "100", "50", "0", "0", "20", "0", "0", "0", "1020", "Butter Chicken", "Main Course", "SAP001", "450", "1", "450", "1020"],
      ["Hanuram", "INV002", "2026-02-15", "2026-02-15", "13:15", "Cash", "Zomato", "Completed", "East Delhi", "Hanuram", "Main", "Staff", "9876543211", "Jane Smith", "East Delhi", "1", "", "650", "80", "30", "0", "0", "15", "0", "0", "0", "775", "Paneer Tikka", "Appetizer", "SAP002", "350", "2", "700", "775"],
      ["Hanuram", "INV003", "2026-02-15", "2026-02-15", "14:45", "Card", "Dining", "Completed", "West Delhi", "Hanuram", "Main", "Staff", "9876543212", "Mike Johnson", "West Delhi", "3", "", "1200", "150", "80", "0", "0", "30", "0", "0", "0", "1460", "Biryani", "Rice", "SAP003", "500", "1", "500", "1460"],
      ["Hanuram", "INV004", "2026-02-16", "2026-02-16", "11:20", "UPI", "Parcel", "Completed", "North Delhi", "Hanuram", "Main", "Staff", "9876543213", "Sarah Lee", "North Delhi", "2", "", "950", "120", "60", "0", "0", "25", "0", "0", "0", "1155", "Tandoori Chicken", "Main Course", "SAP001", "450", "1.5", "675", "1155"],
      ["Hanuram", "INV005", "2026-02-16", "2026-02-16", "15:30", "Cash", "Swiggy", "Completed", "Central Delhi", "Hanuram", "Main", "Staff", "9876543214", "Robert Brown", "Central Delhi", "1", "", "750", "95", "40", "0", "0", "18", "0", "0", "0", "903", "Dal Makhani", "Main Course", "SAP004", "400", "1.5", "600", "903"]
    ];

    return { headers, demoRows };
  };

  const downloadDemoData = () => {
    if (type !== "petpooja") {
      setMessage({ type: "error", text: "Demo data only available for Petpooja upload" });
      return;
    }

    const { headers, demoRows } = getDemoData();

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...demoRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `demo_petpooja_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setMessage({ type: "success", text: "Demo file downloaded successfully!" });
  };

  const handleDeleteData = async (password: string) => {
    if (!deleteMonth || !deleteYear) {
      setMessage({ type: "error", text: "Invalid month or year" });
      return;
    }

    try {
      setIsDeleting(true);
      console.log(`🗑️ Deleting ${type} data for ${deleteMonth}/${deleteYear}`);

      const response = await fetch("/api/upload/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          year: deleteYear,
          month: deleteMonth,
          password
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Data deleted successfully");
        setMessage({ type: "success", text: "Data deleted successfully!" });
        setShowDeleteDialog(false);
        setIsDeleting(false);

        // Refresh month status
        try {
          const statusResponse = await fetch(`/api/uploads?type=${type}&year=${deleteYear}`);
          if (statusResponse.ok) {
            const data = await statusResponse.json();
            if (data.data) {
              setMonthsStatus(data.data);
            }
          }
        } catch (statusError) {
          console.error("Failed to refresh status:", statusError);
        }
      } else {
        throw new Error(result.error || "Failed to delete data");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setIsDeleting(false);
      throw error;
    }
  };

  const openDeleteDialog = (monthNum: number) => {
    setDeleteMonth(monthNum);
    setDeleteYear(selectedYear);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Upload Loader Animation */}
      <UploadLoader isVisible={isLoading || isUpdatingExisting} progress={uploadProgress} />

      {/* Confirm Update Dialog */}
      <ConfirmUploadDialog
        isVisible={showConfirmDialog}
        month={selectedMonth ? MONTHS[selectedMonth - 1] : ""}
        year={selectedYear}
        onConfirm={handleConfirmUpdate}
        onCancel={() => {
          setShowConfirmDialog(false);
          setIsUpdatingExisting(false);
        }}
        isLoading={isUpdatingExisting}
      />

      {/* Delete Data Dialog */}
      <DeleteDataDialog
        isVisible={showDeleteDialog}
        month={deleteMonth ? MONTHS[deleteMonth - 1] : ""}
        year={deleteYear || selectedYear}
        type={type}
        onConfirm={handleDeleteData}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeleteMonth(null);
          setDeleteYear(null);
        }}
        isLoading={isDeleting}
      />

      {/* Upload Section - Modern Card Design */}
      <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header with Gradient Background */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Upload Data</h2>
          </div>
          <p className="text-white/80 text-sm mt-2">Import your data securely and efficiently</p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Year and Month Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white font-medium transition"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Select Month</label>
              <select
                value={selectedMonth || ""}
                onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white font-medium transition"
              >
                <option value="">-- Choose Month --</option>
                {MONTHS.map((month, idx) => (
                  <option key={month} value={idx + 1}>{month}</option>
                ))}
              </select>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Upload CSV/Excel File</label>
            <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer group">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <FileUp className="w-7 h-7 text-purple-600" />
                </div>
                <p className="text-gray-900 font-bold text-base">Click to upload or drag & drop</p>
                <p className="text-gray-500 text-sm mt-1">CSV or Excel files up to 50MB</p>
              </label>
            </div>
            <div className="mt-4">
              <button
                onClick={downloadDemoData}
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-300 transition-all"
              >
                📥 Download Demo File
              </button>
            </div>
          </div>

          {/* File Info - Modern Card */}
          {fileData && (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-gray-900">✓ File loaded:</span> <span className="font-semibold text-cyan-600">{fileData.rows}</span> rows, <span className="font-semibold text-cyan-600">{fileData.columns}</span> columns
              </p>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && validationResult.invalidCount > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
                <div className="flex gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      {validationResult.invalidCount} row(s) found that don't match the database
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Only {validationResult.validCount} valid row(s) will be uploaded. Invalid rows are listed below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Invalid Rows List */}
              {validationResult.invalidRows.length > 0 && (
                <div className="border-2 border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 px-4 py-4 border-b-2 border-red-200">
                    <p className="text-sm font-bold text-red-900">⚠️ Invalid Rows to be Removed</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {validationResult.invalidRows.map((row: any, idx: number) => (
                      <div key={idx} className="px-4 py-3 border-b border-red-100 last:border-b-0 hover:bg-red-50/50 transition">
                        <div className="flex items-start gap-3">
                          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 font-bold" />
                          <div className="flex-1 text-sm">
                            <p className="font-bold text-gray-900">Row {row.rowIndex}</p>
                            <p className="text-red-700 text-xs mt-1 font-medium">{row.reason}</p>
                            <p className="text-gray-600 text-xs mt-1 font-mono truncate bg-gray-100 p-1.5 rounded mt-2">
                              {row.data.slice(0, 3).join(" | ")}...
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className={`p-4 rounded-xl flex gap-3 border-2 ${
              message.type === "success" ? "bg-gradient-to-r from-emerald-50 to-green-50 border-green-300" :
              message.type === "error" ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-300" :
              "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300"
            }`}>
              {message.type === "success" && <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />}
              {message.type === "error" && <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />}
              {message.type === "warning" && <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />}
              <p className={`text-sm font-medium ${
                message.type === "success" ? "text-green-800" :
                message.type === "error" ? "text-red-800" :
                "text-amber-800"
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isLoading || !fileData || !selectedMonth}
            className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
          >
            {isLoading ? "⏳ Uploading..." : "🚀 Upload Data"}
          </button>
        </div>
      </div>

      {/* Months Status - Modern Grid Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Upload Status</h2>
          <p className="text-white/80 text-sm mt-2">Overview for {selectedYear}</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {MONTHS.map((month, idx) => {
              const monthNum = idx + 1;
              const status = getMonthStatus(monthNum);
              const isUploaded = status === "uploaded";

              return (
                <div
                  key={month}
                  className={`relative group rounded-xl p-4 sm:p-5 border-2 transition-all duration-300 ${
                    isUploaded
                      ? "bg-gradient-to-br from-emerald-50 to-green-50 border-green-300 hover:shadow-lg hover:scale-105"
                      : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <p className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">{month}</p>
                    <div className="flex items-center gap-2 mb-3 flex-grow">
                      {isUploaded ? (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs sm:text-sm font-bold text-green-700">Uploaded</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                          <span className="text-xs sm:text-sm font-bold text-gray-600">Pending</span>
                        </>
                      )}
                    </div>
                    {isUploaded && (
                      <button
                        onClick={() => openDeleteDialog(monthNum)}
                        disabled={isDeleting}
                        className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-bold hover:bg-red-100 px-2 py-1.5 rounded-lg transition w-full disabled:opacity-50"
                        title="Delete this month's data"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

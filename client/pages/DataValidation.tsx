import { useState } from "react";
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

interface ValidationRow {
  rowIndex: number;
  status: "match" | "error";
  uploadedData: any;
  databaseData: any;
  differences: string[];
  errorMessage?: string;
}

interface ValidationResult {
  totalRows: number;
  matchedRows: number;
  errorRows: number;
  accuracy: number;
  validationDetails: ValidationRow[];
}

export default function DataValidation() {
  const navigate = useNavigate();
  const [fileData, setFileData] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataType, setDataType] = useState<"sales" | "items">("sales");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          setError("File is empty. Please upload a file with data.");
          return;
        }

        setFileData(jsonData);
        setError(null);
        setValidationResult(null);
      } catch (err) {
        setError("Failed to parse file. Please use valid Excel/CSV format.");
        console.error(err);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const validateData = async () => {
    if (fileData.length === 0) {
      setError("Please upload a file first.");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch("/api/data-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataType,
          data: fileData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Validation failed");
      }

      const result = await response.json();
      setValidationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation error occurred");
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-8">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Validation</h1>
        <p className="text-gray-600 mb-6">Upload your data and compare it with the database. We'll check each row for exact matches.</p>

        {/* Upload Section */}
        <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="flex flex-col items-center gap-4">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <label className="block text-center cursor-pointer">
                <span className="text-base font-semibold text-gray-900">
                  Click to upload data file
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 text-center mt-2">
                Supported: Excel (.xlsx, .xls) or CSV
              </p>
            </div>
          </div>
        </div>

        {/* Data Type & Actions */}
        {fileData.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Type
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as "sales" | "items")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="sales">Sales Data</option>
                  <option value="items">Items Data</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rows Uploaded
                </label>
                <div className="px-4 py-2 bg-blue-50 rounded-lg text-blue-900 font-semibold">
                  {fileData.length} rows
                </div>
              </div>
            </div>

            <button
              onClick={validateData}
              disabled={isValidating}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition disabled:opacity-50"
            >
              {isValidating ? "Validating..." : "Start Validation"}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Validation Results */}
        {validationResult && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Total Rows</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {validationResult.totalRows}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Matched Rows</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {validationResult.matchedRows}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">Accuracy</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {validationResult.accuracy.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Error Summary */}
            {validationResult.errorRows > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-semibold text-yellow-900 mb-2">
                  {validationResult.errorRows} row(s) with errors
                </p>
                <p className="text-sm text-yellow-800">
                  Review the details below to fix mismatches
                </p>
              </div>
            )}

            {/* Detailed Results */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Results</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {validationResult.validationDetails.map((row, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      row.status === "match"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {row.status === "match" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          Row {row.rowIndex}
                          <span
                            className={`ml-2 text-sm font-normal ${
                              row.status === "match"
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {row.status === "match" ? "✓ Match" : "✗ Error"}
                          </span>
                        </p>
                        {row.status === "error" && (
                          <div className="mt-2 space-y-1">
                            {row.errorMessage && (
                              <p className="text-sm text-red-700 font-mono bg-red-100 px-2 py-1 rounded">
                                {row.errorMessage}
                              </p>
                            )}
                            {row.differences.length > 0 && (
                              <div className="text-sm text-red-700">
                                <p className="font-medium">Differences:</p>
                                <ul className="list-disc list-inside ml-2 mt-1">
                                  {row.differences.map((diff, i) => (
                                    <li key={i} className="text-xs">
                                      {diff}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accuracy Status */}
            <div className="p-6 rounded-lg border-2" style={{
              borderColor: validationResult.accuracy === 100 ? '#22c55e' : '#ef4444',
              backgroundColor: validationResult.accuracy === 100 ? '#f0fdf4' : '#fef2f2'
            }}>
              <p className="text-lg font-bold" style={{
                color: validationResult.accuracy === 100 ? '#16a34a' : '#dc2626'
              }}>
                {validationResult.accuracy === 100
                  ? '✓ All data matches perfectly (100% accuracy)'
                  : `✗ Data has ${validationResult.errorRows} error(s) - ${(100 - validationResult.accuracy).toFixed(1)}% mismatch`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

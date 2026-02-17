import { RequestHandler } from "express";
import { MongoClient, Db } from "mongodb";
import { UPLOAD_FORMATS, validateFileFormat } from "../../shared/formats";

const MONGODB_URI = "mongodb+srv://admin:admin1@cluster0.a3duo.mongodb.net/?appName=Cluster0";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

async function getDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  // Prevent multiple simultaneous connection attempts
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        family: 4, // Use IPv4
      });

      await client.connect();
      console.log("✅ Connected to MongoDB");
      cachedClient = client;
      cachedDb = client.db("upload_system");
      return cachedDb;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      connectionPromise = null; // Reset for next attempt
      throw new Error("Database connection failed: " + (error instanceof Error ? error.message : String(error)));
    }
  })();

  return connectionPromise;
}

// Helper function to normalize area to lowercase
function normalizeArea(area: string, orderType?: string): "zomato" | "swiggy" | "dining" | "parcel" {
  const areaLower = area?.toLowerCase().trim() || "";
  const orderTypeLower = orderType?.toLowerCase().trim() || "";

  console.log(`  [AREA DEBUG] input area="${area}" | areaLower="${areaLower}" | orderType="${orderType}"`);

  // Check for Zomato variations
  if (areaLower.includes("zomato")) {
    console.log(`  [AREA DEBUG] ✓ Matched ZOMATO`);
    return "zomato";
  }

  // Check for Swiggy variations
  if (areaLower.includes("swiggy")) {
    console.log(`  [AREA DEBUG] ✓ Matched SWIGGY`);
    return "swiggy";
  }

  // Check for Parcel/Delivery variations
  if (areaLower.includes("parcel") || areaLower.includes("home delivery") || areaLower.includes("pickup")) {
    console.log(`  [AREA DEBUG] ✓ Matched PARCEL`);
    return "parcel";
  }

  // Check order type as fallback
  if (orderTypeLower.includes("pickup") || orderTypeLower.includes("home delivery")) {
    console.log(`  [AREA DEBUG] ✓ Matched PARCEL (via orderType)`);
    return "parcel";
  }
  if (orderTypeLower.includes("delivery")) {
    console.log(`  [AREA DEBUG] ✓ Matched PARCEL (via delivery orderType)`);
    return "parcel";
  }

  // Default to dining
  console.log(`  [AREA DEBUG] → DEFAULT to DINING`);
  return "dining";
}

// Helper function to parse date string
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]);
    const day = parseInt(isoMatch[3]);
    return new Date(year, month - 1, day);
  }

  const formats = [
    /(\d{2})-(\d{2})-(\d{4})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year, month, day;
      if (match[3].length === 4) {
        year = parseInt(match[3]);
        month = parseInt(match[1]);
        day = parseInt(match[2]);
      }
      return new Date(year, month - 1, day);
    }
  }

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export const handleUpload: RequestHandler = async (req, res) => {
  try {
    const { type, year, month, data, rows, columns, validRowIndices } = req.body;

    if (!type || !year || !month || !data || !rows || !columns) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof type !== 'string' || typeof year !== 'number' || typeof month !== 'number') {
      return res.status(400).json({ error: "Invalid field types" });
    }

    // Validate upload type exists
    if (!Object.keys(UPLOAD_FORMATS).includes(type)) {
      return res.status(400).json({ error: `Invalid upload type: ${type}` });
    }

    // Validate file format
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const headers = data[0] as string[];
    const validation = validateFileFormat(headers, type as any);

    if (!validation.valid) {
      return res.status(400).json({
        error: `Invalid file format. Missing columns: ${validation.missing.join(", ")}`,
        missingColumns: validation.missing
      });
    }

    // Filter data if validRowIndices provided (remove invalid rows)
    let finalData = data;
    let finalRows = rows;
    if (Array.isArray(validRowIndices) && validRowIndices.length > 0) {
      // validRowIndices are 1-indexed from the UI (row 2, row 3, etc.)
      // data[0] is headers, so we need to map indices correctly
      finalData = [headers, ...validRowIndices.map(idx => data[idx])];
      finalRows = validRowIndices.length;
    }

    const db = await getDatabase();
    const collection = db.collection(type);

    // Check if data already exists for this month/year
    const existingData = await collection.findOne({ year, month });
    if (existingData) {
      return res.status(409).json({
        error: "Data already exists for this month",
        exists: true
      });
    }

    // Save the data
    const result = await collection.insertOne({
      year,
      month,
      rows: finalRows,
      columns,
      data: finalData,
      uploadedAt: new Date(),
      status: "uploaded"
    });

    // Data is stored in petpooja collection and will be fetched directly from DB when needed
    // No need to process and duplicate data in item variations

    res.json({
      success: true,
      id: result.insertedId,
      message: `Data uploaded successfully (${finalRows} rows)`,
      rowsUploaded: finalRows
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload data";
    res.status(500).json({ error: errorMessage });
  }
};


export const handleGetUploads: RequestHandler = async (req, res) => {
  try {
    const { type, year } = req.query;

    if (!type) {
      return res.status(400).json({ error: "Type is required" });
    }

    const db = await getDatabase();
    const collection = db.collection(type as string);

    // Filter by year if provided, otherwise use current year
    const filterYear = year ? parseInt(year as string) : new Date().getFullYear();

    const data = await collection.find({ year: filterYear }).toArray();

    // Create a map of uploaded months
    const uploadedMonths: Record<number, boolean> = {};
    data.forEach((doc: any) => {
      if (typeof doc.month === 'number') {
        uploadedMonths[doc.month] = true;
      }
    });

    // Fill in months 1-12 with status
    const monthsStatus = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      status: uploadedMonths[i + 1] ? "uploaded" : "pending" as const
    }));

    res.json({ data: monthsStatus });
  } catch (error) {
    console.error("Get uploads error:", error);
    // Return default empty status on error
    const monthsStatus = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      status: "pending" as const
    }));
    res.json({ data: monthsStatus });
  }
};

export const handleUpdateUpload: RequestHandler = async (req, res) => {
  try {
    const { type, year, month, data, rows, columns, validRowIndices } = req.body;

    if (!type || !year || !month || !data) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Filter data if validRowIndices provided
    let finalData = data;
    let finalRows = rows;
    if (Array.isArray(validRowIndices) && validRowIndices.length > 0) {
      const headers = data[0];
      finalData = [headers, ...validRowIndices.map((idx: number) => data[idx])];
      finalRows = validRowIndices.length;
    }

    const db = await getDatabase();
    const collection = db.collection(type);

    const result = await collection.updateOne(
      { year, month },
      {
        $set: {
          rows: finalRows,
          columns,
          data: finalData,
          updatedAt: new Date(),
          status: "updated"
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Data not found" });
    }

    res.json({ success: true, message: `Data updated successfully (${finalRows} rows)` });
  } catch (error) {
    console.error("Update error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update data";
    res.status(500).json({ error: errorMessage });
  }
};

export const handleGetData: RequestHandler = async (req, res) => {
  try {
    const { type, year, month } = req.query;

    if (!type || !year || !month) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const db = await getDatabase();
    const collection = db.collection(type as string);

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    if (isNaN(yearNum) || isNaN(monthNum)) {
      return res.status(400).json({ error: "Invalid year or month" });
    }

    const doc = await collection.findOne({
      year: yearNum,
      month: monthNum
    });

    if (!doc) {
      return res.status(404).json({ error: "Data not found" });
    }

    res.json(doc);
  } catch (error) {
    console.error("Get data error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch data";
    res.status(500).json({ error: errorMessage });
  }
};

// Validate data against database before upload
export const handleValidateUpload: RequestHandler = async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log("📋 Validation request received:", { type, rowCount: Array.isArray(data) ? data.length : 0 });

    if (!type || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    if (type !== "petpooja") {
      return res.json({ success: true, validRows: data.slice(1), invalidRows: [] });
    }

    console.log("🔗 Connecting to database for validation...");
    const db = await getDatabase();
    const itemsCollection = db.collection("items");

    // Get all items and build SAP code map
    console.log("📊 Fetching items to build SAP code map...");
    const items = await itemsCollection.find({}).toArray();
    console.log(`✅ Found ${items.length} items`);

    const sapCodeMap: { [key: string]: { itemId: string; variationId: string } } = {};

    for (const item of items) {
      if (item.variations && Array.isArray(item.variations)) {
        item.variations.forEach((v: any, idx: number) => {
          if (v.sapCode) {
            sapCodeMap[v.sapCode] = {
              itemId: item.itemId,
              variationId: idx.toString(),
            };
          }
        });
      }
    }

    console.log(`🔍 Built SAP code map with ${Object.keys(sapCodeMap).length} codes`);

    const headers = data[0] as string[];
    const dataRows = data.slice(1);

    // Find column indices
    const getColumnIndex = (name: string) =>
      headers.findIndex((h) => h.toLowerCase().trim() === name.toLowerCase().trim());

    const restaurantIdx = getColumnIndex("restaurant_name");
    const sapCodeIdx = getColumnIndex("sap_code");

    console.log(`📍 Column indices - restaurant: ${restaurantIdx}, sapCode: ${sapCodeIdx}`);

    const validRows = [];
    const invalidRows = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      const restaurant = row[restaurantIdx]?.toString().trim() || "";
      const sapCode = row[sapCodeIdx]?.toString().trim() || "";

      let isValid = true;
      let reason = "";

      if (!restaurant) {
        isValid = false;
        reason = "No restaurant name";
      } else if (!sapCodeMap[sapCode]) {
        isValid = false;
        reason = `SAP code "${sapCode}" not found in database`;
      }

      if (isValid) {
        validRows.push({ rowIndex: i + 2, data: row }); // +2 because header is row 1, data starts at row 2
      } else {
        invalidRows.push({ rowIndex: i + 2, data: row, reason });
      }
    }

    console.log(`✅ Validation complete: ${validRows.length} valid, ${invalidRows.length} invalid rows`);

    res.json({
      success: true,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows,
      invalidRows,
    });
  } catch (error) {
    console.error("❌ Validation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to validate data";
    res.status(500).json({ error: errorMessage });
  }
};

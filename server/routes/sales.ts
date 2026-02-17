import { RequestHandler } from "express";
import { MongoClient, Db } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://admin:admin1@cluster0.a3duo.mongodb.net/?appName=Cluster0";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

async function getDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

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
        family: 4,
      });

      await client.connect();
      console.log("✅ Connected to MongoDB");
      cachedClient = client;
      cachedDb = client.db("upload_system");
      return cachedDb;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      connectionPromise = null;
      throw new Error(
        "Database connection failed: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  })();

  return connectionPromise;
}

// Sample sales data structure
interface SalesRecord {
  itemId: string;
  variationId: string;
  channel: "Dining" | "Parcel" | "Online";
  quantity: number;
  value: number;
  date: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PetpoojaRow {
  restaurant_name: string;
  "New Date": string;
  Time: string;
  order_type: string;
  area: string;
  brand_grouping: string;
  category_name: string;
  sap_code: string;
  item_price: number;
  item_quantity: number;
}

interface SalesAnalysis {
  diningData: {
    quantity: number;
    value: number;
    variations: Array<{ name: string; quantity: number; value: number }>;
  };
  parcelData: {
    quantity: number;
    value: number;
    variations: Array<{ name: string; quantity: number; value: number }>;
  };
  onlineData: {
    quantity: number;
    value: number;
    variations: Array<{ name: string; quantity: number; value: number }>;
  };
}

// GET /api/sales - Get sales records with optional filters
export const handleGetSales: RequestHandler = async (req, res) => {
  try {
    const { itemId, startDate, endDate, channel } = req.query;

    // This is a placeholder for future database integration
    // For now, return an empty array or sample data
    const filters: any = {};

    if (itemId) filters.itemId = itemId;
    if (channel) filters.channel = channel;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = startDate;
      if (endDate) filters.date.$lte = endDate;
    }

    // TODO: Query from MongoDB collections.sales with filters
    const salesRecords: SalesRecord[] = [];

    res.json({
      success: true,
      count: salesRecords.length,
      data: salesRecords,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// Helper function to map order type
function mapOrderType(
  orderType: string,
  area: string,
): "Dining" | "Parcel" | "Online" {
  const orderTypeLower = orderType?.toLowerCase() || "";
  const areaLower = area?.toLowerCase() || "";

  // If Area is Zomato or Swiggy → Online
  if (areaLower === "zomato" || areaLower === "swiggy") {
    return "Online";
  }

  // If Order_type is Pickup or Home Delivery → Parcel
  if (orderTypeLower === "pickup" || orderTypeLower === "home delivery") {
    return "Parcel";
  }

  // Default to Dining
  return "Dining";
}

// Helper function to normalize area to lowercase
function normalizeArea(area: string, orderType?: string): "zomato" | "swiggy" | "dining" | "parcel" {
  const areaLower = area?.toLowerCase().trim() || "";
  const orderTypeLower = orderType?.toLowerCase().trim() || "";

  // Check for Zomato variations
  if (areaLower.includes("zomato")) {
    return "zomato";
  }

  // Check for Swiggy variations
  if (areaLower.includes("swiggy")) {
    return "swiggy";
  }

  // Check for Parcel/Delivery variations
  if (areaLower.includes("parcel") || areaLower.includes("home delivery") || areaLower.includes("pickup")) {
    return "parcel";
  }

  // Check order type as fallback
  if (orderTypeLower.includes("pickup") || orderTypeLower.includes("home delivery")) {
    return "parcel";
  }
  if (orderTypeLower.includes("delivery")) {
    return "parcel";
  }

  // Default to dining
  return "dining";
}

// Helper function to extract KG factor from variation value (e.g., "250 GM" -> 0.25)
function getKgFactor(variationValue: string): number {
  if (!variationValue) return 1;

  const lower = variationValue.toLowerCase().trim();

  // Check for grams
  const gmMatch = lower.match(/(\d+\.?\d*)\s*(gm|gms|gram|grams)/);
  if (gmMatch) {
    const grams = parseFloat(gmMatch[1]);
    return grams / 1000;
  }

  // Check for KG
  const kgMatch = lower.match(/(\d+\.?\d*)\s*(kg|kgs|kilogram|kilograms)/);
  if (kgMatch) {
    return parseFloat(kgMatch[1]);
  }

  // Check for specific patterns like "100 Gms", "250Gm[O]", "500Gm[O]", "1 KG [P]"
  if (lower.includes("100")) return 0.1;
  if (lower.includes("250")) return 0.25;
  if (lower.includes("500")) return 0.5;
  if (lower.includes("1 kg") || lower.includes("1kg") || lower.includes("1 kg [p]")) return 1.0;

  return 1; // Default to 1 if can't parse
}

// Helper function to parse date string (handles multiple formats)
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try YYYY-MM-DD format first (from HTML date input)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]);
    const day = parseInt(isoMatch[3]);
    // Use UTC to avoid timezone issues
    const result = new Date(Date.UTC(year, month - 1, day));
    //console.log(`parseDate("${dateStr}") → ${result.toISOString()}`);
    return result;
  }

  // Try other date formats
  const formats = [
    /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or D/M/YYYY
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
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  // Fallback: try native Date parsing
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// GET /api/sales/item/:itemId - Get sales data for a specific item directly from petpooja collection
export const handleGetItemSales: RequestHandler = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { startDate, endDate, restaurant } = req.query;

    // Parse dates
    let start: Date, end: Date;

    if (startDate && endDate) {
      const parsedStart = parseDate(startDate as string);
      const parsedEnd = parseDate(endDate as string);

      if (!parsedStart || !parsedEnd) {
        start = new Date("2000-01-01");
        end = new Date("2099-12-31");
      } else {
        start = parsedStart;
        end = new Date(parsedEnd.getTime() + 24 * 60 * 60 * 1000 - 1);
      }
    } else {
      start = new Date("2000-01-01");
      end = new Date("2099-12-31");
    }

    const db = await getDatabase();

    // Get the item to find all its SAP codes
    const itemsCollection = db.collection("items");
    const item = await itemsCollection.findOne({ itemId });

    if (!item) {
      return res.json({
        success: true,
        data: {
          itemId,
          zomatoData: { quantity: 0, value: 0, variations: [] },
          swiggyData: { quantity: 0, value: 0, variations: [] },
          diningData: { quantity: 0, value: 0, variations: [] },
          parcelData: { quantity: 0, value: 0, variations: [] },
          monthlyData: [],
          dateWiseData: [],
          restaurantSales: {},
        },
      });
    }

    // Build a map of SAP codes for this item
    const sapCodeToVariation: { [sapCode: string]: string } = {};
    if (item.variations && Array.isArray(item.variations)) {
      item.variations.forEach((variation: any, idx: number) => {
        if (variation.sapCode) {
          const variationName = variation.value || variation.name || `Variation ${idx + 1}`;
          sapCodeToVariation[variation.sapCode] = variationName;
        }
      });
    }

    const sapCodes = Object.keys(sapCodeToVariation);
    console.log(
      `📊 Fetching sales for item ${itemId} from petpooja collection`,
    );
    console.log(`  SAP codes: ${sapCodes.join(", ")}`);
    console.log(`  Date range: ${start.toISOString()} to ${end.toISOString()}`);

    if (sapCodes.length === 0) {
      return res.json({
        success: true,
        data: {
          itemId,
          zomatoData: { quantity: 0, value: 0, variations: [] },
          swiggyData: { quantity: 0, value: 0, variations: [] },
          diningData: { quantity: 0, value: 0, variations: [] },
          parcelData: { quantity: 0, value: 0, variations: [] },
          monthlyData: [],
          dateWiseData: [],
          restaurantSales: {},
        },
      });
    }

    // Query petpooja collection directly using MongoDB aggregation
    const petpoojaCollection = db.collection("petpooja");

    // First, get all data files to extract sales records
    const allPetpoojaData = await petpoojaCollection.find({}).toArray();

    // Process all data and aggregate
    const salesByArea: {
      [key in "zomato" | "swiggy" | "dining" | "parcel"]: {
        [variationName: string]: { quantity: number; value: number };
      };
    } = {
      zomato: {},
      swiggy: {},
      dining: {},
      parcel: {},
    };

    const monthlyByArea: { [key: string]: { [area: string]: number } } = {};
    const dailyByArea: { [key: string]: { [area: string]: number } } = {};
    const restaurantSales: { [key: string]: number } = {};

    let totalRecords = 0;
    let matchedRecords = 0;

    // Helper to get column index
    const getColumnIndex = (headers: string[], name: string) =>
      headers.findIndex((h) => h.toLowerCase().trim() === name.toLowerCase().trim());

    for (const petpoojaDoc of allPetpoojaData) {
      if (!Array.isArray(petpoojaDoc.data) || petpoojaDoc.data.length < 2) continue;

      const headers = petpoojaDoc.data[0] as string[];
      const dataRows = petpoojaDoc.data.slice(1);

      const sapCodeIdx = getColumnIndex(headers, "sap_code");
      const restaurantIdx = getColumnIndex(headers, "restaurant_name");
      const dateIdx = getColumnIndex(headers, "New Date");
      const areaIdx = getColumnIndex(headers, "area");
      const orderTypeIdx = getColumnIndex(headers, "order_type");
      const quantityIdx = getColumnIndex(headers, "item_quantity");
      const priceIdx = getColumnIndex(headers, "item_price");

      if (sapCodeIdx === -1) continue;

      for (const row of dataRows) {
        if (!Array.isArray(row)) continue;

        totalRecords++;
        const sapCode = row[sapCodeIdx]?.toString().trim() || "";

        // Only process rows matching this item's SAP codes
        if (!sapCodeToVariation[sapCode]) continue;

        const dateStr = row[dateIdx]?.toString().trim() || "";
        const recordDate = parseDate(dateStr);

        // Filter by date range
        if (!recordDate || recordDate < start || recordDate > end) continue;

        const restaurantName = restaurantIdx !== -1 ? row[restaurantIdx]?.toString().trim() || "Unknown" : "Unknown";

        // Filter by restaurant if provided
        if (restaurant && restaurantName !== restaurant) continue;

        matchedRecords++;

        const quantity = quantityIdx !== -1 ? parseFloat(row[quantityIdx]?.toString() || "0") || 0 : 0;
        const price = priceIdx !== -1 ? parseFloat(row[priceIdx]?.toString() || "0") || 0 : 0;
        const value = Math.round(quantity * price);

        const area = areaIdx !== -1 ? row[areaIdx]?.toString().trim() || "" : "";
        const orderType = orderTypeIdx !== -1 ? row[orderTypeIdx]?.toString().trim() || "" : "";
        const normalizedArea = normalizeArea(area, orderType) as
          | "zomato"
          | "swiggy"
          | "dining"
          | "parcel";

        const variationName = sapCodeToVariation[sapCode];

        // Aggregate by area & variation
        if (!salesByArea[normalizedArea][variationName]) {
          salesByArea[normalizedArea][variationName] = { quantity: 0, value: 0 };
        }
        salesByArea[normalizedArea][variationName].quantity += Math.round(quantity);
        salesByArea[normalizedArea][variationName].value += value;

        // Aggregate by month & area
        const month = recordDate.toISOString().substring(0, 7);
        if (!monthlyByArea[month]) monthlyByArea[month] = {};
        monthlyByArea[month][normalizedArea] =
          (monthlyByArea[month][normalizedArea] || 0) + Math.round(quantity);

        // Aggregate by day & area
        const day = recordDate.toISOString().substring(0, 10);
        if (!dailyByArea[day]) dailyByArea[day] = {};
        dailyByArea[day][normalizedArea] =
          (dailyByArea[day][normalizedArea] || 0) + Math.round(quantity);

        // Aggregate by restaurant
        restaurantSales[restaurantName] =
          (restaurantSales[restaurantName] || 0) + Math.round(quantity);
      }
    }

    // Format data for output
    const formatAreaData = (
      data: { [variationName: string]: { quantity: number; value: number } },
    ) => {
      const variations = Object.entries(data).map(([variationName, info]) => ({
        name: variationName,
        quantity: info.quantity,
        value: info.value,
      }));

      return {
        quantity: variations.reduce((sum, v) => sum + v.quantity, 0),
        value: variations.reduce((sum, v) => sum + v.value, 0),
        variations,
      };
    };

    // Build monthly chart data
    const monthlyData = Object.entries(monthlyByArea)
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .map(([month, areas]) => ({
        month,
        zomatoQty: areas.zomato || 0,
        swiggyQty: areas.swiggy || 0,
        diningQty: areas.dining || 0,
        parcelQty: areas.parcel || 0,
        totalQty:
          (areas.zomato || 0) +
          (areas.swiggy || 0) +
          (areas.dining || 0) +
          (areas.parcel || 0),
      }));

    // Build daily chart data
    const dateWiseData = Object.entries(dailyByArea)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, areas]) => ({
        date,
        zomatoQty: areas.zomato || 0,
        swiggyQty: areas.swiggy || 0,
        diningQty: areas.dining || 0,
        parcelQty: areas.parcel || 0,
        totalQty:
          (areas.zomato || 0) +
          (areas.swiggy || 0) +
          (areas.dining || 0) +
          (areas.parcel || 0),
      }));

    const salesData = {
      itemId,
      zomatoData: formatAreaData(salesByArea.zomato),
      swiggyData: formatAreaData(salesByArea.swiggy),
      diningData: formatAreaData(salesByArea.dining),
      parcelData: formatAreaData(salesByArea.parcel),
      monthlyData,
      dateWiseData,
      restaurantSales,
    };

    console.log(`✅ Sales data for ${itemId}:`, {
      totalRecords,
      matchedRecords,
      zomato: salesData.zomatoData.quantity,
      swiggy: salesData.swiggyData.quantity,
      dining: salesData.diningData.quantity,
      parcel: salesData.parcelData.quantity,
    });

    res.json({
      success: true,
      data: salesData,
    });
  } catch (error) {
    console.error("Error in handleGetItemSales:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// GET /api/sales/summary - Get sales summary data
export const handleGetSalesSummary: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // TODO: Aggregate sales data from MongoDB
    const summary = {
      period: {
        start: startDate,
        end: endDate,
      },
      channels: {
        dining: {
          quantity: 0,
          value: 0,
        },
        parcel: {
          quantity: 0,
          value: 0,
        },
        online: {
          quantity: 0,
          value: 0,
        },
      },
      total: {
        quantity: 0,
        value: 0,
      },
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// POST /api/sales - Record a new sale (for future use)
export const handleRecordSale: RequestHandler = async (req, res) => {
  try {
    const { itemId, variationId, channel, quantity, value, date } = req.body;

    // Validate required fields
    if (!itemId || !variationId || !channel || !quantity || !value || !date) {
      res.status(400).json({
        success: false,
        error:
          "Missing required fields: itemId, variationId, channel, quantity, value, date",
      });
      return;
    }

    // TODO: Insert sale record into MongoDB
    const saleRecord: SalesRecord = {
      itemId,
      variationId,
      channel,
      quantity,
      value,
      date,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      data: saleRecord,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// GET /api/sales/monthly/:itemId - Get monthly sales data for an item
export const handleGetMonthlySales: RequestHandler = async (req, res) => {
  try {
    const { itemId } = req.params;

    // TODO: Aggregate sales data by month from MongoDB
    const monthlyData = [];

    res.json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// GET /api/sales/daily/:itemId/:month - Get daily sales data for a month
export const handleGetDailySales: RequestHandler = async (req, res) => {
  try {
    const { itemId, month } = req.params;

    // TODO: Aggregate sales data by day for the specified month from MongoDB
    const dailyData = [];

    res.json({
      success: true,
      data: dailyData,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// Debug endpoint - Get raw sales data for an item without date filtering from petpooja collection
export const handleDebugItemSalesRaw: RequestHandler = async (req, res) => {
  try {
    const { itemId } = req.query;

    if (!itemId) {
      return res.status(400).json({ error: "itemId query parameter required" });
    }

    const db = await getDatabase();
    const itemsCollection = db.collection("items");
    const item = await itemsCollection.findOne({ itemId });

    if (!item) {
      return res.json({
        success: false,
        error: `Item ${itemId} not found`,
      });
    }

    // Build a map of SAP codes for this item
    const sapCodeToVariation: { [sapCode: string]: string } = {};
    if (item.variations && Array.isArray(item.variations)) {
      item.variations.forEach((variation: any, idx: number) => {
        if (variation.sapCode) {
          const variationName = variation.value || variation.name || `Variation ${idx + 1}`;
          sapCodeToVariation[variation.sapCode] = variationName;
        }
      });
    }

    const sapCodes = Object.keys(sapCodeToVariation);

    const salesByArea: {
      [key in "zomato" | "swiggy" | "dining" | "parcel"]: {
        [variationName: string]: { quantity: number; value: number };
      };
    } = {
      zomato: {},
      swiggy: {},
      dining: {},
      parcel: {},
    };

    let totalRecords = 0;
    let areaCount: { [key: string]: number } = {};

    // Query petpooja collection
    const petpoojaCollection = db.collection("petpooja");
    const allPetpoojaData = await petpoojaCollection.find({}).toArray();

    const getColumnIndex = (headers: string[], name: string) =>
      headers.findIndex((h) => h.toLowerCase().trim() === name.toLowerCase().trim());

    for (const petpoojaDoc of allPetpoojaData) {
      if (!Array.isArray(petpoojaDoc.data) || petpoojaDoc.data.length < 2) continue;

      const headers = petpoojaDoc.data[0] as string[];
      const dataRows = petpoojaDoc.data.slice(1);

      const sapCodeIdx = getColumnIndex(headers, "sap_code");
      const areaIdx = getColumnIndex(headers, "area");
      const orderTypeIdx = getColumnIndex(headers, "order_type");
      const quantityIdx = getColumnIndex(headers, "item_quantity");
      const priceIdx = getColumnIndex(headers, "item_price");

      if (sapCodeIdx === -1) continue;

      for (const row of dataRows) {
        if (!Array.isArray(row)) continue;

        const sapCode = row[sapCodeIdx]?.toString().trim() || "";
        if (!sapCodeToVariation[sapCode]) continue;

        totalRecords++;

        const area = areaIdx !== -1 ? row[areaIdx]?.toString().trim() || "" : "";
        const orderType = orderTypeIdx !== -1 ? row[orderTypeIdx]?.toString().trim() || "" : "";
        const normalizedArea = normalizeArea(area, orderType) as
          | "zomato"
          | "swiggy"
          | "dining"
          | "parcel";

        areaCount[normalizedArea] = (areaCount[normalizedArea] || 0) + 1;

        const quantity = quantityIdx !== -1 ? parseFloat(row[quantityIdx]?.toString() || "0") || 0 : 0;
        const price = priceIdx !== -1 ? parseFloat(row[priceIdx]?.toString() || "0") || 0 : 0;
        const value = Math.round(quantity * price);

        const variationName = sapCodeToVariation[sapCode];

        if (!salesByArea[normalizedArea][variationName]) {
          salesByArea[normalizedArea][variationName] = { quantity: 0, value: 0 };
        }
        salesByArea[normalizedArea][variationName].quantity += Math.round(quantity);
        salesByArea[normalizedArea][variationName].value += value;
      }
    }

    const formatAreaData = (data: {
      [variationName: string]: { quantity: number; value: number };
    }) => {
      const variations = Object.entries(data).map(([variationName, info]) => ({
        name: variationName,
        quantity: info.quantity,
        value: info.value,
      }));
      return {
        quantity: variations.reduce((sum, v) => sum + v.quantity, 0),
        value: variations.reduce((sum, v) => sum + v.value, 0),
        variations,
      };
    };

    res.json({
      success: true,
      itemId,
      itemName: (item as any).itemName,
      sapCodes,
      totalRecords,
      areaCount,
      zomatoData: formatAreaData(salesByArea.zomato),
      swiggyData: formatAreaData(salesByArea.swiggy),
      diningData: formatAreaData(salesByArea.dining),
      parcelData: formatAreaData(salesByArea.parcel),
    });
  } catch (error) {
    console.error("Error in debug sales raw:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET /api/sales/debug-parcel/:itemId - Debug endpoint to see all rows being counted as Parcel
export const handleDebugParcelData: RequestHandler = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({ error: "itemId parameter required" });
    }

    const db = await getDatabase();
    const itemsCollection = db.collection("items");
    const item = await itemsCollection.findOne({ itemId });

    if (!item) {
      return res.json({
        success: false,
        error: `Item ${itemId} not found`,
      });
    }

    // Build a map of SAP codes for this item
    const sapCodeToVariation: { [sapCode: string]: string } = {};
    if (item.variations && Array.isArray(item.variations)) {
      item.variations.forEach((variation: any, idx: number) => {
        if (variation.sapCode) {
          const variationName = variation.value || variation.name || `Variation ${idx + 1}`;
          sapCodeToVariation[variation.sapCode] = variationName;
        }
      });
    }

    const sapCodes = Object.keys(sapCodeToVariation);
    console.log(`🔍 Debugging Parcel data for item ${itemId}`);
    console.log(`  SAP codes: ${sapCodes.join(", ")}`);

    const parcelByVariation: { [variation: string]: number } = {};
    const parcelRows: any[] = [];
    let totalQuantity = 0;

    const getColumnIndex = (headers: string[], name: string) =>
      headers.findIndex((h) => h.toLowerCase().trim() === name.toLowerCase().trim());

    const petpoojaCollection = db.collection("petpooja");
    const allPetpoojaData = await petpoojaCollection.find({}).toArray();

    for (const petpoojaDoc of allPetpoojaData) {
      if (!Array.isArray(petpoojaDoc.data) || petpoojaDoc.data.length < 2) continue;

      const headers = petpoojaDoc.data[0] as string[];
      const dataRows = petpoojaDoc.data.slice(1);

      const sapCodeIdx = getColumnIndex(headers, "sap_code");
      const areaIdx = getColumnIndex(headers, "area");
      const orderTypeIdx = getColumnIndex(headers, "order_type");
      const quantityIdx = getColumnIndex(headers, "item_quantity");
      const priceIdx = getColumnIndex(headers, "item_price");
      const dateIdx = getColumnIndex(headers, "New Date");
      const restaurantIdx = getColumnIndex(headers, "restaurant_name");

      if (sapCodeIdx === -1) continue;

      for (const row of dataRows) {
        if (!Array.isArray(row)) continue;

        const sapCode = row[sapCodeIdx]?.toString().trim() || "";
        if (!sapCodeToVariation[sapCode]) continue;

        const area = areaIdx !== -1 ? row[areaIdx]?.toString().trim() || "" : "";
        const orderType = orderTypeIdx !== -1 ? row[orderTypeIdx]?.toString().trim() || "" : "";
        const normalizedArea = normalizeArea(area, orderType);

        // Only collect parcel rows
        if (normalizedArea !== "parcel") continue;

        const quantity = quantityIdx !== -1 ? parseFloat(row[quantityIdx]?.toString() || "0") || 0 : 0;
        const price = priceIdx !== -1 ? parseFloat(row[priceIdx]?.toString() || "0") || 0 : 0;
        const date = dateIdx !== -1 ? row[dateIdx]?.toString().trim() || "" : "";
        const restaurant = restaurantIdx !== -1 ? row[restaurantIdx]?.toString().trim() || "" : "";
        const variation = sapCodeToVariation[sapCode];

        // Track by variation
        if (!parcelByVariation[variation]) {
          parcelByVariation[variation] = 0;
        }
        parcelByVariation[variation] += quantity;

        parcelRows.push({
          sapCode,
          variation,
          area,
          orderType,
          quantity,
          price,
          date,
          restaurant,
        });

        totalQuantity += quantity;
      }
    }

    res.json({
      success: true,
      itemId,
      itemName: (item as any).itemName,
      sapCodes,
      totalParcelQuantity: totalQuantity,
      parcelByVariation,
      parcelRowCount: parcelRows.length,
      parcelRows: parcelRows.slice(0, 50), // First 50 rows for inspection
    });
  } catch (error) {
    console.error("Error in debug parcel data:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET /api/sales/restaurants - Get unique restaurant names from all sales data
export const handleGetRestaurants: RequestHandler = async (req, res) => {
  try {
    console.log("📥 GET /api/sales/restaurants - fetching unique restaurants");

    const db = await getDatabase();
    const itemsCollection = db.collection("items");

    // Aggregate all unique restaurant names from salesHistory
    console.log("🔍 Running MongoDB aggregation to find unique restaurants...");

    const restaurants = await itemsCollection
      .aggregate([
        { $unwind: "$variations" },
        { $unwind: "$variations.salesHistory" },
        {
          $group: {
            _id: "$variations.salesHistory.restaurant",
          },
        },
        { $match: { _id: { $nin: [null, ""] } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const restaurantNames = restaurants.map((r: any) => r._id).filter(Boolean);

    console.log(
      `✅ Found ${restaurantNames.length} unique restaurants:`,
      restaurantNames,
    );

    res.json({
      success: true,
      data: restaurantNames,
    });
  } catch (error) {
    console.error("❌ Error fetching restaurants:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// DELETE /api/sales/item/:itemId - Sales data is now managed via petpooja collection uploads
// To reset sales data, re-upload the petpooja file or delete the upload records
export const handleResetItemSales: RequestHandler = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: "itemId is required",
      });
    }

    const db = await getDatabase();
    const itemsCollection = db.collection("items");

    // Find the item first
    const item = await itemsCollection.findOne({ itemId });
    if (!item) {
      return res.status(404).json({
        success: false,
        error: `Item with ID "${itemId}" not found`,
      });
    }

    console.log(
      `📊 Sales data for item ${itemId} is managed through petpooja uploads`,
    );

    res.json({
      success: true,
      message: `Sales data for item "${item.itemName}" (ID: ${itemId}) is managed through petpooja collection. To modify sales data, re-upload or delete petpooja records.`,
      itemName: item.itemName,
      info: "Sales data is no longer stored in item variations - it's fetched directly from the petpooja collection on demand",
    });
  } catch (error) {
    console.error("Error in handleResetItemSales:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

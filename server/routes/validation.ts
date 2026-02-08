import { RequestHandler } from "express";
import { MongoClient, Db } from "mongodb";

const MONGODB_URI = "mongodb+srv://admin:admin1@cluster0.a3duo.mongodb.net/?appName=Cluster0";

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
      console.log("✅ Connected to MongoDB for validation");
      cachedDb = client.db("upload_system");
      return cachedDb;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      connectionPromise = null;
      throw new Error("Database connection failed");
    }
  })();

  return connectionPromise;
}

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

export const handleDataValidation: RequestHandler = async (req, res) => {
  try {
    const { dataType, data } = req.body;

    if (!dataType || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Invalid request: dataType and data array required" });
    }

    console.log(`🔍 Starting validation for ${dataType} data with ${data.length} rows`);

    const db = await getDatabase();
    const validationDetails: ValidationRow[] = [];
    let matchedCount = 0;
    let errorCount = 0;

    // Get database reference based on data type
    let dbCollection = null;
    let itemsCollection = null;

    if (dataType === "sales") {
      dbCollection = db.collection("sales_data");
      itemsCollection = db.collection("items");
    } else if (dataType === "items") {
      dbCollection = db.collection("items");
    }

    if (!dbCollection) {
      return res.status(400).json({ error: "Invalid data type" });
    }

    // Validate each row
    for (let i = 0; i < data.length; i++) {
      const uploadedRow = data[i];
      const rowIndex = i + 1;
      const rowValidation: ValidationRow = {
        rowIndex,
        status: "match",
        uploadedData: uploadedRow,
        databaseData: null,
        differences: [],
      };

      try {
        if (dataType === "sales") {
          // For sales data, validate against items and check if SAP code exists
          const sapCode = uploadedRow.sapCode || uploadedRow.sap_code || uploadedRow["SAP Code"];
          
          if (!sapCode) {
            rowValidation.status = "error";
            rowValidation.errorMessage = "Missing SAP Code";
            rowValidation.differences.push("SAP Code is required");
            errorCount++;
          } else {
            // Find item with this SAP code
            let foundItem = null;
            if (itemsCollection) {
              const items = await itemsCollection.find({}).toArray();
              for (const item of items) {
                if (item.variations) {
                  const variation = item.variations.find((v: any) => v.sapCode === sapCode);
                  if (variation) {
                    foundItem = { item, variation };
                    break;
                  }
                }
              }
            }

            if (!foundItem) {
              rowValidation.status = "error";
              rowValidation.errorMessage = `SAP Code "${sapCode}" not found in database`;
              rowValidation.differences.push(`SAP Code mismatch: "${sapCode}" does not exist`);
              errorCount++;
            } else {
              // Validate data against the found item/variation
              const variation = foundItem.variation;
              const uploadedPrice = parseFloat(uploadedRow.price || uploadedRow.item_price || 0);
              const uploadedQuantity = parseFloat(uploadedRow.quantity || uploadedRow.item_quantity || 0);
              
              const databasePrice = variation.price || 0;
              const differences: string[] = [];

              if (Math.abs(uploadedPrice - databasePrice) > 0.01) {
                differences.push(`Price mismatch: uploaded ${uploadedPrice} vs database ${databasePrice}`);
              }

              if (differences.length > 0) {
                rowValidation.status = "error";
                rowValidation.differences = differences;
                rowValidation.databaseData = {
                  sapCode,
                  price: databasePrice,
                  variationValue: variation.value,
                };
                errorCount++;
              } else {
                rowValidation.status = "match";
                rowValidation.databaseData = {
                  sapCode,
                  price: databasePrice,
                  variationValue: variation.value,
                };
                matchedCount++;
              }
            }
          }
        } else if (dataType === "items") {
          // For items data, validate item details
          const itemId = uploadedRow.itemId || uploadedRow.item_id || uploadedRow["Item ID"];

          if (!itemId) {
            rowValidation.status = "error";
            rowValidation.errorMessage = "Missing Item ID";
            rowValidation.differences.push("Item ID is required");
            errorCount++;
          } else {
            const dbItem = await dbCollection.findOne({ itemId: itemId.toString() });

            if (!dbItem) {
              rowValidation.status = "error";
              rowValidation.errorMessage = `Item ID "${itemId}" not found in database`;
              rowValidation.differences.push(`Item ID "${itemId}" does not exist`);
              errorCount++;
            } else {
              // Compare key fields
              const differences: string[] = [];
              const itemName = uploadedRow.itemName || uploadedRow.item_name || uploadedRow["Item Name"];
              const group = uploadedRow.group || uploadedRow.group || uploadedRow["Group"];
              const category = uploadedRow.category || uploadedRow.category || uploadedRow["Category"];

              if (itemName && itemName !== dbItem.itemName) {
                differences.push(
                  `Item Name mismatch: uploaded "${itemName}" vs database "${dbItem.itemName}"`
                );
              }
              if (group && group !== dbItem.group) {
                differences.push(`Group mismatch: uploaded "${group}" vs database "${dbItem.group}"`);
              }
              if (category && category !== dbItem.category) {
                differences.push(
                  `Category mismatch: uploaded "${category}" vs database "${dbItem.category}"`
                );
              }

              if (differences.length > 0) {
                rowValidation.status = "error";
                rowValidation.differences = differences;
                rowValidation.databaseData = {
                  itemId: dbItem.itemId,
                  itemName: dbItem.itemName,
                  group: dbItem.group,
                  category: dbItem.category,
                };
                errorCount++;
              } else {
                rowValidation.status = "match";
                rowValidation.databaseData = dbItem;
                matchedCount++;
              }
            }
          }
        }
      } catch (rowError) {
        rowValidation.status = "error";
        rowValidation.errorMessage =
          rowError instanceof Error ? rowError.message : "Validation error";
        rowValidation.differences.push("Unexpected error during validation");
        errorCount++;
      }

      validationDetails.push(rowValidation);
    }

    const totalRows = data.length;
    const accuracy = totalRows > 0 ? (matchedCount / totalRows) * 100 : 0;

    const result: ValidationResult = {
      totalRows,
      matchedRows: matchedCount,
      errorRows: errorCount,
      accuracy,
      validationDetails,
    };

    console.log(`✅ Validation complete: ${matchedCount}/${totalRows} rows matched (${accuracy.toFixed(1)}%)`);
    res.json(result);
  } catch (error) {
    console.error("❌ Validation error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Validation failed",
    });
  }
};

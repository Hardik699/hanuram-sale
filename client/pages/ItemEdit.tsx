import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";

const CHANNELS = ["Dining", "Parcale", "Swiggy", "Zomato", "GS1"];
const ITEM_TYPES = ["Service", "Goods"];
const UNIT_TYPES = ["Single Count", "GM to KG", "All Count"];
const GST_OPTIONS = ["0%", "5%", "12%", "18%", "28%"];
const HSN_CODES = [
  "1001",
  "1002",
  "1003",
  "1004",
  "1005",
  "2101",
  "2102",
  "2201",
  "2202",
  "2301",
];
const VARIATION_VALUES = [
  "200 Gms",
  "250 Gms",
  "500 Gms",
  "1 Kg",
  "500 ml",
  "1 L",
  "2 L",
];

// Helper function to calculate auto pricing
const calculateAutoPrices = (basePrice: number) => {
  if (basePrice <= 0) return { Zomato: 0, Swiggy: 0, GS1: 0 };

  // Round to nearest 5
  const roundToNearest5 = (price: number) => {
    return Math.round(price / 5) * 5;
  };

  // Add 15% markup for Zomato and Swiggy
  const priceWith15Percent = basePrice * 1.15;
  const autoPriceZomato = roundToNearest5(priceWith15Percent);
  const autoPriceSwiggy = roundToNearest5(priceWith15Percent);

  // Add 20% markup for GS1
  const priceWith20Percent = basePrice * 1.20;
  const autoPriceGS1 = roundToNearest5(priceWith20Percent);

  return { Zomato: autoPriceZomato, Swiggy: autoPriceSwiggy, GS1: autoPriceGS1 };
};

interface Variation {
  id: string;
  name: string;
  value: string;
  area?: string;
  channels: Record<string, number>;
  price: number;
  sapCode: string;
  gs1Code?: string;
  saleType?: "QTY" | "KG";
  profitMargin: number;
  gs1Enabled?: boolean;
  salesHistory?: Array<{
    date: string;
    channel: "Dining" | "Parcel" | "Online";
    quantity: number;
    value: number;
    category?: string;
  }>;
}

export default function ItemEdit() {
  const params = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const itemId = params.itemId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [itemName, setItemName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [description, setDescription] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [group, setGroup] = useState("");
  const [category, setCategory] = useState("");
  const [profitMargin, setProfitMargin] = useState("");
  const [gst, setGst] = useState("");
  const [itemType, setItemType] = useState("Goods");
  const [unitType, setUnitType] = useState("Single Count");
  const [variations, setVariations] = useState<Variation[]>([]);

  const [activeTab, setActiveTab] = useState<"general" | "variations" | "images">("general");

  const [groups, setGroups] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [hsnCodes, setHsnCodes] = useState<string[]>(HSN_CODES);
  const [variationValues, setVariationValues] =
    useState<string[]>(VARIATION_VALUES);

  const [newGroup, setNewGroup] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newHsnCode, setNewHsnCode] = useState("");
  const [newVariationValue, setNewVariationValue] = useState("");

  // Group editing
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [groupCategories, setGroupCategories] = useState<string[]>([]);
  const [newGroupCategory, setNewGroupCategory] = useState("");
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState("");

  // Helper to capitalize first letter of each word
  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Images with channel info
  interface ImageWithChannel {
    file?: File;
    preview: string;
    channel: string;
  }

  const [images, setImages] = useState<ImageWithChannel[]>([]);
  const [selectedImageChannel, setSelectedImageChannel] = useState("Website");
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [tempFileInput, setTempFileInput] = useState<HTMLInputElement | null>(null);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const response = await fetch("/api/items/dropdowns");
        if (response.ok) {
          const data = await response.json();
          if (data.groups) setGroups(data.groups);
          if (data.categories) setCategories(data.categories);
          if (data.hsnCodes) setHsnCodes(data.hsnCodes);
          if (data.variationValues) setVariationValues(data.variationValues);
        }
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };

    loadDropdownData();
  }, []);

  // Load item data
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/items");
        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }

        const items = await response.json();
        const foundItem = items.find((i: any) => i.itemId === itemId);

        if (!foundItem) {
          setError(`Item with ID "${itemId}" not found`);
          return;
        }

        // Populate form with item data
        setItemName(foundItem.itemName);
        setShortCode(foundItem.shortCode);
        setDescription(foundItem.description || "");
        setHsnCode(foundItem.hsnCode || "");
        setGroup(foundItem.group);
        setCategory(foundItem.category);
        setProfitMargin(foundItem.profitMargin?.toString() || "");
        setGst(foundItem.gst?.toString() || "");
        setItemType(foundItem.itemType || "Goods");
        setUnitType(foundItem.unitType || "Single Count");

        // Load existing images with channel info
        if (foundItem.images && Array.isArray(foundItem.images)) {
          const imageList = foundItem.images.map((img: any) => {
            // Handle both old format (string) and new format (object with url and channel)
            if (typeof img === "string") {
              return { preview: img, channel: "Website" };
            } else {
              return { preview: img.url || img.preview, channel: img.channel || "Website" };
            }
          });
          setImages(imageList);
        }

        // Load variations with auto-calculated prices
        if (foundItem.variations && Array.isArray(foundItem.variations)) {
          setVariations(
            foundItem.variations.map((v: any) => {
              const basePrice = v.price || 0;
              const autoPrices = calculateAutoPrices(basePrice);
              const gs1Enabled = v.channels?.GS1 && v.channels.GS1 > 0 ? true : false;

              // Ensure all channels are initialized
              const initialChannels = CHANNELS.reduce(
                (acc, ch) => ({ ...acc, [ch]: v.channels?.[ch] ?? 0 }),
                {} as Record<string, number>
              );

              return {
                id: v.id || Date.now().toString(),
                name: v.name || "",
                value: v.value || "",
                area: v.area || "",
                channels: {
                  ...initialChannels,
                  // Base price for Dining and Parcel (if not already set)
                  Dining: v.channels?.Dining ?? basePrice,
                  Parcale: v.channels?.Parcale ?? basePrice,
                  // Auto-calculated prices for Zomato and Swiggy (+15%)
                  Zomato: autoPrices.Zomato,
                  Swiggy: autoPrices.Swiggy,
                  // Include GS1 if it's enabled (+20%)
                  ...(gs1Enabled && { GS1: autoPrices.GS1 }),
                },
                price: basePrice,
                sapCode: v.sapCode || "",
                gs1Code: v.gs1Code || "",
                saleType: v.saleType || "QTY",
                profitMargin: v.profitMargin || 0,
                gs1Enabled: gs1Enabled,
                salesHistory: v.salesHistory || [],
              };
            }),
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load item";
        console.error("Error loading item:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  const openEditGroupModal = async (groupName: string) => {
    setSelectedGroupForEdit(groupName);
    setEditingGroupName(groupName);
    try {
      const response = await fetch(`/api/items/groups/${encodeURIComponent(groupName)}`);
      if (response.ok) {
        const data = await response.json();
        setGroupCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch group categories:", error);
      setGroupCategories([]);
    }
    setShowEditGroupModal(true);
  };

  const saveGroupChanges = async () => {
    try {
      const response = await fetch(`/api/items/groups/${encodeURIComponent(selectedGroupForEdit)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newName: editingGroupName,
          categories: groupCategories
        }),
      });
      if (response.ok) {
        // Update groups array if name changed
        if (editingGroupName !== selectedGroupForEdit) {
          const updated = groups.map(g => g === selectedGroupForEdit ? editingGroupName : g);
          setGroups(updated);
          if (group === selectedGroupForEdit) {
            setGroup(editingGroupName);
          }
        }
        setShowEditGroupModal(false);
        setNewGroupCategory("");
      }
    } catch (error) {
      console.error("Failed to save group changes:", error);
    }
  };

  const addCategoryToGroup = () => {
    if (newGroupCategory.trim() && !groupCategories.includes(newGroupCategory)) {
      setGroupCategories([...groupCategories, newGroupCategory]);
      setNewGroupCategory("");
    }
  };

  const removeCategoryFromGroup = (categoryName: string) => {
    setGroupCategories(groupCategories.filter(c => c !== categoryName));
  };

  const addGroup = async () => {
    if (newGroup.trim() && !groups.includes(newGroup)) {
      try {
        const response = await fetch("/api/items/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newGroup }),
        });
        if (response.ok) {
          const updated = [...groups, newGroup];
          setGroups(updated);
          setGroup(newGroup);
          setNewGroup("");
        }
      } catch (error) {
        console.error("Failed to add group:", error);
      }
    }
  };

  const addCategory = async () => {
    if (newCategory.trim() && !categories.includes(newCategory)) {
      try {
        const response = await fetch("/api/items/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCategory }),
        });
        if (response.ok) {
          const updated = [...categories, newCategory];
          setCategories(updated);
          setCategory(newCategory);
          setNewCategory("");
        }
      } catch (error) {
        console.error("Failed to add category:", error);
      }
    }
  };

  const addHsnCode = async () => {
    if (newHsnCode.trim() && !hsnCodes.includes(newHsnCode)) {
      try {
        const response = await fetch("/api/items/hsn-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: newHsnCode }),
        });
        if (response.ok) {
          const updated = [...hsnCodes, newHsnCode];
          setHsnCodes(updated);
          setHsnCode(newHsnCode);
          setNewHsnCode("");
        }
      } catch (error) {
        console.error("Failed to add HSN code:", error);
      }
    }
  };

  const addVariationValue = async () => {
    if (
      newVariationValue.trim() &&
      !variationValues.includes(newVariationValue)
    ) {
      try {
        const response = await fetch("/api/items/variation-values", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: newVariationValue }),
        });
        if (response.ok) {
          const updated = [...variationValues, newVariationValue];
          setVariationValues(updated);
          setNewVariationValue("");
        }
      } catch (error) {
        console.error("Failed to add variation value:", error);
      }
    }
  };

  const addVariation = () => {
    const newVariation: Variation = {
      id: Date.now().toString(),
      name: "",
      value: "",
      area: "",
      channels: {
        Dining: 0,
        Parcale: 0,
        Swiggy: 0,
        Zomato: 0,
        GS1: 0,
      },
      price: 0,
      sapCode: "",
      gs1Code: "",
      saleType: "QTY",
      profitMargin: 0,
      gs1Enabled: false,
      salesHistory: [],
    };
    setVariations([...variations, newVariation]);
  };

  const updateVariation = (id: string, field: string, value: any) => {
    setVariations(
      variations.map((v) => {
        if (v.id !== id) return v;

        const updated = { ...v, [field]: value };

        // Auto-calculate prices when base price changes
        if (field === "price") {
          const autoPrices = calculateAutoPrices(value);
          // Ensure all channels exist in the object before updating
          const channelsWithDefaults = CHANNELS.reduce(
            (acc, ch) => ({ ...acc, [ch]: updated.channels?.[ch] ?? 0 }),
            {} as Record<string, number>
          );
          updated.channels = {
            ...channelsWithDefaults,
            // Base price for Dining and Parcel
            Dining: value || 0,
            Parcale: value || 0,
            // Auto-calculated prices for Zomato and Swiggy (+15%)
            Zomato: autoPrices.Zomato,
            Swiggy: autoPrices.Swiggy,
          };
          // Add GS1 price if GS1 is enabled (+20%)
          if (updated.gs1Enabled) {
            updated.channels.GS1 = autoPrices.GS1;
          }
        }

        // When GS1 is toggled, calculate or clear GS1 price
        if (field === "gs1Enabled") {
          if (value) {
            // Enable GS1: calculate auto price
            const autoPrices = calculateAutoPrices(updated.price);
            updated.channels.GS1 = autoPrices.GS1;
          } else {
            // Disable GS1: set to 0
            updated.channels.GS1 = 0;
          }
        }

        return updated;
      }),
    );
  };

  const updateChannelPrice = (id: string, channel: string, value: number) => {
    setVariations(
      variations.map((v) =>
        v.id === id
          ? { ...v, channels: { ...v.channels, [channel]: value } }
          : v,
      ),
    );
  };

  const removeVariation = (id: string) => {
    setVariations(variations.filter((v) => v.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 0) {
      // Show modal to select channel
      setTempFileInput(e.target);
      setShowChannelModal(true);

      // Process files
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImages((prev) => [
            ...prev,
            {
              file: file,
              preview: event.target?.result as string,
              channel: selectedImageChannel,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleChannelSelect = (channel: string) => {
    // Update the channel for newly uploaded images
    setSelectedImageChannel(channel);
    setShowChannelModal(false);

    // Reset input
    if (tempFileInput) {
      tempFileInput.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImageChannel = (index: number, channel: string) => {
    setImages(
      images.map((img, i) =>
        i === index ? { ...img, channel } : img
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName || !group || !category) {
      alert("Please fill all required fields");
      return;
    }

    // Format images with channel info
    const imageData = images.map((img) => ({
      url: img.preview,
      channel: img.channel,
    }));

    const updatedItem = {
      itemId,
      itemName,
      shortCode,
      description,
      hsnCode,
      group,
      category,
      profitMargin: parseFloat(profitMargin) || 0,
      gst: parseFloat(gst) || 0,
      itemType,
      unitType,
      variations,
      images: imageData,
    };

    try {
      setSaving(true);
      console.log("📤 Updating item:", itemId);

      const response = await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API returned ${response.status}`);
      }

      console.log("✅ Item updated successfully");
      navigate(`/items/${itemId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to update item:", errorMessage);
      alert(`Error updating item: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 sm:p-8">
        <button
          onClick={() => navigate(`/items/${itemId}`)}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Item
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Loading item...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 sm:p-8">
        <button
          onClick={() => navigate("/items")}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Items
        </button>
        <div className="bg-white rounded-xl border border-red-200 p-8">
          <div className="text-red-600">
            <p className="font-semibold text-lg">Error</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 sm:p-8">
      <button
        onClick={() => navigate(`/items/${itemId}`)}
        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Item
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Item</h1>

        {/* Form Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "general"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            General Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("variations")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "variations"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Variations ({variations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "images"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Images ({images.length})
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item ID (Read-only)
                  </label>
                  <input
                    type="text"
                    value={itemId}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(toTitleCase(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Code (Read-only)
                  </label>
                  <input
                    type="text"
                    value={shortCode}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HSN Code
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={hsnCode}
                      onChange={(e) => setHsnCode(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="">Select HSN Code</option>
                      {hsnCodes.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setNewHsnCode("")}
                      className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold"
                    >
                      +
                    </button>
                  </div>
                  {newHsnCode !== null && newHsnCode !== undefined && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newHsnCode}
                        onChange={(e) => setNewHsnCode(e.target.value)}
                        placeholder="Enter new HSN Code"
                        autoFocus
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={addHsnCode}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST (%)
                  </label>
                  <select
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">Select GST</option>
                    {GST_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Group & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    >
                      <option value="">Select Group</option>
                      {groups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {group && (
                      <button
                        type="button"
                        onClick={() => openEditGroupModal(group)}
                        className="px-3 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-semibold"
                        title="Edit selected group"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNewGroup("")}
                      className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold"
                    >
                      +
                    </button>
                  </div>
                  {newGroup !== null && newGroup !== undefined && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newGroup}
                        onChange={(e) => setNewGroup(toTitleCase(e.target.value))}
                        placeholder="Enter new group"
                        autoFocus
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={addGroup}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setNewCategory("")}
                      className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold"
                    >
                      +
                    </button>
                  </div>
                  {newCategory !== null && newCategory !== undefined && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(toTitleCase(e.target.value))}
                        placeholder="Enter new category"
                        autoFocus
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={addCategory}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Item Type & Unit Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profit Margin (%)
                  </label>
                  <input
                    type="number"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(e.target.value)}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Type
                  </label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Type
                  </label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {UNIT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(toTitleCase(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 min-h-[100px]"
                  placeholder="Enter item description"
                />
              </div>
            </div>
          )}

          {activeTab === "variations" && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              {/* Variations Section */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Variations
                  </h3>
                  <button
                    type="button"
                    onClick={addVariation}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Variation
                  </button>
                </div>

                {variations.length > 0 ? (
                  variations.map((variation) => (
                    <div
                      key={variation.id}
                      className="mb-6 p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Variation Value
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={variation.value}
                              onChange={(e) =>
                                updateVariation(variation.id, "value", e.target.value)
                              }
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                            >
                              <option value="">Select Variation</option>
                              {variationValues.map((val) => (
                                <option key={val} value={val}>
                                  {val}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setNewVariationValue("")}
                              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold"
                            >
                              +
                            </button>
                          </div>
                          {newVariationValue !== null &&
                            newVariationValue !== undefined && (
                              <div className="mt-2 flex gap-2">
                                <input
                                  type="text"
                                  value={newVariationValue}
                                  onChange={(e) =>
                                    setNewVariationValue(toTitleCase(e.target.value))
                                  }
                                  placeholder="e.g., 300 Gms, 1.5 L"
                                  autoFocus
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                                <button
                                  type="button"
                                  onClick={addVariationValue}
                                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-semibold"
                                >
                                  Add
                                </button>
                              </div>
                            )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price
                          </label>
                          <input
                            type="number"
                            value={variation.price || 0}
                            onChange={(e) =>
                              updateVariation(
                                variation.id,
                                "price",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="0"
                            step="0.01"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SAP Code
                          </label>
                          <input
                            type="text"
                            value={variation.sapCode}
                            onChange={(e) =>
                              updateVariation(variation.id, "sapCode", e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profit Margin (%)
                          </label>
                          <input
                            type="number"
                            value={variation.profitMargin || 0}
                            onChange={(e) =>
                              updateVariation(
                                variation.id,
                                "profitMargin",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            step="0.01"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sale Type
                          </label>
                          <select
                            value={variation.saleType || "QTY"}
                            onChange={(e) =>
                              updateVariation(
                                variation.id,
                                "saleType",
                                e.target.value as "QTY" | "KG"
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            <option value="QTY">QTY (Quantity)</option>
                            <option value="KG">KG (Kilogram)</option>
                          </select>
                          <p className="text-[10px] text-gray-500 mt-1 italic">
                            {variation.saleType === "KG"
                              ? "KG: Converts value (e.g. 250 Gms) to weight (0.25)"
                              : "QTY: Counts each unit as 1.0"}
                          </p>
                        </div>
                      </div>

                      {/* Channel Prices */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Channel Prices (Area-wise)
                          </label>
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded space-y-1">
                            <p>Zomato & Swiggy: auto +15% (rounded to 5)</p>
                            <p>GS1: auto +20% (rounded to 5) - Optional</p>
                          </div>
                        </div>

                        {/* Standard Channels (excluding GS1) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          {CHANNELS.filter((ch) => ch !== "GS1").map((channel) => {
                      const isAutoCalculated = ["Zomato", "Swiggy"].includes(
                        channel,
                      );
                      return (
                        <div key={channel} className="flex flex-col">
                          <div className="flex flex-col mb-1 text-center bg-gray-50 rounded p-1 border border-gray-100">
                             <span className="text-[9px] font-bold text-purple-600 truncate" title={variation.value}>{variation.value}</span>
                             <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-tight leading-none">
                              {channel}
                              {isAutoCalculated && (
                                <span className="text-blue-600 ml-1">(auto)</span>
                              )}
                             </span>
                          </div>
                          <input
                            type="number"
                            value={variation.channels[channel] || 0}
                            onChange={(e) =>
                              updateChannelPrice(
                                variation.id,
                                channel,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="0"
                            step="0.01"
                            disabled={isAutoCalculated}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                              isAutoCalculated
                                ? "bg-blue-50 text-gray-500 cursor-not-allowed font-bold"
                                : ""
                            }`}
                          />
                        </div>
                      );
                    })}
                        </div>

                        {/* GS1 with Checkbox and Code */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`gs1-checkbox-${variation.id}`}
                              checked={variation.gs1Enabled || false}
                              onChange={(e) =>
                                updateVariation(
                                  variation.id,
                                  "gs1Enabled",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-purple-600 cursor-pointer"
                            />
                            <label
                              htmlFor={`gs1-checkbox-${variation.id}`}
                              className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                            >
                              Enable GS1 Channel
                            </label>
                          </div>

                          {variation.gs1Enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* GS1 Price */}
                        <div>
                          <div className="flex flex-col mb-1 text-center bg-blue-50 rounded p-1 border border-blue-100">
                             <span className="text-[9px] font-bold text-purple-600 truncate">{variation.value}</span>
                             <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-tight leading-none">GS1 (auto)</span>
                          </div>
                          <input
                            type="number"
                            value={variation.channels.GS1 || 0}
                            placeholder="Auto: 0"
                            step="0.01"
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-blue-50 text-gray-500 cursor-not-allowed font-bold"
                          />
                          <p className="text-[10px] text-blue-600 mt-1 italic">
                            Auto +20% (rounded to 5)
                          </p>
                        </div>

                        {/* GS1 Code */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                            GS1 Code
                          </label>
                          <input
                            type="text"
                            value={variation.gs1Code || ""}
                            onChange={(e) =>
                              updateVariation(
                                variation.id,
                                "gs1Code",
                                e.target.value,
                              )
                            }
                            placeholder="Enter GS1 code"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                      </div>
                    )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeVariation(variation.id)}
                          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500">No variations added yet. Click "Add Variation" to start.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "images" && (
              <div className="space-y-6 animate-in slide-in-from-left duration-300">
                {/* Image Upload */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">📸 Images by Channel</h3>

                  {/* Upload Area */}
                  <div className="mb-6">
                    <div className="border-2 border-dashed border-purple-400 rounded-lg p-10 text-center bg-gradient-to-b from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-input"
                      />
                      <label htmlFor="image-input" className="cursor-pointer block">
                        <p className="text-3xl mb-2">📁</p>
                        <p className="text-gray-900 font-bold text-lg">
                          Click to upload images
                        </p>
                        <p className="text-gray-600 text-sm mt-2">PNG, JPG up to 10MB</p>
                        <p className="text-purple-600 text-xs mt-3 font-semibold">
                          Select channel in the popup that appears
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Image Previews Grouped by Channel */}
                  {images.length > 0 && (
                    <div className="space-y-8 mt-8">
                      <h4 className="text-lg font-bold text-gray-900 mb-4">
                        📷 Uploaded Images ({images.length})
                      </h4>
                      {["Website", "Zomato", "Swiggy", "GS1"]
                        .filter((channel) => images.some((img) => img.channel === channel))
                        .map((channel) => {
                          const channelImages = images.filter((img) => img.channel === channel);
                          return (
                            <div key={channel} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <h4 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                                {channel === "Website" && "🌐"}
                                {channel === "Zomato" && "🔴"}
                                {channel === "Swiggy" && "🟠"}
                                {channel === "GS1" && "📦"}
                                {" "}
                                {channel} ({channelImages.length})
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {channelImages.map((img, idx) => (
                                  <div key={idx} className="relative group">
                                    <img
                                      src={img.preview}
                                      alt={`${channel} Preview ${idx}`}
                                      className="w-full h-40 object-cover rounded-lg shadow-md"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(images.findIndex((i) => i === img))}
                                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg opacity-0 group-hover:opacity-100 transition"
                                      title="Delete image"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Channel Selection Modal */}
          {showChannelModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg p-4">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  📁 Select Channel for Images
                </h2>

                <p className="text-gray-600 text-center mb-6">
                  Choose which channel these images will be uploaded to:
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {["Website", "Zomato", "Swiggy", "GS1"].map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => handleChannelSelect(channel)}
                      className="px-4 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:border-purple-600 hover:bg-purple-50 transition text-gray-700"
                    >
                      {channel}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Click a channel to confirm upload
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 border-t pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/items/${itemId}`)}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Edit Group Modal */}
        {showEditGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                ✏️ Edit Group
              </h2>

              {/* Rename Group */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(toTitleCase(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Manage Categories */}
              <div className="mb-6 border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Categories in this Group
                </h3>

                {/* Add Category to Group */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(toTitleCase(e.target.value))}
                    placeholder="Add new category"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={addCategoryToGroup}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-semibold"
                  >
                    Add
                  </button>
                </div>

                {/* List of Categories */}
                <div className="space-y-2">
                  {groupCategories.length > 0 ? (
                    groupCategories.map((cat) => (
                      <div
                        key={cat}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                      >
                        <span className="text-sm text-gray-700">{cat}</span>
                        <button
                          type="button"
                          onClick={() => removeCategoryFromGroup(cat)}
                          className="text-red-600 hover:bg-red-50 px-2 py-1 rounded transition text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No categories yet</p>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={saveGroupChanges}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditGroupModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

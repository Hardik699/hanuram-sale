import { TrendingUp } from "lucide-react";

interface SalesCardProps {
  type: "Zomato" | "Swiggy" | "Dining" | "Parcel";
  totalQuantity: number;
  totalValue: number;
  variations: Array<{
    name: string;
    quantity: number;
    value: number;
  }>;
  saleType?: "QTY" | "KG";
}

const typeColors = {
  Zomato: {
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    text: "text-red-700",
  },
  Swiggy: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
    text: "text-orange-700",
  },
  Dining: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    text: "text-blue-700",
  },
  Parcel: {
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
    text: "text-green-700",
  },
};

export function SalesCard({
  type,
  totalQuantity = 0,
  totalValue = 0,
  variations = [],
  saleType = "QTY",
}: SalesCardProps) {
  const colors = typeColors[type];
  const isKG = saleType === "KG";

  // Format quantity based on sale type
  const formatQuantity = (qty: number) => {
    if (isKG) {
      return `${qty.toFixed(2)} KG`;
    }
    return qty.toLocaleString();
  };

  return (
    <div className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
        <h3 className={`text-lg font-bold ${colors.text}`}>{type}</h3>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
            Sale {isKG ? "Quantity (KG)" : "Quantity"}
          </p>
          <p className={`text-2xl font-bold ${colors.text}`}>
            {formatQuantity(totalQuantity ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
            Sale Value
          </p>
          <p className={`text-2xl font-bold ${colors.text}`}>
            ₹{(totalValue ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Variation Breakdown */}
      <div className="border-t-2 border-gray-300 pt-4">
        <div className="space-y-3">
          {variations.map((variation, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-gray-800">
                  {variation.name}
                </p>
                <span className={`text-xs font-semibold ${colors.text}`}>
                  {isKG ? `${variation.quantity.toFixed(2)} KG` : `${variation.quantity} qty`}
                </span>
              </div>
              <p className={`text-sm font-semibold ${colors.text}`}>
                {variation.quantity > 0 && variation.value > 0
                  ? `₹${variation.value.toLocaleString()}`
                  : "-"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SalesSummaryCardsProps {
  zomatoData: {
    quantity: number;
    value: number;
    variations: Array<{ name: string; quantity: number; value: number }>;
  };
  swiggyData: {
    quantity: number;
    value: number;
    variations: Array<{ name: string; quantity: number; value: number }>;
  };
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
  saleType?: "QTY" | "KG";
}

export default function SalesSummaryCards({
  zomatoData,
  swiggyData,
  diningData,
  parcelData,
  saleType = "QTY",
}: SalesSummaryCardsProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">
          Sales Summary by Area
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SalesCard
          type="Zomato"
          totalQuantity={zomatoData.quantity}
          totalValue={zomatoData.value}
          variations={zomatoData.variations}
          saleType={saleType}
        />
        <SalesCard
          type="Swiggy"
          totalQuantity={swiggyData.quantity}
          totalValue={swiggyData.value}
          variations={swiggyData.variations}
          saleType={saleType}
        />
        <SalesCard
          type="Dining"
          totalQuantity={diningData.quantity}
          totalValue={diningData.value}
          variations={diningData.variations}
          saleType={saleType}
        />
        <SalesCard
          type="Parcel"
          totalQuantity={parcelData.quantity}
          totalValue={parcelData.value}
          variations={parcelData.variations}
          saleType={saleType}
        />
      </div>
    </div>
  );
}

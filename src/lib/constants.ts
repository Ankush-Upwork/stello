import type { BusinessType } from "@/lib/supabase/types";

/** Business types shown in the profile dropdown. `value` is stored in the DB. */
export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "boutique", label: "Boutique" },
  { value: "ladies_wear", label: "Ladies Wear" },
  { value: "shoe_wholesale", label: "Shoe Wholesale" },
  { value: "garment_shop", label: "Garment Shop" },
  { value: "cosmetics", label: "Cosmetics" },
  { value: "gift_shop", label: "Gift Shop" },
  { value: "home_seller", label: "Home Seller" },
  { value: "general_store", label: "General Store" },
  { value: "other", label: "Other" },
];

export const BUSINESS_TYPE_VALUES = BUSINESS_TYPES.map((b) => b.value) as [
  BusinessType,
  ...BusinessType[],
];

export function businessTypeLabel(value: string | null | undefined): string {
  return BUSINESS_TYPES.find((b) => b.value === value)?.label ?? "—";
}

/** Product categories. Stored as free text so shops can also type their own. */
export const PRODUCT_CATEGORIES = [
  "Kurti",
  "Suit",
  "Saree",
  "Top",
  "Jeans",
  "Footwear",
  "Cosmetics",
  "Accessories",
  "Other",
] as const;

/** Payment modes for a sale. */
export const PAYMENT_MODES = [
  "Cash",
  "UPI",
  "Card",
  "Bank Transfer",
  "Credit",
  "Mixed",
] as const;

/** Delivery / fulfilment status for a sale. */
export const DELIVERY_STATUSES = [
  "Delivered",
  "Pending",
  "Packed",
  "Shipped",
  "Cancelled",
] as const;

/** Indian states & union territories for the profile dropdown. */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

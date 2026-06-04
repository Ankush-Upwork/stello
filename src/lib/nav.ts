import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  PackagePlus,
  Settings,
  Share2,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** i18n key, e.g. "nav.dashboard". */
  tkey: string;
  icon: LucideIcon;
  /** Live in this phase, or a placeholder for a later phase. */
  available: boolean;
};

/** Main side navigation (desktop) + "More" sheet (mobile). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", tkey: "nav.dashboard", icon: LayoutDashboard, available: true },
  { href: "/products", label: "Products", tkey: "nav.products", icon: Boxes, available: true },
  { href: "/sales", label: "Sales", tkey: "nav.sales", icon: ShoppingCart, available: true },
  { href: "/customers", label: "Customers", tkey: "nav.customers", icon: Users, available: true },
  { href: "/payments/pending", label: "Pending Payments", tkey: "nav.pending", icon: Wallet, available: true },
  { href: "/purchases", label: "Purchases", tkey: "nav.purchases", icon: PackagePlus, available: true },
  { href: "/suppliers", label: "Suppliers", tkey: "nav.suppliers", icon: Truck, available: true },
  { href: "/reports/sales", label: "Reports", tkey: "nav.reports", icon: BarChart3, available: true },
  { href: "/ai/sale-entry", label: "AI Assistant", tkey: "nav.ai", icon: Sparkles, available: true },
  { href: "/catalog", label: "Catalog", tkey: "nav.catalog", icon: Share2, available: true },
  { href: "/settings/business-profile", label: "Settings", tkey: "nav.settings", icon: Settings, available: true },
];

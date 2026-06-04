export type Locale = "en" | "hi";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
];

export const LOCALE_COOKIE = "ss_lang";

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.dashboard": "Dashboard",
  "nav.products": "Products",
  "nav.sales": "Sales",
  "nav.sale": "Sale",
  "nav.customers": "Customers",
  "nav.pending": "Pending Payments",
  "nav.purchases": "Purchases",
  "nav.suppliers": "Suppliers",
  "nav.reports": "Reports",
  "nav.ai": "AI Assistant",
  "nav.catalog": "Catalog",
  "nav.settings": "Settings",
  "nav.billing": "Billing",
  "nav.more": "More",
  "nav.soon": "Soon",
  "action.addSale": "Add Sale",
  "action.addProduct": "Add Product",
  "dash.welcome": "Welcome",
  "dash.salesSummary": "Sales summary",
  "dash.invPayments": "Inventory & payments",
  "dash.todaySales": "Today's sales",
  "dash.todayProfit": "Today's profit",
  "dash.monthSales": "This month's sales",
  "dash.monthProfit": "This month's profit",
  "dash.pending": "Pending payments",
  "dash.lowOut": "Low / Out of stock",
  "dash.totalProducts": "Total products",
  "dash.invValue": "Inventory value",
  "dash.topSellers": "Top sellers this month",
  "dash.recentSales": "Recent sales",
  "dash.lowAlerts": "Low stock alerts",
  "account.shopProfile": "Shop profile",
  "account.billing": "Billing & plan",
  "account.logout": "Log out",
  "account.language": "Language",
};

const hi: Dict = {
  "nav.home": "होम",
  "nav.dashboard": "डैशबोर्ड",
  "nav.products": "प्रोडक्ट",
  "nav.sales": "बिक्री",
  "nav.sale": "बिक्री",
  "nav.customers": "ग्राहक",
  "nav.pending": "बकाया भुगतान",
  "nav.purchases": "खरीद",
  "nav.suppliers": "सप्लायर",
  "nav.reports": "रिपोर्ट",
  "nav.ai": "AI सहायक",
  "nav.catalog": "कैटलॉग",
  "nav.settings": "सेटिंग्स",
  "nav.billing": "बिलिंग",
  "nav.more": "और",
  "nav.soon": "जल्द",
  "action.addSale": "बिक्री जोड़ें",
  "action.addProduct": "प्रोडक्ट जोड़ें",
  "dash.welcome": "नमस्ते",
  "dash.salesSummary": "बिक्री सारांश",
  "dash.invPayments": "इन्वेंट्री और भुगतान",
  "dash.todaySales": "आज की बिक्री",
  "dash.todayProfit": "आज का मुनाफ़ा",
  "dash.monthSales": "इस माह की बिक्री",
  "dash.monthProfit": "इस माह का मुनाफ़ा",
  "dash.pending": "बकाया भुगतान",
  "dash.lowOut": "कम / खत्म स्टॉक",
  "dash.totalProducts": "कुल प्रोडक्ट",
  "dash.invValue": "इन्वेंट्री मूल्य",
  "dash.topSellers": "इस माह के बेस्ट सेलर",
  "dash.recentSales": "हाल की बिक्री",
  "dash.lowAlerts": "कम स्टॉक अलर्ट",
  "account.shopProfile": "दुकान प्रोफ़ाइल",
  "account.billing": "बिलिंग और प्लान",
  "account.logout": "लॉग आउट",
  "account.language": "भाषा",
};

const dicts: Record<Locale, Dict> = { en, hi };

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "en" || v === "hi";
}

/** Translate a key for a locale, falling back to English then the key itself. */
export function t(key: string, locale: Locale): string {
  return dicts[locale]?.[key] ?? en[key] ?? key;
}

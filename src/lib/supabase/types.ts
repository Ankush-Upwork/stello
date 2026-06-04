/**
 * Database types for Sello.
 *
 * Phase 1 covers `profiles` and `businesses`. As later phases add tables
 * (products, customers, sales, ...), extend this file or regenerate it with
 * the Supabase CLI:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BusinessType =
  | "boutique"
  | "ladies_wear"
  | "shoe_wholesale"
  | "garment_shop"
  | "cosmetics"
  | "gift_shop"
  | "home_seller"
  | "general_store"
  | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          owner_name: string | null;
          phone: string | null;
          email: string | null;
          business_type: BusinessType;
          address: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          currency: string;
          gstin: string | null;
          upi_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          owner_name?: string | null;
          phone?: string | null;
          email?: string | null;
          business_type?: BusinessType;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          currency?: string;
          gstin?: string | null;
          upi_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          owner_name?: string | null;
          phone?: string | null;
          email?: string | null;
          business_type?: BusinessType;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          currency?: string;
          gstin?: string | null;
          upi_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          product_name: string;
          category: string | null;
          sku: string | null;
          barcode: string | null;
          size: string | null;
          color: string | null;
          design: string | null;
          brand: string | null;
          material: string | null;
          purchase_price: number;
          selling_price: number;
          quantity: number;
          low_stock_threshold: number;
          supplier_name: string | null;
          supplier_phone: string | null;
          image_url: string | null;
          status: "active" | "inactive";
          has_variants: boolean;
          hsn_code: string | null;
          gst_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id: string;
          product_name: string;
          category?: string | null;
          sku?: string | null;
          barcode?: string | null;
          size?: string | null;
          color?: string | null;
          design?: string | null;
          brand?: string | null;
          material?: string | null;
          purchase_price?: number;
          selling_price?: number;
          quantity?: number;
          low_stock_threshold?: number;
          supplier_name?: string | null;
          supplier_phone?: string | null;
          image_url?: string | null;
          status?: "active" | "inactive";
          has_variants?: boolean;
          hsn_code?: string | null;
          gst_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_id?: string;
          product_name?: string;
          category?: string | null;
          sku?: string | null;
          barcode?: string | null;
          size?: string | null;
          color?: string | null;
          design?: string | null;
          brand?: string | null;
          material?: string | null;
          purchase_price?: number;
          selling_price?: number;
          quantity?: number;
          low_stock_threshold?: number;
          supplier_name?: string | null;
          supplier_phone?: string | null;
          image_url?: string | null;
          status?: "active" | "inactive";
          has_variants?: boolean;
          hsn_code?: string | null;
          gst_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          customer_id: string | null;
          invoice_number: string;
          sale_date: string;
          subtotal: number;
          discount_amount: number;
          total_amount: number;
          paid_amount: number;
          pending_amount: number;
          payment_mode: string | null;
          delivery_status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id: string;
          customer_id?: string | null;
          invoice_number: string;
          sale_date?: string;
          subtotal?: number;
          discount_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          pending_amount?: number;
          payment_mode?: string | null;
          delivery_status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          invoice_number?: string;
          sale_date?: string;
          subtotal?: number;
          discount_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          pending_amount?: number;
          payment_mode?: string | null;
          delivery_status?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name_snapshot: string;
          size_snapshot: string | null;
          color_snapshot: string | null;
          quantity: number;
          unit_price: number;
          purchase_price_snapshot: number;
          discount_amount: number;
          line_total: number;
          line_profit: number;
          gst_rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name_snapshot: string;
          size_snapshot?: string | null;
          color_snapshot?: string | null;
          quantity: number;
          unit_price?: number;
          purchase_price_snapshot?: number;
          discount_amount?: number;
          line_total?: number;
          line_profit?: number;
          gst_rate?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quantity?: number;
          unit_price?: number;
          discount_amount?: number;
          line_total?: number;
          line_profit?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          notes: string | null;
          total_purchase_amount: number;
          total_paid_amount: number;
          total_pending_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          notes?: string | null;
          total_purchase_amount?: number;
          total_paid_amount?: number;
          total_pending_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          notes?: string | null;
          total_purchase_amount?: number;
          total_paid_amount?: number;
          total_pending_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          price_yearly: number;
          product_limit: number | null;
          monthly_sales_limit: number | null;
          features: string[];
          sort_order: number;
          ai_features: boolean;
          ai_assistant_limit: number | null;
        };
        Insert: {
          id: string;
          name: string;
          price_yearly?: number;
          product_limit?: number | null;
          monthly_sales_limit?: number | null;
          features?: string[];
          sort_order?: number;
          ai_features?: boolean;
          ai_assistant_limit?: number | null;
        };
        Update: {
          name?: string;
          price_yearly?: number;
          product_limit?: number | null;
          monthly_sales_limit?: number | null;
          features?: string[];
          sort_order?: number;
          ai_features?: boolean;
          ai_assistant_limit?: number | null;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind?: string;
          created_at?: string;
        };
        Update: {
          kind?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          name: string;
          phone: string | null;
          address: string | null;
          notes: string | null;
          total_purchase_amount: number;
          total_paid_amount: number;
          total_pending_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id: string;
          name: string;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          total_purchase_amount?: number;
          total_paid_amount?: number;
          total_pending_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          total_purchase_amount?: number;
          total_paid_amount?: number;
          total_pending_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          supplier_id: string | null;
          purchase_date: string;
          total_amount: number;
          paid_amount: number;
          pending_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id: string;
          supplier_id?: string | null;
          purchase_date?: string;
          total_amount?: number;
          paid_amount?: number;
          pending_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string | null;
          purchase_date?: string;
          total_amount?: number;
          paid_amount?: number;
          pending_amount?: number;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey";
            columns: ["supplier_id"];
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_items: {
        Row: {
          id: string;
          purchase_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name_snapshot: string;
          size_snapshot: string | null;
          color_snapshot: string | null;
          quantity: number;
          purchase_price: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          purchase_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name_snapshot: string;
          size_snapshot?: string | null;
          color_snapshot?: string | null;
          quantity: number;
          purchase_price?: number;
          line_total?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quantity?: number;
          purchase_price?: number;
          line_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_items_purchase_id_fkey";
            columns: ["purchase_id"];
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          size: string | null;
          color: string | null;
          sku: string | null;
          barcode: string | null;
          quantity: number;
          purchase_price: number;
          selling_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          size?: string | null;
          color?: string | null;
          sku?: string | null;
          barcode?: string | null;
          quantity?: number;
          purchase_price?: number;
          selling_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          size?: string | null;
          color?: string | null;
          sku?: string | null;
          barcode?: string | null;
          quantity?: number;
          purchase_price?: number;
          selling_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_sale: {
        Args: { payload: Json };
        Returns: string;
      };
      delete_sale: {
        Args: { p_sale_id: string; p_restore: boolean };
        Returns: undefined;
      };
      public_catalog: {
        Args: { p_business_id: string };
        Returns: Json;
      };
      create_purchase: {
        Args: { payload: Json };
        Returns: string;
      };
      delete_purchase: {
        Args: { p_purchase_id: string; p_remove_stock: boolean };
        Returns: undefined;
      };
      record_payment: {
        Args: { p_sale_id: string; p_amount: number };
        Returns: undefined;
      };
    };
    Enums: {
      business_type: BusinessType;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Sale = Database["public"]["Tables"]["sales"]["Row"];
export type SaleItem = Database["public"]["Tables"]["sale_items"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
export type PurchaseItem =
  Database["public"]["Tables"]["purchase_items"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant =
  Database["public"]["Tables"]["product_variants"]["Row"];

/** A product together with its variant rows (empty when has_variants is false). */
export type ProductWithVariants = Product & { variants: ProductVariant[] };

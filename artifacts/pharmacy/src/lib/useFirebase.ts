import { useState, useEffect, useCallback } from "react";
import { db, ref, onValue, push, set, update, remove, get, off } from "./firebase";
import { DataSnapshot } from "firebase/database";

function listFromSnapshot<T>(snapshot: DataSnapshot): T[] {
  const val = snapshot.val();
  if (!val) return [];
  return Object.entries(val).map(([key, data]) => ({ ...(data as object), _key: key })) as T[];
}

export interface Product {
  _key?: string;
  id?: string;
  name: string;
  cat: string;
  unit: string;
  qty: number;
  low: number;
  buy: number;
  sell: number;
  expiry: string;
  supplier: string;
  createdAt?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}

export interface Sale {
  _key?: string;
  id?: string;
  items: SaleItem[];
  total: number;
  staffRole: string;
  createdAt: string;
}

export interface StockUpdateItem {
  productId: string;
  productName: string;
  qtyAdded: number;
}

export interface StockUpdate {
  _key?: string;
  id?: string;
  note: string;
  items: StockUpdateItem[];
  staffRole: string;
  createdAt: string;
}

export interface Transaction {
  _key?: string;
  id?: string;
  date: string;
  account: string;
  category: string;
  desc: string;
  income: number;
  expense: number;
  createdAt?: string;
}

export interface ActivityLogEntry {
  _key?: string;
  id?: string;
  ts: string;
  role: string;
  action: string;
  detail: string;
}

function useFirebaseList<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = ref(db, path);
    const unsub = onValue(r, (snap) => {
      setData(listFromSnapshot<T>(snap));
      setLoading(false);
    });
    return () => off(r, "value", unsub);
  }, [path]);

  return { data, loading };
}

// Products
export function useProducts() {
  return useFirebaseList<Product>("products");
}

export async function addProduct(product: Omit<Product, "_key" | "id" | "createdAt">) {
  await push(ref(db, "products"), { ...product, createdAt: new Date().toISOString() });
}

export async function updateProduct(key: string, product: Omit<Product, "_key" | "id" | "createdAt">) {
  await update(ref(db, `products/${key}`), product);
}

export async function deleteProduct(key: string) {
  await remove(ref(db, `products/${key}`));
}

export async function updateProductQty(key: string, delta: number) {
  const snap = await get(ref(db, `products/${key}/qty`));
  const current = (snap.val() as number) || 0;
  await set(ref(db, `products/${key}/qty`), current + delta);
}

// Sales
export function useSales() {
  return useFirebaseList<Sale>("sales");
}

export async function addSale(sale: Omit<Sale, "_key" | "id">) {
  const saleRef = await push(ref(db, "sales"), sale);
  // Update product quantities
  for (const item of sale.items) {
    await updateProductQty(item.productId, -item.qty);
  }
  return saleRef;
}

// Stock Updates
export function useStockUpdates() {
  return useFirebaseList<StockUpdate>("stockUpdates");
}

export async function addStockUpdate(update_: Omit<StockUpdate, "_key" | "id">) {
  const r = await push(ref(db, "stockUpdates"), update_);
  for (const item of update_.items) {
    if (item.qtyAdded > 0) {
      await updateProductQty(item.productId, item.qtyAdded);
    }
  }
  return r;
}

// Transactions
export function useTransactions() {
  return useFirebaseList<Transaction>("transactions");
}

export async function addTransaction(txn: Omit<Transaction, "_key" | "id">) {
  await push(ref(db, "transactions"), { ...txn, createdAt: new Date().toISOString() });
}

export async function deleteTransaction(key: string) {
  await remove(ref(db, `transactions/${key}`));
}

// Activity Log
export function useActivityLog() {
  return useFirebaseList<ActivityLogEntry>("activityLog");
}

export async function addActivityLog(entry: Omit<ActivityLogEntry, "_key" | "id">) {
  await push(ref(db, "activityLog"), entry);
}

export async function clearActivityLog() {
  await remove(ref(db, "activityLog"));
}

// Settings (admin password)
export async function getAdminPassword(): Promise<string> {
  const snap = await get(ref(db, "settings/adminPassword"));
  return snap.val() || "admin1234";
}

export async function setAdminPassword(password: string) {
  await set(ref(db, "settings/adminPassword"), password);
}

export function useSettings() {
  const [adminPassword, setAdminPasswordState] = useState<string>("admin1234");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = ref(db, "settings/adminPassword");
    const unsub = onValue(r, (snap) => {
      setAdminPasswordState(snap.val() || "admin1234");
      setLoading(false);
    });
    return () => off(r, "value", unsub);
  }, []);

  return { adminPassword, loading };
}

// Seed initial data if empty
export async function seedIfEmpty() {
  const snap = await get(ref(db, "products"));
  if (snap.exists()) return; // already seeded

  const products = [
    { name: "Paracetamol 500mg", cat: "Analgesics", unit: "Tabs", qty: 200, low: 50, buy: 5, sell: 10, expiry: "2027-06-30", supplier: "Cosmos" },
    { name: "Amoxicillin 250mg", cat: "Antibiotics", unit: "Capsules", qty: 8, low: 20, buy: 120, sell: 200, expiry: "2026-09-15", supplier: "Dawa" },
    { name: "ORS Sachets", cat: "Gastrointestinal", unit: "Sachets", qty: 3, low: 30, buy: 15, sell: 30, expiry: "2026-12-31", supplier: "Cosmos" },
    { name: "Vitamin C 500mg", cat: "Vitamins", unit: "Tabs", qty: 150, low: 30, buy: 8, sell: 15, expiry: "2027-03-31", supplier: "Dawa" },
    { name: "Betadine Solution", cat: "Antiseptics", unit: "Bottles", qty: 25, low: 10, buy: 180, sell: 280, expiry: "2026-11-30", supplier: "CarePlus" },
    { name: "Micromol", cat: "Analgesics", unit: "Bottles", qty: 8, low: 6, buy: 23, sell: 50, expiry: "2028-12-01", supplier: "" },
    { name: "Curamol", cat: "Analgesics", unit: "Bottles", qty: 2, low: 5, buy: 23, sell: 50, expiry: "2028-12-02", supplier: "" },
    { name: "Cetriplain", cat: "Antihistamines", unit: "Bottles", qty: 8, low: 6, buy: 23, sell: 50, expiry: "2028-12-01", supplier: "" },
    { name: "Flagyl", cat: "Antibiotics", unit: "Bottles", qty: 6, low: 6, buy: 25, sell: 50, expiry: "2028-12-01", supplier: "" },
    { name: "Diclofenac 100mg", cat: "Analgesics", unit: "Tabs", qty: 400, low: 50, buy: 1, sell: 5, expiry: "2028-12-02", supplier: "" },
    { name: "Lydia contraceptive injection", cat: "Other", unit: "Vials", qty: 6, low: 5, buy: 95, sell: 150, expiry: "2028-04-01", supplier: "" },
    { name: "Triphozed", cat: "Antihistamines", unit: "Bottles", qty: 7, low: 6, buy: 27, sell: 50, expiry: "2028-12-01", supplier: "" },
    { name: "Kofgon", cat: "Antihistamines", unit: "Bottles", qty: 9, low: 6, buy: 30, sell: 70, expiry: "2028-12-02", supplier: "" },
    { name: "Flugone-p", cat: "Antihistamines", unit: "Tabs", qty: 4, low: 6, buy: 186, sell: 250, expiry: "2028-03-29", supplier: "" },
    { name: "Ranferon", cat: "Cardiovascular", unit: "Bottles", qty: 2, low: 5, buy: 323, sell: 600, expiry: "2026-11-01", supplier: "" },
    { name: "Probeta N Drops", cat: "Antibiotics", unit: "Bottles", qty: 7, low: 6, buy: 112, sell: 180, expiry: "2028-12-02", supplier: "" },
    { name: "Ascoril Expectorant", cat: "Analgesics", unit: "Bottles", qty: 2, low: 5, buy: 219, sell: 300, expiry: "2028-12-01", supplier: "" },
    { name: "Hemoforce family syrup", cat: "Cardiovascular", unit: "Bottles", qty: 4, low: 6, buy: 183, sell: 300, expiry: "2027-04-01", supplier: "" },
    { name: "Albendazole", cat: "Gastrointestinal", unit: "Tabs", qty: 9, low: 6, buy: 27, sell: 50, expiry: "2028-01-01", supplier: "" },
    { name: "Albendazole syrup", cat: "Gastrointestinal", unit: "Bottles", qty: 2, low: 5, buy: 27, sell: 50, expiry: "2028-12-01", supplier: "" },
    { name: "Mediven 15 mg", cat: "Antihistamines", unit: "Pieces", qty: 3, low: 5, buy: 47, sell: 100, expiry: "2028-09-02", supplier: "" },
    { name: "Clozole-B", cat: "Dermatology", unit: "Pieces", qty: 5, low: 6, buy: 79, sell: 120, expiry: "2028-07-01", supplier: "" },
    { name: "Olcort-Hydrocortisone", cat: "Analgesics", unit: "Tabs", qty: 6, low: 6, buy: 31, sell: 80, expiry: "2027-11-01", supplier: "" },
    { name: "Xtraderm", cat: "Dermatology", unit: "Pieces", qty: 3, low: 5, buy: 130, sell: 200, expiry: "2027-03-01", supplier: "" },
    { name: "TEO", cat: "Antibiotics", unit: "Tabs", qty: 5, low: 6, buy: 33, sell: 60, expiry: "2028-05-01", supplier: "" },
    { name: "Rufenac Gel", cat: "Analgesics", unit: "Pieces", qty: 6, low: 6, buy: 26, sell: 70, expiry: "2028-12-01", supplier: "" },
    { name: "Zeditone-Piriton", cat: "Antihistamines", unit: "Bottles", qty: 9, low: 6, buy: 21, sell: 50, expiry: "2029-01-01", supplier: "" },
    { name: "Brufen-Triofen", cat: "Analgesics", unit: "Bottles", qty: 6, low: 6, buy: 21, sell: 50, expiry: "2029-01-01", supplier: "" },
    { name: "Benaflu toto", cat: "Antihistamines", unit: "Bottles", qty: 3, low: 5, buy: 101, sell: 200, expiry: "2028-09-01", supplier: "" },
    { name: "Relcer gel", cat: "Gastrointestinal", unit: "Bottles", qty: 1, low: 5, buy: 282, sell: 350, expiry: "2028-07-01", supplier: "" },
    { name: "Gastro gel", cat: "Gastrointestinal", unit: "Bottles", qty: 3, low: 5, buy: 63, sell: 150, expiry: "2028-04-01", supplier: "" },
    { name: "Ascoril", cat: "Antihistamines", unit: "Bottles", qty: 2, low: 5, buy: 245, sell: 320, expiry: "2027-03-01", supplier: "" },
    { name: "Coldcap syrup", cat: "Antihistamines", unit: "Bottles", qty: 2, low: 5, buy: 115, sell: 200, expiry: "2028-06-01", supplier: "" },
    { name: "AL-antimalarial", cat: "Antibiotics", unit: "Tabs", qty: 9, low: 6, buy: 57, sell: 100, expiry: "2028-08-01", supplier: "" },
    { name: "Fansidar/malodar", cat: "Antibiotics", unit: "Tabs", qty: 4, low: 6, buy: 40, sell: 80, expiry: "2028-05-01", supplier: "" },
    { name: "Clotrimazole-Benasten", cat: "Antifungals", unit: "Pieces", qty: 2, low: 5, buy: 39, sell: 100, expiry: "2028-10-01", supplier: "" },
    { name: "Calamine lotion", cat: "Dermatology", unit: "Bottles", qty: 5, low: 6, buy: 30, sell: 100, expiry: "2028-11-01", supplier: "" },
    { name: "Flagyl injection", cat: "Antibiotics", unit: "Bottles", qty: 4, low: 5, buy: 40, sell: 250, expiry: "2028-08-01", supplier: "" },
    { name: "Amoxyl syrup", cat: "Antibiotics", unit: "Bottles", qty: 12, low: 6, buy: 26, sell: 50, expiry: "2027-09-01", supplier: "" },
    { name: "Emergency contraceptive", cat: "Other", unit: "Pieces", qty: 8, low: 6, buy: 35, sell: 100, expiry: "2027-11-01", supplier: "" },
  ];

  const transactions = [
    { date: "2025-11-30", account: "Cash", category: "Stock", desc: "Initial Stock", income: 0, expense: 18272 },
    { date: "2025-11-30", account: "Cash", category: "Recurrent", desc: "Rent + deposit", income: 0, expense: 4000 },
    { date: "2025-11-30", account: "Cash", category: "Development", desc: "Shelves + Modification", income: 0, expense: 20000 },
    { date: "2025-11-30", account: "Cash", category: "Development", desc: "Paint, counter door", income: 0, expense: 6400 },
    { date: "2025-12-01", account: "Credit", category: "Shipping", desc: "Stock", income: 0, expense: 5073 },
    { date: "2025-12-02", account: "Cash", category: "Stock", desc: "Stock", income: 0, expense: 1027 },
    { date: "2025-12-07", account: "Checking", category: "Balance", desc: "Stock", income: 0, expense: 2722 },
    { date: "2025-12-10", account: "Credit", category: "Stationery", desc: "Stock", income: 0, expense: 3132 },
    { date: "2025-12-12", account: "", category: "Stock", desc: "Stock - pockets", income: 0, expense: 406 },
    { date: "2025-12-17", account: "", category: "Stock", desc: "Stock", income: 0, expense: 1452 },
    { date: "2025-12-19", account: "", category: "Stock", desc: "Stock", income: 0, expense: 1308 },
    { date: "2025-12-28", account: "", category: "Stock", desc: "Stock", income: 0, expense: 1330 },
    { date: "2025-12-30", account: "", category: "Stock", desc: "Stock", income: 0, expense: 510 },
    { date: "2025-12-31", account: "Cash", category: "Sales", desc: "Closing sales", income: 15715, expense: 0 },
    { date: "2026-01-04", account: "", category: "Stock", desc: "Stock", income: 0, expense: 1515 },
    { date: "2026-01-11", account: "", category: "Stock", desc: "Stock", income: 0, expense: 1918 },
    { date: "2026-01-13", account: "", category: "Stock", desc: "Stock", income: 0, expense: 1296 },
    { date: "2026-01-14", account: "", category: "Stock", desc: "Stock", income: 0, expense: 1359 },
    { date: "2026-01-18", account: "", category: "Stock", desc: "Stock", income: 0, expense: 2404 },
    { date: "2026-01-26", account: "", category: "Stock", desc: "Stock", income: 0, expense: 3041 },
    { date: "2026-01-31", account: "Cash", category: "Sales", desc: "Closing sales", income: 21015, expense: 0 },
    { date: "2026-02-02", account: "", category: "Stock", desc: "Stock", income: 0, expense: 6352 },
    { date: "2026-02-06", account: "", category: "Stock", desc: "Stock", income: 0, expense: 2699 },
    { date: "2026-02-11", account: "", category: "Stock", desc: "Stock", income: 0, expense: 2914 },
    { date: "2026-02-15", account: "", category: "Stock", desc: "Stock", income: 0, expense: 2679 },
    { date: "2026-02-20", account: "", category: "Stock", desc: "Stock", income: 0, expense: 4009 },
    { date: "2026-02-26", account: "", category: "Stock", desc: "Stock", income: 0, expense: 1558 },
    { date: "2026-02-28", account: "", category: "Sales", desc: "Closing sales", income: 25250, expense: 0 },
    { date: "2026-03-03", account: "", category: "Stock", desc: "Stock", income: 0, expense: 3831 },
    { date: "2026-03-04", account: "", category: "Stock", desc: "Stock", income: 0, expense: 2291 },
    { date: "2026-03-11", account: "", category: "Stock", desc: "Stock", income: 0, expense: 2584 },
    { date: "2026-03-18", account: "", category: "Stock", desc: "Stock", income: 0, expense: 855 },
    { date: "2026-03-25", account: "", category: "Stock", desc: "Stock", income: 0, expense: 2680 },
    { date: "2026-03-29", account: "", category: "Sales", desc: "Provisional Closing sales", income: 19290, expense: 0 },
  ];

  // Write all products and transactions in bulk
  for (const product of products) {
    await push(ref(db, "products"), { ...product, createdAt: new Date().toISOString() });
  }
  for (const txn of transactions) {
    await push(ref(db, "transactions"), { ...txn, createdAt: new Date().toISOString() });
  }
  await set(ref(db, "settings/adminPassword"), "admin1234");
}

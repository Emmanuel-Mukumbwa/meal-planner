"use server";

import pool from "@/lib/db";
import {
  format,
  isAfter,
  isBefore,
  isWithinInterval,
  startOfDay,
  subDays,
} from "date-fns";
import {
  AnalyticsDashboardData,
  AnalyticsWatchlistItem,
  InventoryAnalyticsItem,
} from "@/app/lib/analytics-types";

type LeftoverRow = {
  id: string;
  name: string;
  type: string | null;
  storedAt: string;
  expiresAt: string;
  status: "frozen" | "consumed" | "discarded";
  createdAt: string;
};

type ShoppingListRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  completed: number;
  category: string | null;
  createdAt: string;
};

function money(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export async function getAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  const [inventoryRows] = await pool.execute(
    "SELECT id, name, quantity, unit, category, expiryDate, lowStockThreshold, price, createdAt FROM inventory ORDER BY createdAt DESC"
  );

  const [recipeRows] = await pool.execute("SELECT id FROM recipes");

  const [leftoverRows] = await pool.execute(
    "SELECT id, name, type, storedAt, expiresAt, status, createdAt FROM leftovers"
  );

  const [shoppingRows] = await pool.execute(
    "SELECT id, name, quantity, unit, completed, category, createdAt FROM shopping_list"
  );

  const inventory = inventoryRows as InventoryAnalyticsItem[];
  const leftovers = leftoverRows as LeftoverRow[];
  const shoppingList = shoppingRows as ShoppingListRow[];
  const recipes = recipeRows as any[];

  const now = new Date();

  // ✅ FIX: price is already total, so sum price directly
  const totalInventoryValue = inventory.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    return sum + price;
  }, 0);

  const expiredInventoryValue = inventory.reduce((sum, item) => {
    if (!item.expiryDate) return sum;

    const expiry = new Date(item.expiryDate);
    if (Number.isNaN(expiry.getTime()) || isAfter(expiry, now)) return sum;

    const price = Number(item.price) || 0;
    return sum + price;
  }, 0);

  const lowStockItems = inventory.filter((item) => {
    const qty = Number(item.quantity) || 0;
    const threshold = Number(item.lowStockThreshold) || 0;
    return qty <= threshold;
  }).length;

  const expiringSoonItems = inventory.filter((item) => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    if (Number.isNaN(expiry.getTime())) return false;

    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return isWithinInterval(expiry, { start: now, end });
  }).length;

  const totalRecipes = recipes.length;
  const pendingShoppingItems = shoppingList.filter((i) => Number(i.completed) === 0).length;
  const completedShoppingItems = shoppingList.filter((i) => Number(i.completed) === 1).length;

  const activeLeftovers = leftovers.filter((i) => i.status === "frozen").length;

  const overdueLeftovers = leftovers.filter((i) => {
    if (i.status !== "frozen") return false;
    const expiry = new Date(i.expiresAt);
    return !Number.isNaN(expiry.getTime()) && isBefore(expiry, now);
  }).length;

  const freshnessPercent = inventory.length
    ? Math.round(
        (inventory.filter((item) => {
          if (!item.expiryDate) return true;
          const expiry = new Date(item.expiryDate);
          return !Number.isNaN(expiry.getTime()) && isAfter(expiry, now);
        }).length /
          inventory.length) *
          100
      )
    : 0;

  // Weekly inventory adds – use price directly
  const weeklyInventoryAdds = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(subDays(now, 6 - i));
    return {
      day,
      name: format(day, "EEE"),
      quantity: 0,
      value: 0,
    };
  });

  inventory.forEach((item) => {
    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;

    const key = format(createdAt, "yyyy-MM-dd");

    const bucket = weeklyInventoryAdds.find(
      (b) => format(b.day, "yyyy-MM-dd") === key
    );

    if (!bucket) return;

    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;

    bucket.quantity += qty;
    bucket.value += price; // ✅ use price directly
  });

  // Category value distribution – use price directly
  const categoryMap = new Map<string, number>();

  inventory.forEach((item) => {
    const category = (item.category || "Uncategorized").trim() || "Uncategorized";
    const price = Number(item.price) || 0;
    categoryMap.set(category, (categoryMap.get(category) || 0) + price);
  });

  const categoryValueDistribution = Array.from(categoryMap.entries())
    .map(([name, value]) => ({
      name,
      value: money(value),
    }))
    .sort((a, b) => b.value - a.value);

  const statusOrder: Record<string, number> = {
    expired: 0,
    expiring: 1,
    "low-stock": 2,
    healthy: 3,
  };

  // Watchlist – use price directly for value
  const watchlist: AnalyticsWatchlistItem[] = inventory
    .map((item) => {
      const qty = Number(item.quantity) || 0;
      const threshold = Number(item.lowStockThreshold) || 0;
      const value = Number(item.price) || 0; // ✅ already total

      let daysLeft: number | null = null;
      let status: AnalyticsWatchlistItem["status"] = "healthy";

      if (item.expiryDate) {
        const expiry = new Date(item.expiryDate);
        if (!Number.isNaN(expiry.getTime())) {
          const diff = expiry.getTime() - now.getTime();
          daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) status = "expired";
          else if (daysLeft <= 7) status = "expiring";
        }
      }

      if (status === "healthy" && qty <= threshold) {
        status = "low-stock";
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category || "Uncategorized",
        quantity: qty,
        unit: item.unit,
        expiryDate: item.expiryDate || null,
        daysLeft,
        lowStockThreshold: threshold,
        value,
        status,
      };
    })
    .sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (a.daysLeft === null && b.daysLeft === null) return b.value - a.value;
      if (a.daysLeft === null) return 1;
      if (b.daysLeft === null) return -1;
      return a.daysLeft - b.daysLeft;
    })
    .slice(0, 8);

  return {
    summary: {
      totalInventoryItems: inventory.length,
      totalInventoryValue: money(totalInventoryValue),
      expiredInventoryValue: money(expiredInventoryValue),
      lowStockItems,
      expiringSoonItems,
      totalRecipes,
      pendingShoppingItems,
      completedShoppingItems,
      activeLeftovers,
      overdueLeftovers,
      freshnessPercent,
    },
    weeklyInventoryAdds: weeklyInventoryAdds.map(({ day, ...rest }) => rest),
    categoryValueDistribution,
    watchlist,
  };
}
export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  lowStockThreshold: number;
};

export type Recipe = {
  id: string;
  name: string;
  description?: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  steps: string[];
};

export type MealPlanSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealPlan = {
  id: string;
  date: string;
  slots: Record<MealPlanSlot, string[]>; // IDs of recipes or custom text
};

export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  completed: boolean;
  category: string;
};
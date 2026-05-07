
export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  lowStockThreshold: number;
  price: number; // Added price
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

export type LeftoverType = 'Meat' | 'Vegetables' | 'Soup' | 'Grain' | 'Dairy' | 'Other';

export type Leftover = {
  id: string;
  name: string;
  type: LeftoverType;
  storedAt: string;
  expiresAt: string;
  status: 'frozen' | 'consumed' | 'discarded';
};

export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  completed: boolean;
  category: string;
};

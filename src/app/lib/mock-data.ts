import { InventoryItem, Recipe, ShoppingListItem } from './types';

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Milk', quantity: 2, unit: 'liters', category: 'Dairy', expiryDate: new Date(Date.now() + 86400000 * 1).toISOString(), lowStockThreshold: 1 },
  { id: '2', name: 'Eggs', quantity: 12, unit: 'pieces', category: 'Dairy', expiryDate: new Date(Date.now() + 86400000 * 5).toISOString(), lowStockThreshold: 6 },
  { id: '3', name: 'Spinach', quantity: 1, unit: 'kg', category: 'Vegetables', expiryDate: new Date(Date.now() - 86400000 * 1).toISOString(), lowStockThreshold: 0.5 },
  { id: '4', name: 'Chicken Breast', quantity: 0.5, unit: 'kg', category: 'Meat', expiryDate: new Date(Date.now() + 86400000 * 10).toISOString(), lowStockThreshold: 1 },
  { id: '5', name: 'Apples', quantity: 8, unit: 'pieces', category: 'Fruits', expiryDate: new Date(Date.now() + 86400000 * 14).toISOString(), lowStockThreshold: 4 },
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: 'Scrambled Eggs with Spinach',
    ingredients: [
      { name: 'Eggs', quantity: 3, unit: 'pieces' },
      { name: 'Spinach', quantity: 0.1, unit: 'kg' },
      { name: 'Milk', quantity: 0.05, unit: 'liters' }
    ],
    steps: ['Whisk eggs with milk', 'Sauté spinach', 'Add eggs and scramble']
  },
  {
    id: 'r2',
    name: 'Roasted Chicken',
    ingredients: [
      { name: 'Chicken Breast', quantity: 0.5, unit: 'kg' },
      { name: 'Apples', quantity: 2, unit: 'pieces' }
    ],
    steps: ['Season chicken', 'Chop apples', 'Bake at 200C for 25 mins']
  }
];

export const MOCK_SHOPPING_LIST: ShoppingListItem[] = [
  { id: 's1', name: 'Almonds', quantity: 200, unit: 'grams', completed: false, category: 'Snacks' },
  { id: 's2', name: 'Bread', quantity: 1, unit: 'loaf', completed: true, category: 'Bakery' },
];
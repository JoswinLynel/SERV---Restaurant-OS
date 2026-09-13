"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface BasketItemModifier {
  id: string;
  name: string;
  price_adjustment: number;
}

export interface BasketItem {
  id: string; // Unique ID for the basket entry
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  modifiers: BasketItemModifier[];
  notes?: string;
}

interface BasketContextType {
  items: BasketItem[];
  addItem: (item: Omit<BasketItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearBasket: () => void;
  total: number;
  itemCount: number;
  isLoaded: boolean;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export function BasketProvider({ children, restaurantId, tableId }: { children: React.ReactNode, restaurantId: string, tableId: string }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `serve_basket_${restaurantId}_${tableId}`;

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse basket");
      }
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, isLoaded, storageKey]);

  const addItem = (item: Omit<BasketItem, "id">) => {
    setItems((prev) => {
      // Find an existing item with the same menu_item_id, notes, and exact same modifiers
      const existingItemIndex = prev.findIndex((pItem) => {
        if (pItem.menu_item_id !== item.menu_item_id) return false;
        if (pItem.notes !== item.notes) return false;
        
        // Check modifiers
        if (pItem.modifiers.length !== item.modifiers.length) return false;
        
        // Sort modifier IDs to compare them regardless of order
        const pModIds = [...pItem.modifiers].map(m => m.id).sort().join(',');
        const iModIds = [...item.modifiers].map(m => m.id).sort().join(',');
        
        return pModIds === iModIds;
      });

      if (existingItemIndex >= 0) {
        // Item exists, just increment quantity
        const newItems = [...prev];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + item.quantity
        };
        return newItems;
      }

      // If no match found, add as a new item
      const newItem: BasketItem = { ...item, id: Math.random().toString(36).substring(7) };
      return [...prev, newItem];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearBasket = () => {
    setItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  };

  const total = items.reduce((acc, item) => {
    const modifierTotal = item.modifiers.reduce((mAcc, m) => mAcc + Number(m.price_adjustment), 0);
    return acc + (Number(item.price) + modifierTotal) * item.quantity;
  }, 0);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <BasketContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearBasket, total, itemCount, isLoaded }}
    >
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const context = useContext(BasketContext);
  if (context === undefined) {
    throw new Error("useBasket must be used within a BasketProvider");
  }
  return context;
}

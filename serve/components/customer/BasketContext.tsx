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
    const newItem: BasketItem = { ...item, id: Math.random().toString(36).substring(7) };
    setItems((prev) => [...prev, newItem]);
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
  };

  const total = items.reduce((acc, item) => {
    const modifierTotal = item.modifiers.reduce((mAcc, m) => mAcc + Number(m.price_adjustment), 0);
    return acc + (Number(item.price) + modifierTotal) * item.quantity;
  }, 0);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <BasketContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearBasket, total, itemCount }}
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

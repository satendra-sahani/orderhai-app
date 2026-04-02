// src/context/UserContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  apiGetMe,
  apiGetFavorites,
  apiAddFavorite,
  apiRemoveFavorite,
  type ApiUser,
} from "../api";

type Location = { address: string };

export type UserRole = "customer" | "delivery_boy" | "distributor" | "admin";

export type AppUser = {
  id: string;
  name: string;
  phoneNumber: string;
  location: Location;
  _id?: string;
  role: UserRole;
};

type UserContextType = {
  user: AppUser | null;
  isLoggedIn: boolean;
  role: UserRole;
  setUser: (user: AppUser | null) => Promise<void> | void;
  favourites: string[];
  toggleFavourite: (productId: string) => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<AppUser | null>(null);
  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setUserState(null);
        setFavourites([]);
        return;
      }

      try {
        const me: ApiUser = await apiGetMe();
        const defaultAddress =
          me.addresses?.find(a => a.isDefault) ?? me.addresses?.[0];

        setUserState({
          id: me.id,
          name: me.name || "",
          phoneNumber: me.phone,
          role: (me.role as UserRole) || "customer",
          location: {
            address:
              defaultAddress?.line1 ??
              "Set delivery location",
          },
        });

        const favProducts = await apiGetFavorites();
        const ids = (favProducts || []).map(
          (p: any) => p.id || p._id
        );
        setFavourites(ids);
      } catch {
        // API failed — try restoring demo user from AsyncStorage
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.role) {
              setUserState(parsed);
            }
          } catch {
            // corrupted stored user, ignore
          }
        }
      }
    };

    load();
  }, []);

  const setUser = async (u: AppUser | null) => {
    setUserState(u);
    if (u) {
      await AsyncStorage.setItem("user", JSON.stringify(u));
    } else {
      await AsyncStorage.removeItem("user");
    }
  };

  const toggleFavourite = async (productId: string) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    const already = favourites.includes(productId);
    setFavourites(prev =>
      already
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );

    try {
      if (already) {
        await apiRemoveFavorite(productId);
      } else {
        await apiAddFavorite(productId);
      }
    } catch {
      // revert on error
      setFavourites(prev =>
        already
          ? [...prev, productId]
          : prev.filter(id => id !== productId)
      );
    }
  };

  const logout = async () => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
  setUserState(null);
  setFavourites([]);
};

  const value: UserContextType = {
    user,
    isLoggedIn: !!user,
    role: user?.role || "customer",
    setUser,
    favourites,
    toggleFavourite,
    logout
  };

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
};

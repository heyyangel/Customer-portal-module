import { create } from "zustand";
import { productsApi } from "../services/products";
import { useUserStore } from "./userStore";

// Resolves which brand collection to search based on the logged-in user's access.
// Falls back to 'koken' if no specific brand is set.
const getActiveBrand = () => {
  const user = useUserStore.getState().user;
  if (!user) return 'koken';
  const { brandAccess } = user;
  if (brandAccess?.koken) return 'koken';
  if (brandAccess?.bix)   return 'bix';
  if (brandAccess?.imada) return 'imada';
  return 'koken';
};

export const useProductStore = create((set) => ({
  products: [],
  searchResults: [],
  loading: false,
  searching: false,
  error: null,

  fetchProducts: async (brand) => {
    set({ loading: true, error: null });
    try {
      const b = brand || getActiveBrand();
      const products = await productsApi.getAll(b);
      set({ products, loading: false });
    } catch (err) {
      set({ error: err.message || "Failed to load products", loading: false });
    }
  },

  searchProducts: async (query, brand) => {
    if (!query) {
      set({ searchResults: [] });
      return;
    }
    set({ searching: true });
    try {
      const b = brand || getActiveBrand();
      const searchResults = await productsApi.search(query, b);
      set({ searchResults, searching: false });
    } catch {
      set({ searching: false });
    }
  },

  clearSearchResults: () => set({ searchResults: [] }),
}));

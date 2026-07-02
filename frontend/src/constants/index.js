export const ROUTES = {
  DASHBOARD: "/",
  CREATE_ORDER: "/orders/new",
  ORDER_HISTORY: "/orders/history",
  BULK_UPLOAD: "/orders/bulk-upload",
  ADMIN: "/admin",
};

// Product data is no longer hardcoded — it is fetched live from MongoDB
// via productsApi.search(query, brand) → GET /api/v1/products/:brand?search=...
// See: frontend/src/services/products.js

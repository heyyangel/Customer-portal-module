import { productsApi } from "./products";

export const inventoryApi = {
  checkStock: async (productCode) => {
    const product = await productsApi.getByCode(productCode);
    return product ? product.availableStock : 0;
  },
};

import axios from "axios";
import React from "react";
import { useQuery, useQueryClient, useMutation } from "react-query";
import API_PATHS from "~/constants/apiPaths";
import { CartItem, CartItemId } from "~/models/CartItem";
import { Product } from "~/models/Product";

export function useCart() {
  return useQuery("cart", async () => {
    const res = await axios.get(`${API_PATHS.cart}/cart`, {
      headers: {
        Authorization: `Basic ${localStorage.getItem("authorization_token")}`,
      },
    });
    const { data } = res.data;
    const itemsIds: CartItemId[] = data.items.map(
      ({ productId, count }: { productId: string; count: number }) => ({
        productId,
        count,
      })
    );
    console.log("itemsIds", itemsIds);

    const products = await Promise.all(
      itemsIds.map(async (item) => {
        const productRes = await axios.get<Product>(
          `${API_PATHS.bff}/products/${item.productId}`
        );
        return {
          product: productRes.data,
          count: item.count,
        };
      })
    );

    return products;
  });
}

export function useCartData() {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<CartItem[]>("cart");
}

export function useInvalidateCart() {
  const queryClient = useQueryClient();
  return React.useCallback(
    () => queryClient.invalidateQueries("cart", { exact: true }),
    []
  );
}

export function useUpsertCart() {
  return useMutation((values: CartItem) => {
    const { product, count } = values;
    const reqBody = { items: [{ productId: product.id, count }] };
    console.log(reqBody);
    return axios.put<CartItem[]>(`${API_PATHS.cart}/cart`, reqBody, {
      headers: {
        Authorization: `Basic ${localStorage.getItem("authorization_token")}`,
      },
    });
  });
}

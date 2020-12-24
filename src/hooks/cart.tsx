import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem('@GoMarketplace:products');

      if (response) setProducts([...JSON.parse(response)]);
    })();
  }, []);

  const increment = useCallback(
    async (id: string) => {
      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex >= 0) {
        const { id: idProduct, title, image_url, price, quantity } = products[
          productIndex
        ];

        setProducts(oldState => [
          ...oldState.fill(
            { id: idProduct, title, image_url, price, quantity: quantity + 1 },
            productIndex,
            productIndex + 1,
          ),
        ]);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      const productIndex = products.findIndex(product => product.id === id);
      const stateWithoutProduct = products.filter(product => product.id !== id);

      if (productIndex >= 0) {
        const { id: idProduct, title, image_url, price, quantity } = products[
          productIndex
        ];

        if (quantity > 1) {
          setProducts(oldState => [
            ...oldState.fill(
              {
                id: idProduct,
                title,
                image_url,
                price,
                quantity: quantity - 1,
              },
              productIndex,
              productIndex + 1,
            ),
          ]);
        } else {
          setProducts(stateWithoutProduct);
        }
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const productIndex = products.findIndex(
        productItem => productItem.id === product.id,
      );

      if (productIndex >= 0) {
        increment(product.id);
      } else {
        setProducts(oldStateProducts => [
          ...oldStateProducts,
          { ...product, quantity: 1 },
        ]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  // Add your actual Stripe price IDs here
  // Example:
  // {
  //   priceId: 'price_your_actual_price_id',
  //   name: 'Your Product Name',
  //   description: 'Your product description',
  //   mode: 'payment',
  // },
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};
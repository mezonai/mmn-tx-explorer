import Link from 'next/link';
import Card from './shared/card';
import { Award04 } from '@/assets/icons';
import { useTopProducts } from '../hooks';

export const FeaturedProducts = () => {
  const { topProducts, isLoading } = useTopProducts();
  return (
    <>
      <div className="flex w-full flex-row justify-between">
        <h2 className="text-xl font-bold">Featured Products</h2>
        <Link
          href="https://cobar.vn"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-primary flex items-center text-xs hover:underline"
        >
          See more on Cobar.vn
        </Link>
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {topProducts.map((product) => (
          <Card
            key={product.product_id}
            title={product.name}
            quantity={product.total_quantity}
            icon={
              product.thumbnail ? (
                <img src={product.thumbnail} alt={product.name} className="h-10 w-10 object-cover" />
              ) : (
                <Award04 className="h-6 w-6" />
              )
            }
            iconBg="bg-brand-primary/8 text-brand-primary w-12 h-12"
            className="mt-0"
            isLoading={isLoading}
          />
        ))}
      </div>
    </>
  );
};

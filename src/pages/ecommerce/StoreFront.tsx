import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { get } from '../../lib/api';
import { Package, Loader2 } from 'lucide-react';
import { HeroSection } from '../../components/ecommerce/HeroSection';
import { TrustBadges } from '../../components/ecommerce/TrustBadges';
import { ShopByCollection } from '../../components/ecommerce/ShopByCollection';
import { BestSellersSection, type BestSellerProduct } from '../../components/ecommerce/BestSellersSection';
import { SaleBanner } from '../../components/ecommerce/SaleBanner';
import { EverFitDifference } from '../../components/ecommerce/EverFitDifference';
import { CustomerReviews } from '../../components/ecommerce/CustomerReviews';
import { FollowOurStyle } from '../../components/ecommerce/FollowOurStyle';
import { VisitOurStore } from '../../components/ecommerce/VisitOurStore';
import { BrandEthos } from '../../components/sections/BrandEthos';

// ── Types for API data ──────────────────────────────────────────────────────
interface ApiVariant {
  size: string;
  color: string;
  sku: string;
  stock: number;
}

interface ApiReview {
  reviewerName: string;
  reviewerPhoto: string | null;
  description: string | null;
  rating: number;
  createdAt: string;
}

interface ApiCategory {
  id: number;
  name: string;
}

interface ApiProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: ApiCategory;
  variants: ApiVariant[];
  reviews: ApiReview[];
  images: { imageData: string; order: number }[];
  createdAt: string;
}

interface MappedProduct extends BestSellerProduct {
  sizes: string[];
  createdAt: string;
  reviews: ApiReview[];
}

// ── Types for storefront settings ───────────────────────────────────────────
interface SaleBannerData {
  image?: string;
  heading?: string;
  subheading?: string;
  buttonLink?: string;
}

interface BrandPromise {
  title: string;
  desc: string;
}

interface NewsletterData {
  heading?: string;
  subtext?: string;
}

// ── Map API product to frontend shape ───────────────────────────────────────
function mapProduct(p: ApiProduct): MappedProduct {
  const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
  const sizes = [...new Set(p.variants.map(v => v.size))];
  const colors = [...new Set(p.variants.map(v => v.color))];
  const avgRating = p.reviews.length
    ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
    : 0;

  let status: MappedProduct['status'] = 'in-stock';
  if (totalStock === 0) status = 'out-of-stock';
  else if (totalStock <= 10) status = 'low-stock';

  return {
    id: String(p.id),
    name: p.name,
    category: p.category.name,
    image: p.image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80',
    price: p.price,
    sizes,
    colors,
    createdAt: p.createdAt,
    status,
    reviewCount: p.reviews.length,
    avgRating,
    reviews: p.reviews,
  };
}

// ── Fallback product images per category ────────────────────────────────────
const CATEGORY_IMAGES: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80',
};

// ── Homepage Component ──────────────────────────────────────────────────────
export const StoreFront: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [products, setProducts] = useState<MappedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic storefront settings
  const [saleBanner, setSaleBanner] = useState<SaleBannerData | null>(null);
  const [brandPromises, setBrandPromises] = useState<BrandPromise[] | null>(null);
  const [newsletter, setNewsletter] = useState<NewsletterData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [prodData, settingsData] = await Promise.all([
          get<ApiProduct[]>('/products'),
          get<Record<string, string>>('/settings').catch(() => ({} as Record<string, string>)),
        ]);
        if (!cancelled) {
          setProducts(prodData.map(mapProduct));

          // Parse settings
          if (settingsData.home_sale_banner) {
            try { setSaleBanner(JSON.parse(settingsData.home_sale_banner)); } catch {}
          }
          if (settingsData.home_brand_promises) {
            try {
              const parsed = JSON.parse(settingsData.home_brand_promises);
              if (Array.isArray(parsed)) setBrandPromises(parsed);
            } catch {}
          }
          if (settingsData.home_newsletter) {
            try { setNewsletter(JSON.parse(settingsData.home_newsletter)); } catch {}
          }

          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // ── Derived sections ──────────────────────────────────────────────────────
  const collections = useMemo(() => {
    const map = new Map<string, MappedProduct[]>();
    for (const p of products) {
      const cat = p.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      productCount: items.length,
      image: items.find(p => p.image)?.image || CATEGORY_IMAGES.default,
    }));
  }, [products]);

  const bestSellerProducts = useMemo(
    () =>
      [...products]
        .filter(p => p.status !== 'out-of-stock')
        .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
        .slice(0, 8),
    [products]
  );

  const topReviews = useMemo(() => {
    const all: { reviewerName: string; productName: string; rating: number; description: string | null }[] = [];
    for (const p of products) {
      for (const r of p.reviews) {
        all.push({
          reviewerName: r.reviewerName,
          productName: p.name,
          rating: r.rating,
          description: r.description,
        });
      }
    }
    return all.sort((a, b) => b.rating - a.rating).slice(0, 6);
  }, [products]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-[70vh] flex flex-col items-center justify-center gap-4 ${dark ? 'bg-brand-950' : 'bg-white'}`}>
        <Loader2 className={`w-10 h-10 animate-spin ${dark ? 'text-neutral-400' : 'text-gray-400'}`} />
        <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-gray-500'}`}>Loading latest collection…</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`min-h-[70vh] flex flex-col items-center justify-center gap-4 ${dark ? 'bg-brand-950' : 'bg-white'}`}>
        <Package className={`w-12 h-12 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />
        <p className={`text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Unable to load products</p>
        <p className={`text-xs ${dark ? 'text-neutral-600' : 'text-gray-400'}`}>{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium mt-2 ${dark ? 'bg-white text-black' : 'bg-brand-900 text-white'}`}
        >
          Retry
        </button>
      </div>
    );
  }

  const totalProducts = products.length;
  const totalCategories = collections.length;

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <HeroSection totalProducts={totalProducts} totalCategories={totalCategories} />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Shop by Collection */}
      <ShopByCollection collections={collections} />

      {/* Best Sellers Grid */}
      <BestSellersSection products={bestSellerProducts} />

      {/* Season End Sale Banner — dynamic from settings */}
      <SaleBanner
        image={saleBanner?.image}
        heading={saleBanner?.heading}
        subheading={saleBanner?.subheading}
        buttonLink={saleBanner?.buttonLink}
      />

      {/* The Ever Fit Difference — dynamic from settings */}
      <EverFitDifference promises={brandPromises || undefined} />

      {/* Customer Reviews */}
      <CustomerReviews reviews={topReviews} />

      {/* Follow Our Style — Instagram Feed */}
      <FollowOurStyle />

      {/* Visit Our Store */}
      <VisitOurStore />

      {/* Newsletter — dynamic from settings */}
      <BrandEthos heading={newsletter?.heading} subtext={newsletter?.subtext} />
    </div>
  );
};
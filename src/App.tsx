import { useEffect } from 'react';
import './index.css';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { Layout } from './components/Layout';
import { Toaster } from 'sonner';
import { useTheme } from './contexts/ThemeContext';

// Admin pages
import { Dashboard }     from './pages/Dashboard';
import { Products }      from './pages/Products';
import { ProductLabels } from './pages/ProductLabels';
import { Categories }    from './pages/Categories';
import { Invoices }      from './pages/Invoices';
import { CreateInvoice } from './pages/CreateInvoice';
import { Suppliers }     from './pages/Suppliers';
import { Customers }     from './pages/Customers';
import { Reports }       from './pages/Reports';
import { Settings }      from './pages/Settings';
import { StorefrontSettings } from './pages/StorefrontSettings';
import { Subscribers } from './pages/Subscribers';

// Ecommerce pages
import { EcommerceLayout } from './components/ecommerce/EcommerceLayout';
import { StoreFront }      from './pages/ecommerce/StoreFront';
import { ShopPage }        from './pages/ecommerce/ShopPage';
import { ProductDetail }   from './pages/ecommerce/ProductDetail';
import { CartPage }        from './pages/ecommerce/CartPage';
import { Checkout }        from './pages/ecommerce/Checkout';
import { TrackOrder }      from './pages/ecommerce/TrackOrder';
import { CategoriesPage }  from './pages/ecommerce/CategoriesPage';
import { AboutPage }       from './pages/ecommerce/AboutPage';
import { ContactPage }     from './pages/ecommerce/ContactPage';
import { WishlistPage }    from './pages/ecommerce/WishlistPage';

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      theme={theme}
      toastOptions={{
        style: {
          background: theme === 'dark' ? '#171717' : '#ffffff',
          border:     theme === 'dark' ? '1px solid #262626' : '1px solid #e5e5e5',
          color:      theme === 'dark' ? '#ffffff' : '#171717',
        },
      }}
    />
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function AdminPage({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <WishlistProvider>
          <ThemedToaster />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <Routes>

              {/* ── Ecommerce Store — root ── */}
              <Route path="/" element={<EcommerceLayout />}>
                <Route index element={<StoreFront />} />
                <Route path="shop"           element={<ShopPage />} />
                <Route path="product/:id"    element={<ProductDetail />} />
                <Route path="cart"           element={<CartPage />} />
                <Route path="wishlist"       element={<WishlistPage />} />
                <Route path="categories"     element={<CategoriesPage />} />
                <Route path="about"          element={<AboutPage />} />
                <Route path="contact"        element={<ContactPage />} />
              </Route>

              {/* ── Admin System — /system/* ── */}
              <Route path="/system"                  element={<AdminPage><Dashboard /></AdminPage>} />
              <Route path="/system/products"         element={<AdminPage><Products /></AdminPage>} />
              <Route path="/system/products/labels"  element={<AdminPage><ProductLabels /></AdminPage>} />
              <Route path="/system/categories"       element={<AdminPage><Categories /></AdminPage>} />
              <Route path="/system/invoices"         element={<AdminPage><Invoices /></AdminPage>} />
              <Route path="/checkout"                element={<Checkout />} />
              <Route path="/track-order"             element={<TrackOrder />} />
              <Route path="/system/invoices/create"  element={<AdminPage><CreateInvoice /></AdminPage>} />
              <Route path="/system/suppliers"        element={<AdminPage><Suppliers /></AdminPage>} />
              <Route path="/system/customers"        element={<AdminPage><Customers /></AdminPage>} />
              <Route path="/system/reports"          element={<AdminPage><Reports /></AdminPage>} />
              <Route path="/system/settings"         element={<AdminPage><Settings /></AdminPage>} />
              <Route path="/system/storefront-settings" element={<AdminPage><StorefrontSettings /></AdminPage>} />
              <Route path="/system/subscribers"        element={<AdminPage><Subscribers /></AdminPage>} />

              {/* Legacy /store redirect — keeps old bookmarks working */}
              <Route path="/store"    element={<Navigate to="/"         replace />} />
              <Route path="/store/*"  element={<Navigate to="/"         replace />} />

            </Routes>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;

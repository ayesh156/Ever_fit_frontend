import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { get, put } from '../lib/api';
import { toast } from 'sonner';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Save, Loader2, Megaphone, Newspaper, Sparkles, Plus, Trash2 } from 'lucide-react';

interface BrandPromise {
  title: string;
  desc: string;
}

interface SaleBannerData {
  image: string;
  heading: string;
  subheading: string;
  buttonLink: string;
}

interface NewsletterData {
  heading: string;
  subtext: string;
}

const DEFAULT_SALE_BANNER: SaleBannerData = {
  image: '',
  heading: 'Season End Sale',
  subheading: 'Up to 40% off on selected items. Don\'t miss out on our exclusive end-of-season deals.',
  buttonLink: '/shop',
};

const DEFAULT_PROMISES: BrandPromise[] = [
  { title: 'Premium Fabrics', desc: 'We source only the finest materials — from breathable cottons to premium linens — ensuring every piece feels as good as it looks.' },
  { title: 'Fast Delivery', desc: 'Free delivery across Sri Lanka on orders over Rs. 5,000. Most orders arrive within 1–3 business days, straight to your doorstep.' },
  { title: 'Easy Returns', desc: 'Not your fit? Our hassle-free 7-day return policy means you can shop with confidence, no questions asked.' },
  { title: '24/7 Support', desc: 'Our dedicated team is always here to help — via WhatsApp, phone, or in-store. Your satisfaction is our priority.' },
];

const DEFAULT_NEWSLETTER: NewsletterData = {
  heading: 'The edit, in your inbox.',
  subtext: 'Subscribe for exclusive drops, early access, and members-only offers. No spam, just style.',
};

const inputClass = (dark: boolean) => `w-full px-3 py-2 rounded-xl border text-sm transition-all ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400'}`;
const labelClass = (dark: boolean) => `block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`;
const sectionCard = (dark: boolean) => `p-4 sm:p-5 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`;
const sectionTitle = (dark: boolean) => `text-sm font-semibold flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`;

export const StorefrontSettings: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const cls = inputClass(dark);
  const lbl = labelClass(dark);
  const card = sectionCard(dark);
  const stitle = sectionTitle(dark);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sale Banner
  const [saleBanner, setSaleBanner] = useState<SaleBannerData>(DEFAULT_SALE_BANNER);

  // Brand Promises
  const [promises, setPromises] = useState<BrandPromise[]>(DEFAULT_PROMISES);

  // Newsletter
  const [newsletter, setNewsletter] = useState<NewsletterData>(DEFAULT_NEWSLETTER);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await get<Record<string, string>>('/settings');
      if (data.home_sale_banner) {
        try { setSaleBanner({ ...DEFAULT_SALE_BANNER, ...JSON.parse(data.home_sale_banner) }); } catch {}
      }
      if (data.home_brand_promises) {
        try {
          const parsed = JSON.parse(data.home_brand_promises);
          if (Array.isArray(parsed) && parsed.length > 0) setPromises(parsed);
        } catch {}
      }
      if (data.home_newsletter) {
        try { setNewsletter({ ...DEFAULT_NEWSLETTER, ...JSON.parse(data.home_newsletter) }); } catch {}
      }
    } catch (err: any) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = [
        { key: 'home_sale_banner', value: JSON.stringify(saleBanner) },
        { key: 'home_brand_promises', value: JSON.stringify(promises) },
        { key: 'home_newsletter', value: JSON.stringify(newsletter) },
      ];
      await put('/settings', entries);
      toast.success('Storefront settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updatePromise = (idx: number, field: keyof BrandPromise, value: string) => {
    setPromises(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addPromise = () => setPromises(prev => [...prev, { title: '', desc: '' }]);
  const removePromise = (idx: number) => setPromises(prev => prev.filter((_, i) => i !== idx));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className={`w-8 h-8 animate-spin ${dark ? 'text-neutral-400' : 'text-gray-400'}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Storefront Settings</h1>
          <p className={`text-sm mt-0.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Manage homepage content — banners, brand promises, newsletter
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'
          } disabled:opacity-50`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Sale Banner */}
      <div className={card}>
        <h3 className={stitle}><Megaphone className="w-4 h-4" /> Sale Banner</h3>
        <p className={`text-xs mt-1 mb-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
          Configure the "Season End Sale" promotional banner on the homepage.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={lbl}>Background Image</label>
            {saleBanner.image ? (
              <div className="relative w-40 h-40 rounded-xl overflow-hidden border group">
                <img src={saleBanner.image} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setSaleBanner(prev => ({ ...prev, image: '' }))}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <ImageUpload
                value={undefined}
                onChange={val => { if (val) setSaleBanner(prev => ({ ...prev, image: val })); }}
                dark={dark}
                className="w-40"
              />
            )}
          </div>
          <div>
            <label className={lbl}>Heading</label>
            <input value={saleBanner.heading} onChange={e => setSaleBanner(prev => ({ ...prev, heading: e.target.value }))} placeholder="Season End Sale" className={cls} />
          </div>
          <div>
            <label className={lbl}>Button Link</label>
            <input value={saleBanner.buttonLink} onChange={e => setSaleBanner(prev => ({ ...prev, buttonLink: e.target.value }))} placeholder="/shop" className={cls} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Subheading</label>
            <textarea value={saleBanner.subheading} onChange={e => setSaleBanner(prev => ({ ...prev, subheading: e.target.value }))} rows={2} className={cls} />
          </div>
        </div>
      </div>

      {/* Brand Promises */}
      <div className={card}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={stitle}><Sparkles className="w-4 h-4" /> Brand Promises / Values</h3>
          <button onClick={addPromise} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        <p className={`text-xs mb-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
          Manage the "Ever Fit Difference" cards displayed on the homepage.
        </p>
        <div className="space-y-3">
          {promises.map((p, idx) => (
            <div key={idx} className={`grid grid-cols-[1fr_1fr_36px] gap-3 p-3 rounded-lg border items-start ${
              dark ? 'bg-neutral-800/30 border-neutral-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div>
                <label className={lbl}>Title</label>
                <input value={p.title} onChange={e => updatePromise(idx, 'title', e.target.value)} placeholder="e.g. Premium Fabrics" className={cls} />
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea value={p.desc} onChange={e => updatePromise(idx, 'desc', e.target.value)} placeholder="Describe this value..." rows={2} className={cls} />
              </div>
              <button onClick={() => removePromise(idx)} className="p-2 mt-6 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className={card}>
        <h3 className={stitle}><Newspaper className="w-4 h-4" /> Newsletter Section</h3>
        <p className={`text-xs mt-1 mb-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
          Configure the "Stay Connected" newsletter signup section text.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={lbl}>Main Heading</label>
            <input value={newsletter.heading} onChange={e => setNewsletter(prev => ({ ...prev, heading: e.target.value }))} placeholder="The edit, in your inbox." className={cls} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Subtext</label>
            <textarea value={newsletter.subtext} onChange={e => setNewsletter(prev => ({ ...prev, subtext: e.target.value }))} rows={2} className={cls} placeholder="Subscribe for exclusive drops..." />
          </div>
        </div>
      </div>
    </div>
  );
};
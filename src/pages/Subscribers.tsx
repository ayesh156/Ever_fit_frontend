import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { get } from '../lib/api';
import { Loader2, Mail, Search } from 'lucide-react';

interface Subscriber {
  id: number;
  email: string;
  subscribedAt: string;
}

const inputClass = (dark: boolean) => `w-full px-3 py-2 rounded-xl border text-sm transition-all ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400'}`;

export const Subscribers: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const cls = inputClass(dark);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubscribers = useCallback(async () => {
    try {
      const data = await get<Subscriber[]>('/subscribers');
      setSubscribers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const filtered = useMemo(
    () => subscribers.filter(s => s.email.toLowerCase().includes(searchQuery.toLowerCase())),
    [subscribers, searchQuery]
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${dark ? 'text-white' : 'text-gray-900'}`}>
          <Mail className="w-6 h-6" />
          Subscribers
        </h1>
        <p className={`text-sm mt-0.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
          {loading ? 'Loading...' : `${subscribers.length} email subscribers`}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by email..."
          className={`${cls} pl-10`}
        />
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className={`w-8 h-8 animate-spin ${dark ? 'text-neutral-400' : 'text-gray-400'}`} />
        </div>
      ) : error ? (
        <div className={`text-center py-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => { setLoading(true); setError(null); fetchSubscribers(); }} className="mt-3 px-4 py-2 rounded-xl text-sm font-medium bg-brand-900 text-white">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`flex flex-col items-center py-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
          <Mail className={`w-12 h-12 mb-3 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />
          <p className={`text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
            {searchQuery ? 'No subscribers match your search' : 'No subscribers yet'}
          </p>
        </div>
      ) : (
        /* Table */
        <div className={`rounded-2xl border overflow-hidden ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`text-xs uppercase tracking-wider ${dark ? 'bg-neutral-800/50 text-neutral-400' : 'bg-gray-50 text-gray-500'}`}>
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Date Subscribed</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? 'divide-neutral-800' : 'divide-gray-100'}`}>
                {filtered.map((sub, idx) => (
                  <tr key={sub.id} className={`${dark ? 'hover:bg-neutral-800/30' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className={`px-4 py-3 text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{idx + 1}</td>
                    <td className={`px-4 py-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{sub.email}</td>
                    <td className={`px-4 py-3 text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{formatDate(sub.subscribedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
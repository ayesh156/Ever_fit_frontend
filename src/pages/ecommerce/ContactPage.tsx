import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { NavLink } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Clock, Send, Instagram, Facebook,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export const ContactPage: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6">
        <NavLink to="/" className={`${dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-gray-400 hover:text-gray-600'}`}>Home</NavLink>
        <span className={dark ? 'text-neutral-600' : 'text-gray-300'}>/</span>
        <span className={dark ? 'text-neutral-300' : 'text-gray-700'}>Contact</span>
      </div>

      <div className="text-center mb-12">
        <h1 className={`font-display text-3xl lg:text-5xl font-bold mb-3 ${dark ? 'text-white' : 'text-brand-900'}`}>
          Get in Touch
        </h1>
        <p className={`text-sm max-w-lg mx-auto ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
          Have a question? We'd love to hear from you. Drop us a message and we'll respond within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-2xl border ${dark ? 'bg-brand-900/30 border-neutral-800/60' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className={`font-semibold text-lg mb-5 ${dark ? 'text-white' : 'text-gray-900'}`}>Contact Information</h3>
            <div className="space-y-5">
              {[
                { icon: MapPin, title: 'Visit Us', info: 'Ransegoda, Kamburupitiya\nMatara, Sri Lanka' },
                { icon: Phone, title: 'Call Us', info: '077 678 5990' },
                { icon: Mail, title: 'Email Us', info: 'ravindrakumarash@gmail.com' },
                { icon: Clock, title: 'Working Hours', info: 'Mon — Sat: 8:00 AM — 6:00 PM\nSunday: 8:00 AM — 1:00 PM' },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <div className={`p-2.5 rounded-xl h-fit ${dark ? 'bg-neutral-800' : 'bg-white shadow-sm'}`}>
                    <item.icon className={`w-4 h-4 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-0.5 ${dark ? 'text-neutral-200' : 'text-gray-800'}`}>{item.title}</p>
                    <p className={`text-xs whitespace-pre-line leading-relaxed ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{item.info}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-6 pt-5 border-t ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Follow Us</p>
              <div className="flex items-center gap-3">
                <a href="#" className={`p-2.5 rounded-full border transition-all ${
                  dark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'
                }`}><Facebook className="w-4 h-4" /></a>
                <a href="#" className={`p-2.5 rounded-full border transition-all ${
                  dark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'
                }`}><Instagram className="w-4 h-4" /></a>
                <a href="https://wa.me/94776785990" target="_blank" rel="noopener noreferrer" className={`p-2.5 rounded-full border transition-all ${
                  dark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'
                }`}><MessageCircle className="w-4 h-4" /></a>
              </div>
            </div>

            {/* WhatsApp Quick Contact */}
            <div className={`mt-6 pt-5 border-t ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
              <a
                href="https://wa.me/94776785990?text=Hi%20Ever%20Fit!%20I%E2%80%99d%20like%20to%20inquire%20about%20your%20products."
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 ${dark ? 'text-green-400' : 'text-green-600'} hover:bg-green-500/20 transition-all text-sm font-medium`}
              >
                <MessageCircle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Chat on WhatsApp</p>
                  <p className={`text-xs ${dark ? 'text-green-400/60' : 'text-green-600/60'}`}>Quick response guaranteed</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className={`p-6 rounded-2xl border ${
            dark ? 'bg-brand-900/30 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <h3 className={`font-semibold text-lg mb-5 ${dark ? 'text-white' : 'text-gray-900'}`}>Send us a Message</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`text-xs font-medium mb-1.5 block ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    dark
                      ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-neutral-500/20`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1.5 block ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@email.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    dark
                      ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-neutral-500/20`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`text-xs font-medium mb-1.5 block ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+94 77 123 4567"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    dark
                      ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-neutral-500/20`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1.5 block ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                  placeholder="How can we help?"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    dark
                      ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-neutral-500/20`}
                />
              </div>
            </div>

            <div className="mb-5">
              <label className={`text-xs font-medium mb-1.5 block ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Message *</label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                placeholder="Tell us more..."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm resize-none ${
                  dark
                    ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-neutral-500/20`}
              />
            </div>

            <button
              type="submit"
              className={`inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all shadow-lg ${
                dark
                  ? 'bg-white text-black hover:bg-neutral-100 shadow-white/10'
                  : 'bg-brand-900 text-white hover:bg-brand-800 shadow-brand-900/20'
              }`}
            >
              <Send className="w-4 h-4" />
              Send Message
            </button>
          </form>
        </div>
      </div>

      {/* Map */}
      <div className={`mt-12 rounded-3xl overflow-hidden border h-[300px] lg:h-[400px] ${
        dark ? 'border-neutral-800/60' : 'border-gray-200'
      }`}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3967.1179884988896!2d80.56701926129963!3d6.114814693510949!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2slk!4v1779892079675!5m2!1sen!2slk"
          width="100%"
          height="100%"
          style={{ border: 0, filter: dark ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ever Fit Location"
        />
      </div>
    </div>
  );
};
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './header/Header';
import Footer from './footer/Footer';
import CartDrawer from '../CartDrawer';
import CookieConsentBanner from '../CookieConsentBanner';
import CustomerConsentGateModal from '../CustomerConsentGateModal';

export default function PublicLayout() {
  return (
    <div className="min-h-screen w-full bg-[#fcfbf9] text-[#171325] font-sans flex flex-col selection:bg-[#ede9fe] selection:text-[#5b21b6] overflow-x-hidden">
      <Header />
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <CookieConsentBanner />
      <CustomerConsentGateModal />
    </div>
  );
}

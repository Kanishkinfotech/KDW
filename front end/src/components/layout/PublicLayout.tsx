import { Outlet } from 'react-router-dom';
import Header from './header/Header';
import Footer from './footer/Footer';
import CartDrawer from '../CartDrawer';
import WishlistDrawer from '../WishlistDrawer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <WishlistDrawer />
    </div>
  );
}

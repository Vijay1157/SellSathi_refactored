import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from '@/modules/auth/components/AuthModal';

export const Header = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1.5">
              <img src="/gudkart-logo.png" alt="" style={{ height: '64px', width: '64px', objectFit: 'contain' }} />
              <span style={{ lineHeight: 1 }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#1800AD' }}>Gud</span><span style={{ fontSize: '2rem', fontWeight: 400, color: '#5BB8FF' }}>kart</span>
              </span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="#" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Categories</Link>
            <Link to="#" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Deals</Link>
            <Link to="#" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">What's New</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="text-sm font-medium text-gray-600 hover:text-brand transition-colors"
            >
              Login
            </button>
            <Link
              to="/seller"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover transition-all"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </header>
      <AuthModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} hideRegister={true} />
    </>
  );
};





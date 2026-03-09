import React from 'react';
import { Link } from 'react-router-dom';

const SellerHeader = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold tracking-tight text-brand">
            SellSathi <span className="text-xs font-medium text-gray-400 align-top ml-1">Supplier</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            <Link to="#" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Sell Online</Link>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-gray-600 hover:text-brand transition-colors"
            >
              How it works
            </button>
            <Link to="#" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Pricing & Commission</Link>
            <Link to="#" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Shipping & Returns</Link>
            <button
              onClick={() => scrollToSection('grow-business')}
              className="text-sm font-medium text-gray-600 hover:text-brand transition-colors"
            >
              Grow Business
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/seller/register"
            style={{
              backgroundColor: '#6C63FF',
              color: 'white',
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: '500',
              display: 'inline-block',
              textDecoration: 'none'
            }}
          >
            Start Selling
          </Link>
        </div>
      </div>
    </header>
  );
};

export default SellerHeader;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SellerHeader = ({ onLoginClick }) => {
  const [activeSection, setActiveSection] = useState('sell-online');

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['sell-online', 'how-it-works', 'pricing-commission', 'shipping-returns', 'grow-business'];
      const scrollPosition = window.scrollY + 100; // Offset for header

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'sell-online', label: 'Sell Online' },
    { id: 'how-it-works', label: 'How it works' },
    { id: 'pricing-commission', label: 'Pricing & Commission' },
    { id: 'shipping-returns', label: 'Shipping & Returns' },
    { id: 'grow-business', label: 'Grow Business' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold tracking-tight text-brand">
            SellSathi <span className="text-xs font-medium text-gray-400 align-top ml-1">Supplier</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-sm font-medium transition-colors relative ${activeSection === item.id
                    ? 'text-brand'
                    : 'text-gray-600 hover:text-brand'
                  }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-brand" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onLoginClick}
            style={{
              color: '#6C63FF',
              padding: '8px 18px',
              borderRadius: '6px',
              border: '1px solid #6C63FF',
              fontWeight: '500',
              display: 'inline-block',
              textDecoration: 'none',
              backgroundColor: 'transparent',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f5f3ff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Login
          </button>
          <Link
            to="/seller/register"
            target="_blank"
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

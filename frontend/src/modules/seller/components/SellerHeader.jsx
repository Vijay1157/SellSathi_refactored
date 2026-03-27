import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SellerHeader = ({ onLoginClick, onNewSellerClick }) => {
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

  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const profileRef = React.useRef(null);

  const checkUser = () => {
    const isSellerTab = true; // SellerHeader is only used on seller pages
    const userData = localStorage.getItem('seller_user');
    const loginCtx = sessionStorage.getItem('loginContext');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        // On seller pages, we only show user info if they are in SELLER context
        if (loginCtx === 'SELLER') {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUser();
    const handleUserChange = () => checkUser();
    window.addEventListener('userDataChanged', handleUserChange);

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('userDataChanged', handleUserChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    localStorage.removeItem('seller_user');
    localStorage.removeItem('seller_userName');
    localStorage.removeItem('seller_dob');
    sessionStorage.removeItem('loginContext');
    setUser(null);
    window.dispatchEvent(new CustomEvent('userDataChanged'));
    window.location.href = window.location.origin + '/#/seller';
    window.location.reload();
  };

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
          <Link to="/" className="text-2xl font-bold tracking-tight text-[#6C63FF]">
            SellSathi <span className="text-xs font-medium text-gray-400 align-top ml-1">Supplier</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-sm font-medium transition-colors relative ${activeSection === item.id
                  ? 'text-[#6C63FF]'
                  : 'text-gray-600 hover:text-brand'
                  }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <span className="absolute -bottom-[31px] left-0 right-0 h-0.5 bg-[#6C63FF]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4" ref={profileRef}>
              <button
                onClick={() => {
                  if (user.role === 'SELLER' && (user.status === 'APPROVED' || user.sellerStatus === 'APPROVED')) {
                    navigate('/seller/dashboard');
                  } else if (user.status === 'PENDING' || user.sellerStatus === 'PENDING') {
                    alert(`⏳ Your seller application is currently under review. Please wait for admin approval.`);
                  } else {
                    alert('You have not completed the seller registration. Please complete the onboarding to access the dashboard.');
                    navigate('/seller/register');
                  }
                }}
                className="rounded-xl border border-[#6C63FF] px-5 py-2.5 text-sm font-semibold text-[#6C63FF] hover:bg-purple-50 transition-all font-sans"
              >
                Go to Dashboard
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-10 h-10 rounded-full bg-[#6C63FF] text-white flex items-center justify-center font-bold"
                >
                  {(user.fullName || 'S').charAt(0).toUpperCase()}
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.fullName || 'Seller'}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
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
              >
                Login
              </button>
              <button
                onClick={onNewSellerClick}
                style={{
                  backgroundColor: '#6C63FF',
                  color: 'white',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '500',
                  display: 'inline-block',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                New Seller
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default SellerHeader;

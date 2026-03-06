import React from 'react';
import { useLocation } from 'react-router-dom';
import { SellerRegister } from './SellerRegister';
import { LandingPage } from './LandingPage';

export default function SellerPageWithAuth() {
  const location = useLocation();
  const isRegisterPage = location.pathname === '/seller/register';

  return isRegisterPage ? <SellerRegister /> : <LandingPage />;
}

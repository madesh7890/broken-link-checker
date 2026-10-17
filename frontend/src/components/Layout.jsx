import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const isAuthPage = ['/login', '/register', '/403', '/404'].includes(location.pathname);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (isAuthPage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
      
      {/* Mobile backdrop overlay */}
      {mobileMenuOpen && (
        <div 
          className="app-sidebar-backdrop" 
          style={{ display: 'block' }} 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar className={mobileMenuOpen ? 'open' : ''} onCloseMobile={() => setMobileMenuOpen(false)} />
        <main className="app-layout-main" style={{
          flex: 1,
          padding: '28px 36px',
          backgroundColor: 'var(--bg-primary)',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 64px)'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

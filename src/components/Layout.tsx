import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Settings, 
  Menu, 
  X, 
  Building2,
  Wallet,
  Receipt,
  PieChart,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Master Data': true,
    'Transaksi': true,
    'Buku & Laporan': true,
  });
  const location = useLocation();

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { 
      name: 'Master Data', 
      icon: Building2,
      children: [
        { name: 'Profil BUMDes', href: '/profile' },
        { name: 'Chart of Accounts', href: '/accounts' },
        { name: 'Unit Usaha', href: '/units' },
      ]
    },
    { 
      name: 'Transaksi', 
      icon: Wallet,
      children: [
        { name: 'Jurnal Umum', href: '/journals' },
        { name: 'Penerimaan Kas', href: '/receipts' },
        { name: 'Pengeluaran Kas', href: '/payments' },
      ]
    },
    { 
      name: 'Buku & Laporan', 
      icon: BookOpen,
      children: [
        { name: 'Buku Besar', href: '/ledger' },
        { name: 'Neraca', href: '/balance-sheet' },
        { name: 'Laba Rugi', href: '/income-statement' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-indigo-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0",
          mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
          sidebarOpen ? "md:w-64" : "md:w-20"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-indigo-800 shrink-0">
          <span className={cn(
            "font-bold text-lg truncate transition-opacity duration-300",
            !sidebarOpen && "md:hidden"
          )}>
            BUMDes Akuntansi
          </span>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-1 hover:bg-indigo-800 rounded hidden md:block"
          >
            <Menu className="w-6 h-6" />
          </button>
          <button 
            onClick={closeMobileMenu} 
            className="p-1 hover:bg-indigo-800 rounded md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.name}>
                {item.href ? (
                  <Link
                    to={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md transition-colors",
                      location.pathname === item.href ? "bg-indigo-800 text-white" : "text-indigo-100 hover:bg-indigo-800"
                    )}
                  >
                    <item.icon className="w-5 h-5 min-w-[20px]" />
                    <span className={cn("ml-3 transition-opacity duration-300", !sidebarOpen && "md:hidden")}>
                      {item.name}
                    </span>
                  </Link>
                ) : (
                  <div>
                    <div 
                      onClick={() => toggleMenu(item.name)}
                      className="flex items-center px-3 py-2 text-indigo-100 hover:bg-indigo-800 rounded-md cursor-pointer transition-colors"
                    >
                      <item.icon className="w-5 h-5 min-w-[20px]" />
                      <span className={cn("ml-3 flex-1 transition-opacity duration-300", !sidebarOpen && "md:hidden")}>
                        {item.name}
                      </span>
                      <div className={cn("ml-auto", !sidebarOpen && "md:hidden")}>
                        {openMenus[item.name] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                    {item.children && openMenus[item.name] && (
                      <ul className={cn("mt-1 space-y-1 pl-11", !sidebarOpen && "md:hidden")}>
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <Link
                              to={child.href}
                              onClick={closeMobileMenu}
                              className={cn(
                                "block px-3 py-2 text-sm rounded-md transition-colors",
                                location.pathname === child.href ? "bg-indigo-800 text-white" : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                              )}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footnote */}
        <div className={cn(
          "p-4 border-t border-indigo-800 text-xs text-indigo-300 shrink-0",
          !sidebarOpen && "md:hidden"
        )}>
          Dikembangkan oleh<br/>
          <span className="font-semibold text-indigo-200">Imam Sahroni Darmawan</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="p-2 mr-2 hover:bg-slate-100 rounded-md md:hidden"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 truncate">
              Sistem Akuntansi BUMDes
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
              A
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

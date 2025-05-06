import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Ticket, 
  Package, 
  FileBarChart, 
  Bell, 
  ChevronDown, 
  Menu, 
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { logout } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5 text-gray-700" /> },
    { name: 'Accounts', path: '/accounts', icon: <Building2 className="h-5 w-5 text-gray-700" /> },
    { name: 'Users', path: '/users', icon: <Users className="h-5 w-5 text-gray-700" /> },
    { name: 'Subscriptions', path: '/subscriptions', icon: <Ticket className="h-5 w-5 text-gray-700" /> },
    { name: 'Products', path: '/products', icon: <Package className="h-5 w-5 text-gray-700" /> },
    { name: 'Reports', path: '/reports', icon: <FileBarChart className="h-5 w-5 text-gray-700" /> },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCurrentPageTitle = () => {
    const item = navItems.find(item => item.path === location);
    return item ? item.name : 'Dashboard';
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div 
        className={`bg-secondary-800 text-white flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-3 flex items-center justify-between bg-primary border-b border-secondary-700">
          {sidebarOpen ? (
            <h1 className="font-semibold text-xl">Admin Portal</h1>
          ) : (
            <span className="text-2xl font-bold">AP</span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-full hover:bg-secondary-700 focus:outline-none"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-5 px-2">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
            >
              <a
                className={`flex items-center p-2 rounded-md font-medium hover:bg-primary-600 mb-1 transition-colors duration-200 text-black hover:bg-gray-200${
                  location === item.path ? 'bg-primary-700' : ''
                }`}
              >
                {item.icon}
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </a>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4">
          <div className="flex">
            <h2 className="text-2xl font-semibold text-gray-800">{getCurrentPageTitle()}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="h-5 w-5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-4 text-center text-sm text-gray-500">
                    No new notifications
                  </div>
                </div>
                <div className="p-2 text-center">
                  <Link href="/notifications">
                    <a className="text-sm text-primary-600 hover:text-primary-800">View all</a>
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 focus:outline-none">
                  <Avatar>
                    <AvatarFallback>AU</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700">Admin User</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href="/profile">
                    <a className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Your Profile</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings">
                    <a className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

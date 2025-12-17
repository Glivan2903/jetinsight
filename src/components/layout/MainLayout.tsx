import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    LogOut,
    Menu,
    X,
    Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const location = useLocation();
    const { signOut } = useAuth();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = async () => {
        await signOut();
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: MessageSquare, label: 'Atendimentos', path: '/atendimentos' },
        { icon: Brain, label: 'Insights', path: '/insights' },
    ];

    return (
        <div className="h-screen overflow-hidden bg-background text-foreground flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground border-r border-primary-foreground/10 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center justify-center relative px-6 border-b border-primary-foreground/10">
                    <img src="/jetinsight-logo.png" alt="JetInsight" className="h-8 object-contain" />
                    <button onClick={toggleSidebar} className="absolute right-4 lg:hidden text-primary-foreground hover:bg-black/10 p-1 rounded-md transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-black text-white shadow-md transform scale-105"
                                        : "text-primary-foreground/90 hover:bg-black/10 hover:text-primary-foreground"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-foreground/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-primary-foreground/90 hover:bg-red-500/20 hover:text-red-700 transition-all active:scale-95 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:text-red-700" />
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300" >
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-primary text-primary-foreground flex items-center justify-between px-4 fixed top-0 w-full z-40 shadow-md" >
                    <div className="flex items-center gap-2">
                        <button onClick={toggleSidebar} className="p-1 hover:bg-black/10 rounded-md transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>
                        <img src="/jetinsight-logo.png" alt="JetInsight" className="h-6 object-contain" />
                    </div>
                    <div className="w-8"></div> {/* Spacer for centering if needed, or just layout balance */}
                </header >

                <main className="flex-1 p-6 overflow-hidden">
                    <Outlet />
                </main>
            </div >

            {/* Overlay for mobile */}
            {
                isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )
            }
        </div >
    );
}

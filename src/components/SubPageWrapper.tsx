
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import NotificationCenter from './notifications/NotificationCenter';
import { useAuth } from '../hooks/useAuth';

interface SubPageWrapperProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

const SubPageWrapper: React.FC<SubPageWrapperProps> = ({ title, onBack, children }) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                ← Back
              </Button>
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
};

export default SubPageWrapper;


import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <Card className="border-dashed border-2 border-gray-200">
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} className="bg-pink-500 hover:bg-pink-600">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  FileBarChart, 
  CreditCard 
} from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: number | string;
  change?: { value: number; type: 'increase' | 'decrease' };
  type: 'accounts' | 'users' | 'reports' | 'credits';
  loading?: boolean;
}

export default function MetricsCard({ title, value, change, type, loading = false }: MetricsCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'accounts':
        return <Building2 className="h-6 w-6 text-primary-500" />;
      case 'users':
        return <Users className="h-6 w-6 text-indigo-500" />;
      case 'reports':
        return <FileBarChart className="h-6 w-6 text-yellow-500" />;
      case 'credits':
        return <CreditCard className="h-6 w-6 text-green-500" />;
      default:
        return <Building2 className="h-6 w-6 text-primary-500" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'accounts':
        return 'bg-blue-100';
      case 'users':
        return 'bg-indigo-100';
      case 'reports':
        return 'bg-yellow-100';
      case 'credits':
        return 'bg-green-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            )}
          </div>
          <div className={`${getIconBgColor()} p-2 rounded-full`}>
            {getIcon()}
          </div>
        </div>
        {change && !loading && (
          <div className="mt-2">
            <p className={`text-sm ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              <span className={`${change.type === 'increase' ? 'text-green-500' : 'text-red-500'} mr-1`}>
                {change.type === 'increase' ? '↑' : '↓'}
              </span>
              {change.value}% from last month
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

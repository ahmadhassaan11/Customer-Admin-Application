import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { MetricsData, Transaction } from '@/lib/types';
import MetricsCard from '@/components/shared/MetricsCard';
import TransactionTable from '@/components/shared/TransactionTable';
import AccountCard from '@/components/shared/AccountCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Dashboard() {
  // Fetch dashboard metrics data
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['/api/metrics/dashboard'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch expiring subscriptions
  const { data: expiringSubscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['/api/metrics/expiring-subscriptions', { days: 30 }],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard title="Active Accounts" value="--" type="accounts" loading={true} />
          <MetricsCard title="Active Users" value="--" type="users" loading={true} />
          <MetricsCard title="Total Reports Run" value="--" type="reports" loading={true} />
          <MetricsCard title="Credits Available" value="--" type="credits" loading={true} />
        </div>

        {/* Skeleton transactions */}
        <TransactionTable transactions={[]} loading={true} />
      </div>
    );
  }

  // Sample transactions for demonstration
  const recentTransactions: Transaction[] = metricsData?.recentTransactions || [];

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard 
          title="Active Accounts" 
          value={metricsData?.activeUsers || 0}
          change={{ value: 4.75, type: 'increase' }}
          type="accounts" 
        />
        <MetricsCard 
          title="Active Users" 
          value={metricsData?.activeUsers || 0}
          change={{ value: 12.5, type: 'increase' }}
          type="users" 
        />
        <MetricsCard 
          title="Total Reports Run" 
          value={metricsData?.totalReports || 0}
          change={{ value: 8.2, type: 'increase' }}
          type="reports" 
        />
        <MetricsCard 
          title="Credits Available" 
          value={metricsData?.availableCredits || 0}
          change={{ value: 3.1, type: 'decrease' }}
          type="credits" 
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions */}
        <div className="lg:col-span-2">
          <TransactionTable transactions={recentTransactions} />
        </div>

        {/* Top Accounts */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Accounts by Usage</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {metricsData?.topAccounts?.map((account, index) => (
                <AccountCard 
                  key={index} 
                  accountName={account.name} 
                  reportCount={account.reports} 
                  creditsUsed={account.creditsUsed} 
                  accountId={index + 1} 
                />
              )) || (
                <div className="text-center py-4 text-gray-500">
                  No accounts data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Subscriptions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Expiring Subscriptions (Next 30 Days)</h3>
          <Button size="sm">Notify Accounts</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead>Remaining Credits</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingSubscriptions ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : expiringSubscriptions?.length > 0 ? (
                expiringSubscriptions.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.account.name}</TableCell>
                    <TableCell>{sub.product.name} {sub.offering.name}</TableCell>
                    <TableCell>{new Date(sub.expirationTs).toLocaleDateString()}</TableCell>
                    <TableCell>{sub.credits}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="link" size="sm">Renew</Button>
                      <Button variant="link" size="sm">Contact</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No subscriptions expiring soon</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

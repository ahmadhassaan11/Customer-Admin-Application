import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

interface AccountCardProps {
  accountName: string;
  reportCount: number;
  creditsUsed: number;
  accountId: number;
}

export default function AccountCard({ accountName, reportCount, creditsUsed, accountId }: AccountCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{accountName}</p>
            <p className="text-xs text-gray-500">
              {reportCount} reports, {creditsUsed} credits used
            </p>
          </div>
          <div className="text-sm font-medium text-primary-600">
            <Link href={`/accounts/${accountId}`}>
              <Button variant="ghost" size="sm" className="hover:bg-transparent p-0">
                <span className="mr-1">View</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

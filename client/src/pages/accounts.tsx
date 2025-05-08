import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Account } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Filter } from 'lucide-react';
import AccountForm from '@/components/forms/AccountForm';
import AccountDetails from '@/components/shared/AccountDetails';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Accounts() {
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();

  // Fetch accounts data
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['/api/accounts'],
  });

  // Fetch specific account details when one is selected
  const { data: selectedAccount } = useQuery({
    queryKey: ['/api/accounts', selectedAccountId],
    enabled: !!selectedAccountId,
  });

  // Fetch account users for the selected account
  const { data: accountUsers = [] } = useQuery({
    queryKey: ['/api/accounts', selectedAccountId, 'users'],
    enabled: !!selectedAccountId,
  });

  // Fetch subscriptions for the selected account
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/subscriptions', { accountId: selectedAccountId }],
    enabled: !!selectedAccountId,
  });

  // Mutation to delete an account
  const deleteMutation = useMutation({
    mutationFn: (accountId: number) => apiRequest('DELETE', `/api/accounts/${accountId}`),
    onSuccess: () => {
      toast({
        title: 'Account Deleted',
        description: 'The account has been deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive',
      });
    },
  });

  // Handle view account details
  const handleViewAccount = (accountId: number) => {
    setSelectedAccountId(accountId);
    setShowAccountDetails(true);
  };

  // Handle adding a new user to an account
  const handleAddUser = () => {
    // This would open a user form modal pre-configured for the selected account
    toast({
      title: 'Add User',
      description: 'This would open a form to add a user to the account',
    });
  };

  // Handle adding a new subscription to an account
  const handleAddSubscription = () => {
    // This would open a subscription form modal pre-configured for the selected account
    toast({
      title: 'Add Subscription',
      description: 'This would open a form to add a subscription to the account',
    });
  };

  // Filter and search accounts
  const filteredAccounts = accounts?.filter((account: Account) => {
    // Apply type filter
    if (accountTypeFilter !== 'all' && account.type !== accountTypeFilter) return false;
    
    // Apply status filter
    if (accountStatusFilter !== 'all' && account.status !== accountStatusFilter) return false;
    
    // Apply search query
    if (searchQuery && !account.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-600">Manage corporate and individual accounts</p>
        </div>
        <Button onClick={() => setShowNewAccountModal(true)}>
          New Account
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search accounts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select 
              value={accountTypeFilter}
              onValueChange={setAccountTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={accountStatusFilter}
              onValueChange={setAccountStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="p-4 text-center">Loading accounts...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">Error loading accounts</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Active Subscriptions</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No accounts found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts?.map((account: Account) => (
                    <TableRow key={account.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewAccount(account.id)}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {account.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>--</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-900" onClick={(e) => {
                          e.stopPropagation();
                          handleViewAccount(account.id);
                        }}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredAccounts?.length || 0}</span> of <span className="font-medium">{accounts?.length || 0}</span> accounts
                </p>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </div>

      {/* Account Creation Modal */}
      <AccountForm 
        open={showNewAccountModal} 
        onClose={() => setShowNewAccountModal(false)} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
          toast({
            title: 'Account Created',
            description: 'The new account has been created successfully',
          });
        }}
        mode="create"
      />

      {/* Account Details Modal */}
      <AccountDetails 
        open={showAccountDetails}
        onClose={() => setShowAccountDetails(false)}
        account={selectedAccount?.find(acc => acc.id === selectedAccountId)}
        accountUsers={accountUsers}
        subscriptions={subscriptions}
        loading={!selectedAccount}
        onAddUser={handleAddUser}
        onAddSubscription={handleAddSubscription}
      />
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Subscription } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Filter, Plus } from 'lucide-react';
import SubscriptionForm from '@/components/forms/SubscriptionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Subscriptions() {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();

  // Fetch subscriptions data
  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ['/api/subscriptions'],
  });

  // Fetch accounts for the dropdown in the subscription form
  const { data: accounts } = useQuery({
    queryKey: ['/api/accounts'],
  });

  // Fetch products for the dropdown in the subscription form
  const { data: products } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: offerings } = useQuery({
    queryKey: ['/api/product-offerings'],
  });

  const accountLookup = Object.fromEntries(
    accounts?.map((a: Account) => [a.id, a.name]) || []
  );
  const productLookup = Object.fromEntries(
    products?.map((p: Product) => [p.id, p.name]) || []
  );
  const offeringLookup = Object.fromEntries(
    offerings?.map((o: ProductOffering) => [o.id, o.name]) || []
  );

  // Fetch specific subscription details when one is selected
  const { data: selectedSubscription } = useQuery({
    queryKey: ['/api/subscriptions', selectedSubscriptionId],
    enabled: !!selectedSubscriptionId,
  });

  // Fetch authorized users for this subscription
  const { data: authorizedUsers = [] } = useQuery({
    queryKey: ['/api/subscriptions', selectedSubscriptionId, 'users'],
    enabled: !!selectedSubscriptionId,
  });

  // Fetch transactions for this subscription
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/subscription-transactions', { subscriptionId: selectedSubscriptionId }],
    enabled: !!selectedSubscriptionId,
  });

  // Mutation to add credits to a subscription
  const addCreditsMutation = useMutation({
    mutationFn: ({ id, credits, authorizingUserId }: { id: number, credits: number, authorizingUserId: number }) => 
      apiRequest('POST', '/api/subscription-transactions', {
        subscriptionId: id,
        creditAdd: credits,
        authorizingUserId
      }),
    onSuccess: () => {
      toast({
        title: 'Credits Added',
        description: 'Credits have been added to the subscription successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-transactions'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add credits to the subscription',
        variant: 'destructive',
      });
    },
  });

  // Handle viewing subscription details
  const handleViewSubscription = (subscriptionId: number) => {
    setSelectedSubscriptionId(subscriptionId);
    setShowSubscriptionDetails(true);
  };

  // Calculate subscription status based on credits and expiration date
  const getSubscriptionStatus = (subscription: Subscription) => {
    const now = new Date();
    const expirationDate = subscription.expirationTs ? new Date(subscription.expirationTs) : null;
    
    if (subscription.credits <= 0) {
      return 'exhausted';
    }
    
    if (expirationDate && expirationDate < now) {
      return 'expired';
    }
    
    if (expirationDate) {
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiration <= 30) {
        return 'expiring-soon';
      }
    }
    
    return 'active';
  };

  // Filter and search subscriptions
  const filteredSubscriptions = subscriptions?.filter((subscription: Subscription) => {
    // Search by subscription ID or associated account/product if that data is loaded
    if (searchQuery) {
      const subscriptionId = subscription.id.toString();
      if (subscriptionId.includes(searchQuery)) return true;
      
      // Here you would typically search by account name or product name
      // if that information was joined with the subscription data
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Subscriptions</h1>
          <p className="mt-1 text-sm text-gray-600">Manage customer subscriptions and credits</p>
        </div>
        <Button onClick={() => setShowSubscriptionModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Subscription
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search subscriptions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products?.map((product: any) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="exhausted">Exhausted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 text-center">Loading subscriptions...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">Error loading subscriptions</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Offering</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        No subscriptions found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions?.map((subscription: Subscription) => {
                      const status = getSubscriptionStatus(subscription);
                      return (
                        <TableRow 
                          key={subscription.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleViewSubscription(subscription.id)}
                        >
                          <TableCell>{subscription.id}</TableCell>
                          <TableCell>{accountLookup[subscription.accountId] || 'Unknown'}</TableCell>
                          <TableCell>{productLookup[subscription.productId] || 'Unknown'}</TableCell>
                          <TableCell>{offeringLookup[subscription.productOfferingId] || 'Unknown'}</TableCell>
                          <TableCell>{subscription.credits}</TableCell>
                          <TableCell>{new Date(subscription.startingTs).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {subscription.expirationTs 
                              ? new Date(subscription.expirationTs).toLocaleDateString()
                              : 'No expiration'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                status === 'active' ? 'bg-green-100 text-green-800' :
                                status === 'expiring-soon' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {status === 'active' ? 'Active' :
                               status === 'expiring-soon' ? 'Expiring Soon' :
                               status === 'expired' ? 'Expired' : 'Exhausted'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // This would typically open a dialog to add credits
                                  toast({
                                    title: "Add Credits",
                                    description: "This would open a form to add credits"
                                  });
                                }}
                              >
                                Add Credits
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewSubscription(subscription.id);
                                }}
                              >
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredSubscriptions?.length || 0}</span> of <span className="font-medium">{subscriptions?.length || 0}</span> subscriptions
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
        </CardContent>
      </Card>

      {/* Subscription Creation Modal */}
      <SubscriptionForm 
        open={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
          toast({
            title: 'Subscription Created',
            description: 'The new subscription has been created successfully',
          });
        }}
        mode="create"
        accounts={accounts || []}
        products={products || []}
      />

      {/* Subscription Details Modal */}
      <Dialog open={showSubscriptionDetails} onOpenChange={setShowSubscriptionDetails}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              View and manage subscription information and credits
            </DialogDescription>
          </DialogHeader>

          {selectedSubscription && (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="users">Authorized Users</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Account ID</h3>
                    <p className="mt-1">{selectedSubscription.accountId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Product ID</h3>
                    <p className="mt-1">{selectedSubscription.productId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Product Offering ID</h3>
                    <p className="mt-1">{selectedSubscription.productOfferingId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Credits</h3>
                    <p className="mt-1">{selectedSubscription.credits}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                    <p className="mt-1">{new Date(selectedSubscription.startingTs).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Expiration Date</h3>
                    <p className="mt-1">
                      {selectedSubscription.expirationTs 
                        ? new Date(selectedSubscription.expirationTs).toLocaleDateString()
                        : 'No expiration'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button>Add Credits</Button>
                  <Button variant="outline">Extend Expiration</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="users">
                <div className="mb-2 flex justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Authorized Users</h3>
                  <Button size="sm">Add User</Button>
                </div>
                
                {authorizedUsers?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>User Name</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {authorizedUsers.map((user: any) => (
                        <TableRow key={user.authorizedUser}>
                          <TableCell>{user.authorizedUser}</TableCell>
                          <TableCell>
                            {/* Ideally you'd have user name here */}
                            User #{user.authorizedUser}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500">No users are authorized to use this subscription</p>
                )}
              </TabsContent>
              
              <TabsContent value="transactions">
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Transaction History</h3>
                </div>
                
                {transactions?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Credits Added</TableHead>
                        <TableHead>Credits Used</TableHead>
                        <TableHead>Authorized By</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.id}</TableCell>
                          <TableCell>{transaction.creditAdd || '--'}</TableCell>
                          <TableCell>{transaction.creditSubtract || '--'}</TableCell>
                          <TableCell>{transaction.authorizingUserId}</TableCell>
                          <TableCell>{new Date(transaction.transactionTs).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500">No transactions found for this subscription</p>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSubscriptionDetails(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

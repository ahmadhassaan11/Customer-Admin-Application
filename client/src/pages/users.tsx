import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Filter } from 'lucide-react';
import UserForm from '@/components/forms/UserForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Users() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();

  // Fetch users data
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['/api/users'],
  });

  // Fetch specific user details when one is selected
  const { data: selectedUser } = useQuery({
    queryKey: ['/api/users', selectedUserId],
    enabled: !!selectedUserId,
  });

  // Fetch user's contact information
  const { data: userContacts = [] } = useQuery({
    queryKey: ['/api/users', selectedUserId, 'contacts'],
    enabled: !!selectedUserId,
  });

  // Fetch accounts associated with the selected user
  const { data: userAccounts = [] } = useQuery({
    queryKey: ['/api/users', selectedUserId, 'accounts'],
    enabled: !!selectedUserId,
  });

  // Mutation to update user status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number, isActive: boolean }) => 
      apiRequest('PUT', `/api/users/${id}`, { isActive }),
    onSuccess: () => {
      toast({
        title: 'User Updated',
        description: 'User status has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    },
  });

  // Handle viewing user details
  const handleViewUser = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserDetails(true);
  };

  // Handle toggling user active status
  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    updateStatusMutation.mutate({ id: userId, isActive: !currentStatus });
  };

  // Filter and search users
  const filteredUsers = users?.filter((user: User) => {
    // Apply status filter
    if (userStatusFilter !== 'all') {
      if (userStatusFilter === 'active' && !user.isActive) return false;
      if (userStatusFilter === 'inactive' && user.isActive) return false;
    }
    
    // Apply search query
    if (searchQuery) {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      if (!fullName.includes(searchQuery.toLowerCase())) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">Manage system users and their access</p>
        </div>
        <Button onClick={() => setShowUserModal(true)}>
          New User
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select 
              value={userStatusFilter}
              onValueChange={setUserStatusFilter}
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
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 text-center">Loading users...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">Error loading users</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Accounts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No users found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers?.map((user: User) => (
                      <TableRow key={user.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewUser(user.id)}>
                        <TableCell className="font-medium flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                            <span className="text-primary-700 font-medium">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.contactInfo}</TableCell>
                        <TableCell>--</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.creationTs).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(user.id, user.isActive);
                              }}
                              className={user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewUser(user.id);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers?.length || 0}</span> of <span className="font-medium">{users?.length || 0}</span> users
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

      {/* User Creation Modal */}
      <UserForm 
        open={showUserModal} 
        onClose={() => setShowUserModal(false)} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/users'] });
          toast({
            title: 'User Created',
            description: 'The new user has been created successfully',
          });
        }}
        mode="create"
      />

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and manage user information and access
            </DialogDescription>
          </DialogHeader>
           <>
          {selectedUser && (
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">User Info</TabsTrigger>
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1">{selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="mt-1">
                      <Badge variant="outline" className={selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created Date</h3>
                    <p className="mt-1">{new Date(selectedUser.creationTs).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                    <p className="mt-1">
                      {selectedUser.lastUpdateTs 
                        ? new Date(selectedUser.lastUpdateTs).toLocaleDateString() 
                        : 'Never updated'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                  {userContacts?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userContacts.map((contact: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{contact.contactType}</TableCell>
                            <TableCell>{contact.contact}</TableCell>
                            <TableCell>{contact.contactNote || '--'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-gray-500">No contact information available</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="accounts">
                <div className="mb-2 flex justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Associated Accounts</h3>
                  <Button size="sm">Add to Account</Button>
                </div>
                
                {userAccounts?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userAccounts.map((account: any) => (
                        <TableRow key={account.accountId}>
                          <TableCell>{account.accountName}</TableCell>
                          <TableCell>{account.accountRole}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500">This user is not associated with any accounts</p>
                )}
              </TabsContent>
              
              <TabsContent value="activity">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Recent Activity</h3>
                  <p className="text-sm text-gray-500">User activity history will be displayed here</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
          </>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUserDetails(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                // Logic to edit user
                toast({
                  title: "Edit User",
                  description: "This would open the user edit form"
                });
              }}
            >
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

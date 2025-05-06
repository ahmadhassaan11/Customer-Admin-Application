import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Account, User, AccountUser, Subscription } from '@/lib/types';

interface AccountDetailsProps {
  open: boolean;
  onClose: () => void;
  account?: Account;
  accountUsers: AccountUser[];
  subscriptions: Subscription[];
  loading?: boolean;
  onAddUser: () => void;
  onAddSubscription: () => void;
}

export default function AccountDetails({
  open,
  onClose,
  account,
  accountUsers,
  subscriptions,
  loading = false,
  onAddUser,
  onAddSubscription
}: AccountDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{account.name}</DialogTitle>
          <DialogDescription>
            Account details and management
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Account Information</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Account Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{account.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{account.type}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Creation Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(account.creationTs).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <Badge variant="outline" className={`${account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {account.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Usage Statistics</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Total Users</dt>
                    <dd className="mt-1 text-sm text-gray-900">{accountUsers.length}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Active Subscriptions</dt>
                    <dd className="mt-1 text-sm text-gray-900">{subscriptions.length}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Total Reports Run</dt>
                    <dd className="mt-1 text-sm text-gray-900">--</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Last Activity</dt>
                    <dd className="mt-1 text-sm text-gray-900">--</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="text-center py-4 text-gray-500">
                  No recent activity found
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">Users</h4>
              <Button onClick={onAddUser}>Add User</Button>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No users found for this account
                      </TableCell>
                    </TableRow>
                  ) : (
                    accountUsers.map((accountUser) => (
                      <TableRow key={accountUser.userId}>
                        <TableCell className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 mr-4">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-700 font-medium">
                                {accountUser.user.firstName?.[0]}{accountUser.user.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {accountUser.user.firstName} {accountUser.user.lastName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">Email placeholder</div>
                          <div className="text-sm text-gray-500">Phone placeholder</div>
                        </TableCell>
                        <TableCell>{accountUser.accountRole}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${accountUser.user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {accountUser.user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">Edit</Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">
                              {accountUser.user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">Subscriptions</h4>
              <Button onClick={onAddSubscription}>Add Subscription</Button>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Offering</TableHead>
                    <TableHead>Remaining Credits</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No subscriptions found for this account
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">Product ID: {subscription.productId}</TableCell>
                        <TableCell>Offering ID: {subscription.productOfferingId}</TableCell>
                        <TableCell>{subscription.credits}</TableCell>
                        <TableCell>{new Date(subscription.startingTs).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {subscription.expirationTs 
                            ? new Date(subscription.expirationTs).toLocaleDateString() 
                            : 'No expiration'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2 text-sm">
                            <Button variant="link" size="sm">Add Credits</Button>
                            <Button variant="link" size="sm">Extend</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Subscription Authorization</h4>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Authorized Users</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No subscription authorizations found
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">Account Activity</h4>
              <div className="flex space-x-2">
                <select className="border border-gray-300 rounded-md py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                  <option>All Activity</option>
                  <option>Reports</option>
                  <option>Purchases</option>
                  <option>Login/Logout</option>
                </select>
                <input 
                  type="date" 
                  className="border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="bg-white border rounded-md overflow-hidden">
              <div className="text-center py-4 text-gray-500">
                No activity records found
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

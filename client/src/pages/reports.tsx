import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Report } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Reports() {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();

  // Fetch reports data
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['/api/reports'],
  });

  // Fetch specific report details when one is selected
  const { data: selectedReport } = useQuery({
    queryKey: ['/api/reports', selectedReportId],
    enabled: !!selectedReportId,
  });

  // Fetch owner info for the selected report
  const { data: reportOwners = [] } = useQuery({
    queryKey: ['/api/reports', selectedReportId, 'owners'],
    enabled: !!selectedReportId,
  });

  // Handle viewing report details
  const handleViewReport = (reportId: number) => {
    setSelectedReportId(reportId);
    setShowReportDetails(true);
  };

  // Filter and search reports
  const filteredReports = reports?.filter((report: Report) => {
    if (searchQuery) {
      return (
        report.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage generated reports</p>
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search reports..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {/* You'd add owner options here dynamically */}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 text-center">Loading reports...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">Error loading reports</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Creation Date</TableHead>
                    <TableHead>Cost (Credits)</TableHead>
                    <TableHead>KB Version</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No reports found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports?.map((report: Report) => (
                      <TableRow 
                        key={report.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleViewReport(report.id)}
                      >
                        <TableCell>{report.id}</TableCell>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>--</TableCell> {/* Owner name would go here */}
                        <TableCell>{new Date(report.creationTs).toLocaleDateString()}</TableCell>
                        <TableCell>{report.reportCostInCredits}</TableCell>
                        <TableCell>{report.knowledgeBaseVersion || '--'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReport(report.id);
                            }}
                          >
                            View
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
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredReports?.length || 0}</span> of <span className="font-medium">{reports?.length || 0}</span> reports
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

      {/* Report Details Modal */}
      <Dialog open={showReportDetails} onOpenChange={setShowReportDetails}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              View detailed information about this report
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="sharing">Sharing</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1">{selectedReport.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Creation Date</h3>
                    <p className="mt-1">{new Date(selectedReport.creationTs).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Cost (Credits)</h3>
                    <p className="mt-1">{selectedReport.reportCostInCredits}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Knowledge Base Version</h3>
                    <p className="mt-1">{selectedReport.knowledgeBaseVersion || '--'}</p>
                  </div>
                </div>

                {selectedReport.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1 text-sm text-gray-700">{selectedReport.description}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="sharing">
                <div className="mb-2 flex justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Share With Users</h3>
                  <Button size="sm">Share Report</Button>
                </div>
                
                {reportOwners?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Access Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportOwners.map((owner: any) => (
                        <TableRow key={owner.userId}>
                          <TableCell>User #{owner.userId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={owner.isOwner ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                              {owner.isOwner ? 'Owner' : 'Shared'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {!owner.isOwner && (
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">
                                Revoke Access
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500">This report is not shared with any users</p>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowReportDetails(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

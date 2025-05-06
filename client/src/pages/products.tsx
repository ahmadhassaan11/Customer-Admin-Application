import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Product, ProductOffering } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Plus } from 'lucide-react';
import ProductForm from '@/components/forms/ProductForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Products() {
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();

  // Fetch products data
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['/api/products'],
  });

  // Fetch specific product details when one is selected
  const { data: selectedProduct } = useQuery({
    queryKey: ['/api/products', selectedProductId],
    enabled: !!selectedProductId,
  });

  // Fetch product offerings for the selected product
  const { data: productOfferings = [] } = useQuery({
    queryKey: ['/api/product-offerings', { productId: selectedProductId }],
    enabled: !!selectedProductId,
  });

  // Mutation to update a product
  const updateProductMutation = useMutation({
    mutationFn: (product: Partial<Product>) => 
      apiRequest('PUT', `/api/products/${product.id}`, product),
    onSuccess: () => {
      toast({
        title: 'Product Updated',
        description: 'The product has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete a product offering
  const deleteOfferingMutation = useMutation({
    mutationFn: (offeringId: number) => 
      apiRequest('DELETE', `/api/product-offerings/${offeringId}`),
    onSuccess: () => {
      toast({
        title: 'Offering Deleted',
        description: 'The product offering has been deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/product-offerings'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete product offering',
        variant: 'destructive',
      });
    },
  });

  // Handle viewing product details
  const handleViewProduct = (productId: number) => {
    setSelectedProductId(productId);
    setShowProductDetails(true);
  };

  // Filter and search products
  const filteredProducts = products?.filter((product: Product) => {
    if (searchQuery) {
      return product.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-600">Manage products and product offerings</p>
        </div>
        <Button onClick={() => setShowProductModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 text-center">Loading products...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">Error loading products</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Offerings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No products found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts?.map((product: Product) => (
                      <TableRow 
                        key={product.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleViewProduct(product.id)}
                      >
                        <TableCell>{product.id}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.currentVersion || '--'}</TableCell>
                        <TableCell>{new Date(product.creationDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {product.updateDate 
                            ? new Date(product.updateDate).toLocaleDateString()
                            : '--'
                          }
                        </TableCell>
                        <TableCell>--</TableCell> {/* You'd typically count the offerings here */}
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Open edit product modal
                                toast({
                                  title: "Edit Product",
                                  description: "This would open the product edit form"
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProduct(product.id);
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
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredProducts?.length || 0}</span> of <span className="font-medium">{products?.length || 0}</span> products
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

      {/* Product Creation Modal */}
      <ProductForm 
        open={showProductModal} 
        onClose={() => setShowProductModal(false)} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/products'] });
          toast({
            title: 'Product Created',
            description: 'The new product has been created successfully',
          });
        }}
        mode="create"
      />

      {/* Product Details Modal */}
      <Dialog open={showProductDetails} onOpenChange={setShowProductDetails}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              View and manage product information and offerings
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="offerings">Offerings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Current Version</h3>
                    <p className="mt-1">{selectedProduct.currentVersion || '--'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created Date</h3>
                    <p className="mt-1">{new Date(selectedProduct.creationDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                    <p className="mt-1">
                      {selectedProduct.updateDate 
                        ? new Date(selectedProduct.updateDate).toLocaleDateString()
                        : '--'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button onClick={() => {
                    // Handle editing the product
                    toast({
                      title: "Edit Product",
                      description: "This would open the product edit form"
                    });
                  }}>
                    Edit Product
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="offerings">
                <div className="mb-2 flex justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Product Offerings</h3>
                  <Button 
                    size="sm"
                    onClick={() => {
                      // Open offering creation modal
                      toast({
                        title: "New Offering",
                        description: "This would open the offering creation form"
                      });
                    }}
                  >
                    Add Offering
                  </Button>
                </div>
                
                {productOfferings?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Rate per Credit</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productOfferings.map((offering: ProductOffering) => (
                        <TableRow key={offering.id}>
                          <TableCell>{offering.id}</TableCell>
                          <TableCell className="font-medium">{offering.name}</TableCell>
                          <TableCell>{offering.description || '--'}</TableCell>
                          <TableCell>${offering.ratePerCredit.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  // Handle editing the offering
                                  toast({
                                    title: "Edit Offering",
                                    description: "This would open the offering edit form"
                                  });
                                }}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => {
                                  // Handle deleting the offering
                                  if (confirm("Are you sure you want to delete this offering?")) {
                                    deleteOfferingMutation.mutate(offering.id);
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500">No offerings available for this product</p>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowProductDetails(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

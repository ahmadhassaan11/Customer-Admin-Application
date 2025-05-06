import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define schemas for both product and initial offering
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  currentVersion: z.string().optional(),
  // For the initial offering when creating a new product
  initialOffering: z.object({
    name: z.string().min(1, "Offering name is required"),
    description: z.string().optional(),
    ratePerCredit: z.preprocess(
      (val) => (val === '' ? undefined : parseFloat(val as string)),
      z.number().min(0.01, "Rate must be greater than 0")
    )
  }).optional()
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<ProductFormValues>;
  mode: 'create' | 'edit';
}

export default function ProductForm({
  open,
  onClose,
  onSuccess,
  initialData,
  mode
}: ProductFormProps) {
  const { toast } = useToast();
  const [includeOffering, setIncludeOffering] = React.useState(mode === 'create');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      currentVersion: initialData?.currentVersion || '',
      initialOffering: mode === 'create' ? {
        name: '',
        description: '',
        ratePerCredit: 0
      } : undefined
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (mode === 'create') {
        // Create the product
        const productResponse = await apiRequest('POST', '/api/products', {
          name: data.name,
          currentVersion: data.currentVersion
        });
        
        const product = await productResponse.json();
        
        // Create the initial offering if specified
        if (includeOffering && data.initialOffering) {
          await apiRequest('POST', '/api/product-offerings', {
            name: data.initialOffering.name,
            description: data.initialOffering.description,
            ratePerCredit: data.initialOffering.ratePerCredit,
            productId: product.id
          });
        }
        
        toast({
          title: 'Product Created',
          description: 'The product has been created successfully',
        });
      } else if (mode === 'edit') {
        // Assume initialData has the product ID for editing
        const productId = (initialData as any)?.id;
        if (!productId) {
          throw new Error('Product ID is required for editing');
        }
        
        await apiRequest('PUT', `/api/products/${productId}`, {
          name: data.name,
          currentVersion: data.currentVersion
        });
        
        toast({
          title: 'Product Updated',
          description: 'The product has been updated successfully',
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'There was an error processing your request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Product' : 'Edit Product'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new product'
              : 'Update the product information'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Version</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 1.0.0" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>
                    The current version of this product (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-offering"
                    checked={includeOffering}
                    onChange={(e) => setIncludeOffering(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="include-offering" className="text-sm font-medium text-gray-700">
                    Include Initial Product Offering
                  </label>
                </div>

                {includeOffering && (
                  <div className="space-y-4 pt-2">
                    <Separator />
                    <h3 className="text-sm font-medium text-gray-700">Initial Product Offering</h3>

                    <FormField
                      control={form.control}
                      name="initialOffering.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Offering Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Standard Subscription" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="initialOffering.description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe this offering" 
                              className="resize-none" 
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="initialOffering.ratePerCredit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Per Credit</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                              <Input 
                                type="number" 
                                min="0.01" 
                                step="0.01" 
                                placeholder="0.00" 
                                className="pl-8"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            The cost per credit for this offering
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

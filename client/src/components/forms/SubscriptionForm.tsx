import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Form schema based on the subscription schema from the database
const subscriptionFormSchema = z.object({
  accountId: z.number({
    required_error: "Please select an account",
    invalid_type_error: "Please select an account",
  }),
  productId: z.number({
    required_error: "Please select a product",
    invalid_type_error: "Please select a product",
  }),
  productOfferingId: z.number({
    required_error: "Please select a product offering",
    invalid_type_error: "Please select a product offering",
  }),
  credits: z.number().min(0, "Credits cannot be negative"),
  expirationTs: z.date().optional(),
  // For authorizing users initially
  authorizedUserIds: z.array(z.number()).optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<SubscriptionFormValues>;
  mode: 'create' | 'edit';
  accounts: { id: number; name: string }[];
  products: { id: number; name: string }[];
  forAccountId?: number; // If creating a subscription for a specific account
}

export default function SubscriptionForm({
  open,
  onClose,
  onSuccess,
  initialData,
  mode,
  accounts,
  products,
  forAccountId
}: SubscriptionFormProps) {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = React.useState<number | undefined>(initialData?.productId);
  const [productOfferings, setProductOfferings] = React.useState<{ id: number; name: string; description?: string }[]>([]);

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      accountId: forAccountId || initialData?.accountId,
      productId: initialData?.productId,
      productOfferingId: initialData?.productOfferingId,
      credits: initialData?.credits || 0,
      expirationTs: initialData?.expirationTs,
      authorizedUserIds: initialData?.authorizedUserIds || [],
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  // Fetch product offerings when product is selected
  React.useEffect(() => {
    if (selectedProductId) {
      const fetchProductOfferings = async () => {
        try {
          const response = await fetch(`/api/product-offerings?productId=${selectedProductId}`);
          if (response.ok) {
            const data = await response.json();
            setProductOfferings(data);
          }
        } catch (error) {
          console.error('Error fetching product offerings:', error);
        }
      };

      fetchProductOfferings();
    }
  }, [selectedProductId]);

  const onSubmit = async (data: SubscriptionFormValues) => {
    try {
      if (mode === 'create') {
        const response = await apiRequest('POST', '/api/subscriptions', {
          accountId: data.accountId,
          productId: data.productId,
          productOfferingId: data.productOfferingId,
          credits: data.credits,
          expirationTs: data.expirationTs,
        });

        const subscription = await response.json();

        // Add authorized users if provided
        if (data.authorizedUserIds && data.authorizedUserIds.length > 0) {
          for (const userId of data.authorizedUserIds) {
            await apiRequest('POST', '/api/user-subscriptions', {
              subscriptionId: subscription.id,
              authorizedUser: userId
            });
          }
        }

        toast({
          title: 'Subscription Created',
          description: 'The subscription has been created successfully',
        });
      } else if (mode === 'edit') {
        // Assume initialData has the subscription ID for editing
        const subscriptionId = (initialData as any)?.id;
        if (!subscriptionId) {
          throw new Error('Subscription ID is required for editing');
        }

        await apiRequest('PUT', `/api/subscriptions/${subscriptionId}`, {
          accountId: data.accountId,
          productId: data.productId,
          productOfferingId: data.productOfferingId,
          credits: data.credits,
          expirationTs: data.expirationTs,
        });

        toast({
          title: 'Subscription Updated',
          description: 'The subscription has been updated successfully',
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
          <DialogTitle>{mode === 'create' ? 'Create New Subscription' : 'Edit Subscription'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new subscription'
              : 'Update the subscription information'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select
                    disabled={!!forAccountId}
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => {
                      const productId = parseInt(value);
                      field.onChange(productId);
                      setSelectedProductId(productId);
                      // Reset product offering when product changes
                      form.setValue('productOfferingId', undefined as any);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productOfferingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Offering</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    disabled={!selectedProductId || productOfferings.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedProductId ? "Select offering" : "Select a product first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productOfferings.map(offering => (
                        <SelectItem key={offering.id} value={offering.id.toString()}>
                          {offering.name} {offering.description ? `- ${offering.description}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Credits</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    The number of credits available for this subscription
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expirationTs"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiration Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>No expiration date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When the subscription expires, regardless of remaining credits.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Subscription' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

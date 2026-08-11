import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useAppToast } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card } from '@/components/ui/Card';
import {
  ProductForm,
  productToFormValues,
  toProductUpdatePayload,
} from '@/components/products/ProductForm';
import type { ProductFormValues } from '@/components/products/ProductForm';
import { getErrorMessage } from '@/utils/format';

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  const [serverError, setServerError] = useState('');

  const { data: product, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.product(id!),
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      productService.updateProduct(id!, toProductUpdatePayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.product(id!) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      showToast('Product updated successfully.');
      navigate(`/products/${id}`, { replace: true });
    },
    onError: (err) => {
      setServerError(getErrorMessage(err));
    },
  });

  const handleSubmit = async (values: ProductFormValues) => {
    setServerError('');
    await mutation.mutateAsync(values);
  };

  if (isLoading) return <LoadingState message="Loading product..." />;
  if (isError || !product)
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Edit Product"
        description={`Editing: ${product.name} — ${product.sku}`}
      />
      <Card>
        <ProductForm
          defaultValues={productToFormValues(product)}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/products/${id}`)}
          submitLabel="Save Changes"
          serverError={serverError}
          isEdit
        />
      </Card>
    </div>
  );
}

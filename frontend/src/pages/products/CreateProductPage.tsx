import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useAppToast } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { ProductForm, toProductCreatePayload } from '@/components/products/ProductForm';
import type { ProductFormValues } from '@/components/products/ProductForm';
import { getErrorMessage } from '@/utils/format';

export function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  const [serverError, setServerError] = useState('');

  const mutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      showToast('Product created successfully.');
      navigate(`/products/${product.id}`, { replace: true });
    },
    onError: (err) => {
      setServerError(getErrorMessage(err));
    },
  });

  const handleSubmit = async (values: ProductFormValues) => {
    setServerError('');
    await mutation.mutateAsync(toProductCreatePayload(values));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Add Product"
        description="Create a new product. Use Inventory to manage stock levels."
      />
      <Card>
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/products')}
          submitLabel="Create Product"
          serverError={serverError}
        />
      </Card>
    </div>
  );
}

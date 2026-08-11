import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challanService } from '@/services/challan.service';
import { productService } from '@/services/product.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useAppToast } from '@/components/layout/AppLayout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card } from '@/components/ui/Card';
import { ChallanForm } from '@/components/challans/ChallanForm';
import type { ChallanFormState } from '@/components/challans/ChallanForm';
import { getErrorMessage } from '@/utils/format';

export function EditChallanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  usePageTitle('Edit Challan');
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: challan, isLoading: challanLoading, isError: challanError, error: challanErr } = useQuery({
    queryKey: QUERY_KEYS.challan(id!),
    queryFn: () => challanService.getChallanById(id!),
    enabled: !!id,
  });

  // Load products to reconstruct line items with full product data (backend limit max is 100)
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.products, { limit: 100, isActive: true }],
    queryFn: () => productService.getProducts({ limit: 100, isActive: true }),
    enabled: !!challan,
  });

  const mutation = useMutation({
    mutationFn: (state: ChallanFormState) =>
      challanService.updateChallan(id!, {
        customerId: state.customerId,
        items: state.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challan(id!) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      showToast('Challan updated successfully.');
      navigate(`/challans/${id}`, { replace: true });
    },
    onError: (err) => {
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    },
  });

  const handleSubmit = async (state: ChallanFormState) => {
    setServerError('');
    setSubmitting(true);
    await mutation.mutateAsync(state);
  };

  if (challanLoading || productsLoading) return <LoadingState message="Loading challan..." />;
  if (challanError || !challan) return <ErrorState message={getErrorMessage(challanErr)} />;

  // Only DRAFT can be edited
  if (challan.status !== 'DRAFT') {
    return (
      <ErrorState message={`This challan is ${challan.status.toLowerCase()} and cannot be edited.`} />
    );
  }

  const products = productsData?.data ?? [];

  // Build initial items from challan items + current product data
  const initialItems = (challan.items ?? []).flatMap(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return [];
    return [{ productId: item.productId, product, quantity: item.quantity }];
  });

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Edit Challan"
        description={`Editing draft: ${challan.challanNumber}`}
      />
      <Card>
        <ChallanForm
          initialState={{ customerId: challan.customerId, items: initialItems }}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/challans/${id}`)}
          submitLabel="Save Changes"
          submitting={submitting}
          serverError={serverError}
        />
      </Card>
    </div>
  );
}

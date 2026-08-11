import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { challanService } from '@/services/challan.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useAppToast } from '@/components/layout/AppLayout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { ChallanForm } from '@/components/challans/ChallanForm';
import type { ChallanFormState } from '@/components/challans/ChallanForm';
import { getErrorMessage } from '@/utils/format';

export function CreateChallanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  usePageTitle('Create Challan');
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: challanService.createChallan,
    onSuccess: (challan) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      showToast('Sales challan created successfully.');
      navigate(`/challans/${challan.id}`, { replace: true });
    },
    onError: (err) => {
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    },
  });

  const handleSubmit = async (state: ChallanFormState) => {
    setServerError('');
    setSubmitting(true);
    await mutation.mutateAsync({
      customerId: state.customerId,
      items: state.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Create Sales Challan"
        description="Select a customer, add products and save as draft."
      />
      <Card>
        <ChallanForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/challans')}
          submitLabel="Save Draft"
          submitting={submitting}
          serverError={serverError}
        />
      </Card>
    </div>
  );
}

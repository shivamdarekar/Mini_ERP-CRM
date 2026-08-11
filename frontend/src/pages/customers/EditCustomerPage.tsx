import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useAppToast } from '@/components/layout/AppLayout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card } from '@/components/ui/Card';
import {
  CustomerForm,
  customerToFormValues,
  toCreatePayload,
} from '@/components/customers/CustomerForm';
import type { CustomerFormValues } from '@/components/customers/CustomerForm';
import { getErrorMessage } from '@/utils/format';

export function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  usePageTitle('Edit Customer');
  const [serverError, setServerError] = useState('');

  const { data: customer, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.customer(id!),
    queryFn: () => customerService.getCustomerById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      customerService.updateCustomer(id!, toCreatePayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customer(id!) });
      showToast('Customer updated successfully.');
      navigate(`/customers/${id}`, { replace: true });
    },
    onError: (err) => {
      setServerError(getErrorMessage(err));
    },
  });

  const handleSubmit = async (values: CustomerFormValues) => {
    setServerError('');
    await mutation.mutateAsync(values);
  };

  if (isLoading) return <LoadingState message="Loading customer..." />;
  if (isError || !customer)
    return (
      <ErrorState
        message={getErrorMessage(error)}
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Edit Customer"
        description={`Editing: ${customer.name} — ${customer.businessName}`}
      />
      <Card>
        <CustomerForm
          defaultValues={customerToFormValues(customer)}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/customers/${id}`)}
          submitLabel="Save Changes"
          serverError={serverError}
        />
      </Card>
    </div>
  );
}

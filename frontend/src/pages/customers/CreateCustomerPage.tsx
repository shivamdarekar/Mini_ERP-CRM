import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useAppToast } from '@/components/layout/AppLayout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { CustomerForm, toCreatePayload } from '@/components/customers/CustomerForm';
import type { CustomerFormValues } from '@/components/customers/CustomerForm';
import { getErrorMessage } from '@/utils/format';

export function CreateCustomerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  usePageTitle('Add Customer');
  const [serverError, setServerError] = useState('');

  const mutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers });
      showToast('Customer created successfully.');
      navigate(`/customers/${customer.id}`, { replace: true });
    },
    onError: (err) => {
      setServerError(getErrorMessage(err));
    },
  });

  const handleSubmit = async (values: CustomerFormValues) => {
    setServerError('');
    await mutation.mutateAsync(toCreatePayload(values));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Add Customer"
        description="Create a new customer record in the CRM."
      />
      <Card>
        <CustomerForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/customers')}
          submitLabel="Create Customer"
          serverError={serverError}
        />
      </Card>
    </div>
  );
}

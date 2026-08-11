import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { customerService } from '@/services/customer.service';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/utils/format';

const schema = z.object({
  content: z.string().min(1, 'Note is required').max(1000, 'Max 1000 characters'),
});

type FormValues = z.infer<typeof schema>;

interface AddFollowUpModalProps {
  customerId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFollowUpModal({ customerId, open, onClose, onSuccess }: AddFollowUpModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (content: string) => customerService.addFollowUp(customerId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customerFollowUps(customerId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customer(customerId) });
      reset();
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError('root', { message: getErrorMessage(err) });
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values.content);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Follow-up Note">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Textarea
          label="Follow-up note *"
          placeholder="e.g. Called customer regarding bulk quotation..."
          rows={4}
          error={errors.content?.message}
          {...register('content')}
        />

        {errors.root && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-700">{errors.root.message}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isSubmitting}>
            Save Note
          </Button>
        </div>
      </form>
    </Modal>
  );
}

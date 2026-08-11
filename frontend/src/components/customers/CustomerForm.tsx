import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { Customer, CreateCustomerPayload } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  mobile: z
    .string()
    .min(1, 'Mobile is required')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  businessName: z.string().min(1, 'Business name is required').max(150),
  gstNumber: z
    .string()
    .optional()
    .refine(
      v => !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v),
      'Enter a valid GST number'
    ),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'], 'Customer type is required'),
  address: z.string().min(1, 'Address is required').max(300),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE'], 'Status is required'),
  followUpDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type CustomerFormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  serverError?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomerForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  serverError,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'LEAD',
      customerType: 'RETAIL',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {/* Customer Information */}
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-4 pb-1.5 border-b border-slate-100">
          Customer Profile Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full name *"
            placeholder="Rahul Sharma"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Mobile *"
            placeholder="9876543210"
            error={errors.mobile?.message}
            {...register('mobile')}
          />
          <div className="sm:col-span-2">
            <Input
              label="Email *"
              type="email"
              placeholder="rahul@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
        </div>
      </section>

      {/* Business Information */}
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-4 pb-1.5 border-b border-slate-100">
          Business Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Business name *"
            placeholder="ABC Electronics"
            error={errors.businessName?.message}
            {...register('businessName')}
          />
          <Input
            label="GST number"
            placeholder="22AAAAA0000A1Z5"
            error={errors.gstNumber?.message}
            {...register('gstNumber')}
          />
          <Select
            label="Customer type *"
            error={errors.customerType?.message}
            {...register('customerType')}
          >
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </Select>
          <div className="sm:col-span-2">
            <Input
              label="Address *"
              placeholder="123, MG Road, Mumbai"
              error={errors.address?.message}
              {...register('address')}
            />
          </div>
        </div>
      </section>

      {/* CRM Information */}
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-4 pb-1.5 border-b border-slate-100">
          CRM & Follow-up Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Status *" error={errors.status?.message} {...register('status')}>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Input
            label="Follow-up date"
            type="date"
            error={errors.followUpDate?.message}
            {...register('followUpDate')}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Notes"
              placeholder="Any relevant notes about this customer..."
              error={errors.notes?.message}
              rows={3}
              {...register('notes')}
            />
          </div>
        </div>
      </section>


      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <p className="text-xs text-red-700">{serverError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function customerToFormValues(c: Customer): CustomerFormValues {
  return {
    name: c.name,
    mobile: c.mobile,
    email: c.email,
    businessName: c.businessName,
    gstNumber: c.gstNumber ?? '',
    customerType: c.customerType,
    address: c.address,
    status: c.status,
    followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : '',
    notes: c.notes ?? '',
  };
}

export function toCreatePayload(v: CustomerFormValues): CreateCustomerPayload {
  return {
    name: v.name,
    mobile: v.mobile,
    email: v.email,
    businessName: v.businessName,
    customerType: v.customerType,
    address: v.address,
    status: v.status,
    ...(v.gstNumber ? { gstNumber: v.gstNumber } : {}),
    ...(v.followUpDate ? { followUpDate: v.followUpDate } : {}),
    ...(v.notes ? { notes: v.notes } : {}),
  };
}

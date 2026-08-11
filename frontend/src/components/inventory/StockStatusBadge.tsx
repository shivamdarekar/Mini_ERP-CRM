import { Badge } from '@/components/ui/Badge';

interface StockStatusBadgeProps {
  currentStock: number;
  minimumStock: number;
}

export function StockStatusBadge({ currentStock, minimumStock }: StockStatusBadgeProps) {
  const isLow = currentStock <= minimumStock;
  return (
    <Badge variant={isLow ? 'warning' : 'success'}>
      {isLow ? 'Low Stock' : 'Healthy'}
    </Badge>
  );
}

export function isLowStock(currentStock: number, minimumStock: number): boolean {
  return currentStock <= minimumStock;
}

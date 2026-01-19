'use client';

import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Clock, Activity, AlertTriangle, TrendingDown } from 'lucide-react';

interface RiskCardProps {
  title: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  badgeText: string;
  iconType: string;
  onClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  activity: Activity,
  'alert-triangle': AlertTriangle,
  'trending-down': TrendingDown,
};

export default function RiskCard({
  title,
  description,
  riskLevel,
  badgeText,
  iconType,
  onClick,
}: RiskCardProps) {
  const Icon = iconMap[iconType] || AlertTriangle;

  const badgeVariant = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'warning',
    CRITICAL: 'danger',
  }[riskLevel] as 'success' | 'warning' | 'danger';

  return (
    <Card
      hover
      onClick={onClick}
      className="flex gap-4"
    >
      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-orange-600" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
        <Badge variant={badgeVariant} size="sm">
          {badgeText}
        </Badge>
      </div>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { LinkedPolicyRecommendation, LinkedPolicyScheme } from '@/lib/types';

interface PolicyRecommendationCardProps {
  linkedPolicies: LinkedPolicyRecommendation;
  onShareWhatsApp: () => void;
  onApply: (schemeIndex: number) => void;
}

export default function PolicyRecommendationCard({
  linkedPolicies,
  onShareWhatsApp,
  onApply,
}: PolicyRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!linkedPolicies.schemes || linkedPolicies.schemes.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8 border-2 border-green-200 bg-green-50/30" padding="lg">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                Funding Opportunities Available
              </h3>
              <Badge variant="success" size="sm">
                {linkedPolicies.schemes.length} Schemes
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Potential benefit: {formatCurrency(linkedPolicies.totalPotentialBenefit)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<MessageCircle className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              onShareWhatsApp();
            }}
          >
            Share
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-green-200">
          <p className="text-sm text-gray-600 mb-4">
            Based on your operational issue, these government schemes may help fund repairs or upgrades:
          </p>

          <div className="space-y-4">
            {linkedPolicies.schemes.map((scheme, index) => (
              <SchemeCard
                key={index}
                scheme={scheme}
                onApply={() => onApply(index)}
              />
            ))}
          </div>

          {linkedPolicies.priorityMatchCount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                <strong>{linkedPolicies.priorityMatchCount} high-priority match{linkedPolicies.priorityMatchCount > 1 ? 'es' : ''}</strong> found
                based on your Udyam registration and operational context.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function SchemeCard({
  scheme,
  onApply,
}: {
  scheme: LinkedPolicyScheme;
  onApply: () => void;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {scheme.priority_match && (
              <Badge variant="warning" size="sm">PRIORITY MATCH</Badge>
            )}
            <span className="text-xs text-gray-500 uppercase">
              {scheme.level} &bull; {scheme.ministry}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">{scheme.name}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{scheme.description}</p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <p className="text-xs text-gray-500">Up to</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(scheme.max_benefit)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {scheme.eligibility_criteria.slice(0, 2).map((criteria, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600"
            >
              {criteria}
            </span>
          ))}
          {scheme.eligibility_criteria.length > 2 && (
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              +{scheme.eligibility_criteria.length - 2} more
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onApply}>
          <ExternalLink className="w-3 h-3 mr-1" />
          Apply
        </Button>
      </div>
    </div>
  );
}

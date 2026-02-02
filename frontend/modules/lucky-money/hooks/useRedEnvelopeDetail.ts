import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/providers';
import { UUID } from 'crypto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { APP_CONFIG } from '@/configs/app.config';
import { CloseSessionRequest, RedEnvelopeDetailStats } from '../type';
import { formatClaimDate, getStatusDisplay } from '../utils';
import { QUERY_KEYS } from '../constants';
import { RedEnvelopeService } from '../api';

export const useRedEnvelopeDetail = () => {
  const [qrSize, setQrSize] = useState(176);
  const { redEnvelopeId } = useParams<{ redEnvelopeId: UUID }>();
  const queryClient = useQueryClient();

  const request: CloseSessionRequest = useMemo(() => ({
    id: redEnvelopeId,
  }), [redEnvelopeId]);

  const { stats, isLoading, isError, refetch } = useGetLuckMoneyDetail(redEnvelopeId);
  const recipients = useGetLuckMoneyRecipients(redEnvelopeId || '');

  const { mutate: closeSession, isPending: isClosing } = useMutation({
    mutationFn: () => RedEnvelopeService.closeSession(request),
    onSuccess: () => {
      toast.success('Session closed successfully!');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RED_ENVELOPE_DETAIL, redEnvelopeId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CREATED_ENVELOPES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RED_ENVELOPE_STATS_BY_USER]})
    },
    onError: (error) => {
      console.error('Failed to close session:', error);
      toast.error('Failed to close session. Please try again.');
    }
  });

  const { text: displayedStatus, className: statusClassName } = getStatusDisplay(
    stats.status
  );

  const isClosable = stats.status.toLocaleLowerCase() === 'published';

  const statsCards = useMemo(() => [
    {
      title: "TOTAL AMOUNT",
      value: stats.total_amount.toLocaleString('en-US'),
      unit: ` ${APP_CONFIG.CHAIN_SYMBOL}`,
      subValue: '',
    },
    {
      title: "CLAIMED",
      value: stats.total_claimed_amount.toLocaleString('en-US'),
      unit: ` ${APP_CONFIG.CHAIN_SYMBOL}`,
      subValue: "(" + stats.claimed_count + "/" + stats.total_claim + ")",
    },
    {
      title: "EXPIRY",
      value: formatClaimDate(stats.end_date),
      unit: '',
      subValue: '',
    },
  ], [stats, APP_CONFIG.CHAIN_SYMBOL]);

  const pathName = process.env.NEXT_BASE_FE || window.location.origin;
  const claimLink = redEnvelopeId
    ? `${pathName}/lucky-money/${redEnvelopeId}/claim`
    : '';

  const qrCodeValue = JSON.stringify({
    type: 'lucky-money',
    lucky_money_id: redEnvelopeId
  });

  useEffect(() => {
    const updateQrSize = () => {
      setQrSize(window.innerWidth < 768 ? 140 : 176);
    };
    updateQrSize();
    window.addEventListener('resize', updateQrSize);
    return () => window.removeEventListener('resize', updateQrSize);
  }, []);

  const truncateChars = qrSize === 140 ? 15 : 20;

  return {
    stats,
    recipients,
    redEnvelopeId,
    isClosing,
    displayedStatus,
    statusClassName,
    isClosable,
    statsCards,
    claimLink,
    qrCodeValue,
    qrSize,
    truncateChars,
    closeSession,
    isLoading,
    isError,
    refetch,
  };
};

export function useGetLuckMoneyDetail(id: UUID) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.RED_ENVELOPE_DETAIL, id],
    queryFn: () => RedEnvelopeService.getRedEnvelopeStatsById(id),
  });

  const fallback: RedEnvelopeDetailStats = {
    name: '',
    total_amount: 0,
    total_claimed_amount: 0,
    total_claim: 0,
    claimed_count: 0,
    end_date: '',
    red_envelope_wallet: '',
    status: '',
  };

  return {
    stats: data ?? fallback,
    isLoading, 
    isError,  
    error,     
    refetch,  
  };
}

export function useGetLuckMoneyRecipients(id: UUID) {
  const { data } = useQuery({
    queryKey: [QUERY_KEYS.RED_ENVELOPE_DETAIL_RECIPIENTS, id],
    queryFn: () => RedEnvelopeService.getRedEnvelopeDetailById(id),
  });

  return data;
}
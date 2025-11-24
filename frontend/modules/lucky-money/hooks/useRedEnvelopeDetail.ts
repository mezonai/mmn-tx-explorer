import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/providers';
import { UUID } from 'crypto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';


import { APP_CONFIG } from '@/configs/app.config';
import { RedEnvelopeDetailRequest, RedEnvelopeDetailStats } from '../type';
import { formatClaimDate, getStatusDisplay } from '../utils';
import { QUERY_KEYS } from '../constants';
import { RedEnvelopeService } from '../api';

export const useRedEnvelopeDetail = () => {
  const [qrSize, setQrSize] = useState(176);
  const { user } = useUser();
  const { redEnvelopeId } = useParams<{ redEnvelopeId: UUID }>();
  const queryClient = useQueryClient();

  const request: RedEnvelopeDetailRequest = useMemo(() => ({
    id: redEnvelopeId,
    wallet_address: user?.walletAddress || '',
  }), [redEnvelopeId, user?.walletAddress]);

  const { stats } = useGetLuckMoneyDetail(request);
  const recipients = useGetLuckMoneyRecipients(redEnvelopeId || '');

  const { mutate: closeSession, isPending: isClosing } = useMutation({
    mutationFn: () => RedEnvelopeService.closeSession(request),
    onSuccess: () => {
      toast.success('Session closed successfully!');
      queryClient.invalidateQueries({queryKey: [QUERY_KEYS.RED_ENVELOPE_DETAIL, request]});
      queryClient.invalidateQueries({queryKey: [QUERY_KEYS.CREATED_ENVELOPES]})
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

  const handleCloseSession = () => {
    if (!isClosable || isClosing) return;
    closeSession();
  };

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
    ? `${pathName}/li-xi/${redEnvelopeId}/claim`
    : '';

  const qrCodeValue = JSON.stringify({
    type: 'lucky-money',
    wallet_address: stats.red_envelope_wallet || '',
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
    handleCloseSession,
  };
};

export function useGetLuckMoneyDetail(request: RedEnvelopeDetailRequest) {
  const { data } = useQuery({
    queryKey: [QUERY_KEYS.RED_ENVELOPE_DETAIL, request],
    queryFn: () => RedEnvelopeService.getRedEnvelopeStatsById(request),
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
  }
}

export function useGetLuckMoneyRecipients(id: UUID) {
  const { data } = useQuery({
    queryKey: [QUERY_KEYS.RED_ENVELOPE_DETAIL_RECIPIENTS, id],
    queryFn: () => RedEnvelopeService.getRedEnvelopeDetailById(id),
  });

  return data;
}
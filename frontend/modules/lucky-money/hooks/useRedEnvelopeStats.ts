import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import { RedEnvelopeService } from "../api";
import { RedEnvelopeStats, RedEnvelopeStatsByUser } from "../type";

export function useRedEnvelopeStatsByUser() {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.RED_ENVELOPE_STATS_BY_USER],
    queryFn: () => RedEnvelopeService.getEnvelopeStatsByUser(),
  });

  const fallback: RedEnvelopeStatsByUser = {
    total_sent: 0,
    total_recipients: 0,
    total_claimed: 0,
    count_claimed_envelopes: 0,
    total_active_envelopes: 0,
  };

  return {
    stats: data ?? fallback,
    isLoading
  }
}

export function useRedEnvelopeStats() {
  const { data } = useQuery({
    queryKey: [QUERY_KEYS.RED_ENVELOPE_STATS],
    queryFn: () => RedEnvelopeService.getEnvelopeStats(),
  });

  const fallback: RedEnvelopeStats = {
    total_claimed: 0,
    total_envelopes: 0,
  };

  return {
    stats: data ?? fallback,
  }
}

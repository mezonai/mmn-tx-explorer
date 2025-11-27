import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import { RedEnvelopeService } from "../api";
import { RedEnvelopeStats } from "../type";

export function useRedEnvelopeStats() {
  const {data} = useQuery({
    queryKey: [QUERY_KEYS.RED_ENVELOPE_STATS],
    queryFn: () => RedEnvelopeService.getEnvelopeStats(),
  });

  const fallback: RedEnvelopeStats = {
    total_sent: 0,
    count_sent_envelopes: 0,
    total_claimed: 0,
    count_claimed_envelopes: 0,
    total_active_envelopes: 0,
  };

  return {
    stats: data ?? fallback,
  }
}
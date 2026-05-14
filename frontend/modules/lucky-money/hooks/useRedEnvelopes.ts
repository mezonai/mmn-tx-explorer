import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { EnvelopeListParams } from "../type";
import { QUERY_KEYS, RED_ENVELOPE_EVENT_TYPES } from "../constants";
import { RedEnvelopeService } from "../api";
import { useWebSocket } from "@/lib/websocket";

const WS_INVALIDATE_DELAY = 1000;

export const useClaimedEnvelopes = (params: EnvelopeListParams) => {
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.CLAIMED_ENVELOPES, params],
    queryFn: () =>
      RedEnvelopeService.getClaimedEnvelopes({
        ...params,page: params.page,
      }),
  });

  return {
    envelopes: response?.data || [],
    meta: response?.meta,         
    isLoading,
    error,
  };
};

export const useCreatedRedEnvelops = (params: EnvelopeListParams) => {
  const { page, limit } = params;
  const wsManager = useWebSocket();
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.CREATED_ENVELOPES, { page, limit }],
    queryFn: () =>
      RedEnvelopeService.getCreatedEnvelopes({
        ...params,page: params.page,
      }),
  });

  useEffect(() => {
    if (!wsManager) return;

    const handleRedEnvelopeListRefresh = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.CREATED_ENVELOPES],
        });
      }, WS_INVALIDATE_DELAY);
    };

    wsManager.on(RED_ENVELOPE_EVENT_TYPES.RED_ENVELOPE_LIST_REFRESH, handleRedEnvelopeListRefresh);

    return () => {
      wsManager.off(RED_ENVELOPE_EVENT_TYPES.RED_ENVELOPE_LIST_REFRESH, handleRedEnvelopeListRefresh);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [wsManager, queryClient]);

  return {
    envelopes: response?.data || [],
    meta: response?.meta,         
    isLoading,
    error,
  };
}
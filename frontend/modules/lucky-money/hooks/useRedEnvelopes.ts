import { useQuery } from "@tanstack/react-query";
import { EnvelopeListParams } from "../type";
import { QUERY_KEYS } from "../constants";
import { RedEnvelopeService } from "../api";

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

  return {
    envelopes: response?.data || [],
    meta: response?.meta,         
    isLoading,
    error,
  };
}
import { apiDongClient } from "@/service";
import { ClaimedEnvelopes, CreatedEnvelopes, EnvelopeListParams, RedEnvelopeStats } from "./type";
import { RED_ENVELOPE_ENPOINTS } from "./constants";
import { IPaginatedResponse } from "@/types";

export class RedEnvelopeService {
  static async getEnvelopeStats(wallet_address: string): Promise<RedEnvelopeStats> {
    const {data} = await apiDongClient.get<{ data: RedEnvelopeStats}>(RED_ENVELOPE_ENPOINTS.STATS, {
      params: { wallet_address }
    });
    return data.data
  }

  static async getClaimedEnvelopes(
    params: EnvelopeListParams
  ): Promise<IPaginatedResponse<ClaimedEnvelopes[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<ClaimedEnvelopes[]>>(RED_ENVELOPE_ENPOINTS.CLAIMED_ENVELOPES_BY_WALLET, {
      params,
    });
    return data;
  }


  static async getCreatedEnvelopes(
    params: EnvelopeListParams
  ): Promise<IPaginatedResponse<CreatedEnvelopes[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<CreatedEnvelopes[]>>(
      RED_ENVELOPE_ENPOINTS.CREATED_ENVELOPES_BY_WALLET, {params}
    );
    return data;
  }
}
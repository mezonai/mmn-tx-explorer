import { apiDongClient } from "@/service";
import { ClaimedEnvelopes, CreatedEnvelopes, CreateRedEnvelopeRequest, EnvelopeListParams, RedEnvelope, RedEnvelopeDetailRecipient, RedEnvelopeDetailRequest, RedEnvelopeDetailStats, RedEnvelopeStats, UpdateStatusRedEnvelopeRequest } from "./type";
import { RED_ENVELOPE_ENPOINTS } from "./constants";
import { IPaginatedResponse } from "@/types";
import { UUID } from "crypto";

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

  static async createRedEnvelope(request: CreateRedEnvelopeRequest): Promise<RedEnvelope> {
    const { data } = await apiDongClient.post<{ data: RedEnvelope }>(
      RED_ENVELOPE_ENPOINTS.CREATE_RED_ENVELOPE, request
    )
    return data.data
  }

  static async updateRedEnvelopeStatus(request: UpdateStatusRedEnvelopeRequest): Promise<RedEnvelope> {
    const { data } = await apiDongClient.post<{ data: RedEnvelope }>(
      RED_ENVELOPE_ENPOINTS.UPDATE_STATUS_RED_ENVELOPE, request
    )
    return data.data
  }

  static async getRedEnvelopeStatsById(request: RedEnvelopeDetailRequest): Promise<RedEnvelopeDetailStats> {
    const { data } = await apiDongClient.post<{ data: RedEnvelopeDetailStats }>(
      RED_ENVELOPE_ENPOINTS.RED_ENVELOPE_DETAIL_STATS, request
    )
    return data.data;
  }

  static async getRedEnvelopeDetailById(id: UUID): Promise<RedEnvelopeDetailRecipient[]> {
    const { data } = await apiDongClient.get<{ data: RedEnvelopeDetailRecipient[]}>(
      RED_ENVELOPE_ENPOINTS.RED_ENVELOPE_DETAIL_RECIPIENTS(id)
    )
    return data.data;
  }

  static async closeSession(request: RedEnvelopeDetailRequest): Promise<void> {
    await apiDongClient.post(RED_ENVELOPE_ENPOINTS.CLOSE_SESSION, request);
  }
}
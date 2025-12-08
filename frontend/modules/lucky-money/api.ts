import { apiDongClient } from "@/service";
import { ClaimedEnvelopes, ClaimEnvelopeRequest, CreatedEnvelopes, CreateRedEnvelopeRequest, EnvelopeListParams, RedEnvelope, RedEnvelopeClaim, RedEnvelopeDetailRecipient, CloseSessionRequest, RedEnvelopeDetailStats, UpdateStatusRedEnvelopeRequest, RedEnvelopeStatsByUser, RedEnvelopeStats } from "./type";
import { RED_ENVELOPE_ENDPOINTS } from "./constants";
import { IPaginatedResponse } from "@/types";
import { UUID } from "crypto";

export class RedEnvelopeService {
  static async getEnvelopeStatsByUser(): Promise<RedEnvelopeStatsByUser> {
    const {data} = await apiDongClient.get<{ data: RedEnvelopeStatsByUser}>(RED_ENVELOPE_ENDPOINTS.STATS_BY_USER);
    return data.data
  }

  static async getClaimedEnvelopes(
    params: EnvelopeListParams
  ): Promise<IPaginatedResponse<ClaimedEnvelopes[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<ClaimedEnvelopes[]>>(RED_ENVELOPE_ENDPOINTS.CLAIMED_ENVELOPES_BY_USER, {
      params,
    });
    return data;
  }


  static async getCreatedEnvelopes(
    params: EnvelopeListParams
  ): Promise<IPaginatedResponse<CreatedEnvelopes[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<CreatedEnvelopes[]>>(
      RED_ENVELOPE_ENDPOINTS.CREATED_ENVELOPES_BY_USER, {params}
    );
    return data;
  }

  static async createRedEnvelope(request: CreateRedEnvelopeRequest): Promise<RedEnvelope> {
    const { data } = await apiDongClient.post<{ data: RedEnvelope }>(
      RED_ENVELOPE_ENDPOINTS.CREATE_RED_ENVELOPE, request
    )
    return data.data
  }

  static async updateRedEnvelopeStatus(request: UpdateStatusRedEnvelopeRequest): Promise<RedEnvelope> {
    const { data } = await apiDongClient.post<{ data: RedEnvelope }>(
      RED_ENVELOPE_ENDPOINTS.UPDATE_STATUS_RED_ENVELOPE, request
    )
    return data.data
  }

  static async claimRedEnvelope(id: UUID, request: ClaimEnvelopeRequest): Promise<RedEnvelopeClaim> {
    const { data } = await apiDongClient.post<{ data: RedEnvelopeClaim }>(
      RED_ENVELOPE_ENDPOINTS.CLAIM(id), request
    )
    return data.data
  }

  static async getClaimAmount(id: UUID): Promise<RedEnvelopeClaim> {
    const { data } = await apiDongClient.get<{ data: RedEnvelopeClaim }>(
      RED_ENVELOPE_ENDPOINTS.CLAIM_AMOUNT(id)
    )
    return data.data
  }

  static async getRedEnvelopeStatsById(id: UUID): Promise<RedEnvelopeDetailStats> {
    const { data } = await apiDongClient.get<{ data: RedEnvelopeDetailStats }>(
      RED_ENVELOPE_ENDPOINTS.RED_ENVELOPE_DETAIL_STATS(id)
    )
    return data.data;
  }

  static async getRedEnvelopeDetailById(id: UUID): Promise<RedEnvelopeDetailRecipient[]> {
    const { data } = await apiDongClient.get<{ data: RedEnvelopeDetailRecipient[]}>(
      RED_ENVELOPE_ENDPOINTS.RED_ENVELOPE_DETAIL_RECIPIENTS(id)
    )
    return data.data;
  }

  static async closeSession(request: CloseSessionRequest): Promise<void> {
    await apiDongClient.post(RED_ENVELOPE_ENDPOINTS.CLOSE_SESSION, request);
  }

  static async getEnvelopeStats(): Promise<RedEnvelopeStats> {
    const {data} = await apiDongClient.get<{ data: RedEnvelopeStats}>(RED_ENVELOPE_ENDPOINTS.STATS);
    return data.data
  }
}
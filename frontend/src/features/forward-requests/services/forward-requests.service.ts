import { apiClient } from '@/services/api'
import type {
  ForwardRequestResponse,
  IncomingForwardRequestResponse,
  ForwardRequestDetailResponse,
  ForwardReasonType,
} from '../types'

export const forwardRequestsService = {
  async getPendingRequests(signal?: AbortSignal): Promise<ForwardRequestResponse[]> {
    const { data } = await apiClient.get<ForwardRequestResponse[]>(
      '/api/v1/forward-requests/pending',
      {
        signal,
      }
    )
    return data
  },

  async getIncomingRequests(signal?: AbortSignal): Promise<IncomingForwardRequestResponse[]> {
    const { data } = await apiClient.get<IncomingForwardRequestResponse[]>(
      '/api/v1/forward-requests/incoming',
      {
        signal,
      }
    )
    return data
  },

  async getRequestDetails(
    requestId: number,
    signal?: AbortSignal
  ): Promise<ForwardRequestDetailResponse> {
    const { data } = await apiClient.get<ForwardRequestDetailResponse>(
      `/api/v1/forward-requests/${requestId}`,
      { signal }
    )
    return data
  },

  async approveRequest(
    requestId: number,
    payload: { department_id: number; reason_type: ForwardReasonType; remarks: string }
  ): Promise<ForwardRequestResponse> {
    const { data } = await apiClient.post<ForwardRequestResponse>(
      `/api/v1/forward-requests/${requestId}/approve`,
      payload
    )
    return data
  },

  async rejectRequest(requestId: number, reason: string): Promise<ForwardRequestResponse> {
    const { data } = await apiClient.post<ForwardRequestResponse>(
      `/api/v1/forward-requests/${requestId}/reject`,
      { reason }
    )
    return data
  },

  async acceptRequest(requestId: number): Promise<ForwardRequestResponse> {
    const { data } = await apiClient.post<ForwardRequestResponse>(
      `/api/v1/forward-requests/${requestId}/accept`
    )
    return data
  },

  async declineRequest(requestId: number, reason: string): Promise<ForwardRequestResponse> {
    const { data } = await apiClient.post<ForwardRequestResponse>(
      `/api/v1/forward-requests/${requestId}/decline`,
      { reason }
    )
    return data
  },
}

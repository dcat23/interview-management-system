"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getInterviewSessions } from "@feature/backend/server"
import type { SessionStatus } from "@feature/base/server"

interface UseSessionsParams {
  page: number
  limit: number
  search?: string
  status?: SessionStatus
  processId?: string
  supporterId?: string
  clientId?: string
  round?: string
  scheduledFrom?: string
  scheduledTo?: string
  sort?: string
}

export function useSessions({ page, limit, search, status, processId, supporterId, clientId, round, scheduledFrom, scheduledTo, sort }: UseSessionsParams) {
  return useQuery({
    queryKey: ["sessions", { page, limit, search, status, processId, supporterId, clientId, round, scheduledFrom, scheduledTo, sort }],
    queryFn: async () => {
      const { data } = await getInterviewSessions({ page, limit, search, status, processId, supporterId, clientId, round, scheduledFrom, scheduledTo, sort })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

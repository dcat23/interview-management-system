"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getInterviewProcesses } from "@feature/backend/server"
import type { ProcessStatus } from "@feature/base/server"

interface UseProcessesParams {
  page: number
  limit: number
  search?: string
  status?: ProcessStatus
  clientId?: string
  /** yyyy-MM-dd, inclusive - filters on startedAt. */
  startedFrom?: string
  /** yyyy-MM-dd, inclusive - filters on startedAt. */
  startedTo?: string
  sort?: string
}

export function useProcesses({ page, limit, search, status, clientId, startedFrom, startedTo, sort }: UseProcessesParams) {
  return useQuery({
    queryKey: ["processes", { page, limit, search, status, clientId, startedFrom, startedTo, sort }],
    queryFn: async () => {
      const { data } = await getInterviewProcesses({ page, limit, search, status, clientId, startedFrom, startedTo, sort })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

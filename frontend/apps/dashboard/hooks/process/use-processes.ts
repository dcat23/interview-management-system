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
  sort?: string
}

export function useProcesses({ page, limit, search, status, clientId, sort }: UseProcessesParams) {
  return useQuery({
    queryKey: ["processes", { page, limit, search, status, clientId, sort }],
    queryFn: async () => {
      const { data } = await getInterviewProcesses({ page, limit, search, status, clientId, sort })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

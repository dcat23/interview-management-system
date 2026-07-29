"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getInterviewProcesses } from "@feature/backend/server"

interface UseProcessesParams {
  page: number
  limit: number
}

export function useProcesses({ page, limit }: UseProcessesParams) {
  return useQuery({
    queryKey: ["processes", { page, limit }],
    queryFn: async () => {
      const { data } = await getInterviewProcesses({ page, limit })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

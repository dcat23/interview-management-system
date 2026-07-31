"use client"

import { useQuery } from "@tanstack/react-query"
import { getClients } from "@feature/backend/server"

export function useClients() {
  return useQuery({
    queryKey: ["clients", "filter-options"],
    queryFn: async () => {
      const { data } = await getClients({ page: 0, limit: 100, isActive: true })
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

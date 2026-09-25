"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getClients } from "@feature/backend/server"

interface UseClientsPageParams {
  page: number
  limit: number
  search?: string
  isActive?: boolean
  sort?: string
}

export function useClientsPage({ page, limit, search, isActive, sort }: UseClientsPageParams) {
  return useQuery({
    queryKey: ["clients", { page, limit, search, isActive, sort }],
    queryFn: async () => {
      const { data } = await getClients({ page, limit, search, isActive, sort })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

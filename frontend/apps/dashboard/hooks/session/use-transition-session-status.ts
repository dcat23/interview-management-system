"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { transitionSessionStatus } from "@feature/backend/server"
import type { InterviewSession, SessionStatus } from "@feature/base/server"

interface TransitionSessionStatusVariables {
  sessionId: string
  targetStatus: SessionStatus
}

export function useTransitionSessionStatus() {
  return useMutation({
    mutationFn: async ({ sessionId, targetStatus }: TransitionSessionStatusVariables) => {
      const response = await transitionSessionStatus(sessionId, { targetStatus })
      if (!response.success || response.error) {
        throw response.error ?? new Error(response.message)
      }
      return response.data as InterviewSession
    },
    onSuccess: () => {
      toast.success("Session status updated")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Couldn't update session status")
    },
  })
}
import { toast } from "sonner"

import { Button } from "@app/web/components/ui/common/button"

export type ToastActionType =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "error"

export function ToastAction({
  label = "Show toast",
  title = "Saved",
  description = "Your changes have been saved.",
  type = "default",
  actionLabel = "Undo",
}: {
  label?: string
  title?: string
  description?: string
  type?: ToastActionType
  actionLabel?: string | null
}) {
  const showToast = () => {
    const options = {
      description,
      action: actionLabel
        ? {
            label: actionLabel,
            onClick: () => undefined,
          }
        : undefined,
    }

    if (type === "success") {
      toast.success(title, options)
      return
    }

    if (type === "info") {
      toast.info(title, options)
      return
    }

    if (type === "warning") {
      toast.warning(title, options)
      return
    }

    if (type === "error") {
      toast.error(title, options)
      return
    }

    toast(title, options)
  }

  return (
    <Button variant="outline" onClick={showToast}>
      {label}
    </Button>
  )
}

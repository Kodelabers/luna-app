import { toast as toastFn } from "@/hooks/use-toast"

export const toast = {
  success: (message: string, description?: string) => {
    toastFn({
      variant: "success",
      title: message,
      description,
    })
  },
  error: (message: string, description?: string) => {
    toastFn({
      variant: "destructive",
      title: message,
      description,
    })
  },
  warning: (message: string, description?: string) => {
    toastFn({
      variant: "warning",
      title: message,
      description,
    })
  },
  info: (message: string, description?: string) => {
    toastFn({
      variant: "info",
      title: message,
      description,
    })
  },
}


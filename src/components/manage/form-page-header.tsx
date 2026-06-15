import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface FormPageHeaderProps {
  backLabel: string
  backTo: string
  title: string
  subtitle?: string
  mode: "Create" | "Edit"
}

export default function FormPageHeader({ backLabel, backTo, title, subtitle, mode }: FormPageHeaderProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <span className="text-sm text-text-muted">{mode}</span>
      </div>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
    </div>
  )
}

export type { FormPageHeaderProps }

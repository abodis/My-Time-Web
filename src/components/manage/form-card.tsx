interface FormCardProps {
  children: React.ReactNode
}

export function FormCard({ children }: FormCardProps) {
  return <div className="rounded-2xl bg-white shadow-lg p-6">{children}</div>
}

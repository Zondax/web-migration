interface EmptyStateRowProps {
  label: string
  icon: React.ReactNode
}

export default function EmptyStateRow({ label, icon }: EmptyStateRowProps) {
  return (
    <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 mb-4 flex items-center justify-center min-h-[80px]">
      <div className="flex flex-col items-center justify-center w-full gap-2 py-8">
        {icon}
        <span className="text-gray-500 text-base font-medium text-center">{label}</span>
      </div>
    </div>
  )
}

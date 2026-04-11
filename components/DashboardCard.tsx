'use client'

import Link from 'next/link'

interface Props {
  id: string
  title: string
  subtitle: string
  icon: string
  isNew?: boolean
}

export default function DashboardCard({ id, title, subtitle, icon, isNew }: Props) {
  return (
    <Link
      href={`/editor/${id}`}
      className={`
        group block rounded-2xl p-6 transition-all duration-200 cursor-pointer
        ${isNew
          ? 'border-2 border-dashed border-indigo-300 bg-white hover:border-indigo-500 hover:bg-indigo-50'
          : 'bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5'}
      `}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl leading-none mt-1">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg leading-snug ${isNew ? 'text-indigo-600' : 'text-gray-900'} group-hover:text-indigo-700 transition-colors`}>
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <span className="text-gray-300 group-hover:text-indigo-400 transition-colors text-xl mt-1">
          →
        </span>
      </div>
      {isNew && (
        <p className="text-xs text-indigo-400 mt-3">
          खाली दस्तावेज़ बनाएं · Create blank document
        </p>
      )}
    </Link>
  )
}

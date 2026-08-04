import { Card } from './Card'

export function StatTile({
  label,
  value,
  sublabel,
  dotClass,
}: {
  label: string
  value: string
  sublabel: string
  dotClass: string
}) {
  return (
    <Card className="p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</p>
      </div>
      <h3 className="text-2xl font-headline font-bold text-on-surface leading-none">{value}</h3>
      <p className="text-xs text-on-surface-variant">{sublabel}</p>
    </Card>
  )
}

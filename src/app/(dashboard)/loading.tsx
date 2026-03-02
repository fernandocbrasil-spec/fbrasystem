export default function DashboardLoading() {
    return (
        <div className="animate-pulse space-y-6">
            {/* Page header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-5 w-48 rounded bg-pf-grey/15" />
                    <div className="h-3 w-72 rounded bg-pf-grey/10" />
                </div>
                <div className="h-8 w-28 rounded-md bg-pf-grey/15" />
            </div>

            {/* KPI strip skeleton */}
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2 py-3">
                        <div className="h-3 w-20 rounded bg-pf-grey/10" />
                        <div className="h-7 w-24 rounded bg-pf-grey/15" />
                    </div>
                ))}
            </div>

            {/* Toolbar skeleton */}
            <div className="flex items-center gap-3">
                <div className="h-8 w-64 rounded-md bg-pf-grey/10" />
                <div className="h-8 w-24 rounded-md bg-pf-grey/10" />
            </div>

            {/* Table skeleton */}
            <div className="space-y-0">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 border-b border-pf-grey/10 py-3"
                    >
                        <div className="h-3 w-32 rounded bg-pf-grey/10" />
                        <div className="h-3 w-24 rounded bg-pf-grey/10" />
                        <div className="h-3 w-20 rounded bg-pf-grey/10" />
                        <div className="ml-auto h-3 w-16 rounded bg-pf-grey/10" />
                    </div>
                ))}
            </div>
        </div>
    );
}

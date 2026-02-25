export default function SoftBackdrop() {
    return (
        <div className="fixed inset-0 -z-1 pointer-events-none">
            <div className="absolute -left-[15%] top-1/2 -translate-y-1/2 w-[600px] h-[800px] bg-cyan-500/10 rounded-full blur-[130px]" />
            <div className="absolute -right-[5%] bottom-[5%] w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>
    )
}

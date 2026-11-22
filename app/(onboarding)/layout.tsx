export default function LayoutOnboarding({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col overflow-hidden bg-fondo">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 size-[40rem] rounded-full bg-esmeralda/25 blur-[140px]" />
        <div className="absolute -bottom-48 -right-24 size-[34rem] rounded-full bg-esmeralda/15 blur-[140px]" />
      </div>
      {children}
    </div>
  );
}

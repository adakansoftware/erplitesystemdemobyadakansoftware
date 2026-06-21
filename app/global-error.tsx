'use client'

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-lg font-semibold">Kritik hata</h1>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Yenile
          </button>
        </div>
      </body>
    </html>
  )
}

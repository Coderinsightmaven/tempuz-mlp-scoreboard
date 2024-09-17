import MLPScoreboard from '@/components/MLPScoreboard'

export const runtime = "edge"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <MLPScoreboard />
    </main>
  )
}
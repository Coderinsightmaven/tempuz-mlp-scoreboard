import MLPScoreboard from '@/components/MLPScoreboard';

export default function Home() {
  return (
    <main className="flex items-start justify-start p-0 overflow-hidden" style={{ width: '384px', height: '256px' }}>
      <div
        className="origin-top-left"
        style={{
          transform: 'scale(0.133)', // Scale down the component proportionally to fit within 256x385
          transformOrigin: 'top left',
          width: '100%',
          height: '100%',
        }}
      >
        <MLPScoreboard />
      </div>
    </main>
  );
}

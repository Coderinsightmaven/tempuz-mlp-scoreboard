"use client"

import MLPScoreboard from '@/components/MLPScoreboard';
import ResolutionInput from '@/components/ResolutionInput';
import { useState } from 'react';

export default function Home() {
  const [resolution, setResolution] = useState({ width: 1920, height: 1080 });

  const handleResolutionChange = (width: number, height: number) => {
    setResolution({ width, height });
  };

  return (
    <div>
      {/* Your existing app content */}
      <div style={{ width: resolution.width, height: resolution.height }}>
        <MLPScoreboard width={resolution.width} height={resolution.height} />
      </div>
      
      <ResolutionInput onResolutionChange={handleResolutionChange} />
    </div>
  );
}
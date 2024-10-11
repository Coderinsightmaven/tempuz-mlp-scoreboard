"use client";

import MLPScoreboard from "@/components/MLPScoreboard";
import ResolutionInput from "@/components/ResolutionInput";
import EventIdInput from "@/components/EventIdInput";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const [resolution, setResolution] = useState({ width: 384, height: 256 });
  const [eventId, setEventId] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Load eventId from localStorage on component mount
    const storedEventId = localStorage.getItem("eventId");
    if (storedEventId) {
      setEventId(storedEventId);
    } else {
      // Set default value if nothing is stored
      setEventId("2024 MLP7");
    }
  }, []);

  const handleResolutionChange = (width: number, height: number) => {
    setResolution({ width, height });
    toast({
      title: "Resolution Updated",
      description: `New resolution set to ${width}x${height}`,
    });
  };

  const handleEventIdChange = (newEventId: string) => {
    setEventId(newEventId);
    // Save to localStorage whenever it changes
    localStorage.setItem("eventId", newEventId);
    toast({
      title: "Event ID Updated",
      description: `New Event ID set to ${newEventId}`,
    });
  };

  return (
    <div>
      <div style={{ width: resolution.width, height: resolution.height }}>
        <MLPScoreboard
          width={resolution.width}
          height={resolution.height}
          eventId={eventId}
          courtId="Grandstand"
        />
      </div>
      <div className="fixed bottom-4 left-4 space-y-4">
        <EventIdInput onEventIdChange={handleEventIdChange} initialEventId={eventId} />
        <ResolutionInput onResolutionChange={handleResolutionChange} />
      </div>
      <Toaster />
    </div>
  );
}

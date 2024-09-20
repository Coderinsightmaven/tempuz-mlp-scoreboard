import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import Image, { StaticImageData } from "next/image";
import MLPLogo from "@/logos/mlp.svg";

// Import team logos
import BA from "@/logos/challenger/ba.png";
import CHS from "@/logos/challenger/chs.png";
import FLS from "@/logos/challenger/flsmash.png";
import FP from "@/logos/challenger/fp.png";
import LV from "@/logos/challenger/lvno.png";
import MPC from "@/logos/challenger/mpc.png";
import CPC from "@/logos/premier/cpc.png";
import NJ5S from "@/logos/premier/nj5s.png";
import NYH from "@/logos/premier/nyh.png";
import DCPT from "@/logos/premier/dcpt.png";
import UTBD from "@/logos/premier/utbd.png";
import CS from "@/logos/premier/cs.png";
import DFP from "@/logos/premier/dfp.png";
import ORS from "@/logos/premier/ors.png";
import AZD from "@/logos/premier/azd.png";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FB_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Team logo mapping
const teamLogos: { [key: string]: StaticImageData } = {
  "Brooklyn Aces": BA,
  "Chicago Slice": CHS,
  "Florida Smash": FLS,
  "Las Vegas Night Owls": LV,
  "Miami Pickleball Club": MPC,
  "Frisco Pandas": FP,
  "Carolina Pickleball Club": CPC,
  "New Jersey 5s": NJ5S,
  "NY Hustlers": NYH,
  "D.C. Pickleball Team": DCPT,
  "Utah Black Diamonds": UTBD,
  "Columbus Sliders": CS,
  "Dallas Flash Pickleball": DFP,
  "Orlando Squeeze": ORS,
  "AZ Drive": AZD,
};

// Game type display names mapping
const gameTypeDisplayNames: { [key: string]: string } = {
  WD: "Women's Doubles",
  MD: "Men's Doubles",
  MX1: "Mixed Doubles 1",
  MX2: "Mixed Doubles 2",
  DB: "Dream Breaker",
};

// Interfaces
interface GameData {
  team1Score: number;
  team2Score: number;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
  winner: number | string;
}

interface DBGameData {
  team1Score: number;
  team2Score: number;
  winner: string;
}

interface MatchData {
  WD: GameData;
  MD: GameData;
  MX1: GameData;
  MX2: GameData;
  DB: DBGameData;
  team1: string;
  team2: string;
  team1Score: number;
  team2Score: number;
  team1Logo: string;
  team2Logo: string;
  eventID: string;
  court: string;
  divisionID: string;
  roundID: string;
  status: string;
  live: boolean;
}

type GameType = 'WD' | 'MD' | 'MX1' | 'MX2' | 'DB';

// Default data
const defaultGameData: GameData = {
  team1Score: 0,
  team2Score: 0,
  team1Player1: "",
  team1Player2: "",
  team2Player1: "",
  team2Player2: "",
  winner: "-"
};

const defaultDBGameData: DBGameData = {
  team1Score: 0,
  team2Score: 0,
  winner: "-"
};

const defaultMatchData: MatchData = {
  WD: { ...defaultGameData },
  MD: { ...defaultGameData },
  MX1: { ...defaultGameData },
  MX2: { ...defaultGameData },
  DB: { ...defaultDBGameData },
  team1: "",
  team2: "",
  team1Score: 0,
  team2Score: 0,
  team1Logo: "",
  team2Logo: "",
  eventID: "",
  court: "",
  divisionID: "",
  roundID: "",
  status: "",
  live: false,
};

// MLPScoreboard component props
interface MLPScoreboardProps {
  width: number;
  height: number;
  eventId: string;
  courtId: string;
}

export default function MLPScoreboard({ width, height, eventId, courtId }: MLPScoreboardProps) {
  const [matchData, setMatchData] = useState<MatchData>(defaultMatchData);
  const [currentGame, setCurrentGame] = useState<GameType>('WD');
  const [isLoading, setIsLoading] = useState(true);

  // Calculate scale based on provided dimensions
  const baseWidth = 384;
  const baseHeight = 256;
  const scaleX = width / baseWidth;
  const scaleY = height / baseHeight;
  const scale = Math.min(scaleX, scaleY);

  // Styles
  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: "#111827",
    color: "white",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: `${4 * scale}px`,
    fontSize: `${12 * scale}px`,
  };

  const logoSize = 80 * scale;
  const mlpLogoSize = 50 * scale;

  // Helper functions
  const getCurrentGameData = (): GameData | DBGameData => {
    return matchData[currentGame] || (currentGame === 'DB' ? defaultDBGameData : defaultGameData);
  };

  const getTeamLogo = (teamName: string): StaticImageData => {
    return teamLogos[teamName] || MLPLogo;
  };

  const getGameTypeDisplayName = (gameType: GameType): string => {
    return gameTypeDisplayNames[gameType] || gameType;
  };

  const determineCurrentGame = (data: MatchData): GameType => {
    const games: GameType[] = ['WD', 'MD', 'MX1', 'MX2', 'DB'];
    for (const game of games) {
      if (game === 'DB') {
        if (data.DB.team1Score > 0 || data.DB.team2Score > 0) {
          return 'DB';
        }
        return games[games.indexOf(game) - 1];
      }
      if (data[game].team1Score === 0 && data[game].team2Score === 0) {
        return games[games.indexOf(game) - 1];
      }
    }
    return 'WD'; // Default to WD if all games have scores
  };

  // Set up Firebase listeners
  useEffect(() => {
    const monitorLiveMatches = (collectionName: string) => {
      const q = query(
        collection(db, collectionName),
        where("eventID", "==", eventId),
        where("court", "==", courtId),
        where("live", "==", true)
      );

      return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            console.log(`${change.type === "added" ? "New" : "Modified"} live match in ${collectionName}:`, change.doc.data());
            const newMatchData = change.doc.data() as MatchData;
            setMatchData(newMatchData);
            setCurrentGame(determineCurrentGame(newMatchData));
            setIsLoading(false);
          }
          if (change.type === "removed") {
            console.log(`Removed live match in ${collectionName}:`, change.doc.data());
            // Handle removed documents if necessary
          }
        });
      }, (error) => {
        console.error(`Error in ${collectionName} listener:`, error);
        setIsLoading(false);
      });
    };

    const unsubscribeMlpMatches = monitorLiveMatches('mlpmatches');
    const unsubscribeMlpLiveMatches = monitorLiveMatches('mlpLiveMatches');

    console.log(`Started monitoring live matches for event ${eventId} on court ${courtId}`);

    return () => {
      unsubscribeMlpMatches();
      unsubscribeMlpLiveMatches();
    };
  }, [eventId, courtId]);

  // Loading state
  if (isLoading) {
    return (
      <div style={containerStyle} className="flex items-center justify-center">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      </div>
    );
  }

  // Render component
  return (
    <div style={containerStyle}>
      <div className="flex justify-between items-center w-full">
        <div className="flex-1 flex justify-center">
          <div style={{ fontSize: `${36 * scale}px` }} className="font-bold text-mlp">
            {getCurrentGameData().team1Score}
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <Image
            src={MLPLogo}
            alt="MLP Logo"
            width={mlpLogoSize * 1.5}
            height={mlpLogoSize * 1.5}
            className="object-contain"
          />
        </div>
        <div className="flex-1 flex justify-center">
          <div style={{ fontSize: `${36 * scale}px` }} className="font-bold text-mlp">
            {getCurrentGameData().team2Score}
          </div>
        </div>
      </div>

      <div className="text-center" style={{ fontSize: `${14 * scale}px` }}>
        <div>{getGameTypeDisplayName(currentGame)}</div>
        <div style={{ fontSize: `${12 * scale}px` }} className="text-gray-400">Team Score</div>
      </div>

      <div className="flex justify-center items-center w-full">
        <div className="flex items-center space-x-4">
          <Image
            src={getTeamLogo(matchData.team1)}
            alt={`${matchData.team1} Logo`}
            width={logoSize}
            height={logoSize}
            className="object-contain"
          />
          <span style={{ fontSize: `${24 * scale}px` }} className="font-semibold text-mlp">
            {matchData.team1Score}
          </span>
          <div style={{ fontSize: `${24 * scale}px` }} className="font-semibold">-</div>
          <span style={{ fontSize: `${24 * scale}px` }} className="font-semibold text-mlp">
            {matchData.team2Score}
          </span>
          <Image
            src={getTeamLogo(matchData.team2)}
            alt={`${matchData.team2} Logo`}
            width={logoSize}
            height={logoSize}
            className="object-contain"
          />
        </div>
      </div>

      <div className="flex justify-between w-full" style={{ fontSize: `${11 * scale}px` }}>
  <div className="w-1/2 text-center overflow-hidden whitespace-nowrap text-ellipsis">
    {currentGame !== "DB" && 'team1Player1' in getCurrentGameData()
      ? `${(getCurrentGameData() as GameData).team1Player1} / ${(getCurrentGameData() as GameData).team1Player2}`
      : ""
    }
    <div className="text-blue-500">{matchData.team1}</div>
  </div>
  <div className="w-1/2 text-center overflow-hidden whitespace-nowrap text-ellipsis">
    {currentGame !== "DB" && 'team2Player1' in getCurrentGameData()
      ? `${(getCurrentGameData() as GameData).team2Player1} / ${(getCurrentGameData() as GameData).team2Player2}`
      : ""
    }
    <div className="text-blue-500">{matchData.team2}</div>
  </div>
</div>
    </div>
  );
}
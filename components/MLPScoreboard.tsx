"use client";
import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import Image, { StaticImageData } from "next/image";
import MLPLogo from "@/logos/mlp.svg";

// Challenger Series Logos
import BA from "@/logos/challenger/ba.png";
import CHS from "@/logos/challenger/chs.png";
import FLS from "@/logos/challenger/flsmash.png";
import FP from "@/logos/challenger/fp.png";
import LV from "@/logos/challenger/lvno.png";
import MPC from "@/logos/challenger/mpc.png";
// Premier League logos
import CPC from "@/logos/premier/cpc.png";
import NJ5S from "@/logos/premier/nj5s.png";
import NYH from "@/logos/premier/nyh.png";
import DCPT from "@/logos/premier/dcpt.png";
import UTBD from "@/logos/premier/utbd.png";
import CS from "@/logos/premier/cs.png";
import DFP from "@/logos/premier/dfp.png";
import ORS from "@/logos/premier/ors.png";
import AZD from "@/logos/premier/azd.png";

// Firebase config
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
  "Columbus P.C.": CS,
  "Dallas Flash Pickleball": DFP,
  "Orlando Squeeze": ORS,
  "AZ Drive": AZD,
};

// Game type display names mapping
const gameTypeDisplayNames: { [key: string]: string } = {
  WD: "Women's Doubles",
  MD: "Men's Doubles",
  MX1: "Mixed Doubles",
  MX2: "Mixed Doubles",
  DB: "Dream Breaker",
};

interface BaseGameData {
  team1Score: number;
  team2Score: number;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
}

interface GameData extends BaseGameData {
  winner: number | string;
}

interface DreamBreakerData extends BaseGameData {
  winner: string;
}

interface MatchData {
  WD: GameData;
  MD: GameData;
  MX1: GameData;
  MX2: GameData;
  DB: DreamBreakerData;
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

const defaultGameData: GameData = {
  team1Player1: "",
  team1Player2: "",
  team2Player1: "",
  team2Player2: "",
  team1Score: 0,
  team2Score: 0,
  winner: "-",
};

const defaultDreamBreakerData: DreamBreakerData = {
  team1Score: 0,
  team2Score: 0,
  winner: "-",
  team1Player1: "",
  team1Player2: "",
  team2Player1: "",
  team2Player2: "",
};

const defaultMatchData: MatchData = {
  WD: { ...defaultGameData },
  MD: { ...defaultGameData },
  MX1: { ...defaultGameData },
  MX2: { ...defaultGameData },
  DB: { ...defaultDreamBreakerData },
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

export default function MLPScoreboard() {
  const [matchData, setMatchData] = useState<MatchData>(defaultMatchData);
  const [currentGame] = useState<"WD" | "MD" | "MX1" | "MX2" | "DB">("WD");
  const [animateScore1, setAnimateScore1] = useState(false);
  const [animateScore2, setAnimateScore2] = useState(false);
  const [prevScore1, setPrevScore1] = useState(0);
  const [prevScore2, setPrevScore2] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const updateMatchData = useCallback(
    (data: MatchData) => {
      setMatchData((prevData) => {
        const currentGameData = data[currentGame] as BaseGameData;
        const prevGameData = prevData[currentGame] as BaseGameData;

        if (currentGameData.team1Score !== prevGameData.team1Score) {
          setAnimateScore1(true);
          setPrevScore1(prevGameData.team1Score);
          setTimeout(() => setAnimateScore1(false), 1000);
        }

        if (currentGameData.team2Score !== prevGameData.team2Score) {
          setAnimateScore2(true);
          setPrevScore2(prevGameData.team2Score);
          setTimeout(() => setAnimateScore2(false), 1000);
        }

        return data;
      });
    },
    [currentGame]
  );

  useEffect(() => {
    const eventId = "2024 MLP6";
    const court = "Grandstand";
    const collectionName = "mlpmatches";

    const q = query(
      collection(db, collectionName),
      where("eventID", "==", eventId),
      where("court", "==", court)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0]; 
          const data = doc.data() as MatchData;
          updateMatchData(data);
          setIsLoading(false);
        } else {
          console.log("No matches found");
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error in Firestore listener:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [updateMatchData]);

  const getCurrentGameData = (): BaseGameData => {
    const data = matchData[currentGame];
    return data || (currentGame === "DB" ? defaultDreamBreakerData : defaultGameData);
  };

  const getTeamLogo = (teamName: string): StaticImageData => {
    return teamLogos[teamName] || MLPLogo;
  };

  const getGameTypeDisplayName = (gameType: "WD" | "MD" | "MX1" | "MX2" | "DB") => {
    return gameTypeDisplayNames[gameType] || gameType;
  };

  const renderPlayerNames = () => {
    if (currentGame === "DB") {
      return <div className="text-xl font-bold text-center">-</div>;
    }
    const gameData = getCurrentGameData();
    return (
      <>
        <div className="w-1/2 flex flex-col items-center px-2">
          <h1 className="text-xl font-bold text-center">{`${gameData.team1Player1} / ${gameData.team1Player2}`}</h1>
        </div>
        <div className="w-1/2 flex flex-col items-center px-2">
          <h1 className="text-xl font-bold text-center">{`${gameData.team2Player1} / ${gameData.team2Player2}`}</h1>
        </div>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-white bg-gray-900 p-2">
      <div className="flex justify-between items-center w-full">
        <div className={`text-5xl font-bold w-1/3 text-right text-mlp pr-2 transition-all duration-1000 ease-in-out ${animateScore1 ? "transform scale-110" : ""}`}>
          {animateScore1 ? prevScore1 : getCurrentGameData().team1Score}
        </div>
        <div className="w-1/3 flex justify-center">
          <Image src={MLPLogo} alt="MLP Logo" width={50} height={40} className="object-contain" />
        </div>
        <div className={`text-5xl font-bold w-1/3 text-left pl-2 text-mlp transition-all duration-1000 ease-in-out ${animateScore2 ? "transform scale-110" : ""}`}>
          {animateScore2 ? prevScore2 : getCurrentGameData().team2Score}
        </div>
      </div>
      
      <div className="text-sm mb-1">{getGameTypeDisplayName(currentGame)}</div>
      
      <div className="flex justify-center items-center w-full mb-1">
        <div className="flex items-center justify-end w-1/3">
          <Image src={getTeamLogo(matchData.team1)} alt={`${matchData.team1} Logo`} width={40} height={20} className="object-contain mr-1" />
        </div>
        <div className="flex items-center justify-center w-1/3">
          <span className="text-xl font-semibold text-mlp mr-1">{matchData.team1Score}</span>
          <div className="text-xl font-semibold mx-1">-</div>
          <span className="text-xl font-semibold text-mlp ml-1">{matchData.team2Score}</span>
        </div>
        <div className="flex items-center justify-start w-1/3">
          <Image src={getTeamLogo(matchData.team2)} alt={`${matchData.team2} Logo`} width={40} height={20} className="object-contain ml-1" />
        </div>
      </div>

      <div className="flex justify-between w-full text-xs">
        <div className="w-1/2 flex flex-col items-center px-1">
          <h1 className="font-bold text-center truncate w-full">{`${getCurrentGameData().team1Player1} / ${getCurrentGameData().team1Player2}`}</h1>
          <h2 className="text-blue-500 text-center truncate w-full">{matchData.team1}</h2>
        </div>
        <div className="w-1/2 flex flex-col items-center px-1">
          <h1 className="font-bold text-center truncate w-full">{`${getCurrentGameData().team2Player1} / ${getCurrentGameData().team2Player2}`}</h1>
          <h2 className="text-blue-500 text-center truncate w-full">{matchData.team2}</h2>
        </div>
      </div>
    </div>
  );
}

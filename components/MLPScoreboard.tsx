"use client"
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';
import Image from "next/image";
import MLP from "@/logos/mlp.svg";

// Import all team logos
import CPC from "@/logos/premier/cpc.png";
import NJ5S from "@/logos/premier/nj5s.png";
import FP from "@/logos/challenger/fp.png";
import LV from "@/logos/challenger/lvno.png";
import CS from "@/logos/challenger/cs.png";
// ... import other team logos as needed

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
const teamLogos: { [key: string]: any } = {
  "Carolina Pickleball Club": CPC,
  "New York Hustlers": NJ5S,
  "Frisco Pandas": FP,
  "Las Vegas Night Owls": LV,
  "Chicago Slice": CS,
  // Add more teams and their corresponding imported logos here
};

// Game type display names mapping
const gameTypeDisplayNames: { [key: string]: string } = {
  'WD': "Women's Doubles",
  'MD': "Men's Doubles",
  'MX1': "Mixed Doubles",
  'MX2': "Mixed Doubles",
  'DB': "Dream Breaker"
};

interface GameData {
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
  team1Score: number;
  team2Score: number;
  winner: number | string;
}

interface DreamBreakerData {
  team1Score: number;
  team2Score: number;
  winner: string;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
}

interface HistoryEntry {
  action: string;
  type: string;
  t1: string;
  t2: string;
  t1p1: string;
  t1p2: string;
  t2p1: string;
  t2p2: string;
  t1score: number;
  t2score: number;
  date: string;
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
  history?: HistoryEntry[];
}

const defaultGameData: GameData = {
  team1Player1: '', team1Player2: '', team2Player1: '', team2Player2: '',
  team1Score: 0, team2Score: 0, winner: '-'
};

const defaultDreamBreakerData: DreamBreakerData = {
  team1Score: 0, team2Score: 0, winner: '-', team1Player1: '', team1Player2: '', team2Player1: '', team2Player2: ''
};

const defaultMatchData: MatchData = {
  WD: { ...defaultGameData },
  MD: { ...defaultGameData },
  MX1: { ...defaultGameData },
  MX2: { ...defaultGameData },
  DB: { ...defaultDreamBreakerData },
  team1: '', team2: '', team1Score: 0, team2Score: 0, team1Logo: '', team2Logo: '',
  eventID: '', court: '', divisionID: '', roundID: '', status: '', live: false,
};

const gameOrder: ('WD' | 'MD' | 'MX1' | 'MX2' | 'DB')[] = ['WD', 'MD', 'MX1', 'MX2', 'DB'];

export default function MLPScoreboard() {
  const [matchData, setMatchData] = useState<MatchData>(defaultMatchData);
  const [currentGame, setCurrentGame] = useState<'WD' | 'MD' | 'MX1' | 'MX2' | 'DB'>('WD');
  const [animateScore1, setAnimateScore1] = useState(false);
  const [animateScore2, setAnimateScore2] = useState(false);
  const [prevScore1, setPrevScore1] = useState(0);
  const [prevScore2, setPrevScore2] = useState(0);
  const [resetTimer, setResetTimer] = useState<number | null>(null);

  useEffect(() => {
    const eventId = "2024 MLP6";
    const court = "Grandstand";
    const collectionName = 'mlpmatches';

    const q = query(
      collection(db, collectionName),
      where("eventID", "==", eventId),
      where("court", "==", court)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data() as DocumentData;
          updateMatchData(data as MatchData);
        }
      });
    }, (error) => {
      console.error("Error in Firestore listener:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (resetTimer !== null) {
      intervalId = setInterval(() => {
        setResetTimer((prevTimer) => {
          if (prevTimer === null) return null;
          if (prevTimer <= 1000) {
            clearInterval(intervalId);
            resetScoreboard();
            return null;
          }
          return prevTimer - 1000;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [resetTimer]);

  const updateMatchData = (data: MatchData) => {
    setMatchData((prevData) => {
      const currentGameData = data[currentGame];
      const prevGameData = prevData[currentGame];

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

      // Check if a team has reached the winning score
      const team1WinningScore = data.team1Score === 3 && data.team2Score < 3;
      const team2WinningScore = data.team2Score === 3 && data.team1Score < 3;
      const tieBreakScore = data.team1Score === 4 || data.team2Score === 4;

      if ((team1WinningScore || team2WinningScore || tieBreakScore) && resetTimer === null) {
        setResetTimer(180000); // 3 minutes in milliseconds
      }

      return data;
    });
  };

  const getCurrentGameData = () => {
    return matchData[currentGame] || (currentGame === 'DB' ? defaultDreamBreakerData : defaultGameData);
  };

  const getTeamLogo = (teamName: string) => {
    return teamLogos[teamName] || MLP;
  };

  const getGameTypeDisplayName = (gameType: 'WD' | 'MD' | 'MX1' | 'MX2' | 'DB') => {
    return gameTypeDisplayNames[gameType] || gameType;
  };

  const resetScoreboard = () => {
    setMatchData(defaultMatchData);
    setCurrentGame('WD');
    setResetTimer(null);
  };

  const renderPlayerNames = () => {
    if (currentGame === 'DB') {
      return (
        <div className="text-xl font-bold text-center">
          Dream Breaker
        </div>
      );
    }
    return (
      <>
        <div className="w-1/2 flex flex-col items-center px-2">
          <h1 className="text-xl font-bold text-center whitespace-nowrap overflow-hidden overflow-ellipsis w-full">
            {`${getCurrentGameData().team1Player1} / ${getCurrentGameData().team1Player2}`}
          </h1>
        </div>
        <div className="w-1/2 flex flex-col items-center px-2">
          <h1 className="text-xl font-bold text-center whitespace-nowrap overflow-hidden overflow-ellipsis w-full">
            {`${getCurrentGameData().team2Player1} / ${getCurrentGameData().team2Player2}`}
          </h1>
        </div>
      </>
    );
  };

  return (
    <Card className="w-full max-w-4xl text-white bg-gray-900 p-6">
      <CardContent className="flex flex-col items-center">
        {/* Current Game Score */}
        <div className="flex justify-between items-center w-full mb-6">
          <div className={`text-9xl font-bold w-1/3 text-right text-mlp pr-4 transition-all duration-1000 ease-in-out ${animateScore1 ? 'transform scale-125' : ''}`}>
            {animateScore1 ? prevScore1 : getCurrentGameData().team1Score}
          </div>
          <div className="w-1/3 flex justify-center">
            <Image
              src={MLP}
              alt="MLP Logo"
              width={100}
              height={80}
              className="object-contain"
            />
          </div>
          <div className={`text-9xl font-bold w-1/3 text-left text-mlp pl-4 transition-all duration-1000 ease-in-out ${animateScore2 ? 'transform scale-125' : ''}`}>
            {animateScore2 ? prevScore2 : getCurrentGameData().team2Score}
          </div>
        </div>
        <div className="text-2xl text-afw mb-4">{getGameTypeDisplayName(currentGame)}</div>
        <div className="text-xl text-gray-400 mb-6">Team Score</div>
        
        {/* Team Logos and Overall Match Score */}
        <div className="flex justify-center items-center w-full mb-6">
          <div className="flex items-center justify-end w-1/3">
            <Image
              src={getTeamLogo(matchData.team1)}
              alt={`${matchData.team1} Logo`}
              width={100}
              height={50}
              className="object-contain ml-2"
            />
          </div>
          <div className="flex items-center justify-center w-1/3">
            <span className="text-4xl font-semibold text-gray-400 mr-2">
              {matchData.team1Score}
            </span>
            <div className="text-4xl font-semibold mx-4 text-afw">-</div>
            <span className="text-4xl font-semibold text-gray-400 ml-2">
              {matchData.team2Score}
            </span>
          </div>
          <div className="flex items-center justify-start w-1/3">
            <Image
              src={getTeamLogo(matchData.team2)}
              alt={`${matchData.team2} Logo`}
              width={100}
              height={50}
              className="object-contain mr-2"
            />
          </div>
        </div>
        
        <div className="flex justify-between w-full">
          {renderPlayerNames()}
        </div>
        
        <div className="flex justify-between w-full mt-2">
          <div className="w-1/2 flex flex-col items-center px-2">
            <h1 className="text-lg font-semibold text-blue-500 text-center whitespace-nowrap overflow-hidden overflow-ellipsis w-full">
              {matchData.team1}
            </h1>
          </div>
          <div className="w-1/2 flex flex-col items-center px-2">
            <h1 className="text-lg font-semibold text-blue-500 text-center whitespace-nowrap overflow-hidden overflow-ellipsis w-full">
              {matchData.team2}
            </h1>
          </div>
        </div>
        
        {resetTimer !== null && (
          <div className="mt-4 text-xl text-yellow-400">
            Resetting in {Math.ceil(resetTimer / 1000)} seconds
          </div>
        )}
      </CardContent>
    </Card>
  );
}
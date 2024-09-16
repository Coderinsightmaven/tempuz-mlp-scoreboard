"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import MLP from "@/images/mlp.svg";
import Team1 from "@/images/cpc.png";
import Team2 from "@/images/nyhustlers.png";
import Image from "next/image";

export default function MLPScoreboard() {
  const [matchScore, setMatchScore] = useState({ team1: 12, team2: 12 });
  const [teamScores, setTeamScores] = useState({ team1: 0, team2: 0 });
  const [gamePoint, setGamePoint] = useState(false);

  useEffect(() => {
    // Simulating WebSocket connection
    const ws = {
      onmessage: (event) => {
        const data = JSON.parse(event.data);
        setMatchScore(data.matchScore);
        setTeamScores(data.teamScores);
        setGamePoint(data.gamePoint);
      },
    };
    // Cleanup function
    return () => {
      // Close WebSocket connection if needed
    };
  }, []);

  const isGamePoint = (team1Score, team2Score) => {
    return (
      (team1Score >= 24 || team2Score >= 24) &&
      Math.abs(team1Score - team2Score) >= 1
    );
  };

  return (
    <Card className="w-full max-w-4xl text-white bg-gray-900 p-6">
      <CardContent className="flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-6">
          <div className="text-9xl font-bold w-1/3 text-right text-mlp pr-4">
            {matchScore.team1}
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
          <div className="text-9xl font-bold w-1/3 text-left text-mlp pl-4">
            {matchScore.team2}
          </div>
        </div>
        <div className="flex justify-center items-center w-full mb-6">
          <div className="flex items-center justify-end w-1/3">
            <Image
              src={Team1}
              alt="Team 1 Logo"
              width={100}
              height={50}
              className="object-contain ml-2"
            />
          </div>
          <div className="flex items-center justify-center w-1/3">
            <span className="text-4xl font-semibold text-gray-400 mr-2">
              {teamScores.team1}
            </span>
            <div className="text-4xl font-semibold mx-4">-</div>
            <span className="text-4xl font-semibold text-gray-400 ml-2">
              {teamScores.team2}
            </span>
          </div>
          <div className="flex items-center justify-start w-1/3">
            <Image
              src={Team2}
              alt="Team 2 Logo"
              width={100}
              height={50}
              className="object-contain mr-2"
            />
          </div>
        </div>
        {isGamePoint(matchScore.team1, matchScore.team2) && (
          <div className="mt-4 flex items-center justify-center text-yellow-400 text-2xl">
            <AlertCircle className="mr-2 w-8 h-8" />
            <span className="font-semibold">Game Point</span>
          </div>
        )}
        <div className="flex justify-between w-full">
          <div className="w-1/2 flex flex-col items-center">
            <h1 className="text-2xl p-5 font-bold text-center">Ben Johns / Collin Johns</h1>
            <h1 className="text-2xl p-5 font-semibold text-blue-500 text-center">Carolina Pickleball Club</h1>
          </div>
          <div className="w-1/2 flex flex-col items-center">
            <h1 className="text-2xl p-5 font-bold text-center">Carson Klinger / Jack Sock</h1>
            <h1 className="text-2xl p-5 font-semibold text-blue-500 text-center">New York Hustlers</h1>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
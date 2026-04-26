"use client";

import { useState, useEffect } from 'react';

/**
 * Interface för att definiera strukturen på vårt träd
 * Detta hjälper TypeScript att veta exakt vad ett 'Tree' objekt innehåller.
 */
interface Tree {
  name: string;
  baseXp: number;
  speed: number; // Hur mycket progress % per tick
}

export default function WoodcuttingPage() {
  // State-hantering
  // Starta alltid med 0 (server och klient är överens)
  const [xp, setXp] = useState<number>(0);
  const [logs, setLogs] = useState<number>(0);
  const [isChopping, setIsChopping] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Efter att sidan laddats — hämta sparade värden
useEffect(() => {
  setXp(Number(localStorage.getItem('wc_xp')) || 0);
  setLogs(Number(localStorage.getItem('wc_logs')) || 0);
}, []); // [] betyder: kör bara en gång vid uppstart

useEffect(() => {
  localStorage.setItem('wc_xp', String(xp));
}, [xp]);

useEffect(() => {
  localStorage.setItem('wc_logs', String(logs));
}, [logs]);


  // Definition av trädet vi hugger
  const currentTree: Tree = {
    name: "Tree",
    baseXp: 25,
    speed: 2 // Ju högre siffra, desto snabbare fylls mätaren
  };

  // Beräkna nivå baserat på XP (logik hämtad från din tidigare input om RPG-mekanik)
  const level = Math.floor(xp / 100) + 1;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isChopping) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Logik när mätaren är full
            setXp((currentXp) => currentXp + currentTree.baseXp);
            setLogs((currentLogs) => currentLogs + 1);
            return 0; 
          }
          return prev + currentTree.speed;
        });
      }, 50);
    }

    // Cleanup-funktion för att undvika minnesläckor
    return () => clearInterval(interval);
  }, [isChopping, currentTree]);

  return (
    <div style={{ padding: '2rem', maxWidth: '400px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Woodcutting</h1>
        <p>Status: Level {level} | Total XP: {xp}</p>
        <p>Inventory: {logs} Logs</p>
      </header>

      <section style={{ border: '2px solid #333', padding: '1.5rem', borderRadius: '12px' }}>
        <h2>{currentTree.name}</h2>
        
        {/* Progress Bar UI */}
        <div style={{ 
          width: '100%', 
          height: '24px', 
          backgroundColor: '#e0e0e0', 
          borderRadius: '12px', 
          margin: '1rem 0',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${progress}%`, 
            height: '100%', 
            backgroundColor: '#2e7d32',
            transition: 'width 0.05s linear'
          }} />
        </div>

        <button 
          onClick={() => setIsChopping(!isChopping)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isChopping ? '#d32f2f' : '#2e7d32',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {isChopping ? 'Stop' : 'Start'}
        </button>
      </section>
    </div>
  );
}
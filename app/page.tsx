"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const champion = "fiora";
  const initialZoom = 4;
  const zoomStep = 0.3;
  const minZoom = 1;

  const [zoom, setZoom] = useState(initialZoom);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [guess, setGuess] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);

  useEffect(() => {
    // Random position avoiding center (either 10-35% or 65-90%)
    const randomEdge = () => {
      return Math.random() < 0.5
        ? Math.random() * 25 + 10  // 10-35%
        : Math.random() * 25 + 65; // 65-90%
    };
    setPosition({
      x: randomEdge(),
      y: randomEdge(),
    });
    // Enable transitions after initial render
    requestAnimationFrame(() => {
      setIsReady(true);
    });
  }, []);

  const handleGuess = () => {
    if (!guess.trim()) return;

    if (guess.trim().toLowerCase() === champion.toLowerCase()) {
      alert("Correct! You guessed it!");
    } else {
      setZoom((prev) => Math.max(prev - zoomStep, minZoom));
      setWrongGuesses((prev) => [guess.trim(), ...prev]);
    }
    setGuess("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGuess();
    }
  };

  return (
    <div className="page_container">
      <h1>Guess the Splash</h1>
      <div className="game_container">
        <div className="image_wrapper">
          <img
            className="image"
            src={
              "https://raw.communitydragon.org/" +
              "16.1" +
              "/plugins/rcp-be-lol-game-data/global/default/assets/characters/" +
              "fiora" +
              "/skins/" +
              "skin69" +
              "/images/" +
              "fiora_splash_centered_69.jpg"
            }
            alt="Champion splash art"
            style={{
              transform: position ? `scale(${zoom})` : "scale(1)",
              transformOrigin: position ? `${position.x}% ${position.y}%` : "50% 50%",
              transition: isReady ? "transform 0.5s ease-out" : "none",
              visibility: position ? "visible" : "hidden",
            }}
          />
        </div>
        <div className="input_container">
          <textarea
            className="text_field"
            id="guess_field"
            placeholder="Enter a champion name here"
            rows={1}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="send_button" onClick={handleGuess}>
            Send
          </button>
        </div>
        {wrongGuesses.length > 0 && (
          <ul className="wrong_guesses_list">
            {wrongGuesses.map((wrongGuess, index) => (
              <li key={index} className="wrong_guess_item">
                {wrongGuess}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
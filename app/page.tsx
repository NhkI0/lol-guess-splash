"use client";

import championsData from "../data/champions.json";

import { useState, useEffect, useRef } from "react";
import { getLastVersion } from "@/scripts/getLastVersion";

const CURRENT_VERSION = await getLastVersion();
const ASSETS_BASE_URL =
  `https://raw.communitydragon.org/${CURRENT_VERSION}/plugins/rcp-be-lol-game-data/global/default/assets/characters/`;

interface Champion {
  id: number;
  name: string;
  aliases: string[];
  skins: Record<string, string>;
}

type GamePhase = "champion" | "skin";

const champions = championsData as unknown as Champion[];

export default function Home() {
  const initialZoom = 4.5;
  const zoomStep = 0.5;
  const minZoom = 1;

  const [phase, setPhase] = useState<GamePhase>("champion");
  const [champion, setChampion] = useState<Champion | null>(null);
  const [skinName, setSkinName] = useState<string>("");
  const [skinPath, setSkinPath] = useState<string | null>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [guess, setGuess] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Pick a random champion
    const randomChampion = champions[Math.floor(Math.random() * champions.length)];
    setChampion(randomChampion);

    // Pick a random skin from that champion
    const skinNames = Object.keys(randomChampion.skins);
    const randomSkinName = skinNames[Math.floor(Math.random() * skinNames.length)];
    setSkinName(randomSkinName);
    setSkinPath(randomChampion.skins[randomSkinName]);

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

  const handleInputChange = (value: string) => {
    const valueLower = value.toLowerCase();
    setGuess(value);
    setSelectedIndex(-1);

    if (phase === "champion") {
      if (value.trim().length > 0) {
        const filtered = champions
          .filter((c) => {
            if (c.name.toLowerCase().startsWith(valueLower)) return true;
            return c.aliases.some((alias) => alias.toLowerCase().startsWith(valueLower));
          })
          .map((c) => c.name)
          .slice(0, 5);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const isValidGuess = () => {
    if (!guess.trim()) return false;
    const guessLower = guess.trim().toLowerCase();

    if (phase === "champion") {
      return champions.some((c) => {
        if (c.name.toLowerCase() === guessLower) return true;
        return c.aliases.some((alias) => alias.toLowerCase() === guessLower);
      });
    } else {
      if (!champion) return false;
      const skinNames = Object.keys(champion.skins);
      return skinNames.some((name) => name.toLowerCase() === guessLower);
    }
  };

  const selectSuggestion = (name: string) => {
    setGuess(name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleGuess = () => {
    if (!guess.trim() || !champion || !isValidGuess()) return;

    const guessLower = guess.trim().toLowerCase();

    if (phase === "champion") {
      const isCorrect =
        guessLower === champion.name.toLowerCase() ||
        champion.aliases.some((alias) => alias.toLowerCase() === guessLower);

      if (isCorrect) {
        // Show win animation then transition to skin phase
        setWinMessage(champion.name);
        setTimeout(() => {
          setWinMessage(null);
          setPhase("skin");
          setWrongGuesses([]);
          setZoom(1); // Show full image
        }, 1500);
      } else {
        setZoom((prev) => Math.max(prev - zoomStep, minZoom));
        setWrongGuesses((prev) => [guess.trim(), ...prev]);
      }
    } else {
      // Skin phase
      const isCorrect = guessLower === skinName.toLowerCase();

      if (isCorrect) {
        setWinMessage(skinName);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setWrongGuesses((prev) => [guess.trim(), ...prev]);
      }
    }

    setGuess("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[selectedIndex]);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && selectedIndex < 0) {
      e.preventDefault();
      handleGuess();
    }
  };

  return (
    <div className="page_container">
      {winMessage && (
        <div className="win_overlay">
          <div className="win_content">
            <span className="win_label">Correct!</span>
            <span className="win_name">{winMessage}</span>
          </div>
        </div>
      )}
      <h1>{phase === "champion" ? "Guess the Champion" : "Guess the Skin"}</h1>
      <div className="game_container">
        <div className="image_wrapper">
          {skinPath && (
            <img
              className="image"
              src={ASSETS_BASE_URL + skinPath}
              alt="Champion splash art"
              style={{
                transform: position ? `scale(${zoom})` : "scale(1)",
                transformOrigin: position ? `${position.x}% ${position.y}%` : "50% 50%",
                transition: isReady ? "transform 0.5s ease-out" : "none",
                visibility: position ? "visible" : "hidden",
              }}
            />
          )}
        </div>
        {phase === "champion" && (
          <div className="input_wrapper">
            <div className="input_container">
              <textarea
                ref={inputRef}
                className="text_field"
                id="guess_field"
                placeholder="Enter a champion name"
                rows={1}
                value={guess}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => guess.trim() && suggestions.length > 0 && setShowSuggestions(true)}
                autoFocus
              />
              <button
                type="button"
                className={`send_button ${!isValidGuess() ? "disabled" : ""}`}
                onClick={handleGuess}
                disabled={!isValidGuess()}
              >
                Send
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="suggestions_list">
                {suggestions.map((name, index) => (
                  <li
                    key={name}
                    className={`suggestion_item ${index === selectedIndex ? "selected" : ""}`}
                    onMouseDown={() => selectSuggestion(name)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {phase === "champion" && wrongGuesses.length > 0 && (
          <ul className="wrong_guesses_list">
            {wrongGuesses.map((wrongGuess, index) => (
              <li key={index} className="wrong_guess_item">
                {wrongGuess}
              </li>
            ))}
          </ul>
        )}
        {phase === "skin" && champion && (
          <div style={{ width: "100%", maxWidth: "600px", marginTop: "24px" }}>
            <h3 style={{
              color: "#ffc524",
              fontSize: "1.1rem",
              marginBottom: "16px",
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontWeight: 600
            }}>
              Available Skins
            </h3>
            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              justifyContent: "center"
            }}>
              {Object.keys(champion.skins).map((name) => {
                const isWrong = wrongGuesses.includes(name);
                return (
                  <li
                    key={name}
                    onClick={() => {
                      if (isWrong) return;
                      const isCorrect = name.toLowerCase() === skinName.toLowerCase();
                      if (isCorrect) {
                        setWinMessage(skinName);
                        setTimeout(() => {
                          window.location.reload();
                        }, 1500);
                      } else {
                        setWrongGuesses((prev) => [name, ...prev]);
                      }
                    }}
                    style={{
                      padding: "10px 16px",
                      backgroundColor: isWrong ? "rgba(180, 50, 50, 0.4)" : "#0a0a14",
                      border: isWrong ? "2px solid #c94444" : "2px solid #ffc524",
                      borderRadius: "6px",
                      color: isWrong ? "#888" : "#ffffff",
                      fontSize: "0.9rem",
                      cursor: isWrong ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      opacity: isWrong ? 0.6 : 1,
                      textDecoration: isWrong ? "line-through" : "none"
                    }}
                    onMouseEnter={(e) => {
                      if (!isWrong) e.currentTarget.style.backgroundColor = "rgba(255, 197, 36, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isWrong) e.currentTarget.style.backgroundColor = "#0a0a14";
                    }}
                  >
                    {name}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

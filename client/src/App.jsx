import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Clock, Play, SkipForward, X } from 'lucide-react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const HostInterface = ({ socket, onSwitchToPlayer }) => {
  const [gamePin, setGamePin] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('session_created', ({ pin }) => {
      setGamePin(pin);
      setPlayerCount(0);
    });

    socket.on('player_joined', ({ playerCount }) => {
      setPlayerCount(playerCount);
    });

    socket.on('leaderboard_update', ({ leaderboard }) => {
      setLeaderboard(leaderboard);
    });

    return () => {
      socket.off('session_created');
      socket.off('player_joined');
      socket.off('leaderboard_update');
    };
  }, [socket]);

  const startSession = () => {
    socket.emit('create_session');
  };

  const startGame = () => {
    socket.emit('start_game', gamePin);
    setCurrentQuestion(0);
    startQuestionTimer(20);
  };

  const startQuestionTimer = (timeLimit) => {
    setTimeRemaining(timeLimit);
    setShowLeaderboard(false);

    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimeout(() => showResults(), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const showResults = () => {
    socket.emit('get_leaderboard', gamePin);
    setShowLeaderboard(true);
  };

  const nextQuestion = () => {
    socket.emit('next_question', gamePin);
    const next = currentQuestion + 1;
    setCurrentQuestion(next);
    startQuestionTimer(20);
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    socket.emit('end_game', gamePin);
    setGamePin(null);
    setCurrentQuestion(-1);
    setShowLeaderboard(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!gamePin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full text-center">
          <Trophy className="w-24 h-24 mx-auto mb-6 text-yellow-500" />
          <h1 className="text-5xl font-bold mb-4 text-gray-800">Quiz Master</h1>
          <p className="text-xl text-gray-600 mb-8">Real-Time Multiplayer Quiz Platform</p>
          <button
            onClick={startSession}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg"
          >
            Create New Game
          </button>
          <button
            onClick={onSwitchToPlayer}
            className="mt-4 text-purple-600 hover:text-purple-800 underline block mx-auto"
          >
            Join as Player
          </button>
        </div>
      </div>
    );
  }

  if (currentQuestion === -1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-3xl w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-gray-100 px-6 py-3 rounded-lg mb-4">
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-2xl font-bold text-gray-800">{playerCount} Players</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-8 mb-8">
            <p className="text-white text-lg mb-2">Game PIN</p>
            <p className="text-white text-7xl font-bold tracking-wider">{gamePin}</p>
          </div>

          <p className="text-gray-600 mb-8 text-lg">
            Share this PIN with players to join!
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={startGame}
              disabled={playerCount === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-10 py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Play className="w-6 h-6" />
              Start Game
            </button>
            <button
              onClick={endGame}
              className="bg-red-500 text-white px-10 py-4 rounded-xl text-xl font-semibold hover:bg-red-600 transition shadow-lg flex items-center gap-2"
            >
              <X className="w-6 h-6" />
              End
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Trophy className="w-12 h-12 text-yellow-500" />
              <h2 className="text-4xl font-bold text-gray-800">Leaderboard</h2>
            </div>

            <div className="space-y-3 mb-8">
              {leaderboard.slice(0, 10).map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                    index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                    index === 2 ? 'bg-orange-100 border-2 border-orange-400' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      index === 2 ? 'text-orange-600' :
                      'text-gray-400'
                    }`}>
                      #{player.rank}
                    </span>
                    <span className="text-xl font-semibold text-gray-800">{player.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{player.score}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              {currentQuestion < 4 ? (
                <button
                  onClick={nextQuestion}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-4 rounded-xl text-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg flex items-center gap-2"
                >
                  Next Question
                  <SkipForward className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={endGame}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-10 py-4 rounded-xl text-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition shadow-lg"
                >
                  End Game
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questions = [
    {
      question: "What is the capital of France?",
      answers: ["London", "Berlin", "Paris", "Madrid"]
    },
    {
      question: "Which planet is known as the Red Planet?",
      answers: ["Venus", "Mars", "Jupiter", "Saturn"]
    },
    {
      question: "What is the largest ocean on Earth?",
      answers: ["Atlantic", "Indian", "Arctic", "Pacific"]
    },
    {
      question: "Who painted the Mona Lisa?",
      answers: ["Van Gogh", "Da Vinci", "Picasso", "Michelangelo"]
    },
    {
      question: "What is the smallest prime number?",
      answers: ["0", "1", "2", "3"]
    }
  ];

  const question = questions[currentQuestion];
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white rounded-xl px-6 py-3 shadow-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-gray-800">{playerCount}</span>
          </div>
          <div className="bg-white rounded-xl px-6 py-3 shadow-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600" />
            <span className="font-bold text-2xl text-gray-800">{timeRemaining}s</span>
          </div>
          <div className="bg-white rounded-xl px-6 py-3 shadow-lg">
            <span className="font-bold text-gray-800">Question {currentQuestion + 1}/5</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-12 mb-6">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">
            {question.question}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {question.answers.map((answer, index) => (
            <div
              key={index}
              className={`${colors[index]} rounded-xl shadow-xl p-8 text-white`}
            >
              <div className="flex items-start gap-4">
                <div className="bg-white text-gray-800 rounded-lg w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-2xl font-semibold flex-1">{answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PlayerInterface = ({ socket, onSwitchToHost }) => {
  const [gamePin, setGamePin] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [joined, setJoined] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null);
  const [playerStats, setPlayerStats] = useState({ score: 0, rank: 0 });
  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    if (!socket) return;

    socket.on('joined_game', ({ playerId }) => {
      setPlayerId(playerId);
      setJoined(true);
    });

    socket.on('join_error', ({ message }) => {
      alert(message);
    });

    socket.on('game_started', ({ question, questionIndex }) => {
      setCurrentQuestion(question);
      setQuestionIndex(questionIndex);
      setAnswered(false);
      setResult(null);
    });

    socket.on('next_question', ({ question, questionIndex }) => {
      setCurrentQuestion(question);
      setQuestionIndex(questionIndex);
      setAnswered(false);
      setResult(null);
    });

    socket.on('answer_result', ({ isCorrect, pointsEarned, totalScore, rank }) => {
      setResult({ isCorrect, pointsEarned });
      setPlayerStats({ score: totalScore, rank });
    });

    socket.on('game_ended', () => {
      alert('Game has ended!');
      setJoined(false);
      setGamePin('');
      setPlayerName('');
      setPlayerId(null);
    });

    return () => {
      socket.off('joined_game');
      socket.off('join_error');
      socket.off('game_started');
      socket.off('next_question');
      socket.off('answer_result');
      socket.off('game_ended');
    };
  }, [socket]);

  const joinGame = () => {
    if (gamePin && playerName) {
      socket.emit('join_game', { pin: gamePin, playerName });
    }
  };

  const submitAnswer = (answerIndex) => {
    if (answered) return;
    
    setAnswered(true);
    const timeRemaining = 10;
    socket.emit('submit_answer', { 
      pin: gamePin, 
      playerId, 
      answerIndex, 
      timeRemaining 
    });

    setTimeout(() => {
      setResult(null);
    }, 3000);
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Join Quiz</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Game PIN</label>
              <input
                type="text"
                value={gamePin}
                onChange={(e) => setGamePin(e.target.value)}
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-2xl font-bold tracking-wider focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              />
            </div>

            <button
              onClick={joinGame}
              disabled={!gamePin || !playerName}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-indigo-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Game
            </button>

            <button
              onClick={onSwitchToHost}
              className="w-full text-purple-600 hover:text-purple-800 underline text-sm"
            >
              Switch to Host View
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Get Ready!</h2>
          <p className="text-gray-600">Waiting for game to start...</p>
        </div>
      </div>
    );
  }

if (result) 
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${result.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
          <span className="text-4xl">{result.isCorrect ? '✓' : '✗'}</span>
        </div>
        <h2 className={`text-3xl font-bold mb-4 ${
          result.isCorrect ? 'text-green-600' : 'text-red-600'
        }`}>
          {result.isCorrect ? 'Correct!' : 'Incorrect'}
        </h2>

        <div className="bg-gray-100 rounded-xl p-6 mb-4">
          <p className="text-gray-600 mb-2">Points Earned</p>
          <p className="text-4xl font-bold text-purple-600">+{result.pointsEarned}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-100 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Total Score</p>
            <p className="text-2xl font-bold text-blue-600">{playerStats.score}</p>
          </div>
          <div className="bg-purple-100 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Your Rank</p>
            <p className="text-2xl font-bold text-purple-600">#{playerStats.rank}</p>
          </div>
        </div>
      </div>
    </div>
  );
const colors = [
'bg-gradient-to-br from-red-500 to-red-600',
'bg-gradient-to-br from-blue-500 to-blue-600',
'bg-gradient-to-br from-yellow-500 to-yellow-600',
'bg-gradient-to-br from-green-500 to-green-600'
];
return (
<div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 p-4">
<div className="max-w-2xl mx-auto">
<div className="bg-white rounded-xl p-4 mb-4 flex justify-between items-center shadow-lg">
<div>
<p className="text-sm text-gray-600">Score</p>
<p className="text-2xl font-bold text-purple-600">{playerStats.score}</p>
</div>
<div>
<p className="text-sm text-gray-600">Rank</p>
<p className="text-2xl font-bold text-blue-600">#{playerStats.rank || '-'}</p>
</div>
</div>
<div className="grid grid-cols-1 gap-4">
      {currentQuestion.answers.map((answer, index) => (
        <button
          key={index}
          onClick={() => submitAnswer(index)}
          disabled={answered}
          className={`${colors[index]} text-white rounded-2xl shadow-2xl p-8 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="flex items-center gap-4">
            <div className="bg-white text-gray-800 rounded-xl w-14 h-14 flex items-center justify-center font-bold text-2xl flex-shrink-0">
              {index + 1}
            </div>
            <p className="text-2xl font-bold text-left flex-1">{answer}</p>
          </div>
        </button>
      ))}
    </div>
  </div>
</div>
);
}

/**
 * App component manages the main view and socket connection for the quiz platform.
 * @returns {JSX.Element} The main application interface.
 */
export default function App() {
  const [view, setView] = useState('host');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, []);

  if (!socket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-2xl">Connecting...</div>
      </div>
    );
  }
  return view === 'host' ? (
    <HostInterface socket={socket} onSwitchToPlayer={() => setView('player')} />
  ) : (
    <PlayerInterface socket={socket} onSwitchToHost={() => setView('host')} />
  );
}


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Sample questions
const sampleQuestions = [
  {
    question: "What is the capital of France?",
    answers: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    timeLimit: 20
  },
  {
    question: "Which planet is known as the Red Planet?",
    answers: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    timeLimit: 15
  },
  {
    question: "What is the largest ocean on Earth?",
    answers: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctAnswer: 3,
    timeLimit: 20
  },
  {
    question: "Who painted the Mona Lisa?",
    answers: ["Van Gogh", "Da Vinci", "Picasso", "Michelangelo"],
    correctAnswer: 1,
    timeLimit: 20
  },
  {
    question: "What is the smallest prime number?",
    answers: ["0", "1", "2", "3"],
    correctAnswer: 2,
    timeLimit: 15
  }
];

// Game state
const sessions = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_session', () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    sessions.set(pin, {
      pin,
      questions: sampleQuestions,
      currentQuestion: -1,
      players: new Map(),
      started: false
    });
    socket.join(`game_${pin}`);
    socket.emit('session_created', { pin });
  });

  socket.on('join_game', ({ pin, playerName }) => {
    const session = sessions.get(pin);
    if (session) {
      const playerId = Date.now() + Math.random();
      session.players.set(playerId, {
        id: playerId,
        name: playerName,
        score: 0,
        answers: []
      });
      socket.join(`game_${pin}`);
      socket.emit('joined_game', { playerId });
      io.to(`game_${pin}`).emit('player_joined', {
        playerCount: session.players.size
      });
    } else {
      socket.emit('join_error', { message: 'Invalid PIN' });
    }
  });

  socket.on('start_game', (pin) => {
    const session = sessions.get(pin);
    if (session) {
      session.started = true;
      session.currentQuestion = 0;
      io.to(`game_${pin}`).emit('game_started', {
        question: session.questions[0],
        questionIndex: 0
      });
    }
  });

  socket.on('submit_answer', ({ pin, playerId, answerIndex, timeRemaining }) => {
    const session = sessions.get(pin);
    if (session) {
      const player = session.players.get(playerId);
      const question = session.questions[session.currentQuestion];
      const isCorrect = answerIndex === question.correctAnswer;
      const points = isCorrect ? 1000 + Math.floor((timeRemaining / question.timeLimit) * 500) : 0;
      
      player.score += points;
      player.answers.push({ questionIndex: session.currentQuestion, answer: answerIndex, correct: isCorrect, points });
      
      const leaderboard = Array.from(session.players.values())
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score, id: p.id }));
      
      const rank = leaderboard.find(p => p.id === playerId)?.rank || 0;
      
      socket.emit('answer_result', { isCorrect, pointsEarned: points, totalScore: player.score, rank });
    }
  });

  socket.on('next_question', (pin) => {
    const session = sessions.get(pin);
    if (session && session.currentQuestion < session.questions.length - 1) {
      session.currentQuestion++;
      io.to(`game_${pin}`).emit('next_question', {
        question: session.questions[session.currentQuestion],
        questionIndex: session.currentQuestion
      });
    }
  });

  socket.on('get_leaderboard', (pin) => {
    const session = sessions.get(pin);
    if (session) {
      const leaderboard = Array.from(session.players.values())
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score, id: p.id }));
      io.to(`game_${pin}`).emit('leaderboard_update', { leaderboard });
    }
  });

  socket.on('end_game', (pin) => {
    io.to(`game_${pin}`).emit('game_ended');
    sessions.delete(pin);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

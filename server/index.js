// ---- env
require("dotenv").config(!!process.env.CONFIG ? { path: process.env.CONFIG } : {});
// ---- dependencies
const OpenVidu = require("openvidu-node-client").OpenVidu;
const http = require("http");
const cors = require("cors");
const socketIO = require("socket.io");
const express = require("express");
const app = express();
const server = http.createServer(app);
// MRSEO: timer 추가
const timerModule = require('./timer');
const spyTimerModule = require('./spyTimer');
const countdownTimerModule = require('./countdownTimer');

// ---- openvidu env
const SERVER_PORT = process.env.SERVER_PORT || 5050;
const OPENVIDU_URL = process.env.OPENVIDU_URL || 'http://localhost:8443';
const OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'NAMANMU';
const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

// ---- middleware
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---- client num
let numClients = 0;
let redScore = 0;
let blueScore = 0;
let votedSpyList = [0, 0, 0, 0];
let roomMembers = 0;

// ---- socket.io
const io = socketIO(server, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected');

  // 클라이언트가 연결될 때마다 클라이언트 수 증가
  numClients++;
  console.log('현재 클라이언트 수:', numClients);

  socket.on('disconnect', () => {
    console.log('User disconnected');
    // 클라이언트가 연결 해제될 때마다 클라이언트 수 감소
    numClients--;
    console.log(roomMembers);
    if (roomMembers === 0) {
      clearvar();
    }
    console.log('현재 클라이언트 수:', numClients);
  });

  socket.on('joinRoom', (mySessionId) => {
    console.log('$$$$$$$$$$$$$$$$$$$$$$$joinRoom: ', mySessionId);
    roomMembers++;
    console.log(roomMembers);
    socket.join(mySessionId);
  });

  socket.on('leaveSession', (mySessionId) => {
    console.log('$$$$$$$$$$$$$$$$$$$$$$$leaveSession');
    roomMembers--;
    clearvar();
    socket.leave(mySessionId);
  });

  socket.on('goToWaitingRoom', () => {
    console.log('$$$$$$$$$$$$$$$$$$$$$$$goToWatingRoom');
    clearvar();
    io.emit('gameEndByButton')
  })

  socket.on('drawing', (data) => {
    // console.log(data);
    // socket.to(data.mySessionId).emit('drawing', data);
    socket.broadcast.emit('drawing', data);
  });



  socket.on('clearCanvas', () => {
    socket.broadcast.emit('clearCanvas');
  });

  // MRSEO: 게임 시작
  socket.on('startSetting', () => {
    console.log('🔴 startTeamSetting_server !!!!!');
    io.emit('setting');
  });

  socket.on('round1Start', () => {
    console.log('🟠 round1Start_server !!!!!');
    io.emit('round1Countdown');
  });

  socket.on('startTimer1', () => {
    console.log('🟡 startTimer1_server !!!!!');
    timerModule.startTimer(io, 40, () => {
      console.log('타이머 종료');
      io.emit('round2Countdown');
    });
  });

  socket.on('startTimer2', () => {
    console.log('🟢 startTimer2_server !!!!!');
    timerModule.startTimer(io, 40, () => {
      console.log('타이머 종료');
      // 최종 스코어 로직
      if (redScore > blueScore) {
        io.emit('round2End', 'red');
      } else if (redScore < blueScore) {
        io.emit('round2End', 'blue');
      } else {
        io.emit('round2End', 'draw');
      }
      redScore = 0;
      blueScore = 0;
    });
  });

  socket.on('sendScore', (team) => {
    console.log("🔵 sendScore_server !!!!!");
    if (team === 'red') {
      redScore++;
    } else if (team === 'blue') {
      blueScore++;
    }
    io.emit('scoreUpdate', { redScore, blueScore });
  });

  socket.on('correctAnswer', () => {
    console.log('🟣 correctAnswer_server !!!!!');
    io.emit('correctAnswer');
  });

  socket.on('incorrectAnswer', () => {
    console.log('🟣 incorrectAnswer_server !!!!!');
    io.emit('incorrectAnswer');
  });

  socket.on('clearCanvasBySubmit', () => {
    console.log('🟣 clearCanvasBySubmit_server !!!!!');
    io.emit('clearCanvasBySubmit');
  });

  socket.on("hostSetting", () => {
    console.log("🟣 hostSetting_server !!!!!");
    io.emit("hostSetting");
  });

  // SANGYOON: 2-1. Competition Mode - socket.on 수신
  socket.on('updateQuestWords_Com', () => {
    updateQuestWords_Com();
  });

  // SANGYOON: 2-2. Spy Mode - socket.on 수신
  socket.on('updateQuestWords_Spy', () => {
    updateQuestWords_Spy();
  });

  // ------------------------ JUNHO: 스파이모드 시작 ------------------------
  //TODO: 타이머 만들기

  const spyPlayers = [1, 3, 0, 2];
  let spy = 0;
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // swap
    }
  }

  const sum = (arr) => {
    return arr.reduce((acc, val) => acc + (typeof val === "number" ? val : 0), 0);
  }

  const max = (arr) => {
    const maxValue = Math.max(...arr);
    const indexOfMaxValue = arr.indexOf(maxValue);
    return indexOfMaxValue;
  }

  socket.on('spyCountdownUpdate', (time, round, spyPlayer) => {
    console.log('spyCountdownUpdate_server');
    countdownTimerModule.startTimer(io, time, () => {
      if (round === 1) {
        console.log('finishSpyCountdown_server1');
        io.emit('finishSpyCountdown1', spyPlayer);
      } else if (round === 2) {
        console.log('finishSpyCountdown_server2');
        io.emit('finishSpyCountdown2', spyPlayer);
      } else if (round === 3) {
        console.lon('finishSpyCountdown_server3')
        io.emit('finishSpyCountdown3', spyPlayer);
      } else if (round === 4) {
        console.lon('finishSpyCountdown_server4')
        io.emit('finishSpyCountdown4', spyPlayer);
      }
    })
  });

  //1번 대기
  socket.on('spy1Ready', () => {
    console.log('spy1Ready');
    console.log(spyPlayers);
    //플레이어 순서 섞기
    // shuffleArray(spyPlayers);
    // spy = Math.floor(Math.random() * 4);
    // while (spy === spyPlayers[0]) {
    //   spy = Math.floor(Math.random() * 4);
    // } FIXME: 스파이 고정
    console.log(spyPlayers);
    io.emit('spy1GO', spyPlayers[0], spy, spyPlayers);
  });

  //1번 타이머 시작
  socket.on('startSpyTimer1', (spyPlayer1) => {
    console.log('startSpyTimer1');
    spyTimerModule.startTimer(io, 20, () => {
      console.log('1번 타이머 종료');
      io.emit('spyTimer1End', spyPlayer1)
    });
  });

  //2번 대기
  socket.on('spy2Ready', () => {
    console.log('spy2Ready');
    // console.log(spyPlayers);
    io.emit('spy2GO', spyPlayers[1]);
  });


  //2번 타이머 시작
  socket.on('startSpyTimer2', (spyPlayer2) => {
    console.log('startSpyTimer2');
    spyTimerModule.startTimer(io, 20, () => {
      console.log('2번 타이머 종료');
      io.emit('spyTimer2End', spyPlayer2);
    });
  });

  //3번 대기
  socket.on('spy3Ready', () => {
    console.log('spy3Ready');
    io.emit('spy3GO', spyPlayers[2]);
  });


  //3번 타이머 시작
  socket.on('startSpyTimer3', (spyPlayer3) => {
    console.log('startSpyTimer3');
    spyTimerModule.startTimer(io, 20, () => {
      console.log('3번 타이머 종료');
      io.emit('spyTimer3End', spyPlayer3);
    });

  });

  //4번 대기
  socket.on('spy4Ready', () => {
    console.log('spy4Ready');
    io.emit('spy4GO', spyPlayers[3]);
  });


  //4번 타이머 시작
  socket.on('startSpyTimer4', (spyPlayer4) => {
    console.log('startSpyTimer4');
    spyTimerModule.startTimer(io, 20, () => {
      console.log('4번 타이머 종료');
      io.emit('spyTimer4End', spyPlayer4);
    });
  });

  socket.on('spyVoteTimerStart', () => {
    console.log('spyVoteTimerStart');
    spyTimerModule.startTimer(io, 20, () => {
      console.log('spyVoteTimerEnd');
      io.emit('spyVoteTimerEnd');
    });
  });

  socket.on('spyFinish', () => {
    console.log('spyFinish');
    io.emit('spyFinish');
  });

  socket.on('completitionFinish', () => {
    console.log('completitionFinish');
    io.emit('completitionFinish');
  })

  //YEONGWOO: 현재 그리는 사람의 id 전달
  socket.on('updateCurrentPainterId', (currentPainterId) => {
    console.log('updateCurrentPainterId_server: ', currentPainterId);
    socket.broadcast.emit('updateCurrentPainterId', currentPainterId);
  });

  socket.on('submitVotedSpy', (votedSpy) => {
    console.log('submitVotedSpy_server');
    votedSpyList[votedSpy] = votedSpyList[votedSpy] + 1;
    if (sum(votedSpyList) === 4) {
      elected = votedSpyList[max(votedSpyList)]
      if (elected === spy) {
        console.log('스파이 패배')
        io.emit('spyVoteResult', spy, 'spyLose');
      } else {
        console.log('스파이 승리')
        io.emit('spyVoteResult', spy, 'spyWin');
      }
    }
    votedSpyList = [0, 0, 0, 0]
  });

  socket.on('spyWinBySubmit', () => {
    console.log('spyWinBySubmit_server');
    io.emit('spyWinBySubmit');

  });
  // ------------------------ JUNHO: 스파이모드 끝 --------------------


  // MRSEO: 게임 종료

  // MRSEO: change Solver
  socket.on('req_changeSolver', (team) => {
    console.log('🟣 changeSolver_server !!!!!');
    io.emit('res_changeSolver', team);
  });

  // // MRSEO: hacking painting
  // socket.on('req_hacking', (team) => {

  // });

});

const clearvar = () => {
  // if (timerModule.getIntervalId()) {
  //   console.log('타이머 종료');
  //   clearInterval(timerModule.getIntervalId());
  // }
  // if (spyTimerModule.getIntervalId()) {
  //   console.log('타이머 종료');
  //   clearInterval(spyTimerModule.getIntervalId());
  // }
  if (timerModule.getIntervalId()) {
    console.log('타이머 종료');
    timerModule.getTask().stop();
  }
  if (spyTimerModule.getIntervalId()) {
    console.log('타이머 종료');
    spyTimerModule.getTask().stop();
  }
  redScore = 0;
  blueScore = 0;
  votedSpyList = [0, 0, 0, 0];
  cur_ComIndex = 0;
  cur_SpyIndex = 0;
};



// ---- Server Application Connect
server.listen(SERVER_PORT, () => {
  console.log("Application started on port: " + SERVER_PORT);
  console.warn('Application server connecting to OpenVidu at ' + OPENVIDU_URL);
});

// ---- Create Sessions
app.post("/api/sessions", async (req, res) => {
  const session = await openvidu.createSession(req.body);
  res.send(session.sessionId);
});

app.post("/api/sessions/:sessionId/connections", async (req, res) => {
  const session = openvidu.activeSessions.find(
    (s) => s.sessionId === req.params.sessionId
  );
  if (!session) {
    res.status(404).send();
  } else {
    const connection = await session.createConnection(req.body);
    res.send(connection.token);
  }
});

// ---- SANGYOON: MongoDB Conneting
// ---- local mongodb 가져오도록 설정됨
// NOTE: 배포 시, 주석 해제!
const { MONGO_URI } = process.env;
const mongoose = require("mongoose");
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(e => console.error(e));

// ---- SANGYOON: 제시어 받는 API
const FruitWord = require("./models/fruits");
const SpyWord = require("./models/spies");
// const { clear } = require("console");
let selectComWords = [];
let selectSpyWords = [];
let cur_ComIndex = 0;
let cur_SpyIndex = 0;

// ---- SANGYOON: Competition DB
const updateQuestWords_Com = async () => {
  try {
    const FruitWords = await FruitWord.aggregate([{ $limit: 7 }]);
    selectComWords = FruitWords;
    const names = selectComWords.map((word) => word.name);
    const nextSuggestIndex = cur_ComIndex % names.length;
    io.emit('suggestWord', names[nextSuggestIndex]); // 3. GameCanvas.js로 emit
    cur_ComIndex++;
    console.log(names);
  } catch (error) {
    console.log(error);
  };
};

// ---- SANGYOON: Spy DB
const updateQuestWords_Spy = async () => {
  try {
    const SpyWords = await SpyWord.aggregate([{ $limit: 2 }]);
    selectSpyWords = SpyWords;
    const names = selectSpyWords.map((word) => word.name);
    const nextSuggestIndex = cur_SpyIndex % names.length;
    io.emit('suggestWord', names[nextSuggestIndex]); // 3. SpyUI.js로 emit
    cur_SpyIndex++;
    console.log(names);
  } catch (error) {
    console.log(error);
  };
};

process.on('uncaughtException', err => console.error(err));
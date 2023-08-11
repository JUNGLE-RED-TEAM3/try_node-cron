// // spyTimer.js
// let timerSeconds = 10;
// let intervalId = null;


// // 타이머 값을 1초마다 감소시키고 클라이언트들에게 전달하는 함수
// const startTimer = (io, initialTimerSeconds = 10, callback) => {
//   console.log('타이머 시작');
//   // MRSEO: 타이머 값 초기화
//   timerSeconds = initialTimerSeconds; // set the initial timer seconds
//   intervalId = setInterval(() => { 
//     sendTimerValueToClients(io);
//     timerSeconds--;

//     if (timerSeconds < 0) {
//       clearInterval(intervalId); // 타이머 중지
//       // TODO: 게임 종료 처리
//       // MRSEO: 타이머 값 초기화
//       timerSeconds = initialTimerSeconds;
//       //MRSEO: 타이머 종료 후 콜백 함수 호출
//       if (typeof callback === 'function') {
//         callback(); // 콜백 함수 호출
//       }
//     }
//   }, 1000);
// };

// // 타이머 값을 클라이언트들에게 전달하는 함수
// const sendTimerValueToClients = (io) => {
//   //JANG: 타이머 수정
//   console.log("타이머 진행")
//   io.emit('spyTimerUpdate', timerSeconds);
// };

// // 현재 타이머 값을 가져오는 함수
// const getTimerValue = () => {
//   return timerSeconds;
// };

// const getIntervalId = () => {
//   return intervalId;
// }

// module.exports = {
//   startTimer,
//   getTimerValue,
//   getIntervalId,
// };






const cron = require('node-cron');

let timerSeconds = 10;
let task = null;
let isTaskRunning = false;

const startTimer = (io, initialTimerSeconds = 10, callback) => {
  if (isTaskRunning) {
    console.log('타이머가 이미 실행 중입니다.');
    return;
  }

  console.log('타이머 시작');
  timerSeconds = initialTimerSeconds;
  isTaskRunning = true;

  try {
    task = cron.schedule('* * * * * *', () => {
      sendTimerValueToClients(io);
      timerSeconds--;

      if (timerSeconds < 0) {
        console.log('타이머 종료');
        task.stop();
        task.destroy(); // 작업 완전 삭제
        isTaskRunning = false;
        timerSeconds = initialTimerSeconds;
        if (typeof callback === 'function') {
          callback();
        }
      }
    });
  } catch (error) {
    console.error("Error in the task:", error);
    task.stop();
    task.destroy(); // 작업 완전 삭제
    isTaskRunning = false;
  }
};

const sendTimerValueToClients = (io) => {
  console.log("타이머 진행");
  io.emit('spyTimerUpdate', timerSeconds);
};

const getTimerValue = () => {
  return timerSeconds;
};

const getTask = () => {
  return task;
};

module.exports = {
  startTimer,
  getTimerValue,
  getTask,
};
const cron = require('node-cron');

let timerSeconds = 3;
let task = null;
let isTaskRunning = false;

const startTimer = (io, initialTimerSeconds = 3, callback) => {
  if (isTaskRunning) {
    console.log('isTaskRunning is true, timer is already running');
    console.log('카운트다운타이머가 이미 실행 중입니다.');
    return;
  }

  try {
    console.log('카운트다운타이머 시작');
    timerSeconds = initialTimerSeconds;
    console.log('Setting isTaskRunning to true'); // 로그 추가
    isTaskRunning = true;

    task = cron.schedule('* * * * * *', () => {
      sendTimerValueToClients(io);
      timerSeconds--;

      if (timerSeconds < 0) {
        console.log('카운트다운타이머 종료');
        task.stop();
        task.destroy(); // 작업 완전 삭제
        console.log('Setting isTaskRunning to false'); // 로그 추가
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
  io.emit('spyCountdownUpdate', timerSeconds);
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

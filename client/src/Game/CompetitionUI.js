import React, { useEffect, useState } from "react";
import UserVideoComponent from "../Openvidu/UserVideoComponent";
import useStore from "../store";
import "./BasicUI.css";

import socket from "../Openvidu/socket";

// SANGYOON: Competition Sound
import { WaitingSound, CompetitionSound, EntranceEffect } from "./audio";

// 게임 컴포넌트
import GameCanvas from "./For_canvas/GameCanvas";
import Navbar from "./For_screen/Navbar";
import Countdown from "./Countdown";

// Chakra UI
import {
  Button,
  Box,
  Center,
  Flex,
  GridItem,
  Spacer,
  VStack,
  Grid,
  Input,
  Radio,
  RadioGroup,
  Text,
  keyframes,
  Img,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";

// JANG: 게임 이팩트 효과
// 1) 게임 시작 버튼
// https://www.react-spring.dev/docs/concepts/animated-elements ->

// 폭죽 효과
import confetti from "canvas-confetti";

const CompetitionUI = () => {
  // MRSEO: 타이머 값 상태
  const [timerValue, setTimerValue] = useState(0);

  // MRSEO: 타이머 값 상태
  const {
    gamers,
    setPlayerCount,
    curSession,
    setRedScoreCnt,
    setBlueScoreCnt,
    round,
    setRound,
    sortGamer,
    setPhase,
    setMode,
    iAmPainter,
    iAmSolver,
    myUserId,
    phase,
  } = useStore((state) => ({
    gamers: state.gamers,
    setPlayerCount: state.setPlayerCount,
    curSession: state.curSession,
    setRedScoreCnt: state.setRedScoreCnt,
    setBlueScoreCnt: state.setBlueScoreCnt,
    round: state.round,
    setRound: state.setRound,
    sortGamer: state.sortGamer,
    setPhase: state.setPhase,
    setMode: state.setMode,
    iAmPainter: state.iAmPainter,
    iAmSolver: state.iAmSolver,
    myUserId: state.myUserId,
    phase: state.phase,
  }));

  useEffect(() => {
    if (curSession !== undefined) {
      setPlayerCount(gamers.length);
    }
    // 재 렌더링 되는 건 맞지만, 자식 요소가 재 렌더링 되지는 않음
    sortGamer();
  }, [gamers]);

  // MRSEO:
  useEffect(() => {
    // MRSEO: 소켓 관리를 위한 함수 추가와 클린업 함수 추가
    const timerUpdateHandler = (value) => {
      console.log("timerUpdate_client@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      setTimerValue(value);
    };

    const scoreUpdateHandler = ({ redScore, blueScore }) => {
      setRedScoreCnt(redScore);
      setBlueScoreCnt(blueScore);
    };

    const round2CountdownHandler = () => {
      setRound(2);
      setPhase("Game2");
      // MRSEO: 게임 초기화
    };
    // 서버로부터 타이머 값을 수신하는 이벤트 리스너
    socket.on("timerUpdate", timerUpdateHandler);
    socket.on("scoreUpdate", scoreUpdateHandler);

    // MRSEO: 라운드를 2로 업데이트
    socket.on("round2Countdown", round2CountdownHandler);

    return () => {
      socket.off("timerUpdate", timerUpdateHandler);
      socket.off("scoreUpdate", scoreUpdateHandler);
      socket.off("round2Countdown", round2CountdownHandler);
    };
  }, [socket]);

  // JANG: 08.06 - 모드 선택 애니메이션
  const bounce = keyframes`
0% { transform: translateY(15px); }
50% { transform: translateY(-15px);}
100% { transform: translateY(15px); }
`;
  const animation = `${bounce} infinite 2s ease`;

  //MRSEO: 08.06 useState를 useEffect로 바꿈.
  useEffect(() => {
    confetti();
  }, []);

  // MRSEO: 대기실 버튼으로 대기실로 돌아가는 이벤트 핸들러
  useEffect(() => {
    socket.on("gameEndByButton", () => {
      // alert("게임이 종료되었습니다.");
      setMode("waitingRoom");
    });

    return () => {
      socket.off("gameEndByButton");
    };
  }, [socket]);

  useEffect(() => {
    socket.on("completitionFinish", () => {
      // alert("경쟁모드가 종료되었습니다.");
      competitionUIInitializer();
      setMode("waitingRoom");
    });
  });

  const [iAmSolverRender, setIAmSolverRender] = useState(false);
  const [iAmPainterRender, setIAmPainterRender] = useState(false);

  useEffect(() => {
    setIAmPainterRender(iAmPainter);
    setIAmSolverRender(iAmSolver);
  }, [iAmSolver, iAmPainter]);

  // MRSEO: 경쟁모드 초기화 함수
  const competitionUIInitializer = () => {
    setRedScoreCnt(0);
    setBlueScoreCnt(0);
    setTimerValue(0);
    setRound(1);
    setPhase("Ready");
    setMode("waitingRoom");
    socket.emit("goToWaitingRoom");
  };

  // MRSEO: 대기실 버튼으로 대기실로 돌아가는 함수
  const goToWaitingRoom = () => {
    competitionUIInitializer();
  };

  // SANGYOON: 대기실로 돌아가서 대기실 sound on
  const waitingroomSound = () => {
    CompetitionSound.pause();
    EntranceEffect.play();
    WaitingSound.loop = true;
    WaitingSound.currentTime = 0;
    WaitingSound.play();
    WaitingSound.volume = 0.3;
  };

  return (
      <>
        {/* JANG: 화면 전체 높이는 다시 수정 */}
        <div style={{ height: "100%", width: "100%" }}>
          {/* <Navbar /> */}
  
          {/*** @2-1. 경쟁 모드 ***/}
          <Grid h="15%" w="100%" templateColumns="2fr 5fr 2fr">
            <Flex alignItems="center" justifyContent="center">
              <Box
                className="Red_Score"
                bg="red.500"
                p="20px"
                width="85%"
                height="90%"
                borderRadius="20px"
                fontSize="40px" // 글자 크기를 x-large로 설정
                fontWeight="bold" // 글자를 두껍게 설정
                color= "white"
                _hover={{
                  boxShadow: "0 0 20px rgba(255, 0, 0, 0.8)", // 네온 샤인처럼 빛이 나는 hover 효과 (빨간색)
                }}
                transition="box-shadow 0.3s ease-in-out" // 부드러운 애니메이션 효과
              >
              <Text>SCORE <br/> {useStore.getState().redScoreCnt}</Text>
            </Box>
          </Flex>
          <Flex alignItems="center" justifyContent="center">
            <Box
              className="Round_Timer"
              bg="yellowgreen"
              p="10px"
              borderRadius="20px"
              fontSize="40px" // 글자 크기를 x-large로 설정
              fontWeight="bold" // 글자를 두껍게 설정
              color= "white"
              
              width="80%"
              height="90%"

              _hover={{
                boxShadow: "0 0 20px rgba(255, 255, 0, 0.8)", // 네온 샤인처럼 빛이 나는 hover 효과 (노란색)
              }}
              transition="box-shadow 0.3s ease-in-out" // 부드러운 애니메이션 효과
            >
              <p>ROUND {round}</p> <p>TIMER {timerValue}</p>
            </Box>
          </Flex>
          <Flex alignItems="center" justifyContent="center">
            <Box
              className="Blue_Score"
              bg="blue.600"
              p="20px"
              borderRadius="20px"
              fontSize="40px" // 글자 크기를 x-large로 설정
              color="white"
              fontWeight="bold" // 글자를 두껍게 설정
              width="80%"
              height="90%"
              _hover={{
                boxShadow: "0 0 20px rgba(0, 0, 255, 0.8)", // 네온 샤인처럼 빛이 나는 hover 효과 (파란색)
              }}
              transition="box-shadow 0.3s ease-in-out" // 부드러운 애니메이션 효과
            >
              SCORE <br/> {useStore.getState().blueScoreCnt}
            </Box>
          </Flex>
        </Grid>

        <Grid
          h="80%"
          w="100%"
          templateColumns="2fr 5fr 2fr"
          marginTop="10px"
          justifyContent="center"
          alignItems="center"
        >
          {/* 왼쪽 박스 1과 2 */}
          <Flex
            flexDirection="column"
            justifyContent="space-between"
            alignItems="center"
            h="90%"
            w="90%"
            gap="10px"
            margin="auto"
          >
            <Box
              className="Gamer_Box"
              w="100%"
              minHeight="20px"
            >
              <div style={{ position: 'relative' }}>
                {gamers[0] && (
                  <UserVideoComponent
                    streamManager={gamers[0].streamManager}
                    my_name={gamers[0].name}
                    key={gamers[0].name}
                  />
                )}

            {phase === 'Ready' && (
                  <>
                    {iAmPainterRender && (
                      <Img
                        src={`${process.env.PUBLIC_URL}/resources/images/Painter.png`}
                        alt="character"
                        width="30%"
                        height="30%"
                        style={{
                          position: "absolute",
                          top: "0%", // Adjust as necessary
                          left: "0%", // Centering the image if it's 80% width
                        }}
                      />
                    )}
                  </>
                )}
                {phase !== 'Ready' && (
                  <>
                    {round === 1 && gamers[0].name === myUserId && (
                      <>
                        {iAmPainterRender && (
                          <Img
                            src={`${process.env.PUBLIC_URL}/resources/images/Painter.png`}
                            alt="character"
                            width="30%"
                            height="30%"
                            style={{
                              position: "absolute",
                              top: "0%", // Adjust as necessary
                              left: "0%", // Centering the image if it's 80% width
                            }}
                          />
                        )}
                        {iAmSolverRender && (
                          <Img
                            src={`${process.env.PUBLIC_URL}/resources/images/Solver.png`}
                            alt="character"
                            width="30%"
                            height="30%"
                            style={{
                              position: "absolute",
                              top: "0%", // Adjust as necessary
                              left: "0%", // Centering the image if it's 80% width
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </Box>
            <Box
              className="Gamer_Box"
              w="100%"
              minHeight="20px"
            >
              <div style={{ position: 'relative' }}>
                {gamers[2] && (
                  <UserVideoComponent
                    streamManager={gamers[2].streamManager}
                    my_name={gamers[2].name}
                    key={gamers[2].name}
                  />
                )}
                {phase === 'Ready' && (
                  <>
                    {iAmPainterRender && (
                      <Img
                        src={`${process.env.PUBLIC_URL}/resources/images/Painter.png`}
                        alt="character"
                        width="30%"
                        height="30%"
                        style={{
                          position: "absolute",
                          top: "0%", // Adjust as necessary
                          left: "0%", // Centering the image if it's 80% width
                        }}
                      />
                    )}
                  </>
                )}
                {phase !== 'Ready' && (
                  <>
                    {round === 1 && gamers[2].name === myUserId && (
                      <>
                        {iAmPainterRender && (
                          <Img
                            src={`${process.env.PUBLIC_URL}/resources/images/Painter.png`}
                            alt="character"
                            width="30%"
                            height="30%"
                            style={{
                              position: "absolute",
                              top: "0%", // Adjust as necessary
                              left: "0%", // Centering the image if it's 80% width
                            }}
                          />
                        )}
                        {iAmSolverRender && (
                          <Img
                            src={`${process.env.PUBLIC_URL}/resources/images/Solver.png`}
                            alt="character"
                            width="30%"
                            height="30%"
                            style={{
                              position: "absolute",
                              top: "0%", // Adjust as necessary
                              left: "0%", // Centering the image if it's 80% width
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </Box>
          </Flex>

          {/* 가운데 Canvas */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "center",
              alignItems: "center",
              position: "relative",
            }}
            className="GameCanvas 들어갈 영역 1"
          >
            <GameCanvas />
          </div>

          {/* 오른쪽 박스 3과 4 */}
          <Flex
            flexDirection="column"
            justifyContent="space-between"
            alignItems="center"
            h="90%"
            w="90%"
            gap="10px"
            margin="auto"
          >
            <Box
              className="Gamer_Box"
              w="100%"
              minHeight="20px"
            >
              <div style={{ position: 'relative' }}>
                {gamers[1] && (
                  <UserVideoComponent
                    streamManager={gamers[1].streamManager}
                    my_name={gamers[1].name}
                    key={gamers[1].name}
                  />
                )}
                {phase === 'Ready' && (
                  <>
                    {iAmPainterRender && (
                      <Img
                        src={`${process.env.PUBLIC_URL}/resources/images/Painter.png`}
                        alt="character"
                        width="30%"
                        height="30%"
                        style={{
                          position: "absolute",
                          top: "0%", // Adjust as necessary
                          left: "0%", // Centering the image if it's 80% width
                        }}
                      />
                    )}
                  </>
                )}
                {phase !== 'Ready' && (
                  <>
                    {round === 2 && gamers[1].name === myUserId && (
                      <>
                        {iAmPainterRender && (
                          <Img
                            src={`${process.env.PUBLIC_URL}/resources/images/Painter.png`}
                            alt="character"
                            width="30%"
                            height="30%"
                            style={{
                              position: "absolute",
                              top: "0%", // Adjust as necessary
                              left: "0%", // Centering the image if it's 80% width
                            }}
                          />
                        )}
                        {iAmSolverRender && (
                          <Img
                            src={`${process.env.PUBLIC_URL}/resources/images/Solver.png`}
                            alt="character"
                            width="30%"
                            height="30%"
                            style={{
                              position: "absolute",
                              top: "0%", // Adjust as necessary
                              left: "0%", // Centering the image if it's 80% width
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </Box>
            <Box
              className="Gamer_Box"
              w="100%"
              minHeight="20px"
            >
              <div style={{ position: 'relative' }}>
                {gamers[3] && (
                  <UserVideoComponent
                    streamManager={gamers[3].streamManager}
                    my_name={gamers[3].name}
                    key={gamers[3].name}
                  />
                )}
                {phase === 'Ready' && (
                  <>
                    {iAmPainterRender && (
                      <Img
                        src={`${process.env.PUBLIC_URL}/resources/images/Painter.png`}
                        alt="character"
                        width="30%"
                        height="30%"
                        style={{
                          position: "absolute",
                          top: "0%", // Adjust as necessary
                          left: "0%", // Centering the image if it's 80% width
                        }}
                      />
                    )}
                  </>
                )}

                {phase !== 'Ready' && (
                  <>
                    {round === 2 && gamers[3].name === myUserId && (
                      <>
                        {iAmPainterRender && (
                          <Img
                            src={`${process.env.PUBLIC_URL}/resources/images/Painter.png`}
                            alt="character"
                            width="30%"
                            height="30%"
                            style={{
                              position: "absolute",
                              top: "0%", // Adjust as necessary
                              left: "0%", // Centering the image if it's 80% width
                            }}
                          />
                        )}
                        {iAmSolverRender && (
                          <Img
                            src={`${process.env.PUBLIC_URL}/resources/images/Solver.png`}
                            alt="character"
                            width="30%"
                            height="30%"
                            style={{
                              position: "absolute",
                              top: "0%", // Adjust as necessary
                              left: "0%", // Centering the image if it's 80% width
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </Box>
          </Flex>
        </Grid>
        {/* JANG: 대기실로 이동 버튼!! */}
        {/* <Flex>
          <Button
            colorScheme="teal"
            variant="solid"
            onClick={() => {
              goToWaitingRoom();
              waitingroomSound();
            }}
            margin="10px"
          >
            대기실로 이동
          </Button>
        </Flex> */}
        {/*** @2-1. 경쟁 모드 ***/}
      </div>

      {/* 경쟁모드 이팩트 효과 */}
      {/* 1) 게임 플레이 버튼 */}

      {/* 2) 게임 종료 */}
      {/* ** 패배 시 뜨는 창 **
              <div
              style={{
                  background: "#000000a0",
                  width: "100vw",
                  height: "100vh",
                  position: "absolute",
                  zIndex: "10000",
                  left: "0",
                  top: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "700",
                  fontSize: "60px",
              }}
              >
              패배
              </div> */}
      {/* ** 승리 시 confetti(); 실행하면 폭죽효과 생김 ** */}
      {/*  */}
    </>
  );
};

export default CompetitionUI;

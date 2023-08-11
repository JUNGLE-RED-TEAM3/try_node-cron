import React, { useState, useEffect } from 'react';
import './Webcam.css';
import axios from 'axios';

// YEONGWOO: provider 생성
import SessionContext from './SessionContext';

// OpenVidu
import { OpenVidu } from 'openvidu-browser';
import UserVideoComponent from './UserVideoComponent';

// Zustand
import useStore from '../store';

// BasicUI
import BasicUI from '../Game/BasicUI';

// MRSEO: 
import socket from './socket';

// SANGYOON: Sound
import { RoundMusic, WaitingSound, EntranceEffect } from '../Game/audio';

// JANG: 08.06 - Chakra UI 추가
import {
  Button,
  ButtonGroup,
  Box,
  Center,
  FormLabel,
  Flex,
  Heading,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
  Spacer,
  useDisclosure, // CHAKRA 제공 함수
  Grid,
  VStack,
  ModalBody,
  Img,
} from "@chakra-ui/react";
// 버튼 애니메이션
import { keyframes } from "@emotion/react";
// CSS
import "./Webcam.css";


// NOTE: 배포 전 확인!
// const APPLICATION_SERVER_URL = "https://mysquidcanvas.shop/"
const APPLICATION_SERVER_URL = process.env.NODE_ENV === 'production' ? '' : 'https://demos.openvidu.io/';

const Webcam = () => {
  //JUNHO: 8.7 플레이스 홀더 변경
  const [mySessionId, setMySessionId] = useState('');
  const [myUserName, setMyUserName] = useState('');
  const [session, setSession] = useState(undefined);
  const [publisher, setPublisher] = useState(undefined);
  const [subscribers, setSubscribers] = useState([]);
  const [audio, setAudio] = useState(false);

  // MRSEO: ZUSTAND 상태 변수 선언
  const {
    round,
    redScoreCnt,
    blueScoreCnt,
    phase,
    setPhase,
    gamers,
    setGamers,
    host,
    setHost,
    setCanSeeAns,
    setDrawable,
    setIAmPainter,
    setTeam,
    team,
    setMyUserId,
    iAmSolver,
    iAmPainter,
    setIAmSolver,
    spyPainter,
    iAmSpy,
    setMode,
  } = useStore(
    state => ({
      round: state.round,
      redScoreCnt: state.redScoreCnt,
      blueScoreCnt: state.blueScoreCnt,
      phase: state.phase,
      setPhase: state.setPhase,
      gamers: state.gamers,
      setGamers: state.setGamers,
      host: state.host,
      setHost: state.setHost,
      setCanSeeAns: state.setCanSeeAns,
      setDrawable: state.setDrawable,
      setIAmPainter: state.setIAmPainter,
      setTeam: state.setTeam,
      team: state.team,
      setMyUserId: state.setMyUserId,
      iAmSolver: state.iAmSolver,
      iAmPainter: state.iAmPainter,
      setIAmSolver: state.setIAmSolver,
      spyPainter: state.spyPainter,
      iAmSpy: state.iAmSpy,
      setMode: state.setMode,
    })
  );

  useEffect(() => {

    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  const onBeforeUnload = (event) => {
    leaveSession();
  };

  const handleChangeSessionId = (e) => {
    setMySessionId(e.target.value);
  };

  const handleChangeUserName = (e) => {
    setMyUserName(e.target.value);
  };

  const joinSession = async (e) => {
    e.preventDefault();

    const OV = new OpenVidu();

    const mySession = OV.initSession();

    mySession.on('streamCreated', (event) => {
      var subscriber = mySession.subscribe(event.stream, undefined);
      // mySession.subscribe : openvidu 세션(mySession)에 대해 스트림 구독

      // MRSEO: SUBSCRIBER 로직 업데이트 -> 다시 확인!
      // var subscribers = [...subscribers];
      setGamers({
        name: JSON.parse(event.stream.connection.data).clientData,
        streamManager: subscriber,
        // MRSEO: 08.04 상태를 true로 초기화
        drawable: true,
        canSeeAns: true,
      });

      subscribers.push(subscriber);
      setSubscribers(subscribers);
    });

    //JANG: deleteGamer 로직 수정할 것! (아래 주석 보면서)
    mySession.on("streamDestroyed", (event) => {
      // var subscribers = [...subscribers];

      // 1. subscribers 배열에서 해당 subscriber 제거
      const index = subscribers.indexOf(event.stream.streamManager);
      if (index > -1) {
        subscribers.splice(index, 1);
        setSubscribers(subscribers);
      }

      // 2. gamers 정보에서 해당 subscriber 제거
      // JANG: 아래 useStore 쓰는 것보다, zustand로 불러와서 쓰면 바로 렌더링 됨! (확인 필요)
      useStore.getState().deleteGamer(JSON.parse(event.stream.connection.data).clientData);

      // 3. 방에 남아 있는 플레이어 수 업데이트
      // JANG: setPlayerCount 갱신되기 전 삭제하는 시점의 플레이어 수로 갱신되는 문제 해결
      // JANG: 일단 이거 없애니까, 지금까지 1) gamer 배열 중복 등록 방지 2) 세션 나가면 gamer 배열 갱신 성공 + 비디오 비워지고 새 유저 그 자리에
      // useStore.getState().setPlayerCount(useStore.getState().gamers.filter((a) => event.stream.streamManager.clientData !== a.name).length);

      //JANG: 아래 로직으로 가는 게 더 좋을 것 같다! (앞서 useStore로 수정 진행하고 -> setSubscriber로 한 번에 렌더링)
      // const deleteSubscriber = (streamManager, subscribers) => {
      //   let index = subscribers.indexOf(streamManager, 0); 

      //   useStore.getState().deleteGamer(JSON.parse(event.stream.connection.data).clientData);
      //   useStore.getState().setPlayerCount(useStore.getState().gamers.length);

      //   if (index > -1) {
      //     subscribers.splice(index, 1);  // subscribers 배열에서 해당 streamManager 삭제
      //     return subscribers;
      //   }
      // };

      // setSubscribers(deleteSubscriber(event.stream.streamManager, subscribers));
    });

    mySession.on('exception', (exception) => {
      console.warn(exception);
    });

    try {
      const token = await getToken();
      await mySession.connect(token, { clientData: myUserName })
        .then(async () => {
          let publisher = await OV.initPublisherAsync(undefined, {
            audioSource: undefined,
            videoSource: undefined,
            publishAudio: true,
            publishVideo: true,
            resolution: '640x480',
            frameRate: 30,
            insertMode: 'APPEND',
            mirror: false,
          });

          mySession.publish(publisher);

          setGamers({
            name: myUserName,
            streamManager: publisher,
            // MRSEO: gamer의 drawable, canSeeAns 상태 변수 추가
            // MRSEO: 08.04 상태를 true로 초기화
            drawable: true,
            canSeeAns: true,
          });
          setMyUserId(myUserName)

          // useStore.getState().setMyUserID(myUserName);
          setPublisher(publisher);
          setMode('waitingRoom')
        })
    }
    catch (error) {
      console.log('There was an error connecting to the session:', error.code, error.message);
    }

    setSession(mySession);

  };

  // JANG: 이부분 수정해야 될 수도!
  // 내가 나갈 때, 방에 남은 다른 유저들도 모두 게임에서 제거 되어 버림
  // 그냥 창을 끌 때와, 직접 exit 버튼 누르는 것에 차이가 있을까?
  const leaveSession = () => {
    const mySession = session;

    if (mySession) {
      mySession.disconnect();
    }

    socket.emit('leaveSession', mySessionId);
    useStore.getState().clearGamer();

    setSession(undefined);
    setSubscribers([]);
    setMySessionId('');
    setMyUserName('');
    setPublisher(undefined);
  };

  const getToken = async () => {
    const sessionId = await createSession(mySessionId);
    console.log('getToken' + sessionId);
    return await createToken(sessionId);
  };

  const createSession = async (sessionId) => {
    console.log('create' + sessionId);
    const response = await axios.post(APPLICATION_SERVER_URL + 'api/sessions', { customSessionId: sessionId }, {
      headers: { 'Content-Type': 'application/json', },
    });
    return response.data; // The sessionId (정확히는 session, sessionId)
  };

  const createToken = async (sessionId) => {
    console.log('createToken' + sessionId);
    const response = await axios.post(APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections', {}, {
      headers: { 'Content-Type': 'application/json', },
    });
    return response.data; // The token (정확히는 connection.token)
  };

  //JUNHO: 시작


  //MRSEO: host 설정
  // useEffect(() => {
  //   if (gamers.length === 0) return;
  //   console.log("host 설정")
  //   setHost(gamers[0].name);
  // }, [gamers]);

  // MRSEO: 게임 시작 버튼을 누른 후, 플레이어 상태 초기화
  useEffect(() => {
    if (phase === 'Game1') {
      GameInitializer1();
    } else if (phase === 'Game2') {
      GameInitializer2();
    }
  }, [phase]);  // `phase`가 변경될 때 마다 이 useEffect는 실행됩니다.



  useEffect(() => {
    const settingHandler = () => {
      console.log('settingHandle_client@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
      // gamers배열을 돌면서 myUserName과 같은 이름을 가진 gamer의 인덱스가 짝수면 setTeam('red'), 홀수면 setTeam('blue')
      for (let i = 0; i < gamers.length; i++) {
        if (gamers[i].name === myUserName) {
          if (i % 2 === 0) {
            setTeam('red');
          } else {
            setTeam('blue');
          }
        }
      }
      setPhase('Game1');
      if (myUserName === useStore.getState().host) {
        socket.emit('round1Start');
      }
    }

    socket.on('setting', settingHandler);

    return () => {
      socket.off('setting', settingHandler);
    }

  }, [socket, gamers]);

  // SANGYOON: 입장하기 버튼 클릭시 sound effect
  const entranceSquid = () => {
    EntranceEffect.play();
    setTimeout(() => {
      WaitingSound.loop = true;
      WaitingSound.currentTime = 0;
      WaitingSound.play();
      WaitingSound.volume = 0.3;
    }, 1000 * 4);
  };

  const clickSquid = () => {
    EntranceEffect.play();
  };

  const handleGameStart = () => {
    // MRSEO: 게임 시작 버튼 누르면, 게임 시작, useStore.getState()지움
    console.log("게임 시작");
    RoundMusic.play();
    RoundMusic.volume = 0.3;
    socket.emit('startSetting')
  };


  // MRSEO: 게임 초기화
  const GameInitializer1 = () => {
    if (round === 1) {
      console.log("GameInitializer Round 1");
      for (let i = 0; i < gamers.length; i++) {
        if (i === 0) {
          setCanSeeAns(true, gamers[i].name);
          setDrawable(true, gamers[i].name);
        } else if (i === 1 || i === 3) {
          setCanSeeAns(true, gamers[i].name);
          setDrawable(false, gamers[i].name);
        } else {
          setCanSeeAns(false, gamers[i].name);
          setDrawable(false, gamers[i].name);
        }

      }

      if (gamers[0].name !== myUserName) {
        setIAmPainter(false)
      }
      if (gamers[2].name === myUserName) {
        setIAmSolver(true);
      }
      console.log("Round 1 - 초기화 실행 완료!!");
    }

  }

  // MRSEO: 게임 초기화
  const GameInitializer2 = () => {
    if (round === 2) {
      console.log("GameInitializer Round 2");
      for (let i = 0; i < gamers.length; i++) {
        if (i === 1) {
          setCanSeeAns(true, gamers[i].name);
          setDrawable(true, gamers[i].name);
        } else if (i === 0 || i === 2) {
          setCanSeeAns(true, gamers[i].name);
          setDrawable(false, gamers[i].name);
        } else {
          setCanSeeAns(false, gamers[i].name);
          setDrawable(false, gamers[i].name);
        }

      }
      if (gamers[1].name !== myUserName) {
        setIAmPainter(false)
      } else {
        setIAmPainter(true)
      }

      if (gamers[3].name === myUserName) {
        setIAmSolver(true)
      }
      console.log("Round 2 - 초기화 실행 완료!!");
    }
    // console.log(gamers);
  }


  // JANG: 나중에 유저 입장이 안정적으로 처리되면 지울 것!
  const consoleCommand = () => {
    console.log("gamers : ", useStore.getState().gamers);
    console.log("host : ", host);
    console.log("gamers[0] : ", gamers[0].name);
    console.log("myUserName : ", myUserName)
    console.log("redScoreCnt : ", redScoreCnt);
    console.log("blueScoreCnt : ", blueScoreCnt);
    console.log("round : ", round);
    console.log("team : ", team);
    console.log("iAmSolver : ", iAmSolver);
    console.log("iAmPainter : ", iAmPainter);
    console.log("spyPainter : ", spyPainter);
    console.log("spy : ", iAmSpy);
    console.log("mode : " + useStore.getState().mode);
    // setCanSeeAns(!gamers[0].canSeeAns, gamers[0].name);
    // setDrawable(!gamers[0].drawable, gamers[0].name);
    console.log('audio : ', audio);
    publisher.publishAudio(!audio);
    setAudio(!audio);
  }

  //JANG: 08.06 - Chakra UI, 애니메이션 효과
  const { isOpen, onOpen, onClose } = useDisclosure();
  // JANG: 홈 타이틀 애니메이션 (bounce)
  const bounce_title = keyframes`
   0% { transform: scale(1); }
   50% { transform: scale(1.1); }
   100% { transform: scale(1); }
   `;

  // JANG: 홈 캐릭터 애니메이션
  const bounce_character = keyframes`
   0% { transform: translateY(15px); }
   50% { transform: translateY(-15px);}
   100% { transform: translateY(15px); }
   `;
  const animation_character = `${bounce_character} infinite 2s ease`;

  // JANG: 08.06 - ★★★ 아래 요소는 임시로 넣어 둠 (승자/패자에 대한 효과 처리)
  const [status, setStatus] = useState("game"); // game, vote, result

  // 마우스 설정 (위치와 상태 관리 및 처리)
  const [xy, setXy] = useState({ x: 0, y: 0 });
  const [pointerSize, setPointerSize] = useState(40);
  const xyHandler = (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    setXy({ x: mouseX, y: mouseY });
  };
  return (
    <div>

      {/* // JANG: 08.06 - 마우스 캐릭터 -> 나중에 주석 해지하기!! */}
      {/* <div
      onMouseMove={xyHandler}
      onMouseDown={() => {
        setPointerSize(40);
      }}
      onMouseUp={() => {
        setPointerSize(40);
      }}
      style={{ width: "100vw", height: "100vh", cursor: "none" }}
    >
      <Img
        src={`${process.env.PUBLIC_URL}/resources/images/character_squid.png`}
        alt="pointer"
        style={{
          background: "transparent", // 배경 투명
          transform: `translate(${xy.x}px, ${xy.y}px)`, // 마우스 위치에 따라 이미지 위치 변경
          position: "absolute", // 절대 위치
          width: pointerSize, // 이미지 크기
          height: pointerSize, // 이미지 크기
          left: -pointerSize / 2, // 이미지 크기의 절반만큼 왼쪽으로 이동
          top: -pointerSize / 2, // 이미지 크기의 절반만큼 위로 이동
          zIndex: "1000",
          pointerEvents: "none",
        }}
      /> */}

      {session === undefined ? (
        <Box textAlign="center" className="Home_Screen">
          <Grid minH="100vh" p={3}>
            <VStack
              spacing={8}
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              {/* 수직으로 요소들을 정렬, 자식 요소들 사이의 간격 8, 수평/수직으로 가운데 정렬, 부모의 요소 높이의 100%  */}

              <div>
                <Flex alignContent="center" justifyContent="center" h="100%">
                  <VStack spacing={10}>
                    {/* JANG: 로고 선정해서 넣기 */}
                    {/* <Flex
                      alignItems="center"
                      justifyContent="center"
                      bg="orange"
                      color="white"
                      w="60vw"
                      h="40vh"
                      borderRadius="md"
                      p={4}
                    >
                      <div class="Home_Logo" >
                      @ 1-1. 홈 화면 - 로고
                      </div>
                    </Flex> */}
                    <Box
                      colorScheme="teal"
                      borderRadius="md"
                      w="800px"
                      h="400px"
                      onClick={() => {
                        onOpen(); // 첫 번째 작업
                        clickSquid(); // 두 번째 작업
                      }}
                      className="Home_Button"
                    >
                    </Box>
                    {/* @ 1-1. 홈 화면 캐릭터 */}
                    <div className="character">
                      <Img
                        src={`${process.env.PUBLIC_URL}/resources/images/character_squid.png`}
                        alt="character"
                        width="10%"
                        height="25%"
                        animation={animation_character}
                        position="fixed"
                        top="30px"
                        left="300px"
                      />
                      <Img
                        src={`${process.env.PUBLIC_URL}/resources/images/character_shark.png`}
                        alt="character"
                        width="15%"
                        height="25%"
                        animation={animation_character}
                        position="fixed"
                        top="200px"
                        right="150px"
                      />
                      <Img
                        src={`${process.env.PUBLIC_URL}/resources/images/character_crab.png`}
                        alt="character"
                        width="7%"
                        height="13%"
                        animation={animation_character}
                        position="fixed"
                        bottom="15px"
                        left="500px"
                      />
                      <Img
                        src={`${process.env.PUBLIC_URL}/resources/images/character_plant.png`}
                        alt="character"
                        width="30%"
                        height="50%"
                        // animation={animation_character}
                        position="fixed"
                        bottom="-50px"
                        left="-80px"
                      />
                    </div>


                    {/* @ 1-2. 닉네임, 방번호 입력 모달창 */}
                    <Modal isOpen={isOpen} onClose={onClose} isCentered>
                      <ModalOverlay />
                      <ModalContent className="JoinForm">
                        <ModalHeader>
                          <h2 style={{ textAlign: "center" }}>게임 참가</h2>
                        </ModalHeader>
                        <ModalCloseButton />

                        <form onSubmit={joinSession}>
                          <ModalBody pb={6}>
                            <div style={{ width: "75%", margin: "0 auto" }}>
                              <FormLabel>닉네임</FormLabel>
                              <Input
                                type="text"
                                id="userName"
                                value={myUserName}
                                onChange={handleChangeUserName}
                                required
                                style={{ marginBottom: "10px" }}
                              />
                              <FormLabel>ROOM 넘버</FormLabel>
                              <Input
                                type="text"
                                id="sessionId"
                                value={mySessionId}
                                onChange={handleChangeSessionId}
                                required
                              />
                            </div>
                          </ModalBody>

                          <ModalFooter>
                            <Button
                              onClick={() => {
                                onClose(); // 첫 번째 작업
                                entranceSquid(); // 두 번째 작업
                              }}
                              colorScheme="teal"
                              size="md"
                              type="submit"
                            >
                              입장하기
                            </Button>
                          </ModalFooter>
                        </form>
                      </ModalContent>
                    </Modal>
                  </VStack>
                </Flex>
              </div>
            </VStack>
          </Grid>
        </Box>
      ) : null}

{session !== undefined ? (
        <Box textAlign="center" className="Game_Screen">
          {/* MRSEO: useStore.getState()지움 */}
          {phase === "Ready" || phase === "Game1" || phase === "Game2" ? (
            // JANG: 게임 대기방으로 만들기!
            <Flex className="Game_Screen_in1"
              textAlign="center"
              height="100%"
              width="100%"
              flexDirection="column"
              alignItems="center" // 자식 요소들이 교차 축을 최대한 차지하도록 설정
              justifyContent="center"
            >
              {/* JANG: 게임 대기방 */}
              <Flex flex="9.5" width="100%">
                <SessionContext.Provider value={{ mySessionId, myUserName }}>
                  <BasicUI />
                </SessionContext.Provider>
              </Flex>

              {/* JANG: 하단에 Test 버튼과 EXIT 버튼 임시로 ORIGIN_Webcam.js에 넣어둠 */}
              {myUserName === host && gamers?.length === 4 ? (
                    <Button
                      colorScheme="Messenger"
                      size="lg"
                      onClick={handleGameStart}
                      marginRight="10px"
                    >
                      Start
                    </Button>
              ) : null}
              
              </Flex>
            // </Flex>
          ) : null}
        </Box>
      ) : null}

    </div>
  );
};

export default Webcam;

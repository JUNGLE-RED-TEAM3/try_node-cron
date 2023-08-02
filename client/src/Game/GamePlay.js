import React, { useEffect } from "react";
import UserVideoComponent from "../Openvidu/UserVideoComponent";
import useStore from "../store";
import "./GamePlay.css";

// JANG: 유저 리스트를 밖으로 뺌
// import "./UserList.css";
// JANG: 유저 플레이 게임 훅 추가 (아래 없길래)
// import useGamePlay from "../Hook/GamePlayHook";
// JANG: bootstrap react
import {Row, Col, Button, Badge } from "react-bootstrap";



// import GamePlayContext from "../Context/GamePlayContext";

// 게임 컴포넌트
import WhiteCanvas from "./WhiteCanvas";

// 게임 훅
import useGamePlay from "../Hook/GamePlayHook";

function GamePlay() {

  const [
    gameState,
    gameStateDispatch,
    initialQuestionWordState,
  ] = useGamePlay();

  // JANG: 유저들 관리
  const {
    gamers,
    playerCount,
    setPlayerCount,
    myUserID,
    setMyIndex,
    curSession,
  } = useStore();

  // JANG: 유저들 관리 (useEffect)
  useEffect(() => {
    if (curSession !== undefined) {
      setPlayerCount(gamers.length);
    }
    // 재 렌더링 되는 건 맞지만, 자식 요소가 재 렌더링 되지는 않음

    
  }, [gamers]);

  
    return (
      // <GamePlayContext.Provider value={{ gameState, gameStateDispatch }}>
      <>
      <div>
      <Row>
        <Col xs={3} style={{ color: 'white', textAlign: 'center' }}>
          <Button variant="outline-danger"><h1 style={{ fontWeight: 'bold' }}>RED SCORE</h1></Button>
        </Col>
        <Col xs ={3} style={{color: 'white', textAlign: 'center'}}>
          <Button variant="outline-success"><h1 style={{ fontWeight: 'bold' }}>라운드</h1></Button>
        </Col>
        <Col xs ={3} style={{color: 'white', textAlign: 'center'}}>
          <Button variant="outline-warning"><h1 style={{ fontWeight: 'bold' }}>타이머</h1></Button>
        </Col>
        <Col xs ={3} style={{color: 'white', textAlign: 'center'}}>
          <Button variant="outline-primary"><h1 style={{ fontWeight: 'bold' }}>BLUE SCORE</h1></Button>
        </Col>
      </Row>

      <Row style={{'width': '100%', margin: '10 auto'}}>
      
      <Col xs={3} className="User_Left">
        <div className="LeftVideoBox">
            <div className="VideoBox">
              <div id={0} className="VideoFrame_Out">
                {gamers[0] && (
                  <div className="VideoFrame_In">
                    <UserVideoComponent
                      streamManager={gamers[0].streamManager}
                      my_name={gamers[0].name}
                      key={gamers[0].name}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="VideoBox">
              <div id={2} className="VideoFrame_Out">
                {gamers[2] && (
                  <div className="VideoFrame_In">
                    <UserVideoComponent
                      streamManager={gamers[2].streamManager}
                      my_name={gamers[2].name}
                      key={gamers[2].name}

                    />
                  </div>
                )}
              </div>
            </div>
        </div>
      {/* </div> */}
      </Col>
      
      <Col xs={6}>
        <div className="GameCanvas_Right">
          <WhiteCanvas />
        </div>
      </Col>
      
      <Col xs={3} className="User_Right">
        <div className="VideoBox">
        <div id={1} className="VideoFrame_Out">
          {gamers[1] && (
            <div className="VideoFrame_In">
              <UserVideoComponent
                streamManager={gamers[1].streamManager}
                my_name={gamers[1].name}
                key={gamers[1].name}

              />
            </div>
          )}
        </div>
      </div>

      <div className="VideoBox">
        <div id={3} className="VideoFrame_Out">
          {gamers[3] && (
            <div className="VideoFrame_In">
              <UserVideoComponent
                streamManager={gamers[3].streamManager}
                my_name={gamers[3].name}
                key={gamers[3].name}

              />
            </div>
          )}
        </div>
      </div>
    </Col>
    </Row>
    </div>
    </>
      // </GamePlayContext.Provider>
    );  
  }
  export default GamePlay;
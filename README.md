# TwistedPuzzleScrambler

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-blue.svg)](https://discord.com/oauth2/authorize?client_id=1496050132486193192)
[![Node.js](https://img.shields.io/badge/Node.js-18.x+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

> 디스코드에서 간편하게 즐기는 WCA 공인 큐브 스크램블 생성 봇

## 주요 기능
* **대회 규격 스크램블 제공**: 실제 WCA 공인대회 규격의 스크램블
* **다양한 퍼즐 지원**: 3x3x3부터 2x2x2, 4x4x4, 피라밍크스(Pyraminx), 메가밍크스(Megaminx) 등 WCA 공인 퍼즐들의 스크램블을 지원합니다.
* **직관적인 명령어**: 누구나 쉽게 사용할 수 있는 간단한 슬래시 명령어(`/`) 기반으로 제작되었습니다.
* **가벼움과 안정성**: 빠르고 안정적인 응답 속도로 끊김 없이 봇을 이용할 수 있습니다.
* **통계 및 로깅 지원**: 봇 사용량 및 에러를 추적하고, 통계를 CSV로 추출할 수 있습니다.

### 업데이트 예정
* **시각화 기능**: 스크램블 상태를 간단한 이미지나 텍스트로 미리 볼 수 있는 기능이 업데이트될 예정입니다.
* **비공인 큐브 스크램블 지원**: 8x8x8 이상의 빅큐브들이나, WCA에 공인 종목으로 등록되지 않은 특수큐브들의 스크램블을 생성하는 기능이 업데이트 될 예정입니다.

### 검토중 
* **주간 솔빙**: 매주 공개되는 스크램블을 가지고 다른 큐버들과 기록 경쟁을 할 수 있는 기능이 검토되고 있습니다.
* **트레이닝 세션**: 공식을 연습할수 있는 스크램블을 생성하는 기능이 검토되고 있습니다.

## 명령어
모든 명령어는 디스코드 슬래시 인터랙션(`/`)을 통해 사용합니다.

| 명령어 | 설명 | 예시 |
| :--- | :--- | :--- |
| `/help`| 봇의 도움말과 명령어 목록을 확인합니다. | `/help` |
| `/puzzle-list` | 지원하는 전체 퍼즐 목록을 확인합니다. | `/puzzle-list` |
| `/scramble` | WCA 규격에 따른 퍼즐 종목별 단일 스크램블을 생성합니다. | `/scramble event:3x3`<br>`/scramble event:3x3 mbld count:5`| 
| `/scramble-set` | WCA 규격에 따른 퍼즐 종목별 스크램블 세트를 생성합니다. | `/scramble-set event:2x2`<br>`/scramble-set event:3x3 mbld count:10` |

## 사용된 기술 스택 (Tech Stack)
* **Language**: Node.js (JavaScript)
* **Library**: `discord.js`, `cubing.js`, `winston`

## 설치 및 초대
* **봇 초대하기**: [여기를 클릭하여 디스코드 서버에 봇을 초대하세요](https://discord.com/oauth2/authorize?client_id=1496050132486193192)
* **지원 서버**: 사용 중 문제가 발생하거나 건의사항이 있다면 [지원 서버]()에 입장해 주세요.

## 로컬 개발 및 실행 (Self-Hosting)
소스 코드를 직접 클론하여 개인 봇으로 실행하고 싶다면 아래 단계를 따르세요.

### 1. 사전 요구사항 (Prerequisites)
*   Node.js (v18 이상 권장)
*   Discord Bot Token

### 2. 설치 방법 (Getting Started)
```bash
# 저장소 복제
git clone https://github.com/penguinjean0421/cube-scrambler.git

# 프로젝트 폴더로 이동
cd cube-scrambler

# 의존성 패키지 설치
npm install
```

### 3. 환경 변수 설정 (.env)
프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래 내용을 입력하세요.
```
BOT_TOKEN=your_bot_token_here
```

### 4. 봇 실행하기
```bash
node index.js
```

## 라이선스
이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 `LICENSE` 파일을 확인하세요.
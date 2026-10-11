# Cove

### Your little corner, together.

Cove is a cozy, private watch-party experience for sharing YouTube videos with people who are somewhere else. Create a room, send the link, and settle in with synchronized playback, room chat, lightweight reactions, and optional peer-to-peer video calling.

> Built for the moments when distance should not mean watching alone.



![Next.js](https://img.shields.io/badge/Next.js-15-2b2925?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-657b69?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-557c73?style=flat-square&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-302c28?style=flat-square&logo=socket.io&logoColor=white)



## Why Cove exists

Watching a video together remotely should feel like sharing a sofa, not coordinating timestamps in one window while chatting in another. Cove keeps the small things in one calm room: the video stays central, everyone receives the same playback state, and conversation can stay close by without taking over the screen.

The product is deliberately lightweight: no account system, no public room directory, and no permanent profile. A room is a temporary little corner for the people who have its link.


## How it works

1. Open Cove and create a room. The backend returns an unguessable room ID and a one-time creator token.
2. Enter a temporary display name. 
3. Share the room link with up to three other people.
4. Paste a YouTube URL into the room. Playback actions are broadcast through the server and reconciled on each client.
5. Chat, react to a moment, or turn on a camera if the group wants to be more present.
6. The host can change the shared room atmosphere/theme without changing the video itself.


## Getting started

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer.


### 1. Clone the repository

```bash
git clone https://github.com/niharika-278/cove.git
cd cove
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment

```bash
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
```

### 4. Build the shared package once


```bash
npm run build -w shared
```


### 5. Start Cove

```bash
npm run dev
```
 With the default environment, open:

- Cove: <http://localhost:3000>


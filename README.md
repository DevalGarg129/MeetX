# MeetX — Full-Stack Video Conferencing

A full-stack video conferencing app built with **React**, **Node.js**, **Express**, **MongoDB**, **Socket.io (WebSockets)** and **WebRTC**.

---

## 📁 Project Structure

```
MeetX/
├── backend/
│   ├── server.js                  # Express + Socket.io entry point
│   ├── .env                       # Environment variables
│   ├── package.json
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── models/
│   │   ├── Room.js                # Room schema (participants, messages, reactions)
│   │   └── User.js                # User schema (auth)
│   ├── controllers/
│   │   ├── roomController.js      # Create/get/end rooms
│   │   ├── userController.js      # Register/login
│   │   └── chatController.js      # Save/fetch messages
│   ├── routes/
│   │   ├── roomRoutes.js
│   │   ├── userRoutes.js
│   │   └── chatRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT protect
│   └── socket/
│       └── socketHandler.js       # All Socket.io event handlers
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── package.json
    └── src/
        ├── App.js                 # Router + Providers
        ├── index.js
        ├── styles/
        │   └── global.css         # CSS variables, buttons, layout
        ├── context/
        │   ├── SocketContext.js   # Single socket.io instance
        │   └── RoomContext.js     # Shared meeting state
        ├── hooks/
        │   ├── useWebRTC.js       # Peer connections, streams, screen share
        │   ├── useAudioMeter.js   # Feature 5: Live audio level meter
        │   └── useToast.js        # Toast notifications
        ├── utils/
        │   └── api.js             # Axios wrappers for all API calls
        ├── pages/
        │   └── LandingPage.js     # Home: create/join meeting
        └── components/
            ├── shared/
            │   ├── Navbar.js
            │   └── ToastContainer.js
            ├── lobby/
            │   └── LobbyPage.js   # Feature 1: Waiting room + camera preview
            └── room/
                ├── RoomPage.js    # Main meeting room
                ├── VideoTile.js   # Single participant video tile
                ├── ControlsBar.js # Mic/cam/screen/reactions/hand
                ├── Sidebar.js     # Sliding chat + participants panel
                ├── ChatPanel.js   # Feature 2: Real-time chat
                ├── ParticipantsPanel.js
                └── ReactionsPicker.js # Feature 4: Emoji reactions
```

---

## ✨ 5 New Features Added

| # | Feature | Where |
|---|---------|-------|
| 1 | **Lobby / Waiting Room** — Camera + mic preview before joining, see who's already in | `LobbyPage.js` |
| 2 | **Real-time Chat** — Messages persisted to MongoDB, broadcast via Socket.io | `ChatPanel.js`, `chatController.js` |
| 3 | **Screen Sharing** — `getDisplayMedia()` with WebRTC track replacement | `useWebRTC.js`, `socketHandler.js` |
| 4 | **Reactions + Raise Hand** — Emoji picker with animated bubbles, hand-raised badge on tiles | `ReactionsPicker.js`, `socketHandler.js` |
| 5 | **Live Audio Level Meter** — Web Audio API `AnalyserNode` shows speaking state in lobby and room controls | `useAudioMeter.js` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)

### 1. Backend

```bash
cd backend
npm install
# Edit .env with your MONGO_URI and JWT_SECRET
npm run dev
# Server starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
# App opens on http://localhost:3000
```

---

## 🛰 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms/create` | Create a new room |
| GET  | `/api/rooms/:code` | Get room info |
| PUT  | `/api/rooms/:code/end` | End/close a room |
| POST | `/api/chat/:code/message` | Save a chat message |
| GET  | `/api/chat/:code/messages` | Fetch all messages |
| POST | `/api/users/register` | Register user |
| POST | `/api/users/login` | Login user |
| GET  | `/api/users/me` | Get current user (JWT protected) |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `lobby:check` | Client→Server | Check participants in lobby |
| `lobby:info` | Server→Client | Return participant list |
| `room:join` | Client→Server | Join a room |
| `room:user-joined` | Server→Client | Notify others |
| `room:existing-participants` | Server→Client | Send participant list to new user |
| `room:user-left` | Server→Client | Notify others on disconnect |
| `webrtc:offer/answer/ice-candidate` | Bidirectional | WebRTC signaling |
| `media:toggle-mic/cam` | Client→Server | Broadcast media state |
| `media:user-toggled-*` | Server→Client | Receive media state changes |
| `chat:message` | Bidirectional | Real-time chat |
| `chat:system` | Server→Client | System messages |
| `screenshare:start/stop` | Client→Server | Screen share events |
| `screenshare:started/stopped` | Server→Client | Notify peers |
| `reaction:send` | Client→Server | Send emoji reaction |
| `reaction:received` | Server→Client | Broadcast reaction |
| `hand:raise` | Client→Server | Toggle raise hand |
| `hand:changed` | Server→Client | Broadcast hand state |
| `audio:speaking` | Client→Server | Speaking state change |
| `audio:user-speaking` | Server→Client | Broadcast speaking state |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | Pure CSS (CSS Variables) |
| Real-time | Socket.io-client + WebRTC |
| HTTP Client | Axios |
| Backend | Node.js + Express |
| WebSockets | Socket.io |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |

# Texas Hold'em Poker Game

## Project Overview
This project is a real-time Texas Hold'em poker game designed for private and community play. The game features essential poker logic, real-time multiplayer capabilities, user authentication, and various gameplay enhancements.

## Bare Minimum Requirements

### **Poker Game Logic**
- Texas Hold'em rules implementation.
- Deck of cards (52-card deck logic, shuffling, dealing).
- Hand ranking system.
- Betting system (handling bets, calls, raises, folds).
- Turn management (timer for player actions).

### **Server (Backend)**
- Real-time communication.
- Game state management (store player hands, pot size, turn order).
- Networking (handle communication between players).
- User authentication.

### **Client (Frontend)**
- Basic UI (display cards, chips, and action buttons).
- Real-time updates (player actions reflected across all clients).
- Input handling (betting, folding, checking).

### **Player Account System**
- Username, total player earnings, credits, profile picture, and account creation date.

### **Table Chat Box**
- In-game chat for players.

### **Game Privacy Types**
- Community tables, public games, and private games (lobby keys).

## Software Engineering Principles
- Agile development with documented story cards.

## Advanced Features (Stretch Goals)
We aim to implement as many of the following advanced features as possible with the remaining time:

- Sound effects and animations.
- Variable opponent strategy/difficulty (AI).
- Coaching system (suggest best statistical moves).
- Two players sharing one hand.
- Friends system (friends-only lobbies, invites, status, stats).
- Spectator mode.
- **Advanced Account Statistics**: Track gameplay stats (hands played, win rate, biggest pot win, etc.).
- **Learning Center**: Tutorials and resources for new players.
- **Voice/Video Chat**: Real-time communication between players.

---

## **Getting Started**

This project consists of both a **backend** (Node.js with Express and Socket.IO) and a **frontend** (React). Follow the steps below to set up your development environment and run the project locally.

### **Prerequisites**

Ensure that you have the following installed:
- [Node.js (v20 LTS or higher)](https://nodejs.org/)
- [npm (comes with Node.js)](https://www.npmjs.com/)
- [Git](https://git-scm.com/)

---

### **1. Backend Setup**

The backend is a Node.js server with Express and Socket.IO.

#### **Install Dependencies**

In the project root folder (where `package.json` is located), run:

```sh
cd backend
npm install
npm install dotenv
npm install pg
```

This will install all required backend dependencies.

#### **Create environment variables**

Create .env file

```sh
touch .env
```

Add environment variables to .env file

```sh
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Natebartel04  # Replace with the actual password for each developer
DB_NAME=postgres
```

#### **Run the Backend**

To start the backend server on port `3001`, run:

```sh
npm start
```

You should see:

```
Server is running on http://localhost:3001
```

---

### **2. Frontend Setup**

The frontend is a React app.

#### **Install Dependencies**

In the frontend directory, run:

```sh
cd frontend
npm install
```

This will install all required frontend dependencies.

#### **Run the Frontend**

To start the React development server on port `3000`, run:

```sh
npm start
```

You should see:

```
Frontend is running on http://localhost:3000
```

---

### **3. Verify Connection**

1. Open your browser and navigate to `http://localhost:3000` (frontend).
2. The frontend should automatically connect to the backend on `http://localhost:3001` via **Socket.IO**.
3. If everything is set up correctly, you should see real-time messages being displayed from the backend.

---

### **4. Important Notes**

- **CORS**: Ensure that you have configured **CORS** in the backend to allow requests from the frontend (`http://localhost:3000`).
- **Socket.IO**: The real-time connection between the backend and frontend will be handled by Socket.IO.
- If you're working on a specific branch or feature, make sure to pull the latest changes:
  ```sh
  git pull origin main
  ```

---

### **5. Troubleshooting**

- If you encounter a **CORS error**: Ensure your backend is correctly configured to allow requests from `http://localhost:3000`.
- If you encounter errors related to missing dependencies, make sure you've run `npm install` in both the **frontend** and **backend** directories.

---

### **6. Oauth**

-npm install @react-oauth/google
-npm install react-router-dom
-npm install express pg cors body-parser dotenv

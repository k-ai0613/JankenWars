import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { v4 as uuidv4 } from "uuid";
import { log } from "./vite";

interface GameRoom {
  id: string;
  players: {
    [socketId: string]: {
      username: string;
      ready: boolean;
      playerNumber: 1 | 2 | null;
    }
  };
  gameState: any;
  inProgress: boolean;
  spectators: string[]; // SocketIDs of spectators
}

// Store active game rooms
const gameRooms: { [roomId: string]: GameRoom } = {};

// Store waiting users for matchmaking
let waitingUsers: { socketId: string, username: string }[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // API routes for game rooms
  app.get('/api/game-rooms', (req, res) => {
    // Return only rooms that are not in progress
    const availableRooms = Object.entries(gameRooms)
      .filter(([_, room]) => !room.inProgress)
      .map(([id, room]) => ({
        id,
        playerCount: Object.keys(room.players).length,
        players: Object.values(room.players).map(p => p.username)
      }));
    
    res.json({ rooms: availableRooms });
  });

  const httpServer = createServer(app);
  
  // Set up Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    log(`New client connected: ${socket.id}`);
    
    // User joins with username
    socket.on("user:join", (username: string) => {
      log(`User joined: ${username} (${socket.id})`);
      
      // Store user data in socket
      socket.data.username = username;
    });
    
    // User requests to create a game room
    socket.on("room:create", () => {
      const roomId = uuidv4().substring(0, 8);
      const username = socket.data.username || "Anonymous";
      
      gameRooms[roomId] = {
        id: roomId,
        players: {
          [socket.id]: {
            username,
            ready: false,
            playerNumber: 1 // Creator is player 1
          }
        },
        gameState: null,
        inProgress: false,
        spectators: []
      };
      
      // Join the room
      socket.join(roomId);
      
      // Notify client
      socket.emit("room:created", {
        roomId,
        players: [{
          id: socket.id,
          username,
          playerNumber: 1,
          ready: false
        }]
      });
      
      log(`Room created: ${roomId} by ${username}`);
    });
    
    // User joins an existing room
    socket.on("room:join", (roomId: string) => {
      const room = gameRooms[roomId];
      const username = socket.data.username || "Anonymous";
      
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }
      
      if (room.inProgress) {
        // If game is in progress, add as spectator
        room.spectators.push(socket.id);
        socket.join(roomId);
        socket.emit("room:joined:spectator", {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber,
            ready: data.ready
          }))
        });
        return;
      }
      
      const playerCount = Object.keys(room.players).length;
      
      if (playerCount >= 2) {
        // Room is full, add as spectator
        room.spectators.push(socket.id);
        socket.join(roomId);
        socket.emit("room:joined:spectator", {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber,
            ready: data.ready
          }))
        });
      } else {
        // Join as player 2
        room.players[socket.id] = {
          username,
          ready: false,
          playerNumber: 2
        };
        
        socket.join(roomId);
        
        // Notify all clients in the room
        io.to(roomId).emit("room:player:joined", {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber,
            ready: data.ready
          }))
        });
        
        log(`Player joined room: ${username} joined ${roomId}`);
      }
    });
    
    // Player ready status toggle
    socket.on("player:ready", (roomId: string) => {
      const room = gameRooms[roomId];
      
      if (!room || !room.players[socket.id]) {
        return;
      }
      
      // Toggle ready status
      room.players[socket.id].ready = !room.players[socket.id].ready;
      
      // Notify all clients in the room
      io.to(roomId).emit("room:player:ready", {
        playerId: socket.id,
        ready: room.players[socket.id].ready,
        players: Object.entries(room.players).map(([id, data]) => ({
          id,
          username: data.username,
          playerNumber: data.playerNumber,
          ready: data.ready
        }))
      });
      
      // Check if all players are ready to start
      const allReady = Object.values(room.players).every(p => p.ready);
      const playerCount = Object.keys(room.players).length;
      
      if (allReady && playerCount === 2) {
        room.inProgress = true;
        io.to(roomId).emit("game:start", {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber
          }))
        });
        
        log(`Game started in room ${roomId}`);
      }
    });
    
    // Player game move
    socket.on("game:move", (roomId: string, moveData: any) => {
      const room = gameRooms[roomId];
      
      if (!room || !room.players[socket.id] || !room.inProgress) {
        return;
      }
      
      // Forward the move to all players in the room
      socket.to(roomId).emit("game:move", {
        playerId: socket.id,
        playerNumber: room.players[socket.id].playerNumber,
        ...moveData
      });
    });
    
    // Quick matchmaking
    socket.on("matchmaking:join", () => {
      const username = socket.data.username || "Anonymous";
      
      // Add user to waiting queue
      waitingUsers.push({
        socketId: socket.id,
        username
      });
      
      log(`User ${username} joined matchmaking queue`);
      
      // If we have at least 2 users waiting, match them
      if (waitingUsers.length >= 2) {
        const player1 = waitingUsers.shift()!;
        const player2 = waitingUsers.shift()!;
        
        const roomId = uuidv4().substring(0, 8);
        
        gameRooms[roomId] = {
          id: roomId,
          players: {
            [player1.socketId]: {
              username: player1.username,
              ready: false,
              playerNumber: 1
            },
            [player2.socketId]: {
              username: player2.username,
              ready: false,
              playerNumber: 2
            }
          },
          gameState: null,
          inProgress: false,
          spectators: []
        };
        
        // Join both players to the room
        io.sockets.sockets.get(player1.socketId)?.join(roomId);
        io.sockets.sockets.get(player2.socketId)?.join(roomId);
        
        // Notify both players
        io.to(roomId).emit("matchmaking:matched", {
          roomId,
          players: [
            {
              id: player1.socketId,
              username: player1.username,
              playerNumber: 1,
              ready: false
            },
            {
              id: player2.socketId,
              username: player2.username,
              playerNumber: 2,
              ready: false
            }
          ]
        });
        
        log(`Matched players: ${player1.username} and ${player2.username} in room ${roomId}`);
      } else {
        // Notify the user they're in queue
        socket.emit("matchmaking:waiting");
      }
    });
    
    // Cancel matchmaking
    socket.on("matchmaking:cancel", () => {
      // Remove user from waiting list
      waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
      socket.emit("matchmaking:cancelled");
    });
    
    // Handle game results
    socket.on("game:result", (roomId: string, result: any) => {
      const room = gameRooms[roomId];
      
      if (!room || !room.inProgress) {
        return;
      }
      
      // Broadcast result to all players and spectators
      io.to(roomId).emit("game:result", result);
      
      // Game is no longer in progress
      room.inProgress = false;
      
      log(`Game ended in room ${roomId} with result: ${JSON.stringify(result)}`);
    });
    
    // Handle disconnect
    socket.on("disconnect", () => {
      // Remove from waiting users
      waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
      
      // Handle player leaving rooms
      for (const roomId in gameRooms) {
        const room = gameRooms[roomId];
        
        // If player is in this room
        if (room.players[socket.id]) {
          // Remove player
          delete room.players[socket.id];
          
          if (Object.keys(room.players).length === 0) {
            // Delete empty room
            delete gameRooms[roomId];
            log(`Room ${roomId} deleted (empty)`);
          } else {
            // Notify remaining players
            io.to(roomId).emit("player:left", {
              playerId: socket.id,
              players: Object.entries(room.players).map(([id, data]) => ({
                id,
                username: data.username,
                playerNumber: data.playerNumber,
                ready: data.ready
              }))
            });
          }
        }
        
        // If spectator, remove from spectators
        const spectatorIndex = room.spectators.indexOf(socket.id);
        if (spectatorIndex !== -1) {
          room.spectators.splice(spectatorIndex, 1);
        }
      }
      
      log(`Client disconnected: ${socket.id}`);
    });
  });

  return httpServer;
}

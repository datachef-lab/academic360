import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";

const wss = new WebSocketServer({ port: 8081 });
const clients: { [userId: string]: WebSocket } = {};

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const userId = new URL(req.url || "", `http://localhost`).searchParams.get("userId");

    if (userId) {
        clients[userId] = ws;

        console.log(`User ${userId} connected.`);

        // Handle disconnection
        ws.on("close", () => {
            console.log(`User ${userId} disconnected.`);
            delete clients[userId]; // Cleanup on disconnect
        });
    }
});

export const broadcastMessage = (userId: string, response: any) => {
    if (clients[userId]) {
        clients[userId].send(JSON.stringify(response));
    } else {
        console.log(`User ${userId} not connected.`);
    }
};

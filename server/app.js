import { WebSocketServer } from 'ws'

const server = new WebSocketServer({ port: 5001 })

let sockets = []

let nextId = 1;
let nextMessageId = 1
let systemMessageId = 1

server.on('connection', (socket) => {
    socket.send(JSON.stringify({ "senderId": "server", "content": `Hello socket-${nextId} from the server!`, "id": "greet" }))
    socket.id = nextId++;
    sockets.push(socket)
    const availableSockets = sockets.reduce((previous, socket) => { return previous + socket.id.toString() }, '').split('').join(', ')
    sockets.forEach(socket => {
        socket.send(JSON.stringify({ senderId: "server", "content": `The list of available recipients are as follows, ${availableSockets}`, "id": `system-${systemMessageId}` }))
    })
    socket.on("message", (message) => {
        const clientMessage = JSON.parse(message);
        const senderId = socket.id
        if (clientMessage.recipientId === "") {
            sockets.forEach(socket => {
                socket.send(
                    JSON.stringify({ senderId, content: clientMessage.content, id: `message-${nextMessageId}` })
                );
            })
        }
        else {
            const recipientSocket = sockets.find(socket => {
                return socket.id === Number(clientMessage.recipientId)
            })
            socket.send(JSON.stringify({ senderId, content: clientMessage.content, id: `message-${nextMessageId}` }))
            recipientSocket.send(JSON.stringify({ senderId, content: clientMessage.content, id: `message-${nextMessageId}` }))
        }
    });
    socket.on("close", () => {
        const socketId = socket.id
        sockets = sockets.filter(s => s !== socket);
        const availableSockets = sockets.reduce((previous, socket) => { return previous + socket.id.toString() }, '').split('').join(', ')
        sockets.forEach(socket => {
            socket.send(
                JSON.stringify({ senderId: "server", content: `Socket ${socketId} is now offline`, id: `message-${nextMessageId}` })
            );
            socket.send(JSON.stringify({ senderId: "server", "content": `The list of available recipients are as follows, ${availableSockets}`, "id": `system-${systemMessageId}` }))
        })
    });
})
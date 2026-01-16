//socker manager controller
import { Server } from 'socket.io';

let connections = {}; //for number od connected clients:: {"roomA": [socket1, socket2] "roomB": [socket3]}
let message = {};
let timeOnline = {};
export const connectToSocket = (server) => {
    //setting connectiong with socket.io
    const allowedOrigins = [
        "https://video-meetingfrontend.onrender.com",
        "http://localhost:5173"
    ];
    const io = new Server(server, {
        //handle cors error od io
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            credentials: true
        }
    });

    //main socket.io comunication stuff: io.on()// like a event listner
    //these lines down: new client connected to socket and callback function
    //connect request from specific client from frontend is hanled here
    io.on("connection", (socket) => {
        //here can put any name but on client side should be same during hearing(.emit)
        console.log("SOMETHING IS CONNECTED");
        socket.on("join-call", (path) => {
            console.log("=== USER JOINING CALL ===");
            console.log("Socket ID:", socket.id);
            console.log("Path/Room:", path);

            //join-call (from frontend:: socket.emit("join-call", roomId);) event request handler ::path is same as roomId
            // NOw :::::::::::handle the join request
            //just in case connection path is undefined
            if (connections[path] == undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id);//Store the socket ID of the newly connected user inside the array for that specific room (path)
            console.log("connections[path]", connections[path]);//gives the array of socket ids of all the clients in the room
            console.log("socket.id", socket.id);
            console.log("Current connections for room:", connections[path]);
            timeOnline[socket.id] = new Date();
            //response from server to individual client (emit) that user joined and with we send socket id
            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path])//we have now the new;y joined scoket and all the existing socket in the array
            }


            //When a new user joins a call room, the server re-sends previous chat messages (stored in message[path]) to that user so they can see message history.
            if (message[path] !== undefined) {
                for (let a = 0; a < message[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", message[path][a]['data'],
                        message[path][a]['sender'], message[path][a]['socket-id-sender'])
                }
            }
        })


        //signal event handler is part of a WebRTC signaling mechanism::::::::::::;🔀 One-to-one communication
        //This event helps two peers (clients) exchange WebRTC signaling data (like offer, answer, ICE candidates) via the Socket.IO server.
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })


        //for chat message reciened from frontend like HI has been sent then its is handled here:::: Room-wide broadcast
        socket.on("chat-message", (data, sender) => {
            //using higher order functions
            //steps:
            //1) Find the room this socket is part of
            //2)store the message
            //3)BroadCast: Loop through everyone in that room and emit
            const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                if (!isFound && roomValue.includes(socket.id)) {
                    return [roomKey, true];
                }
                return [room, isFound]
            }, ['', false]);
            //if we found the room
            if (found == true) {
                if (message[matchingRoom] == undefined) {
                    message[matchingRoom] = []
                }

                message[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id });
                console.log("message", matchingRoom, ":", sender, data);

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }
        })
        socket.on("disconnect", () => { //▶️ This runs automatically when any client disconnects from the server
            //math functiom
            var diffTime = Math.abs(timeOnline[socket.id] - new Date()); //how much time active

            //steps:
            //✅ Find the room (key) they belonged to.(can be optimized so that every time we dont tranverse over entire room)
            //✅ Notify everyone in the room: "user-left" with the disconnected user's socket ID.
            //✅ Remove the disconnected user from the room.
            //✅Deletes the room if it's empty.
            //✅Cleans up memory tracking   


            var key //Stores the room name this socket belonged to.
            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {

                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k

                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }

                        var index = connections[key].indexOf(socket.id)

                        connections[key].splice(index, 1)


                        if (connections[key].length === 0) {
                            delete connections[key]
                        }
                    }
                }

            }
        })
    })

    return io;
}



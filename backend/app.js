import express from 'express';
const app = express();
import {createServer} from "node:http";

import {Server} from "socket.io";
import mongoose from "mongoose";
//need to mention js
import {connectToSocket} from './src/controllers/socketManager.js'
import cors from "cors";
import router from './src/routes/user.routes.js'
//config for cors for production editing
const allowedOrigins = [
    "https://apnavideocall.duckdns.org",
    "http://16.192.105.47",
    "https://video-call-frontend-w9cp.onrender.com",
    "http://localhost:5173"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
app.use(express.json({limit:"40kb" }));
app.use(express.urlencoded({limit:"40kb" , extended:true}));
const server = createServer(app); // now app is working in server 
//const io = new Server(server);  but we to make the code readable we make the controller at the other file 
//of soket Manager in controller and call the finction here
  const io = connectToSocket(server);

app.set("port" , (process.env.PORT || 8000));

app.get("/home" , (req,res)=>{
    return res.json({"hello":"world"});

});

const start = async ()=>{
    /*app.listen(8000 , ()=>{
        console.log("Listening on port 8080");
    })*/
   //after connectiong server and mongoose
   const connectionDb = await mongoose.connect("mongodb+srv://sakhilsharma123:sakhil98@cluster0.nxhqxnx.mongodb.net/")
//we can also check the conenction host
         console.log(`MONGO connected DB Host :${connectionDb.connection.host}`);
   server.listen(app.get("port"), ()=>{
    console.log("Listening at the port 8000");
})
}
start();
//this way  is used for making different versions
app.use("/api/users" ,router); //distributed codes for users -redability

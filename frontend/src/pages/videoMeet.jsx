
import "../styles/videoComponent.css";
import { Badge, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import { useRef, useState, useEffect } from 'react';
import io from "socket.io-client";
import IconButton from "@mui/material/IconButton";
import CloseIcon from '@mui/icons-material/Close';
var connections = {};
import { useNavigate } from 'react-router-dom';
import server from '../environment'
const server_url = server; //web socket server
const peerConfigConnections = { //stun servers
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    const routeTo = useNavigate();
    //{window.location.href  /*this tells us where are we our address of frontend like:http://localhost:5173/4262 */}

    var socketRef = useRef();
    let socketIdRef = useRef();


    //access or control the real DOM ::useRef
    let localVideoRef = useRef(); //our video gets displayed on this refernce ::creates a ref object.........  ref:{ null }

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState();

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setShowModel] = useState(false);//popup and all
    let [screenAvailable, setScreenAvailable] = useState(); //need to check screen is Available or not

    let [messages, setMessages] = useState([]); //array

    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0); //title popup

    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    let [videos, setVideos] = useState([]);
    const videoRef = useRef([]); //list o f video  ref 

    //if (isChrome() === false) {
    //    //webRTC works on chromium based browser : basically all browser
    //}

    const getPermissions = async () => {
        try {
            //navigator have all acces harware and all
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            // The Promise resolves with a MediaStream object and if denied The Promise rejects and throws an error
            if (videoPermission) {
                //if permission is given from the window then we can set videoAvailablity : true
                setVideoAvailable(true);

            }
            else {
                setVideoAvailable(false);
            }

            //for audio similiar
            const audioPermissions = await navigator.mediaDevices.getUserMedia({ audio: true });

            if (audioPermissions) {
                //if permission is given from the window
                setAudioAvailable(true);

            }
            else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                //used to on the screen sharing
                setScreenAvailable(true);
            }
            else {
                setScreenAvailable(false);

            }

            if (videoAvailable || audioAvailable) {
                // If at least video or audio is available (true)\
                //here:navigator.mediaDevices.getUserMedia({video: videoAvailable , audio : audioAvailable})
                //  This asks the user for permission to access their camera and/or microphone.
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });

                if (userMediaStream) {
                    //If the user allows access, getUserMedia() gives you a MediaStream object
                    //You save the stream globally (attached to the window):This is simply a convenient way to store the MediaStream globally,
                    //  so it can be accessed later from anywhere in your code
                    window.localStream = userMediaStream;
                    if (localVideoRef.current) {
                        //localVideoRef.current was null until the <video> DOM element is rendered and mounted in the DOM.
                        // //This part displays the live stream in a <video> element (using a React ref).
                        //localVideoRef.current is a reference to the video DOM element. and we set it equal to videoStream form navigator
                        localVideoRef.current.srcObject = userMediaStream;
                    }

                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        //as we enter into the intial lobby of joining state we need to have permissions for audio and video
        getPermissions();
    }, [])



    let getUserMediaSuccess = (stream) => {
        console.log("getUserMediaSuccess called with stream:", stream);

        // Safely stop existing tracks if localStream exists
        try {
            if (window.localStream && window.localStream.getTracks) {
                const tracks = window.localStream.getTracks();
                if (tracks && tracks.length > 0) {
                    tracks.forEach(track => track.stop());
                }
            }
            else {
                console.log("cant find the window.localStream or something in getUserMediaSuccess");
            }
        } catch (e) {
            console.log("Error stopping existing tracks:", e)
        }

        window.localStream = stream
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoRef.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }


    let getUserMedia = () => {
        //this is main video call feature and not the lobby one
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess) // Pass the function reference, don't call it immediately
                .catch((e) => console.log("getUserMedia error:", e));

        }
        else {
            try {
                if (localVideoRef.current && localVideoRef.current.srcObject) {
                    let tracks = localVideoRef.current.srcObject.getTracks();//returns an array of all media tracks (video + audio) in that stream.
                    tracks.forEach(track => track.stop());
                    //this turns off the webcam and mic — very important for cleanup!
                }
            }
            catch (e) {
                console.log("Error stopping tracks:", e);
            }
        }
    }
    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video]);

    // Debug effect to monitor videos state
    useEffect(() => {
        //console.log("=== VIDEOS STATE CHANGED ===");
        //console.log("Videos array:", videos);
        //console.log("Videos length:", videos.length);
    }, [videos]);





    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    let connectToSocketServer = () => {
        console.log("connected to scoket :step 1");

        //as a connection request is sent it automatically passes the socket/client credentials to backend as parameter
        //for every client/user specific socket.io is crearted by scoket.io package
        socketRef.current = io.connect(server_url, { secure: false })
        //created user side scoket 
        //secure is just an header
        socketRef.current.on('signal', gotMessageFromServer);

        //chat inmplemetation
        socketRef.current.on("chat-message", addMessage);


        socketRef.current.on('connect', () => {
            console.log("join call request sent");
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id; //make a scoketisRef for the newly connected socket/user

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => { //id gives single sccoket id and clients refer to all the connected clients in the room
                console.log("=== USER JOINED EVENT ===");
                console.log("Joined user ID:", id);
                console.log("All clients:", clients);
                console.log("Current socket ID:", socketIdRef.current);
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("=== onaddstream triggered ===");
                        console.log("Socket ID:", socketListId);
                        console.log("Event stream:", event.stream);
                        console.log("Event stream tracks:", event.stream.getTracks());

                        setVideos(currentVideos => {
                            console.log("Current videos in state:", currentVideos);//this is an array 
                            //make eshure the id may exist already in the room 
                            let videoExists = currentVideos.find(video => video.socketId === socketListId);

                            if (videoExists) {
                                //Already Exists → Update the Stream
                                console.log("FOUND EXISTING - Updating stream");
                                //Replaces the old stream with the new one for that socketId.
                                const updatedVideos = currentVideos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                console.log("Updated videos:", updatedVideos);
                                return updatedVideos;
                            } else {
                                // Create a new video
                                console.log("CREATING NEW video entry");
                                //created a custom object === every video should have socketId , stream souurce, autplay etc
                                let newVideo = {
                                    socketId: socketListId,
                                    stream: event.stream,
                                    autoplay: true,
                                    playsinline: true
                                };

                                const updatedVideos = [...currentVideos, newVideo];
                                videoRef.current = updatedVideos;
                                console.log("Added new video, total videos:", updatedVideos);
                                return updatedVideos;
                            }
                        });
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        //black silence
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                //WebRTC offer broadcasting block
                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;//if it matches the current connected user 
                        //else
                        try {
                            //Tries to attach your own webcam/audio to the peer connection.
                            //This is what lets others receive your video.
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        //Creating an offer to establish the peer connection::::::::::LIKE
                        //“Hey id2, I’m trying to connect to you.
                        //Here’s my connection offer. Please look at it and respond.”

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }
    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }


    let getMedia = () => {
        //now after taking all the permissions we set audio and video
        setVideo(videoAvailable);
        setAudio(audioAvailable);


        connectToSocketServer(); //conncetion to the socket ... handled by backend as io.on("connection", ()=>{})
    }
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }
    let handleVideo = () => {
        setVideo(!video);
        // getUserMedia();
    }
    let handleAudio = () => {
        setAudio(!audio)
        // getUserMedia();
    }


    let getDisplayMediaSuccess = (stream) => {
        //SCREEN SHARING FEATURE
        console.log("getDisplayMediaSuccess called with stream:", stream)
        try {
            //we will stop first all the tracks
            if (window.localStream && window.localStream.getTracks) {
                window.localStream.getTracks().forEach(track => track.stop())
            }
        } catch (e) { console.log("Error stopping display media tracks:", e) }
        //now after clearing all the tracks we will make oue localStream as 
        window.localStream = stream
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                if (localVideoRef.current && localVideoRef.current.srcObject) {
                    let tracks = localVideoRef.current.srcObject.getTracks()
                    tracks.forEach(track => track.stop())
                }
            } catch (e) { console.log("Error stopping tracks on screen end:", e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = window.localStream;
            }

            getUserMedia();//call

        })
    }

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e));
            }
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let chatMessage = () => {
        setShowModel(!showModal);
    }

    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage(""); // now we emit this message to backend socket and any request to the chat-message is 
        //reponses in scoket connection as addMessage function: Implement addMessage after this

        //// this.setState({ message: "", sender: username })
    }
    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    let handleEndCall = () => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop())
        }
        catch (e) { }

        routeTo("/home");
    }

    return (
        <>
            <div>
                {askForUsername === true ?
                    <div className="LobbyArea">
                        <div className="lobbyCard">
                            <h2>Enter Into Lobby</h2>
                            <TextField
                                id="outlined-basic"
                                label="Enter Name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                variant="outlined"
                            />
                            {username ? <Button variant="contained" onClick={connect}>
                                Connect
                            </Button> :
                                <Button variant="contained" disabled>
                                    Connect
                                </Button>
                            }

                            <div className="video-container">
                                <video ref={localVideoRef} autoPlay muted></video>
                            </div>
                        </div>
                    </div>

                    : <div className='meetVideoContainer'>

                        {showModal ? <div className="chatRoom">
                            <div className="chatHeader">
                                <h1>Chat</h1>
                                <IconButton className="closeButton" onClick={chatMessage}>
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            <div className="chattingDisplay">
                                {
                                    messages.length !== 0 ? messages.map((item, index) => {
                                        return (
                                            <div className="chatBubble" key={index}>
                                                <span className="senderName">{item.sender}</span>
                                                <span className="messageText">{item.data}</span>
                                            </div>
                                        )
                                    }) : <p className="emptyChat">No messages yet</p>
                                }
                            </div>

                            <div className="chatContainer">
                                <div className="chattingArea">
                                    <TextField
                                        label="Enter Message"
                                        id="outlined-basic"
                                        variant="outlined"
                                        size="small"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <Button variant="contained" onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </div> :
                            <></>
                        }

                        <div className="conferenceView">
                            {
                                videos.map((video) => (
                                    <div key={video.socketId}>
                                        <video
                                            className="conferenceClients"
                                            data-socket={video.socketId}
                                            ref={
                                                ref => {
                                                    {
                                                        if (ref && video.stream) {
                                                            ref.srcObject = video.stream;
                                                        }
                                                    }
                                                }
                                            }
                                            autoPlay
                                        >
                                        </video>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="selfViewWrapper">
                            <video className='meetUserVideo' ref={localVideoRef} autoPlay muted></video>
                            <span className="selfViewLabel">You</span>
                        </div>

                        <div className="buttonContainer">
                            <IconButton onClick={handleVideo} style={{ color: 'white' }}>
                                {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                            <IconButton onClick={handleEndCall} style={{ color: '#ff5c5c' }}>
                                <CallEndIcon />
                            </IconButton>
                            <IconButton onClick={handleAudio} style={{ color: 'white' }}>
                                {(audio === true) ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>

                            {screenAvailable === true ? <IconButton onClick={handleScreen} style={{ color: 'white' }}>
                                {screen == true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton> :
                                <IconButton>
                                </IconButton>}

                            <Badge badgeContent={newMessages} max={999} color={"secondary"}>
                                <IconButton style={{ color: 'white' }} onClick={chatMessage}>
                                    <ChatIcon />
                                </IconButton>
                            </Badge>
                        </div>
                    </div>

                }
            </div >
        </>
    )
}
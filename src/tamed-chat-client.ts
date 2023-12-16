import io from "socket.io-client";

class TamedChatClient {

    chatClient: ReturnType<typeof io>;
    avData: object = {};
    peerConnection: any;

    AVCallEstablishedCallback: Function;
    errorCallback: Function;

    rtcProvider: Function;
    localStreamBinder: Function;
    remoteStreamBinder: Function;
    cleanUp: Function;

    constructor(
        socketURL: string,
        socketConnectCallBack: Function,
        socketDisconnectCallBack: Function,
        textMessageCallback: Function,
        incomingAVCallCallback: Function,
        AVCallEstablishedCallback: Function,
        hangupCallback: Function,
        errorCallback: Function,
        rtcProvider: Function,
        localStreamBinder: Function,
        remoteStreamBinder: Function,
        cleanUp: Function,
    ) {

        this.chatClient = io(socketURL);
        this.AVCallEstablishedCallback = AVCallEstablishedCallback;
        this.errorCallback = errorCallback;

        this.chatClient.on("connect", () => {
            socketConnectCallBack();
        });

        this.chatClient.on("disconnect", () => {
            socketDisconnectCallBack();
        });

        this.chatClient.on("message", (payload) => {
            if (payload?.msg?.action == "AVCallMade") {
                this.avData["callData"] = payload;
                this.avData["from"] = this.avData["callData"].from;
                incomingAVCallCallback(this.avData["callData"].from, this.avData["callData"].msg.callId);
            } else if (payload?.msg?.action == "AVAnswerMade") {
                if (payload.msg.answer) {
                    this.avData["answerData"] = payload;
                    this._establishCall();
                } else if (payload.msg.ic) {
                    this.peerConnection.addIceCandidate(payload.msg.ic)
                        .catch(err => this.avData["icArr"].push(payload.msg.ic));
                }
            } else if (payload?.msg?.action == "AVCallClosed") {
                const callId = this.avData["callData"]?.msg.callId || this.avData["answerData"]?.msg.callId;
                this._reset();
                hangupCallback(callId);
            } else {
                textMessageCallback(payload);
            }
        });

        this.chatClient.on("error", (data) => {
            errorCallback(data);
        });

        this.rtcProvider = rtcProvider;
        this.localStreamBinder = localStreamBinder;
        this.remoteStreamBinder = remoteStreamBinder;
        this.cleanUp = cleanUp;

        this._reset();
    }

    _errCatch = (err) => {
        this.errorCallback(err);
    }

    _establishCall = () => {
        if (this.chatClient.connected) {
            this.peerConnection.setRemoteDescription(this.rtcProvider("RTCSessionDescription", this.avData["answerData"].msg.answer))
                .then(_ => Promise.all(this.avData["icArr"].map((x) => this.peerConnection.addIceCandidate(x))))
                .then(_ => this.AVCallEstablishedCallback(this.avData["to"], this.avData["answerData"].msg.callId))
                .catch(this._errCatch);
        } else {
            this.errorCallback("Channel Closed!");
        }
    }

    _reset = () => {
        if (this.peerConnection) {
            this.avData = {};
            this.cleanUp();
            try {
                this.peerConnection.close();
            } catch (err) {
                console.warn(err);
            }
        }
        this.peerConnection = this.rtcProvider();
        this.avData = {};
        this.avData["icArr"] = [];
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.chatClient.send({
                    action: "makeAVAnswer",
                    data: {
                        ic: event.candidate,
                        to: this.avData["to"] || this.avData["from"]
                    }
                });
            }
        }
    }

    isInCall = () => {
        return (this.avData["to"] || this.avData["from"]) ? true : false;
    }

    makeAVCall = (to, privacy) => {
        this.avData["to"] = to;
        if (this.chatClient.connected) {
            this.remoteStreamBinder(this.peerConnection);
            this.localStreamBinder(this.peerConnection)
                .then(_ => this.peerConnection.createOffer())
                .then(offer => this.peerConnection.setLocalDescription(this.rtcProvider("RTCSessionDescription", offer)))
                .then(_ => {
                    this.chatClient.send({
                        action: "makeAVCall",
                        data: {
                            offer: this.peerConnection.localDescription,
                            to: to,
                            privacy
                        }
                    });
                })
                .catch(this._errCatch);
        } else {
            this.errorCallback("Channel Closed!");
        }
    }

    acceptCall = (privacy) => {
        if (this.chatClient.connected) {
            this.remoteStreamBinder(this.peerConnection);
            this.localStreamBinder(this.peerConnection).then(() => this.peerConnection.setRemoteDescription(this.rtcProvider("RTCSessionDescription", this.avData["callData"].msg.offer)))
                .then(_ => Promise.all(this.avData["icArr"].map(x => this.peerConnection.addIceCandidate(x))))
                .then(() => this.peerConnection.createAnswer())
                .then(answer => this.peerConnection.setLocalDescription(this.rtcProvider("RTCSessionDescription", answer)))
                .then(_ => {
                    this.chatClient.send({
                        action: "makeAVAnswer",
                        data: {
                            answer: this.peerConnection.localDescription,
                            to: this.avData["callData"].from,
                            privacy: { ...privacy, callId: this.avData["callData"].msg.callId }
                        }
                    });
                    this.avData["from"] = this.avData["callData"].from;
                }).catch(this._errCatch);
        } else {
            this.errorCallback("Channel Closed!");
        }
    }

    loginUser = (data) => {
        this.chatClient.send({ action: "authorize", data });
    }

    getPastMessages = (to) => {
        if (this.chatClient.connected) {
            this.chatClient.send({ action: "getPastMessages", data: { to } })
        } else {
            this.errorCallback("Channel Closed!");
        }
    }

    sendMessage = (to, msg, privacy) => {
        if (this.chatClient.connected) {
            this.chatClient.send({ action: "newMessage", data: { to, msg, privacy } })
        } else {
            this.errorCallback("Channel Closed!");
        }
    }

    hangup = (privacy) => {
        const who = this.avData["to"] || this.avData["from"];
        if (who) {
            const callId = this.avData["callData"]?.msg.callId || this.avData["answerData"]?.msg.callId;
            if (callId) {
                this.chatClient.send({
                    action: "hangupAVCall",
                    data: {
                        to: who,
                        privacy: { ...privacy, callId }
                    }
                });
            }
        }
        this._reset();
    }

}

const WEB_RTC_PROVIDER = (whichObject: string, param) => {
    if (whichObject === "RTCSessionDescription") {
        return new RTCSessionDescription(param);
    } else {
        return new RTCPeerConnection();
    }
}

const WEB_CLEANUP = () => {
    const localVideo = document.getElementById('local-video') as HTMLVideoElement;
    const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
    if (localVideo)
        localVideo.srcObject = null;
    if (remoteVideo)
        remoteVideo.srcObject = null;
}

const WEB_REMOTE_STREAM_BINDER = (peerConnection) => {
    const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
    peerConnection.ontrack = function ({ streams }) {
        if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = streams[0];
        }
    };
}

const WEB_LOCAL_STREAM_BINDER = (peerConnection) => {
    const localVideo = document.getElementById('local-video') as HTMLVideoElement;
    return new Promise((resolve, reject) => {
        if (navigator.mediaDevices) {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    try {
                        if (!localVideo.srcObject) {
                            localVideo.srcObject = stream;
                        }
                        stream
                            .getTracks()
                            .forEach((track) => peerConnection.addTrack(track, stream));
                        resolve(stream)
                    } catch (err) {
                        reject(err);
                    }
                }).catch((err) => {
                    reject(err);
                });
        } else {
            try {
                (navigator as any).getUserMedia({ video: true, audio: true }, (stream) => {
                    stream.getTracks().forEach((track) => {
                        peerConnection.addTrack(track, stream);
                    });
                    resolve(stream);
                });
            } catch (err) {
                reject(err);
            }
        }
    });
}

export { TamedChatClient, WEB_CLEANUP, WEB_LOCAL_STREAM_BINDER, WEB_REMOTE_STREAM_BINDER, WEB_RTC_PROVIDER }

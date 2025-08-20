// see https://github.com/kaplanke/tamed-chat-server for Tamed Chat Server
// Enter local IP to [chrome://flags -> "Insecure origins treated as secure"] for non-ssl execution
// e.g. http://192.168.X.Y:9000

var socketURL = "ws://192.168.1.10:5001";
var serverURL = "http://192.168.1.10:5001";

var callId = null;

var logBox = document.getElementById("logBox");
function logMsg(msg) {
    logBox.innerHTML = "<verbatim>" + msg + "</verbatim></br>" + logBox.innerHTML;
}
function logError(err) {
    logBox.innerHTML = "<b style='color:red'>Error:</b> <verbatim>" + err.message + "</verbatim></br>" + logBox.innerHTML;
}
document.getElementById("btnLoginUser").onclick = function () {
    tcc.loginUser({ userId: document.getElementById('user1id').value });
};
document.getElementById("btnGetPastMessages").onclick = function () {
    tcc.getPastMessages(document.getElementById('user1pm_to').value);
};
document.getElementById("btnSendMessage").onclick = function () {
    tcc.sendMessage(document.getElementById('user1sm_to').value, document.getElementById('user1sm_msg').value);
};
document.getElementById("btnMakeAVCall").onclick = function () {
    if (tcc.isInCall())
        tcc.hangup({ callId });
    callId = Date.now()
    tcc.makeAVCall(document.getElementById('user1av_to').value, { callId });
};
document.getElementById("btnSendPush").onclick = function () {
    let toUserId = document.getElementById('user1push_to').value;
    let payload = document.getElementById('user1push_msg').value;
    sendTamedPush(toUserId, payload);
};

const TamedChatClientExports = require("tamed-chat-client");
var TamedChatClient = TamedChatClientExports.TamedChatClient;

const tcc = new TamedChatClient(
    socketURL,
    function () {
        logMsg("Socket Connected");
    },
    function () {
        logMsg("Socket Disconnected");
    },
    function (payload) {
        logMsg("Message: " + JSON.stringify(payload));
    },
    function (from) {
        logMsg("Incoming call from " + from + " <br> You may " + "<a href=# onclick='window.tcc.acceptCall()'>Accept</a> or " + "<a href=# onclick='window.tcc.hangup()'>Decline</a><br>");
    },
    function (to) {
        logMsg("Call established to " + to);
    },
    function (err) {
        logMsg("Call terminated by peer.");
    },
    function (err) {
        logError(err);
    },
    TamedChatClientExports.WEB_RTC_PROVIDER,
    TamedChatClientExports.WEB_LOCAL_STREAM_BINDER,
    TamedChatClientExports.WEB_REMOTE_STREAM_BINDER,
    TamedChatClientExports.WEB_CLEANUP,
    function (data) {
        logMsg("<b style='color:green'>TamedPush received:</b> " + JSON.stringify(data));
        document.getElementById("push-result").textContent = "TamedPush received: " + JSON.stringify(data, null, 2);
    }
);
window.tcc = tcc;

function sendTamedPush(toUserId, payload) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", serverURL + "/push", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                logMsg("Push sent!");
            } else {
                logMsg("Failed to send tamed push: " + xhr.responseText);
            }
        }
    };
    xhr.onerror = function () {
        logMsg("Failed to send tamed push: Network error");
    };
    
    let parsedPayload;
    try {
        parsedPayload = JSON.parse(payload);
    } catch (e) {
        parsedPayload = payload;
    }
    xhr.send(JSON.stringify({
        toUserId: toUserId,
        payload: parsedPayload
    }));
}
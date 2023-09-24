
// see https://github.com/kaplanke/tamed-chat-server for Tamed Chat Server
// Enter local IP to chrome://flags -> Insecure origins treated as secure for non-ssl execution

var socketURL = "ws://192.168.1.104:5001/";

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
        tcc.hangup();
    setTimeout(() => { tcc.makeAVCall(document.getElementById('user1av_to').value) }, 3000);
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
    TamedChatClientExports.WEB_CLEANUP
);
window.tcc = tcc;


const session = require('electron').remote.session;
const ipc = require('electron').ipcRenderer;

// Query all cookies.
session.defaultSession.cookies.get({url: 'http://index.autographa.com'}, (error, cookie) => {
//    console.log(cookie[0].name);
    console.log(cookie[0].name + "|" + cookie[0].value);
});

const syncMsgBtn = document.getElementById('sync-msg');

syncMsgBtn.addEventListener('click', function () {
    const reply = ipc.sendSync('synchronous-message', 'ping');
    const message = `Synchronous message reply: ${reply}`;
    document.getElementById('sync-reply').innerHTML = message;
});

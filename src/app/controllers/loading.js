 const electron = require('electron').remote
 const {app} = electron

 document.getElementById("update-close").addEventListener("click", function (e) {
       var window = electron.getCurrentWindow();
       app.quit();
       window.close();
  });

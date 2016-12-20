var remote = require('remote');
var ipc = require('ipc');
var Menu = remote.require('menu')
var MenuItem = remote.require('menu-item')

// Build our new menu
var menu = new Menu()
menu.append(new MenuItem({
  label: 'Autographa Lite 1.0 ',
  submenu: [
  {
    label: 'Prefs',
    click: function() {
    // Trigger an alert when menu item is clicked
    ipc.show('send-settings');
  }
  }]

}))
menu.append(new MenuItem({
  label: 'More Info...',
  click: function() {
    // Trigger an alert when menu item is clicked
    alert('Here is more information')
  }
}))

// Add the listener
document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.js-context-menu').addEventListener('click', function (event) {
    menu.popup(remote.getCurrentWindow());
  })
})

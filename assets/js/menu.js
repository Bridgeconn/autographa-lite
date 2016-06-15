// var remote = require('remote');
// var ipc = require('ipc');
// var Menu = remote.require('menu')
// var MenuItem = remote.require('menu-item')

// // Build our new menu
// var menu = new Menu()
// menu.append(new MenuItem({
//   label: 'Autographa Lite 1.0 ',
//   submenu: [
//   {
//     label: 'Prefs',
//     click: function() {
//     // Trigger an alert when menu item is clicked
//     ipc.show('send-settings');
//   }
//   }]

// }))
// menu.append(new MenuItem({
//   label: 'More Info...',
//   click: function() {
//     // Trigger an alert when menu item is clicked
//     alert('Here is more information')
//   }
// }))

// // Add the listener
// document.addEventListener('DOMContentLoaded', function () {
//   document.querySelector('.js-context-menu').addEventListener('click', function (event) {
//     menu.popup(remote.getCurrentWindow());
//   })
// })


      const {remote} = require('electron');
      const {Menu, MenuItem} = remote;

      const menu = new Menu();
      menu.append(new MenuItem({label: 'MenuItem1', click() { console.log('item 1 clicked'); }}));
      menu.append(new MenuItem({type: 'separator'}));
      menu.append(new MenuItem({label: 'MenuItem2', type: 'checkbox', checked: true}));

      window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        menu.popup(remote.getCurrentWindow());
      }, false);



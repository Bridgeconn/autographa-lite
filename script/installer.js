#!/usr/bin/env node

const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')
const rimraf = require('rimraf')

deleteOutputFolder()
  .then(getInstallerConfig)
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  const rootPath = path.join(__dirname, '..')
  const outPath = path.join(rootPath, 'dist')
  console.log(outPath)
  return Promise.resolve({
    appDirectory: path.join(outPath, 'Autographa-win32-x64'),
    // iconUrl: 'https://raw.githubusercontent.com/electron/electron-api-demos/master/assets/app-icon/win/app.ico',
    // loadingGif: path.join(rootPath, 'assets', 'img', 'loading.gif'),
    certificateFile: "1fbb63d87f4fd1b5a72ef156c402ba96.cer",
    noMsi: true,
    outputDirectory: path.join(outPath, 'windows-installer'),
    exe: "Autographa.exe",
    setupIcon: path.join(rootPath, 'app', 'assets', 'images', 'autographa.ico')
    // setupIcon: path.join(rootPath, 'app', 'assets', 'images', 'icon.ico'),
    // skipUpdateIcon: true
  })
}

function deleteOutputFolder () {
  return new Promise((resolve, reject) => {
    rimraf(path.join(__dirname, '..', 'out', 'windows-installer'), (error) => {
      error ? reject(error) : resolve()
    })
  })
}
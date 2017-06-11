#!/usr/local/bin/node

const fs = require('fs');
const path = require('path');

// const SOURCE_DIR = '/Users/nayaabkhan/Dropbox/Music';
const SOURCE_DIR = '/Users/nayaabkhan/Desktop/Source';
const DESTINATION_DIR = '/Volumes/Print/Music';

const MUSIC_EXTENSIONS = ['.mp3', '.flac'];


const prependPath = (folderPath) => (filename) => path.join(folderPath, filename);
const isMusicFile = (filePath) => fs.lstatSync(filePath).isFile() && MUSIC_EXTENSIONS.indexOf(path.extname(filePath)) >= 0;
const isFolder = (filePath) =>  fs.lstatSync(filePath).isDirectory();


/**
 * syncs the given folder
 *
 * @param  {string}   path - The path of the folde to sync
 */
const syncFolder = (folderPath) => {
  console.log(`Processing folder "${folderPath}"`);

  // calculate corresponding destination path
  const destinationFolder = path.join(DESTINATION_DIR, path.relative(SOURCE_DIR, folderPath));
  console.log(`Destination folder "${destinationFolder}"`);

  // check if destination path exists, otherwise create it
  if (!fs.existsSync(destinationFolder) || !isFolder(destinationFolder)) {
    fs.mkdirSync(destinationFolder);
  }

  // get all files in the folder
  const folderContents = fs.readdirSync(folderPath).map(prependPath(folderPath));
  const musicFiles = folderContents.filter(isMusicFile);
  const folders = folderContents.filter(isFolder);

  folders.forEach(syncFolder);
};

// main
syncFolder(SOURCE_DIR);

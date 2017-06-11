#!/usr/local/bin/node

const fs = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');
const child_process = require('child_process');

// const SOURCE_DIR = '/Users/nayaabkhan/Dropbox/Music';
const SOURCE_DIR = '/Users/nayaabkhan/Desktop/Source';
// const DESTINATION_DIR = '/Volumes/Print/Music';
const DESTINATION_DIR = '/Users/nayaabkhan/Desktop/Destination';
const MUSIC_EXTENSIONS = ['.mp3', '.flac'];


const prependPath = (folderPath) => (filePath) => path.join(folderPath, filePath);
const isMusicFile = (filePath) => fs.lstatSync(filePath).isFile() && MUSIC_EXTENSIONS.indexOf(path.extname(filePath).toLowerCase()) >= 0;
const isFolder = (filePath) =>  fs.lstatSync(filePath).isDirectory();
const getRelativePathTo = (folderPath) => (filePath) => path.relative(folderPath, filePath);
const isFlac = (filePath) => path.extname(filePath).toLowerCase() === '.flac';
const renameFlacToMp3 = (filePath) => filePath.replace(/\.[^/.]+$/, '.mp3');
const renameMp3ToFlac = (filePath) => filePath.replace(/\.[^/.]+$/, '.flac');
const hasNoCorrespondingMp3File = (filePath) => !fs.existsSync(path.join(DESTINATION_DIR, renameFlacToMp3(filePath)));
const hasNoCorrespondingFlacFile = (filePath) => !fs.existsSync(path.join(SOURCE_DIR, renameMp3ToFlac(filePath)));

const minus = (a, b) => a.filter((i) => b.indexOf(i) < 0);


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

  // get all files in the source folder
  const sourceFolderContents = fs.readdirSync(folderPath).map(prependPath(folderPath));
  const sourceMusicFiles = sourceFolderContents.filter(isMusicFile);
  const sourceSubFolders = sourceFolderContents.filter(isFolder);

  // get all files in the destination folder
  const destFolderContents = fs.readdirSync(destinationFolder).map(prependPath(destinationFolder));
  const destMusicFiles = destFolderContents.filter(isMusicFile);
  const destSubFolders = destFolderContents.filter(isFolder);

  const sourceMusicFilesRelative = sourceMusicFiles.map(getRelativePathTo(SOURCE_DIR));
  const sourceSubFoldersRelative = sourceSubFolders.map(getRelativePathTo(SOURCE_DIR));
  const destMusicFilesRelative = destMusicFiles.map(getRelativePathTo(DESTINATION_DIR));
  const destSubFoldersRelative = destSubFolders.map(getRelativePathTo(DESTINATION_DIR));


  const filesToAdd = sourceMusicFilesRelative
    .filter(x => destMusicFilesRelative.indexOf(x) < 0 )
    .filter(hasNoCorrespondingMp3File);

  console.log(`${filesToAdd.length} new files to add...`);
  filesToAdd.forEach((f) => {
    if (isFlac(f)) {
      child_process.execSync(`ffmpeg -i "${path.join(SOURCE_DIR, f)}" -ab 320k -map_metadata 0 -id3v2_version 3 "${path.join(DESTINATION_DIR, renameFlacToMp3(f))}"`);
    } else {
      fs.copySync(path.join(SOURCE_DIR, f), path.join(DESTINATION_DIR, f));
    }
  });


  const filesToRemove = destMusicFilesRelative
    .filter(x => sourceMusicFilesRelative.indexOf(x) < 0 )
    .filter(hasNoCorrespondingFlacFile);

  console.log(`${filesToRemove.length} files to remove...`);
  filesToRemove.forEach((f) => {
    fs.unlink(path.join(DESTINATION_DIR, f));
  });

  const foldersToRemove = destSubFoldersRelative
    .filter(x => sourceSubFoldersRelative.indexOf(x) < 0 );

  console.log(`${foldersToRemove.length} folders to remove...`);
  foldersToRemove.forEach((f) => {
    rimraf.sync(path.join(DESTINATION_DIR, f));
  });

  sourceSubFolders.forEach(syncFolder);
};

// main
syncFolder(SOURCE_DIR);

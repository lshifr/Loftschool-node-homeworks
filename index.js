const path = require("path");
const {copyFile} = require("./copy-file-async");
const {traverse, ensureDir} = require("./dir-ops");

const filedir = __dirname + "/SampleFiles/Westerns";
const fileDest = __dirname + "/SampleFiles/NewWesterns";


const getFirstLetter = str => str.charAt(0).toUpperCase();

function categorizeFiles(sourceDir, targetDir, cb) {

    const getNewDirForFile = filename => path.join(
        targetDir, getFirstLetter(path.basename(filename))
    );

    const getNewFileName = (filename, dir) => path.join(dir, path.basename(filename));

    traverse(sourceDir, (err, filename) => {
        if (err){
            cb(err)
        } else {
            ensureDir(getNewDirForFile(filename), (err, dirpath) => {
                if (err) {
                    cb(err);
                } else {
                    copyFile(filename, getNewFileName(filename, dirpath), err => {
                        if (err) cb(err);
                    });
                }
            });
        }
    });
}

categorizeFiles(
    filedir,
    fileDest,
    err => {
        console.warn(`Something went wrong. The error was: ${err}`)
    }
);

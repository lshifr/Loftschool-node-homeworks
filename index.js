const fs = require("fs");
const path = require("path");
const { copyFile } = require("./copy-file-async");

const filedir = __dirname + "/SampleFiles/Westerns";
const fileDest = __dirname + "/SampleFiles/NewWesterns";

function traverse(filepath, cb) {
    fs.stat(filepath, (err, stats) => {
        if (err) throw err;
        if (stats.isDirectory()) {
            fs.readdir(filepath, (err, files) => {
                if (err) {
                    cb(err);
                } else {
                    files.forEach(filename =>
                        traverse(path.join(filepath, filename), cb)
                    );
                }
            });
        } else if (stats.isFile()) {
            cb(null, filepath);
        } else {
            cb(new Error(`Can't handle the file at path ${filepath}`));
        }
    });
}

// traverse(filedir, console.log);

const ensureDir = (dirpath, cb) => {
    fs.stat(dirpath, (err, stats) => {
        if (err || !stats.isDirectory()) {
            fs.mkdir(dirpath, { recursive: true }, err => {
                if (err) {
                    cb(err);
                } else {
                    cb(null, dirpath);
                }
            });
        }
    });
};

traverse(filedir, (err, filename) => {
    if (err) throw err;
    const fstLetter = path
        .basename(filename)
        .charAt(0)
        .toUpperCase();
    ensureDir(path.join(fileDest, fstLetter), (err, dirpath) => {
        if (err) throw err;
        copyFile(filename, path.join(dirpath, path.basename(filename)), err => {
            if (err) throw err;
        });
    });
});

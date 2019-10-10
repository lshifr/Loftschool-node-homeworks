const fs = require("fs");
const path = require("path");

function traverse(filepath, cb) {
    let innerError = false;
    let innercb = (error, arg) => {
        if(error){
            innerError = true;
        }
        cb(error, arg)
    };
    fs.stat(filepath, (err, stats) => {
        if (err) {
            cb(err);
        } else if (stats.isDirectory()) {
            fs.readdir(filepath, (err, files) => {
                if (err) {
                    cb(err);
                } else {
                    for(let filename of files){
                        if(innerError){
                            break;
                        }
                        traverse(path.join(filepath, filename), innercb);
                    }
                }
            });
        } else if (stats.isFile()) {
            cb(null, filepath);
        } else {
            cb(new Error(`Can't handle the file at path ${filepath}`));
        }
    });
}


const ensureDir = (dirpath, cb) => {
    fs.stat(dirpath, (err, stats) => {
        if (err || !stats.isDirectory()) {
            fs.mkdir(dirpath, {recursive: true}, err => {
                if (err) {
                    cb(err);
                } else {
                    cb(null, dirpath);
                }
            });
        } else {
            cb(null, dirpath);
        }
    });
};


module.exports = {traverse, ensureDir};

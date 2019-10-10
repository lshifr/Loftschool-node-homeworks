const fs = require("fs");
const path = require("path");

const wrapper = require("../common/callwrapper");


function traverse(filepath, cb) {
    let innerError = false;
    let innercb = (error, arg) => {
        if(error){
            innerError = true;
        }
        cb(error, arg)
    };
    wrapper.wrap(fs.stat)(filepath, (err, stats) => {
        if (err) {
            cb(err);
        } else if (stats.isDirectory()) {
            wrapper.wrap(fs.readdir)(filepath, (err, files) => {
                if (err) {
                    cb(err);
                } else {
                    for(let filename of files){
                        if(innerError){
                            break;
                        }
                        wrapper.wrap(traverse)(path.join(filepath, filename), innercb);
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
    wrapper.wrap(fs.stat)(dirpath, (err, stats) => {
        if (err || !stats.isDirectory()) {
            wrapper.wrap(fs.mkdir)(dirpath, {recursive: true}, err => {
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

const deleteFolderRecursiveSync = function(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursiveSync(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};


module.exports = {traverse, ensureDir, deleteFolderRecursiveSync};

const path = require("path");
const {copyFile} = require("./file-operations/copy-file-async");
const {traverse, ensureDir, deleteFolderRecursiveSync} = require("./file-operations/dir-ops");

const wrapper = require("./common/callwrapper");

const getFirstLetter = str => str.charAt(0).toUpperCase();

function categorizeFiles(sourceDir, targetDir, options, cb) {

    const {deleteOriginalFolder, verbose, defaultSource} = options;

    const getNewDirForFile = filename => path.join(
        targetDir, getFirstLetter(path.basename(filename))
    );

    const getNewFileName = (filename, dir) => path.join(dir, path.basename(filename));

    const taskMonitor = wrapper.createTaskMonitor(
        taskCount => {
            if(verbose){
                console.log(`Current task count: ${taskCount}`)
            }
        },
        () => {
            if(verbose){
                console.log("All copying tasks finished");
            }
            if(deleteOriginalFolder && (defaultSource !== source)){
                if(verbose){
                    console.log(`Deleting original folder ${source}`);
                }
                deleteFolderRecursiveSync(sourceDir)
            }
        }
    );

    traverse(sourceDir, (err, filename) => {
        if (err) {
            cb(err)
        } else {
            wrapper.wrap(ensureDir)(getNewDirForFile(filename), (err, dirpath) => {
                if (err) {
                    cb(err);
                } else {
                    const newfile = getNewFileName(filename, dirpath);
                    if(verbose){
                        console.log(`Copying file ${filename} into ${newfile}`);
                    }
                    wrapper.wrap(copyFile)(filename, newfile, err => {
                        if (err) cb(err);
                    });
                }
            });
        }
    });
    setTimeout(taskMonitor, 0);
}

module.exports = categorizeFiles;
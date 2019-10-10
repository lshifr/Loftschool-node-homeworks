const path = require("path");
const {copyFile} = require("./copy-file-async");
const {traverse, ensureDir, deleteFolderRecursiveSync} = require("./dir-ops");
let argv = require('yargs');
const wrapper = require("./callwrapper");

const defaultSource = __dirname + "/SampleFiles/Westerns";
const defaultDestination = __dirname + "/SampleFiles/NewFiles";


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

argv = argv
    .option('source', {
        alias: 's',
        description: 'Source folder'
        })
    .option('destination',{
        alias: 'd',
        description: 'Destination folder'
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Run with verbose logging'
    }).option('delete-source', {
        alias: 'ds',
        type: 'boolean',
        description: 'Delete the source folder'
    }).argv;

const source = argv.source || defaultSource;
const destination = argv.destination || defaultDestination;
const deleteOriginalFolder = argv['delete-source'];
const verbose = argv.verbose;


categorizeFiles(
    source,
    destination,
    {verbose, deleteOriginalFolder, defaultSource},
    err => {
        console.warn(`Something went wrong. The error was: ${err}`);
        throw err;
    }
);

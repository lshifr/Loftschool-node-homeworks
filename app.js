const categorizeFiles = require("./categorize");

const defaultSource = __dirname + "/SampleFiles/Westerns";
const defaultDestination = __dirname + "/SampleFiles/NewFiles";

const argv = require('yargs')
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

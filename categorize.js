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


    // Создаем монитор асинхронных задач для основной операции копирования файлов
    const taskMonitor = wrapper.createTaskMonitor(
        taskCount => {
            if (verbose) {
                // За этим довольно интересно наблюдать в режиме verbose
                console.log(`Current async task count: ${taskCount}`)
            }
        },
        () => {
            // Все операции копирования файлов завершены, можно удалять исходный каталог
            if (verbose) {
                console.log("All copying tasks finished");
            }
            if (deleteOriginalFolder && (defaultSource !== source)) {
                if (verbose) {
                    console.log(`Deleting original folder ${source}`);
                }
                // Я не стал заморачиваться с асинхронным рекурсивным удалением папки,
                // чтобы не перегружать код.
                deleteFolderRecursiveSync(sourceDir)
            }
        }
    );

    // Асинхронный рекурсивный проход исходной папки с созданием новой структуры
    // файлов
    traverse(sourceDir, (err, filename) => {
        if (err) {
            cb(err)
        } else {
            ensureDir(getNewDirForFile(filename), (err, dirpath) => {
                if (err) {
                    cb(err);
                } else {
                    const newfile = getNewFileName(filename, dirpath);
                    if (verbose) {
                        console.log(`Copying file ${path.basename(filename)}`);
                    }
                    copyFile(filename, newfile, err => {
                        if (err) cb(err);
                    });
                }
            });
        }
    });

    // Запускаем монитор асинхронных задач
    setTimeout(taskMonitor, 0);
}

module.exports = categorizeFiles;
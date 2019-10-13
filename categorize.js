const path = require("path");
const fsPromises = require('fs').promises;

/*
**  Проверка существования каталога
*/
const checkDir = async dir => fsPromises.stat(dir).then(stats => {
    return stats.isDirectory()
}).catch(() => {
    return false
});


/*
**  Создает каталог, если он не существует
*/
const checkOrCreateDir = async dir => {
    if (!await checkDir(dir)) {
        return fsPromises.mkdir(dir).catch(() => {});
    } else {
        return Promise.resolve()
    }
};


/*
**  Рекурсивный асинхронный проход по дереву каталогов. К файлам применяется
**  функция fileFunc, к под-каталогам - dirFunc. Обе должны возврашать promise.
**  Основная функция (traverse) возвращает promise, который разрешается по
**  полному завершению всех асинхронных операций на файлах и под-каталогах.
*/
const traverse = async (dir, fileFunc, dirFunc) => {
    const files = await fsPromises.readdir(dir);
    const processed = files.map(file => {
        const fullFileName = path.join(dir, file);
        return fsPromises.stat(fullFileName).then(stats => {
            if (stats.isDirectory()) {
                let result = traverse(fullFileName, fileFunc, dirFunc);
                if (dirFunc) {
                    // Post-order traversal
                    result = result.then(() => dirFunc(fullFileName));
                }
                return result;
            } else if (stats.isFile()) {
                return fileFunc ? fileFunc(fullFileName) : Promise.resolve();
            } else {
                // Just skip whatever it is
                return Promise.resolve();
            }
        })
    });
    return Promise.all(processed);
};

/*
**  Aсинхронное удаление каталога любой вложенности
*/
const rmDirRec = async dir => {
    await traverse(dir, fsPromises.unlink, fsPromises.rmdir);
    return fsPromises.rmdir(dir);
};


const getFirstLetter = str => str.charAt(0).toUpperCase();

const categorizeFiles = async (sourceDir, targetDir, options) => {

    const {deleteOriginalFolder, verbose, defaultSource} = options;

    await checkOrCreateDir(targetDir); // Если корневой каталог назначения отсутствует, создадим его

    await traverse(sourceDir, async filename => {
        const fileBaseName = path.basename(filename);
        const newDir = path.join(targetDir, getFirstLetter(fileBaseName));
        await checkOrCreateDir(newDir); // Создаем новый каталог по первой букве файла, если его нет
        await fsPromises.copyFile(filename, path.join(newDir, fileBaseName));
        if (verbose) {
            console.log(`Copying file ${fileBaseName}`);
        }
    });
    if (deleteOriginalFolder && (defaultSource !== sourceDir)) {
        if(verbose){
            console.log(`Removing the source folder: ${sourceDir}`);
        }
        await rmDirRec(sourceDir)
    }
};

module.exports = categorizeFiles;
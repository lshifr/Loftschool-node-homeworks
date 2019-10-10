const fs = require("fs");
const path = require("path");

const wrapper = require("../common/callwrapper"); //Генератор оберток для мониторинга асинхронных вызовов

// Создаем обертки над системными асинхронными функциями
const [fsstat, fsreaddir, fsmkdir] = [fs.stat, fs.readdir, fs.mkdir].map(wrapper.wrap);

/*
**  Рекурсивная функция для асинхронного прохода по каталогу
*/
function traverse(filepath, cb) {
    let innerError = false;

    // Обертка на callback, чтобы сразу завершить проход в случае ошибки
    let innercb = (error, arg) => {
        if (error) {
            innerError = true;
        }
        cb(error, arg)
    };

    // Основная функция рекурсивного прохода по каталогу
    const traverseRec = wrapper.wrap(
        (fpath, callback) => {
            // Получаем информацию о файле
            fsstat(fpath, (err, stats) => {
                if (err) {
                    callback(err);
                } else if (stats.isDirectory()) { // Это папка. Получаем список файлов и папок
                    fsreaddir(fpath, (err, files) => {
                        if (err) {
                            callback(err);
                        } else {
                            // Проходим рекурсивно по внутренним файлам и папкам
                            for (let filename of files) {
                                if (innerError) { // Ошибка при проходе предыдущего файла или папки. Заврешаем цикл.
                                    break;
                                }
                                traverseRec(
                                    path.join(fpath, filename), callback
                                );
                            }
                        }
                    });
                } else if (stats.isFile()) {
                    // Это файл. Вызываем callback на нем
                    callback(null, fpath);
                } else {
                    // Это не папка и не файл. Выдаем ошибку
                    callback(new Error(`Can't handle the file at path ${fpath}`));
                }
            });
        });

    // Собственно вызов
    traverseRec(filepath, innercb);
}


/*
**  Создает папку по имени, если папка не существует, и затем выполняет
**  callback
*/
const ensureDir = (dirpath, cb) => {
    fsstat(dirpath, (err, stats) => {
        if (err || !stats.isDirectory()) {
            // Папка не существует. Создаем ее
            fsmkdir(dirpath, {recursive: true}, err => {
                if (err) {
                    cb(err);
                } else {
                    cb(null, dirpath);
                }
            });
        } else {
            // Папка уже существует - просто выполняем callback
            cb(null, dirpath);
        }
    });
};


/*
**  Функция для синхронного рекурсивного удаления папки
*/
const deleteFolderRecursiveSync = function (path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursiveSync(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};


module.exports = {traverse, ensureDir, deleteFolderRecursiveSync};

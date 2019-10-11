const fs = require("fs");
const wrapper = require("../common/callwrapper");

class FileCopyError extends Error {
    constructor(message) {
        super(message);
        this.name = "FileCopyError";
    }
}

/*
 **  Create a "readable" listener which pauses reading until the predicate
 **  gives true.
 */
const readListenerFactory = (
    stream,
    dataConsumer,
    predicate,
    timeInterval = 100
) => {
    let initialized = false;
    let listener = () => {
        if (!initialized) { // Отрабатывает только один раз при первом вызове функции
            stream.on("close", remover);
            stream.on("end", remover);
            initialized = true;
        }
        let check = () => {
            // Переподписаться на событие 'readable', как только предикат выдаст true
            if (predicate()) {
                stream.on("readable", listener);
            } else {
                setTimeout(check, timeInterval);
            }
        };
        // Отписываемся от события 'readable', чтобы приостановить дальнейшее чтение
        stream.removeListener("readable", listener);
        let data;
        while (null !== (data = stream.read())) {
            // Вычитываем данные их буфера и передаем в функцию dataConsumer (асинхронно)
            dataConsumer(data, err => {
                if (err) throw err;
            });
        }
        check(); // Запускаем проверку возможности переподписаться на 'readable'
    };
    let remover = () => {
        // Удаляем обработчики
        stream.removeListener("readable", listener);
        stream.removeListener("close", remover);
        stream.removeListener("end", remover);
    };
    return listener;
};

/*
**  Обертка над Writable.
**  Принимает Writable stream
**  Возвращает объект с двумя методами: {consume, check}
*/
const readListenerAdapterFactory = writeStream => {
    let canWrite = true;
    let streamValid = true;
    writeStream.on("drain", () => {
        canWrite = true;
    });
    writeStream.on("close", () => {
        streamValid = false;
    });
    return {
        consume(data, errorHandler) {
            if (!streamValid) {
                errorHandler(new FileCopyError("Broken writable stream"));
            } else {
                canWrite = writeStream.write(data);
            }
        },
        check() {
            return canWrite;
        }
    };
};

/*
**  Асинхронно копирут файл src в dest
*/
exports.copyFile = wrapper.wrap(
    (src, dest, callback) => {
        const stream = fs.createReadStream(src);
        const ws = fs.createWriteStream(dest);

        // Создаем адаптер для readListener
        const readListenerAdapter = readListenerAdapterFactory(ws);

        // Coздаем обработчик на событие 'readable'
        const readListener = readListenerFactory(
            stream,
            readListenerAdapter.consume,
            readListenerAdapter.check,
            10
        );

        // Вешаем обработчики на 'end', 'readable' и 'error' для потока ввода,
        // и 'finish', 'error' для потока вывода. Это автоматически запускает
        // процесс копирования.
        stream.on("end", () => ws.end(Buffer.from([])));
        stream.on("readable", readListener);
        ws.on("finish", () => callback(null, dest));
        stream.on("error", err => {
            callback(new FileCopyError(err.message));
        });
        ws.on("error", err => {
            callback(new FileCopyError(err.message));
        });
    }
);

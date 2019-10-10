const fs = require("fs");

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
    if (!initialized) {
      stream.on("close", remover);
      stream.on("end", remover);
      initialized = true;
    }
    let check = () => {
      if (predicate()) {
        stream.on("readable", listener);
      } else {
        setTimeout(check, timeInterval);
      }
    };
    stream.removeListener("readable", listener);
    let data;
    while (null !== (data = stream.read())) {
      dataConsumer(data, err => {
        if (err) throw err;
      });
    }
    check();
  };
  let remover = () => {
    stream.removeListener("readable", listener);
    stream.removeListener("close", remover);
    stream.removeListener("end", remover);
  };
  return listener;
};

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

exports.copyFile = (src, dest, callback) => {
  const stream = fs.createReadStream(src);
  const ws = fs.createWriteStream(dest);

  const readListenerAdapter = readListenerAdapterFactory(ws);

  const readListener = readListenerFactory(
    stream,
    readListenerAdapter.consume,
    readListenerAdapter.check,
    50
  );

  stream.on("end", () => ws.end(Buffer.from([])));
  stream.on("readable", readListener);
  ws.on("finish", () => callback(null, dest));
  stream.on("error", err => {
    callback(new FileCopyError(err.message));
  });
  ws.on("error", err => {
    callback(new FileCopyError(err.message));
  });
};

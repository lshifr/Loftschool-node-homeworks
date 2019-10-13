const http = require('http');

const delay = process.env.RESPONSE_DELAY || 5;
const logInterval = process.env.LOG_INTERVAL || 1;
const port = process.env.PORT || 3000;

class RequestHandler {
    constructor() {
        this.activeRequests = 0;
        this.currentTimeoutID = null;
    }

    stopLogger() {
        clearTimeout(this.currentTimeoutID);
        this.currentTimeoutID = null;
    }

    refreshLogger(logger){
        if (this.activeRequests) {
            this.currentTimeoutID = setTimeout(logger, logInterval * 1000)
        } else if (this.currentTimeoutID) {
            this.stopLogger();
        }
    }

    connect(callback) {
        if (!this.activeRequests) {
            const printer = () => {
                console.log(this.getDate());
                this.refreshLogger(printer);
            };
            setTimeout(printer, 0); // Отложить запуск до следующей итерации event loop.
        }
        this.activeRequests++;
        setTimeout(
            () => {
                this.activeRequests--;
                callback()
            },
            delay * 1000
        )
    }

    getDate() {
        return new Date().toUTCString();
    }
}

const requestHandler = new RequestHandler();

const send404 = resp => {
    resp.writeHead(400, {'Content-Type': 'text/html'});
    resp.end(`<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Page not found</title>
                </head>
                <body>
                    <h1>Page not found</h1>
                </body>
                </html>
            `);
}

http.createServer((req, resp) => {
        if (req.method === 'GET') {
            if (req.url === '/favicon.ico') {
                resp.writeHead(200, {'Content-Type': 'image/x-icon'});
                resp.end('');
            } else {
                requestHandler.connect(
                    () => {
                        resp.writeHead(200, {'Content-Type': 'text/plain'});
                        resp.end(requestHandler.getDate());
                    }
                )
            }
        } else {
            send404(resp);
        }
    }
).listen(port, '127.0.0.1', (err) => {
    if (err) {
        return console.log(`The following error was encountered: ${err}`)
    }
    console.log(`Server is listening on ${port}`)
});

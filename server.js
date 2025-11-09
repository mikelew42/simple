import http from "http";
import path from "path";
import express from "express";
import { fileURLToPath } from 'url';

const SITENAME = "simple"; // the <base> path (/simple/) 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use("/" + SITENAME, express.static("docs", { redirect: false }));

app.use((req, res, next) => {
    console.log("req.path", req.path);

    // If this ends in ".ext", let it 404
    if (/\.[a-zA-Z0-9]+$/.test(req.path)) {
        return res.status(404).end();
    }

    res.sendFile(path.join(__dirname, './docs', '404.html'));
    
});

const server = http.createServer(app);
server.listen(80, () => {
    console.log("Serving ./docs at " + "localhost/" + SITENAME);
});
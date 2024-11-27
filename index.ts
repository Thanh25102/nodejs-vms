import express from "express";
import path from "path";
import cors from "cors"
import { exec, ChildProcess } from 'child_process';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const staticPath = path.join(__dirname, 'public');

const app = express();
const port = 3002;
let ffmpegProcess: ChildProcess[] = [];
app.use(cors(
    // {    origin: 'http://10.6.5.34:3002'}
));

app.use(express.static(staticPath));

const streamRtsp = [
    {
        id: 'camera1',
        url: `rtsp://10.6.204.56:554/stream1`
    },
    {
        id: 'camera2',
        url: `rtsp://10.6.204.31:554/stream1`
    },
    {
        id: 'camera3',
        url: `rtsp://10.6.204.2:554/stream1`
    },
    {
        id: 'camera4',
        url: `rtsp://10.6.204.3:554/stream1`
    },
    {
        id: 'camera5',
        url: `rtsp://10.6.204.6:554/stream1`
    },
]
const createCameraFolder = (id: string) => {
    const dir = path.join(staticPath, 'videos', id);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const ffmpegCommand = (rtsp: { id: string, url: string }) => `ffmpeg -i ${rtsp.url} -c:v copy -c:a aac -strict -2 -f hls -hls_time 2 -hls_list_size 3 -hls_flags delete_segments -hls_segment_filename "public/videos/${rtsp.id}/segment_%03d.ts" public/videos/${rtsp.id}/${rtsp.id}.m3u8`;

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
    console.log("Client connected to WebSocket");
});

app.get('/focus/:cameraId', (req, res) => {
    const cameraId = req.params.cameraId;
    console.log(`Focus on: ${cameraId}`);

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ action: 'focus', cameraId }));
        }
    });

    res.send(`Camera ${cameraId} focus requested.`);
});

app.get('/defocus/:cameraId', (req, res) => {
    const cameraId = req.params.cameraId;
    console.log(`Focus on: ${cameraId}`);

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ action: 'defocus', cameraId }));
        }
    });

    res.send(`Camera ${cameraId} defocus requested.`);
});


app.get("/", (req, res) => {
    res.send("Streaming server is up!");
});

const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    ffmpegProcess = streamRtsp.map(stream => {
        createCameraFolder(stream.id);
        return exec(ffmpegCommand(stream), (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
            }
            console.log(`Stdout: ${stdout}`);
        })
    }

    )
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
    });
});

// Dừng script chuyển đổi khi server tắt
const handleExit = async (signal: string) => {
    ffmpegProcess.forEach(p => p.kill('SIGINT'));
    process.exit();
};

process.on('SIGINT', () => handleExit('SIGINT'));
process.on('SIGTERM', () => handleExit('SIGTERM'));


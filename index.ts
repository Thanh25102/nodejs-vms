import express from "express";
import path from "path";
import cors from "cors"
import { exec, ChildProcess } from 'child_process';
import fs from 'fs';

// Đường dẫn đến thư mục chứa file tĩnh
const staticPath = path.join(__dirname, 'public');

// Sử dụng middleware express.static để phục vụ các file tĩnh
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
// Tạo thư mục cho từng camera
const createCameraFolder = (id: string) => {
    const dir = path.join(staticPath, 'videos', id);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Đường dẫn đến script chuyển đổi
const ffmpegCommand = (rtsp: { id: string, url: string }) => `ffmpeg -i ${rtsp.url} -c:v copy -c:a aac -strict -2 -f hls -hls_time 2 -hls_list_size 3 -hls_flags delete_segments -hls_segment_filename "public/videos/${rtsp.id}/segment_%03d.ts" public/videos/${rtsp.id}/${rtsp.id}.m3u8`;
// Khởi động script chuyển đổi khi server khởi động
app.listen(port, () => {
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

// Dừng script chuyển đổi khi server tắt
const handleExit = async (signal: string) => {
    ffmpegProcess.forEach(p => p.kill('SIGINT'));
    process.exit();
};

process.on('SIGINT', () => handleExit('SIGINT'));
process.on('SIGTERM', () => handleExit('SIGTERM'));

app.get("/", (req, res) => {
    res.send("Streaming server is up!");
});

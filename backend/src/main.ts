import fs from 'fs/promises';
import path from 'path';
import { Request } from "zeromq";
import { PNG } from 'pngjs';

const parsePng = (data: Buffer) => new Promise<Buffer>((resolve, reject) => {
    new PNG().parse(data, (error, png) => {
        if (error) {
            reject(error)
        } else {
            resolve(png.data);
        }
    });
});

async function run() {
    const sock = new Request();

    sock.connect("tcp://127.0.0.1:38989");
    console.log("Producer bound to port 38989");

    // Simulate game loop.
    let frame = 1;
    setInterval(async () => {
        if (frame > 201) {
            frame = 1;
        }

        try {
            const data = await fs.readFile(path.resolve(__dirname, `./assets/frame_${frame}.png`));
            const rgbaBuffer = await parsePng(data);
            await sock.send(rgbaBuffer);
            const [result] = await sock.receive();
        } catch (error) {

        }

        frame += 1;
    }, 50);
}

run()
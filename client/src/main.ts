import { Worker } from 'worker_threads';
import { Reply, Context } from "zeromq";

import GamePad from '../libs/node-gamepad';

/**
 * @link https://github.com/vitest-dev/vitest/issues/5757#issuecomment-2126095729
 */
class TsWorker extends Worker {
    constructor(filename: any, options: any = {}) {
        options.workerData ??= {};
        options.workerData.__ts_worker_filename = filename.toString();
        super(new URL("./worker.mjs", import.meta.url), options);
    }
}

const worker = new TsWorker(new URL("./worker.ts", import.meta.url));





const controller = new GamePad('logitech/gamepadf310');
// const controller = new GamePad('logitech/gamepadf310', { debug: true });
controller.connect();

const controlBuffer = new ArrayBuffer(8);
const view = new Uint8Array(controlBuffer);

controller.on('dpadUp:press', () => {
    console.log('up');
});
controller.on('dpadDown:press', () => {
    console.log('down');
});

controller.on('left:move', (s) => {
    view[0] = s.x;
    view[1] = s.y;
    console.log('left', s);
});

controller.on('right:move', (s) => {
    view[2] = s.x;
    view[3] = s.y;
    console.log('right', s);
});

async function run() {
    console.log("run");
    const context = new Context({ maxSockets: 1 });
    const sock = new Reply({ context });
    console.log("2");
    await sock.bind("tcp://127.0.0.1:38989");
    console.log("3");

    for await (const [inputData] of sock) {
        console.log(inputData)

        // Do inference (by AI) here

        await sock.send(controlBuffer);
    }
    console.log("4");
}

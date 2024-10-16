import { Reply, Context } from "zeromq";

import GamePad from '../libs/node-gamepad';

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
    // console.log('left', s);
});

controller.on('right:move', (s) => {
    view[2] = s.x;
    view[3] = s.y;
    // console.log('right', s);
});

async function run() {
    const context = new Context({ maxSockets: 1 });
    const sock = new Reply({ context });

    await sock.bind("tcp://127.0.0.1:38989");

    for await (const [inputData] of sock) {
        // console.log(inputData)

        // Do inference (by AI) here

        await sock.send(controlBuffer);
    }
}

run();

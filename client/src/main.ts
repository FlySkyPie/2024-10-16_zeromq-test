import { Reply, Context } from "zeromq";
import * as THREE from 'three';
import { init, addThreeHelpers } from '3d-core-raub';

import GamePad from '../libs/node-gamepad';


const { doc, gl, requestAnimationFrame } = init({
    width: 512,
    height: 512,
    isGles3: true,
});
addThreeHelpers(THREE, gl);

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(doc.devicePixelRatio);
renderer.setSize(doc.innerWidth, doc.innerHeight);

const camera = new THREE.OrthographicCamera(1 / - 2, 1 / 2, 1 / 2, 1 / - 2, 1, 1000);
camera.position.z = 2;

const scene = new THREE.Scene();

const displayBuffer = new ArrayBuffer(64 * 64 * 4);
const displayArray = new Uint8Array(displayBuffer);
for (let index = 0; index < displayArray.length; index++) {
    displayArray[index] = 0xff;
}

const texture = new THREE.DataTexture(displayBuffer, 64, 64);
texture.needsUpdate = true;

const geometry = new THREE.PlaneGeometry(1, 1);
const material = new THREE.MeshBasicMaterial({ map: texture });
const plane = new THREE.Mesh(geometry, material);
plane.scale.set(1, -1, 1);
scene.add(plane);

doc.addEventListener('resize', () => {
    renderer.setSize(doc.innerWidth, doc.innerHeight);
});

const animate = () => {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
};

animate();

// let frame = 1;
// setInterval(async () => {
//     if (frame > 201) {
//         frame = 1;
//         // clearInterval(timer);
//         // return;
//     }
//     const data = await fs.readFile(path.resolve(__dirname, `./assets/frame_${frame}.png`));
//     new PNG().parse(data, (_, png) => {
//         for (let index = 0; index < png.data.length; index++) {
//             view[index] = png.data[index];
//         }
//         texture.needsUpdate = true;
//     });
//     frame += 1;
// }, 50);


// const controller = new GamePad('logitech/gamepadf310');
// // const controller = new GamePad('logitech/gamepadf310', { debug: true });
// controller.connect();

const controlBuffer = new ArrayBuffer(8);
const controlArray = new Uint8Array(controlBuffer);

// controller.on('dpadUp:press', () => {
//     console.log('up');
// });
// controller.on('dpadDown:press', () => {
//     console.log('down');
// });

// controller.on('left:move', (s) => {
//     controlArray[0] = s.x;
//     controlArray[1] = s.y;
//     console.log('left', s);
// });

// controller.on('right:move', (s) => {
//     controlArray[2] = s.x;
//     controlArray[3] = s.y;
//     console.log('right', s);
// });

async function run() {
    console.log("run");
    const context = new Context({ maxSockets: 1 });
    const sock = new Reply({ context });
    console.log("2");
    await sock.bind("tcp://127.0.0.1:38989");
    console.log("3");

    for await (const [inputData] of sock) {
        for (let index = 0; index < inputData.length; index++) {
            displayArray[index] = inputData[index];
        }
        texture.needsUpdate = true;

        await sock.send(controlBuffer);
    }
    console.log("4");
}

run();
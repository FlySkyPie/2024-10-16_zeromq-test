import GamePad from '../libs/node-gamepad';

const controller = new GamePad('logitech/gamepadf310');
// const controller = new GamePad('logitech/gamepadf310', { debug: true });
controller.connect();

controller.on('dpadUp:press', () => {
    console.log('up');
});
controller.on('dpadDown:press', () => {
    console.log('down');
});

controller.on('left:move', (s) => {
    console.log('left', s);
});

controller.on('right:move', (s) => {
    console.log('right', s);
});
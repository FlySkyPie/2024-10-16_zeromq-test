import { Request } from "zeromq";

async function run() {
    const sock = new Request();

    sock.connect("tcp://127.0.0.1:38989");
    console.log("Producer bound to port 38989");

    // Simulate game loop.
    setInterval(async () => {
        try {
            await sock.send("4");
            const [result] = await sock.receive();

            console.log("Server got result:", result);
        } catch (error) {
            console.error(error);
        }
    }, 100);
}

run()
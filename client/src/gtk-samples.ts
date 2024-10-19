import { Worker } from 'worker_threads';
import NodeGtk from '@girs/node-gtk';

import GamePad from '../libs/node-gamepad';

const gi: (typeof NodeGtk) = (NodeGtk as any).default;

// {

//     console.log("A");

//     const Gtk = gi.require('Gtk', '3.0');

//     console.log("B");

//     gi.startLoop();
//     Gtk.init();

//     console.log("C");

//     const win = new Gtk.Window();
//     win.on('destroy', () => Gtk.mainQuit());
//     win.on('delete-event', () => false);

//     console.log("D");

//     win.setDefaultSize(200, 80);
//     win.add(new Gtk.Label({ label: 'Hello Gtk+' }));

//     win.showAll();
//     Gtk.main();
// }


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





{
    const Gtk = gi.require('Gtk', '3.0')
    const Cairo = gi.require('cairo')
    const Pango = gi.require('Pango')
    const PangoCairo = gi.require('PangoCairo')

    Gtk.init()

    // Main program window
    const window = new Gtk.Window({
        type: Gtk.WindowType.TOPLEVEL
    })

    // Button
    const button = Gtk.ToolButton.newFromStock(Gtk.STOCK_GO_BACK)

    // Draw area
    const drawingArea = new Gtk.DrawingArea()
    drawingArea.on('draw', (_: any) => {
        const width = drawingArea.getAllocatedWidth()
        const height = drawingArea.getAllocatedHeight()

        // console.log(['draw', { width, height }])

        // Cairo in GJS uses camelCase function names
        _.setSourceRgba(1, 0.0, 0.0, 1)
        _.arc(16, 16, 16, 0, 2 * Math.PI);
        _.fill()

        _.selectFontFace('Fantasque Sans Mono', Cairo.FontSlant.NORMAL, Cairo.FontWeight.NORMAL)
        _.setFontSize(12)

        const extents = _.textExtents('Disziplin ist Macht.')
        // console.log({
        //     xAdvance: extents.xAdvance,
        //     yAdvance: extents.yAdvance,
        //     width: extents.width,
        //     height: extents.height,
        //     xBearing: extents.xBearing,
        //     yBearing: extents.yBearing,
        // })

        const fontExtents = _.fontExtents()
        // console.log({
        //     ascent: fontExtents.ascent,
        //     descent: fontExtents.descent,
        //     height: fontExtents.height,
        //     maxXAdvance: fontExtents.maxXAdvance,
        //     maxYAdvance: fontExtents.maxYAdvance,
        // })

        _.setSourceRgba(0.1, 0.1, 0.1, 1)
        _.rectangle(10, 40, extents.xAdvance, extents.height - extents.yBearing)
        _.fill()

        _.moveTo(10, 50)
        _.setSourceRgba(1, 0.0, 0.0, 1)
        _.showText('Disziplin ist Macht.')


        /* Lines */
        {
            _.setSourceRgb(1, 1, 1)
            _.setLineWidth(1)
            _.moveTo(250, 100)
            _.lineTo(250, 200)
            _.moveTo(200, 150)
            _.lineTo(300, 150)
            _.stroke()
        }
        {
            _.setSourceRgb(1, 1, 1)
            _.setLineWidth(1)
            _.moveTo(400.5, 100.5)
            _.lineTo(400.5, 200.5)
            _.moveTo(350.5, 150.5)
            _.lineTo(450.5, 150.5)
            _.stroke()
        }

        _.setSourceRgb(0, 0, 0)
        const layout = PangoCairo.createLayout(_)
        const fontDescription = Pango.fontDescriptionFromString('Fantasque Sans Mono 9')
        layout.setText('text', -1)
        layout.setFontDescription(fontDescription)
        PangoCairo.showLayout(_, layout)

        // Draw glyphs
        // const fontFace = Cairo.FontFace.create('Arial', Cairo.FontSlant.NORMAL, Cairo.FontWeight.NORMAL)
        // const scaledFont = Cairo.ScaledFont.create(fontFace, new Cairo.Matrix(), new Cairo.Matrix(), new Cairo.FontOptions())
        const scaledFont = _.getScaledFont()
        const text = 'Here are some glyphs'
        const [glyphs] = scaledFont.textToGlyphs(10, 100, text, true)

        // put paths for current cluster to _
        // _.setScaledFont(scaledFont)
        _.glyphPath(glyphs, glyphs.length)
        const glyphExtents = _.glyphExtents(glyphs, glyphs.length)

        // draw black text with green stroke
        _.setSourceRgba(1, 1, 0.2, 1)
        _.fillPreserve()
        // _.setLineWidth(0.5)
        // _.stroke()

        const path = _.copyPath()
        // console.log(path, path.status)

        return true
    })

    // Containing box
    const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
    vbox.packStart(button, false, true, 0)
    vbox.packStart(drawingArea, true, true, 0)


    // configure main window
    window.setDefaultSize(600, 400)
    window.setResizable(true)
    window.add(vbox)

    // window show event
    window.on('show', () => {
        Gtk.main();
    })

    // window after-close event
    window.on('destroy', () => Gtk.mainQuit())

    // window close event: returning true has the semantic of preventing the default behavior:
    // in this case, it would prevent the user from closing the window if we would return `true`
    window.on('delete-event', () => false)
    window.showAll()
}


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




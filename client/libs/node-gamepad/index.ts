import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

import HID from 'node-hid';
import colors from 'colors/safe';

import type { IConfig } from './interfaces/IConfig';

/**
 * `Gamepad` is the base API object constructor.
 *
 * @class Gamepad
 * @constructor
 * 
 * @param {String} type The type of gamepad to be loaded. This can follow 2 forms: (1) vendor ID or (2) vendor ID/productID. Thus, "ps3" and "ps3/dualshock3" are both valid options.
 * @param {Object} options A hash of options that can be set by the user.
 * @param {Number} [options.vendorID] When this value is specified it will overwrite the existing `vendorID` that's loaded from the detected configuration.
 * @param {Number} [options.productID] When this value is specified it will overwrite the existing `productID` that's loaded from the detected configuration.
 */
class Gamepad extends EventEmitter {
    private _usb: any;
    private _type: any;
    private _config: any;
    private _states: any;
    private _options: IConfig | Partial<IConfig>;

    constructor(type: any, options: IConfig | {} = {}) {
        super();
        this._usb = null;
        this._type = type;
        this._config = {};
        this._states = {};
        this._options = options;

        // Expand number of max listeners to 100 (so we can listen to up to 100 event types)
        this.setMaxListeners(100)

        // on process exit, disconnect from any devices we may be connected to.
        process.on('exit', this.disconnect.bind(this));
    }

    // Prototype Methods
    // =================

    /**
     * This function will load the configuration file for the specified controller type.
     * If the configuration file for the specified controller type does not exist, we
     * bail.
     *
     * @private
     * @method _loadConfiguration
     */
    private _loadConfiguration() {
        var configPath = path.resolve(__dirname, './controllers/' + this._type + '.json');
        if (!fs.existsSync(configPath)) {
            console.log(colors.red('The controller configuration for "' + this._type + '" does not exist.'));
            process.exit(0);
        }

        this._config = require(configPath);

        // if the user specified a custom vendorID or productID, use that instead
        if (this._options.vendorID) {
            this._config.vendorID = this._options.vendorID;
        }
        if (this._options.productID) {
            this._config.productID = this._options.productID;
        }
    }

    /**
     * Detects whether or not the specified string has a product ID in the form of 
     * "vendorID/productID" or not.
     *
     * @private
     * @method _hasProductId
     * 
     * @param {String} str The string we're using to check for a product ID.
     * @return {Boolean} Indicates whether or not a product ID was detected.
     */
    private _hasProductId(str: string) {
        return str.indexOf('/') > -1;
    }

    /**
     * Detects the configuration that will be used to load this controller type. If
     * a controller configuration is already defined, we'll use it. Otherwise, we'll
     * try to detect the specific controller configuration to use.
     *
     * @private
     * @method _detectControllerConfiguration
     * 
     * @return Indicates whether or not the controller configuration could be detected.
     */
    private _detectControllerConfiguration(): boolean {
        // check to see if a product ID was already specified in the product type.
        if (this._hasProductId(this._type)) {
            return true;
        }

        // check to see if the vendor exists
        var platformPath = path.resolve(__dirname, './controllers/' + this._type + '/');
        if (!fs.existsSync(platformPath)) {
            console.log(colors.red('The vendor "' + this._type + '" does not exist.'));
            process.exit(0);
        }

        // we know the vendor exists, so loop through HID devices and the
        // configurations for this particular vendor while checking to see if any of
        // them match each other (indicating that we have a configuration something
        // that is currently plugged in).
        // 
        // TODO: make this faster by looping through loaded controllers once instead
        // of once per HID device.
        var devices = HID.devices();
        var files = fs.readdirSync(platformPath), tmpConfig, tmpDevice;
        for (var i = 0, len = files.length; i < len; i++) {
            tmpConfig = platformPath + '/' + files[i];
            tmpConfig = require(tmpConfig);

            // check to see if this vendorID and productID exist
            for (var j = 0, leng = devices.length; j < leng; j++) {
                tmpDevice = devices[j];
                if (tmpConfig.vendorID === tmpDevice.vendorId && tmpConfig.productID === tmpDevice.productId) {
                    this._type = this._type + '/' + files[i].replace('.json', '');
                    return true;
                }
            }
        }

        return false;
    }

    public connect() {
        if (!this._detectControllerConfiguration()) {
            console.log(colors.red('A product for the vendor "' + this._type + '" could not be detected.'));
            process.exit(0);
        }

        this.emit('connecting');
        this._loadConfiguration();
        this._usb = new HID.HID(this._config.vendorID, this._config.productID);

        // Debug: Show each pin and current value
        if (typeof this._options.debug === 'boolean' && this._options.debug === true) {
            this._usb.on('data', function (data: any) {

                // Build a message with input values from pins
                // Example:
                // Input pin values:  0:128 |   1:127 |   2:128 |   3:132 |   4:40 |   5:0 |   6:0 |   7:255 |

                var logMessage = 'Input pin values:  '

                // Check up to 100 pins for input
                for (var i = 0; i < 100; i++) {
                    if (i in data) {
                        logMessage += i + ':' + data[i] + ' |   '
                    }
                }

                console.log(logMessage);
            });
        }

        this._usb.on('data', this._onControllerFrame.bind(this));
        this.emit('connected');

        return this;
    }

    _onControllerFrame(data: any) {
        this._processJoysticks(data);
        this._processButtons(data);
        this._processStatus(data);
    }

    _processJoysticks(data: any) {
        if (!this._config.joysticks) {
            return;
        }

        var joysticks = this._config.joysticks, joystick, currentState;
        for (var i = 0, len = joysticks.length; i < len; i++) {
            joystick = joysticks[i];
            if (!this._states[joystick.name]) {
                this._states[joystick.name] = {
                    x: data[joystick.x.pin],
                    y: data[joystick.y.pin]
                };
                continue;
            }

            currentState = this._states[joystick.name];
            if (currentState.x !== data[joystick.x.pin] || currentState.y !== data[joystick.y.pin]) {
                currentState = {
                    x: data[joystick.x.pin],
                    y: data[joystick.y.pin]
                };
                this._states[joystick.name] = currentState;
                this.emit(joystick.name + ':move', currentState);
            }
        }
    }

    private _processButtons(data: any) {
        if (!this._config.buttons) {
            return;
        }

        var buttons = this._config.buttons, button, isPressed, currentState;
        for (var i = 0, len = buttons.length; i < len; i++) {
            button = buttons[i];
            isPressed = (data[button.pin] & 0xff) === button.value;
            if (this._states[button.name] === undefined) {
                this._states[button.name] = isPressed;

                if (isPressed) {
                    this.emit(button.name + ':press');
                }

                continue;
            }
            currentState = this._states[button.name];

            if (isPressed && currentState !== isPressed) {
                this.emit(button.name + ':press');
            } else if (!isPressed && currentState !== isPressed) {
                this.emit(button.name + ':release');
            }

            this._states[button.name] = isPressed;
        }
    }

    private _processStatus(data: any) {
        if (!this._config.status) {
            return;
        }

        var statuses = this._config.status, status, state, states;
        var currentState;
        for (var i = 0, len = statuses.length; i < len; i++) {
            status = statuses[i];
            state = data[status.pin] & 0xff;
            states = status.states;

            for (var j = 0, length = states.length; j < length; j++) {
                if (states[j].value === state) {
                    state = states[j].state;
                    break;
                }
            }

            currentState = this._states[status.name];
            if (currentState !== state) {
                this.emit(status.name + ':change', state);
            }

            this._states[status.name] = state;
        }
    }

    public disconnect() {
        if (this._usb) {
            this._usb.close();
        }
    }
}

export default Gamepad;

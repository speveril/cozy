import * as Engine from "./Engine";
import * as Audio from './Audio';
import * as File from "./File";
import * as Input from "./Input";
import * as Layer from "./Layer";
import * as Plane from './Plane';
import * as Sprite from "./Sprite";
import * as Texture from "./Texture";
import * as Trig from "./Trig";
import * as UiComponent from "./UiComponent";

let Cozy = {};

Object.assign(Cozy,
    Engine, Audio, File, Input, Layer, Plane, Sprite, Texture, Trig, UiComponent
);

window['Cozy'] = Cozy;
export default Cozy;

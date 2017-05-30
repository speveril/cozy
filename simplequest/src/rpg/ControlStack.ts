module RPG {
    const CONTROLSTACKDEBUG = false;
    export enum ControlMode { None, Scene, Menu, Map, Battle };
    let controlModeNames = ["none","scene","menu","map","battle"];

    export class ControlStack {
        private static stack:Array<ControlMode> = [];

        public static cleanup() {
            this.stack = [];
        }

        private static dbg(...args):string {
            if (!CONTROLSTACKDEBUG) return;
            let s = "";
            _.each(this.stack, (mode) => {
                if (s !== '') s += ",";
                s += controlModeNames[mode];
            }, "");
            console.trace.apply(console, ["CONTROLS>>", s].concat(args));
        }

        public static push(mode:ControlMode):void {
            this.dbg("<--", controlModeNames[mode]);
            this.stack.push(mode);
        }

        public static pop():ControlMode {
            let mode = this.stack.pop();
            this.dbg("-->", controlModeNames[mode]);
            return mode;
        }

        public static top():ControlMode {
            return this.stack[ControlStack.len - 1];
        }

        public static get len():number {
            return this.stack.length;
        }
    }
}

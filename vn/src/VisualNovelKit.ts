///<reference path="Page.ts"/>
module VN {
    export var sfx:{[key:string]: Cozy.Sound} = {};
    export var music:{[key:string]: Cozy.Music} = {};
    export var plane:Cozy.UiPlane;
    export var page:VN.Page;
    export var pages:{[key:string]: any} = {};

    export function start(args?:any):Promise<any> {
        var config = args || {};

        var loadSkip = config.loadSkip || [];

        if (config.sfx) {
            _.each(config.sfx, (args:string, name:string) => this.sfx[name] = new Cozy.Sound(args));
        }

        if (config.music) {
            _.each(config.music, (args:any, name:string) => this.music[name] = new Cozy.Music(args));
        }

        var textures = {};
        _.each(Cozy.gameDir.glob("**/*.{png,jpg,gif}"), (f) => {
            if (f instanceof Cozy.File) {
                if (_.reduce(loadSkip, (memo, ignore:string) => memo || f.path.indexOf(ignore) === 0, false)) return;
                textures[(<Cozy.File>f).relativePath(Cozy.gameDir)] = f;
            }
        });

        pages = _.mapObject(args.pages || {}, (p) => {
            _.each(p['actions'], (body, name) => {
                if (typeof body === 'string') {
                    p['actions'][name] = new Function('VN', body);
                }
            });
            return p;
        });

        var promises = [ Cozy.loadTextures(textures) ];
        _.each(sfx, (s) => promises.push(s.loaded()));
        _.each(music, (m) => promises.push(m.loaded()));

        plane = <Cozy.UiPlane>Cozy.addPlane(Cozy.UiPlane, {});
        page = new VN.Page();
        plane.addChild(page);

        return Promise.all(promises);
    }

    export function reset() {
        // don't do anything right now
    }

    export function showPage(pageKey) {
        console.log(VN.pages);
        console.log("open", pageKey, VN.pages[pageKey]);
        this.page.setContent(VN.pages[pageKey]);
    }
}

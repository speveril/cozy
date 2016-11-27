var VN;
(function (VN) {
    class Page extends Cozy.UiComponent {
        constructor(args) {
            super({
                className: 'page',
                html: `
                    <div class="content"></div>
                    <div class="overlay"></div>
                `
            });
            this.actions = {};
            this.find('.content').addEventListener('click', (e) => this.onClick(e));
        }
        setContent(def) {
            var content = this.find('.content');
            content.innerHTML = '';
            this.actions = def.actions;
            content.style.backgroundImage = `url(${Cozy.gameDir.file('gfx/' + def.bg).url})`;
            _.each(def.text, (block) => {
                var div = document.createElement('div');
                div.className = 'text-block';
                div.style.left = block['x'] + 'px';
                div.style.top = block['y'] + 'px';
                div.style.width = block['w'] + 'px';
                div.innerHTML = block['text'];
                content.appendChild(div);
            });
        }
        onClick(e) {
            var target = e.target;
            if (target.tagName === 'LI') {
                var action = this.actions[target.getAttribute('data-action')];
                action(VN);
            }
        }
    }
    VN.Page = Page;
})(VN || (VN = {}));
///<reference path="Page.ts"/>
var VN;
(function (VN) {
    VN.sfx = {};
    VN.music = {};
    VN.pages = {};
    function start(args) {
        var config = args || {};
        var loadSkip = config.loadSkip || [];
        if (config.sfx) {
            _.each(config.sfx, (args, name) => this.sfx[name] = new Cozy.Sound(args));
        }
        if (config.music) {
            _.each(config.music, (args, name) => this.music[name] = new Cozy.Music(args));
        }
        var textures = {};
        _.each(Cozy.gameDir.glob("**/*.{png,jpg,gif}"), (f) => {
            if (f instanceof Cozy.File) {
                if (_.reduce(loadSkip, (memo, ignore) => memo || f.path.indexOf(ignore) === 0, false))
                    return;
                textures[f.relativePath(Cozy.gameDir)] = f;
            }
        });
        VN.pages = _.mapObject(args.pages || {}, (p) => {
            _.each(p['actions'], (body, name) => {
                if (typeof body === 'string') {
                    p['actions'][name] = new Function('VN', body);
                }
            });
            return p;
        });
        var promises = [Cozy.loadTextures(textures)];
        _.each(VN.sfx, (s) => promises.push(s.loaded()));
        _.each(VN.music, (m) => promises.push(m.loaded()));
        VN.plane = Cozy.addPlane(Cozy.UiPlane, {});
        VN.page = new VN.Page();
        VN.plane.addChild(VN.page);
        return Promise.all(promises);
    }
    VN.start = start;
    function reset() {
        // don't do anything right now
    }
    VN.reset = reset;
    function showPage(pageKey) {
        console.log(VN.pages);
        console.log("open", pageKey, VN.pages[pageKey]);
        this.page.setContent(VN.pages[pageKey]);
    }
    VN.showPage = showPage;
})(VN || (VN = {}));
var VisualNovel;
(function (VisualNovel) {
    function getPages() {
        return {
            'start': {
                bg: 'scr01.png',
                text: [
                    {
                        x: 1200, y: 150, w: 600,
                        text: `
                            There's been a zombie outbreak. Good thing you're here! You know just what to do...
                            <ul>
                                <li data-action="shoot">Shoot them!</li>
                                <li data-action="guide">Get out your trusty Zombie Survival Guide</li>
                                <li data-action="run">Get your ass out of here</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    shoot: `VN.showPage('shooting')`,
                    guide: `VN.showPage('reading')`,
                    run: `VN.showPage('coward-death')`
                }
            },
            'shooting': {
                bg: 'scr03.png',
                text: [
                    {
                        x: 1150, y: 40, w: 680,
                        text: `
                            You pull out your trusty airsoft guns and start firing into the crowd. You know Mythbusters said it's not as effective, but you shoot side-style with both hands because you're a bad-ass.
                            <ul>
                                <li data-action="continue">Continue</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    continue: `VN.showPage('shooter death')`
                }
            },
            'reading': {
                bg: 'scr02.png',
                text: [
                    {
                        x: 1400, y: 120, w: 500,
                        text: `
                            The good ol' ZSG is always close at hand. It's a good thing zombie experts like you know all about zombies even though they were, until now, fictional! You pull it out and start leafing through the pages...
                            <ul>
                                <li data-action="continue">Look up appropriate quarantine methods</li>
                                <li data-action="continue">Look up most effective means of combatting the undead.</li>
                                <li data-action="continue">Remind yourself exactly what a zombie is.</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    continue: `VN.showPage('nerd death')`
                }
            },
            'shooter death': {
                bg: 'scr04.png',
                text: [
                    {
                        x: 120, y: 680, w: 750,
                        text: `
                            Not only do you miss every zombie, you're using useless toys to shoot at them. You are quickly overwhelmed and die.
                            <ul>
                                <li data-action="restart">Restart</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    restart: `VN.reset(); VN.showPage('start')`
                }
            },
            'nerd death': {
                bg: 'scr04.png',
                text: [
                    {
                        x: 120, y: 680, w: 750,
                        text: `
                            The zombies eat you while you're reading your idiotic book. You die.
                            <ul>
                                <li data-action="restart">Restart</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    restart: `VN.reset(); VN.showPage('start');`
                }
            },
            'coward-death': {
                bg: 'scr04.png',
                text: [
                    {
                        x: 120, y: 680, w: 750, text: `
                            Turns out you suck at running. The zombies eat you until you die.
                            <ul>
                                <li data-action="restart">Restart</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    restart: `VN.reset(); VN.showPage('start');`
                }
            },
        };
    }
    VisualNovel.getPages = getPages;
})(VisualNovel || (VisualNovel = {}));
///<reference path="src/VisualNovelKit.ts"/>
///<reference path="src/pages.ts"/>
var VisualNovel;
(function (VisualNovel) {
    function start() {
        console.log(VisualNovel.getPages());
        var p = VN.start({
            sfx: {},
            music: {
                bgmusic: { tracks: ['audio/712184_LazyTown---We-Are-Number-O.mp3'] }
            },
            pages: VisualNovel.getPages()
        });
        p.then(startGame);
    }
    VisualNovel.start = start;
    function startGame() {
        VN.music['bgmusic'].start();
        VN.reset();
        VN.showPage('start');
        Cozy.unpause();
    }
    VisualNovel.startGame = startGame;
    function frame(dt) {
        // this will run every frame
        // - dt is the number of seconds that have passed since the last frame
    }
    VisualNovel.frame = frame;
})(VisualNovel || (VisualNovel = {}));
module.exports = VisualNovel;

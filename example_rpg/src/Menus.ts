module SimpleQuest {
    function quitGame() {
        RPG.Scene.start()
            .then(function() {
                return RPG.Scene.waitForFadeOut(1.0, "#000000");
            })
            .then(function() {
                Egg.quit();
                RPG.Scene.finish();
            });
    }

    export class Menu_Boot extends RPG.Menu {
        constructor() {
            super({ html: "ui/boot-menu.html" });
            this.container.className = "menu boot-menu";
        }
        newGame() {
            RPG.Scene.start()
                .then(function() {
                    sfx['start'].play();
                    return RPG.Scene.waitForFadeOut(1.0, "#000000");
                })
                .then(function() {
                    RPG.Scene.finish();
                    SimpleQuest.newGame();
                    RPG.Menu.pop();
                });
        }
        loadGame() { console.log("not yet"); }
        exit() { quitGame(); }
    }

    export class Menu_Main extends RPG.Menu {
        cancelable:boolean = true;

        constructor() {
            super({ html: "ui/main-menu.html" });
            this.container.className = "menu main-menu";

            var moneyField = <HTMLElement>(this.container.querySelector('span.money'));
            if (moneyField) {
                moneyField.innerHTML = RPG.Party.money.toString() + RPG.moneyName;
            }

            var htmlPath:string = Egg.File.pathname(Egg.File.projectFile("ui/main-menu.html"));
            var memberTemplate = this.container.querySelector('.main-menu .party-view .member.template');
            var memberContainer = this.container.querySelector('.main-menu .party-view');
            var fields = ['name','title','level','hp','maxhp','xp','attack','defense','critical','evade'];

            _.each(RPG.Party.members, function(member, i) {
                var el = <HTMLElement>(memberTemplate.cloneNode(true));
                el.setAttribute('data-member', i.toString());
                el.className = el.className.replace(/\s*template/, '');

                for (var f in fields) {
                    var fieldName = fields[f];
                    var field = <HTMLElement>(el.querySelector('span.' + fieldName));
                    field.innerText = member.character[fieldName];
                }

                var portraitField = <HTMLElement>(el.querySelector('img.portrait'));
                if (member.character['portrait']) {
                    portraitField.setAttribute('src', htmlPath + "/" + member.character['portrait']);
                }
                memberContainer.appendChild(el);
            });
        }
        exit() { quitGame(); }
    }
}

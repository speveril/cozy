module SimpleQuest {
    export module Menu {
        export class Main extends RPG.Menu {
            cancelable:boolean = true;

            constructor() {
                super({ html: "ui/main-menu.html" });
                this.element.className = "menu main-menu";

                var moneyField = <HTMLElement>(this.element.querySelector('span.money'));
                if (moneyField) {
                    moneyField.innerHTML = RPG.Party.money.toString() + RPG.moneyName;
                }

                var htmlPath:string = Egg.File.pathname(Egg.File.projectFile("ui/main-menu.html"));
                var memberTemplate = this.find('.main-menu .view.status .member.template');
                var memberContainer = this.find('.main-menu .view.status');
                var fields = ['name','title','level','hp','maxhp','xp','attack','defense','critical','evade'];

                _.each(RPG.Party.members, function(member, i) {
                    var el = <HTMLElement>(memberTemplate.cloneNode(true));
                    el.setAttribute('data-member', i.toString());
                    el.className = el.className.replace(/\s*template/, '');

                    for (var f in fields) {
                        var fieldName = fields[f];
                        var field = <HTMLElement>(el.querySelector('span[data-field=' + fieldName + ']'));
                        if (!field) {
                            console.log("Couldn't find a field span for " + fieldName + ".");
                        } else {
                            field.innerText = member.character[fieldName];
                        }
                    }

                    var portraitField = <HTMLElement>(el.querySelector('img.portrait'));
                    if (member.character['portrait']) {
                        portraitField.setAttribute('src', htmlPath + "/" + member.character['portrait']);
                    }
                    memberContainer.appendChild(el);
                });
            }

            update(dt) {
                this.showView(this.selections[this.selectionIndex].getAttribute('data-menu'));
            }

            showView(key) {
                var i;
                var views = this.element.getElementsByClassName('view');
                for (i = 0; i < views.length; i++) {
                    var view = <HTMLElement>(views[i]);
                    if (view.className == 'view ' + key) {
                        view.style.display = '';
                    } else {
                        view.style.display = 'none';
                    }
                }
            }

            exit() { SimpleQuest.Menu.quitGame(); }
        }
    }
}

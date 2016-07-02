module SimpleQuest {
    export module Menu {
        export class Main extends RPG.Menu {
            html:string = `
                <link rel="stylesheet" type="text/css" href="main-menu.css">

                <div class="main-area">
                    <div class="view status">
                        <div class="member template">
                            <section class="layout-row">
                                <section class="portrait-container"><img class="portrait"></section>
                                <section class="layout-column">
                                    <section class="layout-row">
                                        <section class="layout-column">
                                            <section><span data-field="name"></span></section>
                                            <section>HP</section>
                                            <section class="right-align"><span data-field="hp"></span>/<span data-field="maxhp"></span></section>
                                            <section>XP</section>
                                            <section class="right-align"><span data-field="xp"></span></section>
                                        </section>
                                        <section class="layout-column">
                                            <section class="layout-row">
                                                <div><span data-field="title"></span></div>
                                                <div class="right-align">LV <span data-field="level"></span></div>
                                            </section>
                                            <section class="layout-row">
                                                <div>ATK</div><div class="right-align"><span data-field="attack"></span></div>
                                            </section>
                                            <section class="layout-row">
                                                <div>DEF</div><div class="right-align"><span data-field="defense"></span></div>
                                            </section>
                                            <section class="layout-row">
                                                <div>CRT</div><div class="right-align"><span data-field="critical"></span></div>
                                            </section>
                                            <section class="layout-row">
                                                <div>EVD</div><div class="right-align"><span data-field="evade"></span></div>
                                            </section>
                                        </section>
                                    </section>
                                </section>
                            </section>
                        </div>
                    </div>

                    <div class="view items">
                        Items!
                    </div>

                    <div class="view equip">
                        Equip!
                    </div>

                    <div class="view save">
                        Save!
                    </div>
                </div>

                <div class="right-column">
                    <ul class="selections">
                        <li data-menu="status">Status</li>
                        <li data-menu="items">Items</li>
                        <li data-menu="equip">Equip</li>
                        <li data-menu="save">Save</li>
                        <li data-menu="exit">Exit</li>
                    </ul>

                    <div class="overview">
                        <div class="money-container"><span class="money"></span></div>
                    </div>
                </div>
            `;

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

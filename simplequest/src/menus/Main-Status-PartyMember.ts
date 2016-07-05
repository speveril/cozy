module SimpleQuest {
    export module Menu {
        var html = `
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
        `

        export class Main_PartyMember extends Egg.UiComponent {
            constructor(args) {
                super({ html: html });
                this.element.classList.add("member");

                var member = args.member;
                var fields = ['name','title','level','hp','maxhp','xp','attack','defense','critical','evade'];

                this.element.setAttribute('data-member', args.index.toString());

                for (var f in fields) {
                    var fieldName = fields[f];
                    var field = this.find('span[data-field=' + fieldName + ']');
                    if (!field) {
                        console.log("Couldn't find a field span for " + fieldName + ".");
                    } else {
                        field.innerText = member.character[fieldName];
                    }
                }

                var portraitField = this.find('img.portrait');
                if (member.character['portrait']) {
                    portraitField.setAttribute('src', Egg.File.projectFile("ui/" + member.character['portrait']));
                }
            }

            rerender() {
            }
        }
    }
}

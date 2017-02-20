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
                                <div>DMG</div><div class="right-align"><span data-field="damage"></span></div>
                            </section>
                            <section class="layout-row">
                                <div>CRT</div><div class="right-align"><span data-field="critical"></span></div>
                            </section>
                            <section class="layout-row">
                                <div>DOD</div><div class="right-align"><span data-field="dodge"></span></div>
                            </section>
                            <section class="layout-row">
                                <div>BLK</div><div class="right-align"><span data-field="block"></span></div>
                            </section>
                            <section class="layout-row">
                                <div>DEF</div><div class="right-align"><span data-field="defense"></span></div>
                            </section>
                        </section>
                    </section>
                </section>
            </section>
        `

        export class Main_PartyMember extends Cozy.UiComponent {
            index:number;
            member:RPG.PartyMember;

            constructor(args) {
                super({ html: html });
                this.element.classList.add("member");
                this.index = args.index;
                this.member = args.member;

                this.render();
            }

            setField(fieldName:string, value:string) {
                var field = this.find('span[data-field=' + fieldName + ']');
                if (field) {
                    field.innerText = value;
                } else {
                    console.warn("Couldn't find a field span for " + fieldName + ".");
                }
            }

            render() {
                this.element.setAttribute('data-member', this.index.toString());

                ['name','title','level','hp','maxhp','xp'].forEach((f) => this.setField(f, this.member.character[f]));
                ['damage','critical','dodge','block','defense'].forEach((f) => this.setField(f, this.member.character.get(f)));

                var portraitField = this.find('img.portrait');
                if (this.member.character['portrait']) {
                    portraitField.setAttribute('src', Cozy.gameDir.file(this.member.character['portrait']).url);
                }
            }
        }
    }
}

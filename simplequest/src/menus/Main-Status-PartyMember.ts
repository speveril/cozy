///<reference path="Main-Equip-Slot.ts"/>

module SimpleQuest {
    export module Menu {
        export class Main_PartyMember extends Cozy.UiComponent {
            slotChildren:any;
            index:number;
            member:RPG.PartyMember;

            constructor(args) {
                super({ html: `
                    <section class="layout-row main-status-row">
                        <section class="portrait-container"><img class="portrait"></section>
                        <section class="layout-column">
                            <section class="layout-row">
                                <span data-field="name"></span>
                            </section>
                            <section class="layout-row">
                                <span data-field="title"></span>
                            </section>
                            <section class="layout-row">
                                <section class="label">Level</section>
                                <section class="value"><span data-field="level"></span></section>
                            </section>
                            <section class="layout-row">
                                <section class="label">XP</section>
                                <section class="value">
                                    <span data-field="xp"></span>/<span data-field="xpnext"></span>
                                </section>
                            </section>
                            <section class="layout-row">
                                <section class="label">HP</section>
                                <section class="value">
                                    <span data-field="hp"></span>/<span data-field="maxhp"></span>
                                </section>
                            </section>
                        </section>
                    </section>
                    <section class="layout-row title-row">
                        Attributes
                    </section>
                    <section class="layout-row equip-info-row">
                        <section class="layout-column stats-column">
                            <section class="layout-row" data-stat="damage">
                                <span class="label">DMG</span>
                                <span class="value" data-field="damage">0</span>
                            </section>
                            <section class="layout-row" data-stat="critical">
                                <span class="label">CRT</span>
                                <span class="value" data-field="critical">0</span>
                            </section>
                            <section class="layout-row" data-stat="dodge">
                                <span class="label">DOD</span>
                                <span class="value" data-field="dodge">0</span>
                            </section>
                            <section class="layout-row" data-stat="block">
                                <span class="label">BLK</span>
                                <span class="value" data-field="block">0</span>
                            </section>
                            <section class="layout-row" data-stat="defense">
                                <span class="label">DEF</span>
                                <span class="value" data-field="defense">0</span>
                            </section>
                        </section>
                        <section class="layout-column slots-column">
                            <ul class="slots">
                            </ul>
                        </section>
                    </section>
                `});
                this.element.classList.add("member");
                this.index = args.index;
                this.member = args.member;

                this.slotChildren = {};
                var listContainer = this.find('.slots');
                _.each(RPG.equipSlots, (slot:string) => {
                    this.slotChildren[slot] = this.addChild(new Main_EquipSlot(this.member.character, slot), listContainer);
                });

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

                ['name','title','level','hp','maxhp','xp','xpnext'].forEach((f) => this.setField(f, this.member.character[f]));
                ['damage','critical','dodge','block','defense'].forEach((f) => this.setField(f, this.member.character.get(f)));

                var portraitField = this.find('img.portrait');
                if (this.member.character['portrait']) {
                    portraitField.setAttribute('src', Cozy.gameDir.file(this.member.character['portrait']).url);
                }

                _.each(RPG.equipSlots, (slot:string) => {
                    this.slotChildren[slot].rerender();
                });
            }
        }
    }
}

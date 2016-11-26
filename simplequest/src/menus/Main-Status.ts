///<reference path="Main-Status-PartyMember.ts"/>

module SimpleQuest {
    export module Menu {
        export class Main_StatusPanel extends Cozy.UiComponent {
            constructor() {
                super({
                    className: 'panel status'
                });
                RPG.Party.members.forEach((member, i) => {
                    this.addChild(new Main_PartyMember({ index: i, member: member }));
                });
            }

            updateFields() {
                this.children.forEach((ch) => {
                    var ch_ = <Main_PartyMember>ch;
                    ch_.render();
                });
            }
        }
    }
}

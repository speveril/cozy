var slotDisplayNames = {
    "weapon": "WPN",
    "shield": "SHD",
    "armor": "ARM",
    "accessory": "ACC"
}

module SimpleQuest {
    export module Menu {
        var html:string = `
            <span class="slot-name"></span>
            <span class="item-icon"></span>
            <span class="item-name"></span>
        `;
        export class Main_EquipSlot extends Egg.UiComponent {
            character:RPG.Character;
            slot:string;

            constructor(character:RPG.Character, slot:string) {
                super({ html: html, tag: 'li' });
                this.element.classList.add('slot');

                this.character = character;
                this.slot = slot;
                this.element.setAttribute('data-menu', 'slot');
                this.element.setAttribute('data-value', this.slot)

                this.rerender();
            }

            rerender() {
                this.find('.slot-name').innerText = slotDisplayNames[this.slot];

                var item = this.character.equipped[this.slot];
                if (item) {
                    item.makeIcon(this.find('.item-icon'));
                    this.find('.item-name').innerText = item.name;
                } else {
                    this.find('.item-icon').style.backgroundImage = '';
                    this.find('.item-icon').style.backgroundPosition = '';
                    this.find('.item-name').innerText = '-';
                }
            }
        }
    }
}

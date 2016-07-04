module SimpleQuest {
    export module Menu {
        var html:string = `
            items
        `;
        export class Main_ItemsSubmenu extends RPG.Menu {
            constructor() {
                super({ html: html, cancelable: true });
                this.element.classList.add('items-submenu');
            }
        }
    }
}

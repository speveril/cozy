module RPG {
    export class Menu extends Egg.UiComponent {
        static menuStack:Menu[] = [];
        static blip:Egg.Sound = null;
        static choose:Egg.Sound = null;
        static sfxBad:Egg.Sound = null;

        static get currentMenu():Menu {
            return Menu.menuStack[Menu.menuStack.length - 1] || null;
        }

        static push(m:Menu, parentComponent?:Egg.UiComponent, parentElement?:HTMLElement|string):void {
            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.pause();
            }
            RPG.controls = RPG.ControlMode.Menu;
            Menu.menuStack.push(m);

            if (parentComponent) {
                parentComponent.addChild(m, parentElement);
            } else {
                RPG.uiPlane.addChild(m);
            }
        }

        static pop():void {
            if (Menu.menuStack.length < 1) {
                throw new Error("Tried to pop with nothing in the menu stack.");
            }
            Menu.menuStack.pop().stop();
            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.unpause();
            } else {
                RPG.controls = RPG.ControlMode.Map;
            }
        }

        static replace(m:Menu):void {
            if (Menu.menuStack.length < 1) {
                throw new Error("Tried to replace with nothing in the menu stack.");
            }
            Menu.pop();
            Menu.push(m);
        }

        static update(dt:number):void {
            Menu.currentMenu.update(dt);
        }

        selectionIndex:number;
        selectionContainer:HTMLElement;
        selections:HTMLElement[];

        constructor(args) {
            super(args);

            this.element.classList.add("rpg-menu");

            this.setupSelections(args.selectionContainer || this.element);

            // TODO have a UiComponent activation system to handle this "if Menu.currentMenu !== this" stuff

            if (args.cancelable) {
                let cb = () => {
                    if (Menu.currentMenu !== this) return;

                    Egg.Input.debounce('menu');
                    Egg.Input.debounce('cancel');
                    Menu.pop();
                };
                Egg.Input.on('menu.down', cb, this);
                Egg.Input.on('cancel.down', cb, this);
            }

            Egg.Input.on('up.down', () => {
                if (Menu.currentMenu !== this) return;

                Egg.Input.debounce('up', 0.2);
                this.moveSelection(-1);
                if (Menu.blip) {
                    Menu.blip.play();
                }
            }, this);
            Egg.Input.on('down.down', () => {
                if (Menu.currentMenu !== this) return;

                Egg.Input.debounce('down', 0.2);
                this.moveSelection(+1);
                if (Menu.blip) {
                    Menu.blip.play();
                }
            }, this);
            Egg.Input.on('confirm.down', () => {
                if (Menu.currentMenu !== this) return;

                Egg.Input.debounce('confirm');
                this.confirmSelection();
            }, this);
        }

        setupSelections(parent) {
            this.selectionContainer = parent;
            this.selections = [];
            _.each(parent.getElementsByTagName('*'), (element:HTMLElement) => {
                if (element.getAttribute('data-menu')) {
                    this.selections.push(element);
                }
            });
            this.setSelection(0);
        }

        start() {
            this.setSelection(0);
        }

        pause() {
            this.find('li.active').classList.remove('active');
        }
        unpause() {
            this.setSelection(this.selectionIndex);
        }

        stop() {
            this.remove();
            Egg.Input.off(undefined, undefined, this)
        }

        update(dt) {}

        confirmSelection() {
            if (this.selections.length < 1) return;
            var currentMenuSelection = this.selections[this.selectionIndex].getAttribute('data-menu');
            if (currentMenuSelection === '@disabled') {
                if (Menu.sfxBad) {
                    Menu.sfxBad.play();
                }
            } else if (this[currentMenuSelection]) {
                var playSound = this[currentMenuSelection](this.selections[this.selectionIndex]);
                if (playSound !== false && Menu.choose) {
                    Menu.choose.play();
                }
            }
        }

        setSelection(index:number) {
            if (this.selections.length < 1) return;
            if (this.selectionIndex !== undefined) {
                this.selections[this.selectionIndex].classList.remove('active');
            }
            this.selectionIndex = Egg.wrap(index, this.selections.length);
            this.selections[this.selectionIndex].classList.add('active');
            this.fixScroll();
        }

        moveSelection(delta:number) {
            this.setSelection(this.selectionIndex + delta);
        }

        fixScroll() {
            var selected = this.selections[this.selectionIndex];
            var selectedRects = selected.getClientRects();
            var containerRects = this.selectionContainer.getClientRects();

            if (selectedRects.length === 0 || containerRects.length === 0) return;

            var adjustedHeight = selectedRects[0].height / Egg.getCurrentZoom();
            var threshold = selectedRects[0].height * 3;
            var dtop = ((selectedRects[0].top - containerRects[0].top - threshold) / Egg.getCurrentZoom());
            var dbot = ((containerRects[0].bottom - threshold - selectedRects[0].bottom) / Egg.getCurrentZoom());

            if (dtop < 0) {
                this.selectionContainer.scrollTop += Math.ceil(dtop / adjustedHeight) * adjustedHeight;
            }
            if (dbot < 0) {
                this.selectionContainer.scrollTop -=  Math.ceil(dbot / adjustedHeight) * adjustedHeight;
            }
        }
    }
}

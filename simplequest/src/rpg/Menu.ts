module RPG {
    export enum MenuDirection { VERTICAL, HORIZONTAL, GRID };

    export class Menu extends Egg.UiComponent {
        static menuStack:Menu[] = [];
        static blip:Egg.Sound = null;
        static choose:Egg.Sound = null;
        static sfxBad:Egg.Sound = null;

        static get currentMenu():Menu {
            return Menu.menuStack[Menu.menuStack.length - 1] || null;
        }

        static init() {
            Egg.Input.on('menu.down cancel.down', (info) => {
                if (!Menu.currentMenu || !Menu.currentMenu.cancelable || Menu.currentMenu.paused) return;
                Egg.Input.debounce(info.button);
                Menu.pop();
            }, this);

            Egg.Input.on('up.down vertical-.down', (info) => {
                if (!Menu.currentMenu || Menu.currentMenu.paused || Menu.currentMenu.direction === MenuDirection.HORIZONTAL) return;
                Egg.Input.debounce(info.button, 0.2);
                Menu.currentMenu.moveSelection(-1, MenuDirection.VERTICAL);
                if (Menu.blip) Menu.blip.play();
            }, this);

            Egg.Input.on('down.down vertical+.down', (info) => {
                if (!Menu.currentMenu || Menu.currentMenu.paused || Menu.currentMenu.direction === MenuDirection.HORIZONTAL) return;
                Egg.Input.debounce(info.button, 0.2);
                Menu.currentMenu.moveSelection(+1, MenuDirection.VERTICAL);
                if (Menu.blip) Menu.blip.play();
            }, this);

            Egg.Input.on('left.down horizontal-.down', (info) => {
                if (!Menu.currentMenu || Menu.currentMenu.paused || Menu.currentMenu.direction === MenuDirection.VERTICAL) return;
                Egg.Input.debounce(info.button, 0.2);
                Menu.currentMenu.moveSelection(-1, MenuDirection.HORIZONTAL);
                if (Menu.blip) Menu.blip.play();
            }, this);

            Egg.Input.on('right.down horizontal+.down', (info) => {
                if (!Menu.currentMenu || Menu.currentMenu.paused || Menu.currentMenu.direction === MenuDirection.VERTICAL) return;
                Egg.Input.debounce(info.button, 0.2);
                Menu.currentMenu.moveSelection(+1, MenuDirection.HORIZONTAL);
                if (Menu.blip) Menu.blip.play();
            }, this);

            Egg.Input.on('confirm.down', (info) => {
                if (!Menu.currentMenu || Menu.currentMenu.paused) return;
                Egg.Input.debounce(info.button);
                Menu.currentMenu.confirmSelection();
            }, this);
        }

        static push(m:Menu):Menu {
            Egg.Input.debounce("menu cancel up vertical- down vertical+ left horizontal- right horizontal confirm");

            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.pause();
            }
            RPG.controlStack.push(RPG.ControlMode.Menu);
            Menu.menuStack.push(m);

            // if (parentComponent) {
            //     parentComponent.addChild(m, parentElement);
            // } else {
            //     RPG.uiPlane.addChild(m);
            // }
            //
            m.start();
            return m;
        }

        static pop():Menu {
            if (Menu.menuStack.length < 1) {
                throw new Error("Tried to pop with nothing in the menu stack.");
            }
            var m = Menu.menuStack.pop();
            m.stop();
            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.unpause();
            }
            RPG.controlStack.pop();
            return m;
        }

        static replace(m:Menu):void {
            if (Menu.menuStack.length < 1) {
                throw new Error("Tried to replace with nothing in the menu stack.");
            }
            Menu.pop();
            Menu.push(m);
        }

        static update(dt:number):void {
            if (Menu.currentMenu)
                Menu.currentMenu.update(dt);
        }

        cancelable:boolean             = false;
        done:boolean                   = false;
        paused:boolean                 = true;
        direction:MenuDirection;
        selectionIndex:number;
        selectionContainer:HTMLElement;
        selections:HTMLElement[];
        confirmCallback:any; // TODO this is a function, set the right type for it

        private firstScrollFix:boolean = false;

        constructor(args) {
            super(args);

            this.direction = args.direction === undefined ? MenuDirection.VERTICAL : args.direction;
            this.cancelable = !!args.cancelable;
            this.element.classList.add("rpg-menu"); // TODO should actually be 'menu'
            this.setupSelections(args.selectionContainer ? this.find(args.selectionContainer) : this.element);
        }

        setupSelections(parent) {
            if (this.selectionContainer) {
                this.selectionContainer.classList.remove('active');
            }

            this.selectionContainer = parent;
            this.selectionContainer.classList.add('active');
            this.selections = [];
            _.each(parent.getElementsByTagName('*'), (element:HTMLElement) => {
                if (element.getAttribute('data-menu')) {
                    this.selections.push(element);
                }
            });

            if (!this.paused) {
                if (this.selectionIndex >= this.selections.length) {
                    this.setSelection(this.selections.length - 1);
                } else {
                    this.setSelection(this.selectionIndex);
                }
            }
        }

        start() {
            this.done = false;
            this.paused = false;
            this.setSelection(0);
            if (this.selectionContainer) {
                this.selectionContainer.classList.add('active');
            }
        }
        unpause() {
            if (this.paused) {
                this.paused = false;
                this.setSelection(this.selectionIndex);
                if (this.selectionContainer) {
                    this.selectionContainer.classList.add('active');
                }
            }
        }

        pause() {
            if (!this.paused) {
                this.paused = true;
                if (this.selectionContainer) {
                    this.selectionContainer.classList.remove('active');
                }
            }
        }
        stop() {
            this.pause();
            this.done = true;
            // this.remove();
        }

        update(dt) {
            if (!this.firstScrollFix && this.selectionIndex !== undefined) {
                this.firstScrollFix = true;
                this.fixScroll();
            }
        }

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
            if (this.selectionIndex !== undefined && this.selections[this.selectionIndex] !== undefined) {
                this.selections[this.selectionIndex].classList.remove('active');
            }

            this.selectionIndex = Egg.wrap(index, this.selections.length);
            this.selections[this.selectionIndex].classList.add('active');
            this.fixScroll();
        }

        moveSelection(delta:number, direction:MenuDirection) {
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

            var st = this.selectionContainer.scrollTop;
            var sh = this.selectionContainer.scrollHeight;
            var ch = this.selectionContainer.clientHeight;

            if (ch < sh) {
                st > 0 ? this.selectionContainer.classList.add('can-scroll-up') : this.selectionContainer.classList.remove('can-scroll-up');
                st < sh - ch ? this.selectionContainer.classList.add('can-scroll-down') : this.selectionContainer.classList.remove('can-scroll-down');
            }
        }
    }
}

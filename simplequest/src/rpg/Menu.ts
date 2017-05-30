module RPG {
    export enum MenuDirection { VERTICAL, HORIZONTAL, GRID };

    export class Menu extends Cozy.UiComponent {
        static menuStack:Menu[] = [];
        static blip:Cozy.Sound = null;
        static choose:Cozy.Sound = null;
        static sfxBad:Cozy.Sound = null;

        static get currentMenu():Menu {
            return Menu.menuStack[Menu.menuStack.length - 1] || null;
        }

        static init() {
            Cozy.Input.on('menu.down cancel.down', (info) => {
                if (!Menu.currentMenu || !Menu.currentMenu.cancelable || Menu.currentMenu.paused) return;
                Cozy.Input.debounce(info.button);
                Menu.currentMenu.cancel();
            }, this);

            Cozy.Input.on('up.down vertical-.down', (info) => {
                if (!Menu.currentMenu || Menu.currentMenu.paused || Menu.currentMenu.direction === MenuDirection.HORIZONTAL) return;
                Cozy.Input.debounce(info.button, 0.2);
                if (Menu.currentMenu.moveSelection(-1, MenuDirection.VERTICAL) && Menu.blip) Menu.blip.play();
            }, this);

            Cozy.Input.on('down.down vertical+.down', (info) => {
                if (!Menu.currentMenu || Menu.currentMenu.paused || Menu.currentMenu.direction === MenuDirection.HORIZONTAL) return;
                Cozy.Input.debounce(info.button, 0.2);
                if (Menu.currentMenu.moveSelection(+1, MenuDirection.VERTICAL) && Menu.blip) Menu.blip.play();
            }, this);

            Cozy.Input.on('left.down horizontal-.down', (info) => {
                if (!Menu.currentMenu || Menu.currentMenu.paused || Menu.currentMenu.direction === MenuDirection.VERTICAL) return;
                Cozy.Input.debounce(info.button, 0.2);
                if (Menu.currentMenu.moveSelection(-1, MenuDirection.HORIZONTAL) && Menu.blip) Menu.blip.play();
            }, this);

            Cozy.Input.on('right.down horizontal+.down', (info) => {
                if (!Menu.currentMenu || Menu.currentMenu.paused || Menu.currentMenu.direction === MenuDirection.VERTICAL) return;
                Cozy.Input.debounce(info.button, 0.2);
                if (Menu.currentMenu.moveSelection(+1, MenuDirection.HORIZONTAL) && Menu.blip) Menu.blip.play();
            }, this);

            Cozy.Input.on('confirm.down', (info) => {
                if (!Menu.currentMenu || Menu.currentMenu.paused) return;
                Cozy.Input.debounce(info.button);
                Menu.currentMenu.confirmSelection();
            }, this);
        }

        static push(m:Menu):Menu {
            Cozy.Input.debounce("menu cancel up vertical- down vertical+ left horizontal- right horizontal confirm");

            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.pause();
            }
            RPG.ControlStack.push(RPG.ControlMode.Menu);
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
            RPG.ControlStack.pop();
            if (Menu.menuStack.length > 0) {
                Menu.currentMenu.unpause();
            }
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

        cancelable:boolean                          = false;
        done:boolean                                = false;
        paused:boolean                              = true;
        scrollable:boolean                          = false;
        indicators:{[key:string]: HTMLElement}      = {};
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
            this.element.classList.add("menu"); // TODO should actually be 'menu'
            this.setupSelections(args.selectionContainer ? this.find(args.selectionContainer) : this.element);
        }

        setupSelections(parent) {
            if (this.selectionContainer) {
                this.selectionContainer.classList.remove('active');
                _.each(this.indicators, (e) => {
                    if (e.parentElement) {
                        e.parentElement.removeChild(e);
                    }
                });
                this.indicators = {};
            }

            this.selectionContainer = parent;
            this.selectionContainer.classList.add('active');

            this.selections = [];
            _.each(parent.getElementsByTagName('*'), (element:HTMLElement) => {
                if (element.getAttribute('data-menu')) {
                    this.selections.push(element);
                }
            });

            if (this.selectionContainer.classList.contains('scrollable')) {
                this.scrollable = true;

                this.indicators['up'] = document.createElement('div');
                this.indicators['up'].className = 'indicator up';
                this.selectionContainer.appendChild(this.indicators['up']);

                this.indicators['down'] = document.createElement('div');
                this.indicators['down'].className = 'indicator down';
                this.selectionContainer.appendChild(this.indicators['down']);
            } else {
                this.scrollable = false;
            }

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

            this.selectionIndex = Cozy.wrap(index, this.selections.length);
            this.selections[this.selectionIndex].classList.add('active');
            this.fixScroll();
            return true;
        }

        moveSelection(delta:number, direction:MenuDirection) {
            return this.setSelection(this.selectionIndex + delta);
        }

        cancel() {
            Menu.pop();
        }

        fixScroll() {
            if (!this.scrollable) return;

            var selected = this.selections[this.selectionIndex];
            var container = this.selectionContainer;

            if (!selected || !container) return;

            var st = container.scrollTop;

            var selectedTop = selected.offsetTop;
            var selectedHeight = selected.clientHeight;
            var selectedBottom = selectedTop + selectedHeight;

            var containerHeight = container.clientHeight;
            var scrollHeight = container.scrollHeight;
            var threshold = (containerHeight / 3) || 0;

            if (selectedTop < st + threshold) {
                st = selectedTop - threshold;
                if (selectedBottom > st + containerHeight - threshold) {
                    st = selectedTop + selectedHeight / 2 - containerHeight / 2;
                }
            } else if (selectedBottom > st + containerHeight - threshold) {
                st = selectedBottom - containerHeight + threshold;
                if (selectedTop < st + threshold) {
                    st = selectedTop + selectedHeight / 2 - containerHeight / 2;
                }
            }

            st = Math.min(scrollHeight - containerHeight, Math.max(0, st));
            st > 0 ? container.classList.add('can-scroll-up') : container.classList.remove('can-scroll-up');
            st < scrollHeight - containerHeight ? container.classList.add('can-scroll-down') : container.classList.remove('can-scroll-down');

            this.selectionContainer.scrollTop = st;

            this.indicators['up'].style.top = this.selectionContainer.scrollTop + 'px';
            this.indicators['down'].style.bottom = -this.selectionContainer.scrollTop + 'px';
        }
    }
}

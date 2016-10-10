module EntityTests {
    var root:Egg.Entity;

    class TestComponent extends Egg.Component {
        foo:string;
        bar:string;
        accum:number = 0;

        getFoo() { return this.foo; }
        getBar() { return this.bar; }

        update(dt) {
            super.update(dt);
            this.accum -= dt;
            while (this.accum <= 0) {
                console.log(">>", this.getFoo(), this.getBar());
                this.accum += 5;
            }
        }
    }

    class TestComponentA extends TestComponent {
        constructor(f:string) { super(); this.foo = f; this.bar = "barbarbar"; }
    }

    class TestComponentB extends TestComponent {
        constructor(b:string) { super(); this.bar = b; this.foo = "foofoofoo"; }
    }

    export function start() {
        root = new Egg.Entity();
        window['sceneRoot'] = root;

        root.addChild([
            new TestComponentA("hello")
        ]);

        root.addChild([
            new TestComponentA("shmello"),
            new TestComponentB("smello")
        ]);

        Egg.unpause();
    }

    export function frame(dt) {
        root.update(dt);
    }
}

module.exports = EntityTests;

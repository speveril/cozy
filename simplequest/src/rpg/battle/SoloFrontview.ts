module RPG.BattleSystem {
    export class SoloFrontview {
        fightMusic:Egg.Music        = null;
        victoryMusic:Egg.Music      = null;
        monsters:any                = null;
        renderPlane:Egg.RenderPlane = null;
        uiPlane:Egg.UiPlane         = null;

        constructor(args:any) {
            this.fightMusic = args.fightMusic || null;
            this.victoryMusic = args.victoryMusic || null;
            this.monsters = args.monsters || {};

            this.renderPlane = <Egg.RenderPlane>Egg.addPlane(Egg.RenderPlane, { className: 'battle-render' });
            this.renderPlane.hide();

            this.uiPlane = <Egg.UiPlane>Egg.addPlane(Egg.UiPlane, { className: 'battle-ui' });
            this.uiPlane.hide();
        }

        *start(args:any) {
            var done = false;
            var time = 0;

            while (!done) {
                var dt = yield;
                time += dt;
                console.log(dt, time);

                if (time > 10) done = true;
            }
            console.log("completed battle");
        }
    }
}

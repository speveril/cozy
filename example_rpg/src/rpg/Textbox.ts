module RPG {
    export class Textbox {
        static show(text:string) {
            var textboxSprite = new Egg.Sprite({
                texture: 'sprites/textbox.png',
                position: { x:0, y:190 }
            })
            RPG.UILayer.add(textboxSprite);
        }
    }
}

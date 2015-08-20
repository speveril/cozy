using Oleander;
using UnityEngine;
using System.Collections;

namespace GTGMaps {
    public class GTG02 : Oleander.Map {
        public GTG02() : base() {
            LoadJSON("maps/gtg-02");
        }

        public void TestEvent(TriggerInfo info) {
            if (info.sprite != Game.GetPlayerSprite()) return;

            CutScene scene = new Oleander.CutScene();
            scene.State("START")
                .Enter_Textbox("This is a <size=40>large</size> amount of text! Let's see how this wraps. There's a <color=#ff0000>cat</color> trying to climb on my hands while I type.")
                .Update_WaitForButtonThen("what event")
                .Exit_Textbox()
            ;
            scene.State("what event")
                .Enter_Textbox("By the way, this is event tile " + info.data["flag"] + ".")
                .Update_WaitForButtonThen("flip tile")
                .Exit_Textbox()
            ;
            scene.State("flip tile")
                .Enter(delegate() {
                    SetTile(2, 2, 0, GetTile(2, 2, 0) == 7 ? 6 : 7);
                    scene.End();
                })
            ;

            Game.StartCutScene(scene);
        }
    }
}

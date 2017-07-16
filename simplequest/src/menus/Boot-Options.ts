module SimpleQuest {
    export module Menu {
        export class Boot_Options extends RPG.Menu {
            savedSFXVolume:number;
            savedMusicVolume:number;

            constructor() {
                super({
                    cancelable: true,
                    className: 'boot-options-menu box',
                    tag: 'div',
                    html: `
                        <div class="title">Options</div>
                        <ul class="selections">
                            <li class="sfx" data-menu="sfx">
                                <div class="label">Sound Volume</div>
                                <div class="value"><meter max="100"></meter></div>
                            </li>
                            <li class="music" data-menu="music">
                                <div class="label">Music Volume</div>
                                <div class="value"><meter max="100"></meter></div>
                            </li>

                            <li class="divider"></li>

                            <li class="foot" data-menu="accept">
                                <div>Accept</div>
                            </li>
                            <li class="foot" data-menu="cancel">
                                <div>Cancel</div>
                            </li>
                        </ul>
                    `
                });

                this.savedSFXVolume = Cozy.Audio.sfxVolume;
                this.savedMusicVolume = Cozy.Audio.musicVolume;

                this.updateMeters();
                this.setupSelections(this.find('ul.selections'));
            }

            updateMeters() {
                this.find('.sfx .value meter').setAttribute('value', Math.round(Cozy.Audio.sfxVolume * 100).toString());
                this.find('.music .value meter').setAttribute('value', Math.round(Cozy.Audio.musicVolume * 100).toString());
            }

            stop() {
                super.stop();
                this.remove();
            }

            sfx_adjust(d:number) {
                Cozy.Audio.setSFXVolume(Math.min(1, Math.max(0, Cozy.Audio.sfxVolume + 0.05 * d)));
                this.updateMeters();
            }

            music_adjust(d:number) {
                Cozy.Audio.setMusicVolume(Math.min(1, Math.max(0, Cozy.Audio.musicVolume + 0.05 * d)));
                this.updateMeters();
                return false;
            }

            accept() {
                Cozy.writeUserConfig({
                    volume: {
                        sfx: Cozy.Audio.sfxVolume,
                        music: Cozy.Audio.musicVolume
                    }
                })
                RPG.Menu.pop();
            }

            cancel() {
                Cozy.Audio.setSFXVolume(this.savedSFXVolume);
                Cozy.Audio.setMusicVolume(this.savedMusicVolume);
                RPG.Menu.pop();
            }
        }
    }
}

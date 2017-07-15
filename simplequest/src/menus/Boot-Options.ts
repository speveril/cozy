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
                                <div class="value"></div>
                            </li>
                            <li class="music" data-menu="music">
                                <div class="label">Music Volume</div>
                                <div class="value"></div>
                            </li>

                            <li class="divider"></li>

                            <li class="foot" data-menu="accept">Accept</li>
                            <li class="foot" data-menu="cancel">Cancel</li>
                        </ul>
                    `
                });

                this.savedSFXVolume = Cozy.Audio.sfxVolume;
                this.savedMusicVolume = Cozy.Audio.musicVolume;

                this.find('.sfx .value').innerText = Math.round(this.savedSFXVolume * 100).toString();
                this.find('.music .value').innerText = Math.round(this.savedMusicVolume * 100).toString();

                this.setupSelections(this.find('ul.selections'));
            }

            stop() {
                super.stop();
                this.remove();
            }

            sfx_adjust(d:number) {
                Cozy.Audio.setSFXVolume(Math.min(1, Math.max(0, Cozy.Audio.sfxVolume + 0.05 * d)));
                this.find('.sfx .value').innerText = Math.round(Cozy.Audio.sfxVolume * 100).toString();
            }

            music_adjust(d:number) {
                Cozy.Audio.setMusicVolume(Math.min(1, Math.max(0, Cozy.Audio.musicVolume + 0.05 * d)));
                this.find('.music .value').innerText = Math.round(Cozy.Audio.musicVolume * 100).toString();
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

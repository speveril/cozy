module SimpleQuest {
    export module Menu {
        export class Boot_Options extends RPG.Menu {
            savedSFXVolume:number;
            savedMusicVolume:number;
            savedFullScreen:boolean;

            constructor() {
                super({
                    cancelable: true,
                    className: 'boot-options-menu box',
                    tag: 'div',
                    html: `
                        <div class="title">Options</div>
                        <ul class="selections">
                            <li class="divider"></li>

                            <li class="sfx" data-menu="sfx">
                                <div class="label">Sound Volume</div>
                                <div class="value"><meter max="100"></meter></div>
                            </li>
                            <li class="music" data-menu="music">
                                <div class="label">Music Volume</div>
                                <div class="value"><meter max="100"></meter></div>
                            </li>
                            <li class="fullscreen" data-menu="fullscreen">
                                <div class="label">Full Screen</div>
                                <div class="value">
                                    <div class="indicator true">Yes</div>
                                    <div class="indicator false">No</div>
                                </div>
                            </li>

                            <li class="divider"></li>

                            <li class="foot" data-menu="accept">
                                <div>Accept</div>
                            </li>
                            <li class="foot" data-menu="cancel">
                                <div>Cancel</div>
                            </li>

                            <li class="divider"></li>
                            
                            <div class="version"></div>
                        </ul>
                    `
                });

                this.savedSFXVolume = Cozy.Audio.sfxVolume;
                this.savedMusicVolume = Cozy.Audio.musicVolume;
                this.savedFullScreen = Cozy.getFullScreen();

                if (Cozy.config['version']) {
                    this.find('div.version').innerText = 'v.' + Cozy.config['version'];
                }

                this.updateMeters();
                this.find('.fullscreen .value').classList.add(Cozy.getFullScreen().toString());
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

            fullscreen() {
                Cozy.setFullScreen(!Cozy.getFullScreen());
                this.find('.fullscreen .value').classList.remove('true','false');
                this.find('.fullscreen .value').classList.add(Cozy.getFullScreen().toString());
            }

            fullscreen_adjust(d:number) {
                if ((d < 0 && !Cozy.getFullScreen()) || (d > 0 && Cozy.getFullScreen())) {
                    this.fullscreen();
                } else {
                    return false;
                }
            }

            accept() {
                Cozy.writeUserConfig({
                    fullscreen: Cozy.getFullScreen(),
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
                Cozy.setFullScreen(this.savedFullScreen);
                RPG.Menu.pop();
            }
        }
    }
}

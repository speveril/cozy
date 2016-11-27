module VisualNovel {
    export function getPages() {
        return {
            'start': {
                bg: 'scr01.png',
                text: [
                    {
                        x: 1200, y: 150, w: 600,
                        text: `
                            There's been a zombie outbreak. Good thing you're here! You know just what to do...
                            <ul>
                                <li data-action="shoot">Shoot them!</li>
                                <li data-action="guide">Get out your trusty Zombie Survival Guide</li>
                                <li data-action="run">Get your ass out of here</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    shoot:  `VN.showPage('shooting')`,
                    guide:  `VN.showPage('reading')`,
                    run:    `VN.showPage('coward-death')`
                }
            },
            'shooting': {
                bg: 'scr03.png',
                text: [
                    {
                        x: 1150, y: 40, w: 680,
                        text: `
                            You pull out your trusty airsoft guns and start firing into the crowd. You know Mythbusters said it's not as effective, but you shoot side-style with both hands because you're a bad-ass.
                            <ul>
                                <li data-action="continue">Continue</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    continue:   `VN.showPage('shooter death')`
                }
            },
            'reading': {
                bg: 'scr02.png',
                text: [
                    {
                        x: 1400, y: 120, w: 500,
                        text: `
                            The good ol' ZSG is always close at hand. It's a good thing zombie experts like you know all about zombies even though they were, until now, fictional! You pull it out and start leafing through the pages...
                            <ul>
                                <li data-action="continue">Look up appropriate quarantine methods</li>
                                <li data-action="continue">Look up most effective means of combatting the undead.</li>
                                <li data-action="continue">Remind yourself exactly what a zombie is.</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    continue:   `VN.showPage('nerd death')`
                }
            },
            'shooter death': {
                bg: 'scr04.png',
                text: [
                    {
                        x: 120, y: 680, w: 750,
                        text: `
                            Not only do you miss every zombie, you're using useless toys to shoot at them. You are quickly overwhelmed and die.
                            <ul>
                                <li data-action="restart">Restart</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    restart:    `VN.reset(); VN.showPage('start')`
                }
            },
            'nerd death': {
                bg: 'scr04.png',
                text: [
                    {
                        x: 120, y: 680, w: 750,
                        text: `
                            The zombies eat you while you're reading your idiotic book. You die.
                            <ul>
                                <li data-action="restart">Restart</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    restart:    `VN.reset(); VN.showPage('start');`
                }
            },
            'coward-death': {
                bg: 'scr04.png',
                text: [
                    {
                        x: 120, y: 680, w: 750, text: `
                            Turns out you suck at running. The zombies eat you until you die.
                            <ul>
                                <li data-action="restart">Restart</li>
                            </ul>
                        `
                    }
                ],
                actions: {
                    restart:    `VN.reset(); VN.showPage('start');`
                }
            },
        }
    }
}

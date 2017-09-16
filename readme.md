# Cozy
## A generic 2d game engine.

https://cozyengine.com/


**Cozy is not currently released.** If you've somehow gotten access to this repository, hopefully I've actually given it to you and you know what's up. When/if I do ever release it, it will be under a permissive license (probably something like MIT).


I have a lot of games I want to make at some point and/or have been working on for more than a decade. I keep trying other engines and finding something distasteful about them; I figured if I made my own at least I couldn't blame anyone else. I could also build it with the tools that I am most familiar with and so afford me the most pleasant working environment -- as such the main basis of the engine are web technologies, like HTML and JS.

The engine's development is driven entirely by my needs of it. That said, if you are using the engine and have a use-case that I'm not meeting, we should talk -- maybe there's something I haven't thought of which would be great, or something I'm already planning that I could shuffle forward on the roadmap.

Cozy (the development environment and the games it creates) currently works on Windows. It should be fairly straightforward to get it working on other platforms, it just hasn't happened yet.


## Usage

Run `.engine/cozy.exe`. This will open the launcher/project manager. I like to make a shortcut on my desktop to `.engine/cozy.exe` so I can find it easily. I hope to make this process less annoying in the future.

Unfortunately, **to get up and running you'll need to have NPM installed**; run `npm install` in `.engine/resources/app/`. I plan to make this a requirement only if you intend to work on the engine, eventually.


## Current technologies

- Electron: <https://github.com/atom/electron>
- PIXI.js: <http://www.pixijs.com/>
- Underscore: <http://underscorejs.org>
- Typescript: <http://typescriptlang.org>


## Examples

See https://bitbucket.org/speveril/cozy-examples/

### SimpleQuest

SimpleQuest was built with Cozy as a way to shake out any problems with the engine by building a game end-to-end. It also formed the basis of the RPG Kit code.

http://speveril.itch.io/simplequest


## Feature Roadmap

The roadmap/tasklist is now on Quire:

https://quire.io/w/CozyEngine/

If you need access, talk to Shamus.


## Who is responsible for this mess

[Shamus Peveril](http://shamuspeveril.com) -- architect, lead (only) developer, example maker

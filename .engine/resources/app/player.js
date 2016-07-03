Player = {
    play: function(path, debug) {
        if (path === undefined) {
            Browser.output("<span style='color:red'>Can't play: No game path supplied.</span>");
            return;
        }

        try {
            params = JSON.parse(FS.readFileSync(Path.join(path, "config.json")));
        } catch(e) {
            Browser.output("<span style='color:red'>Can't play: " + e + "</span>");
            return;
        }

        params['width'] = params['width'] || 320;
        params['height'] = params['height'] || 240;
        params['game'] = path;
        params['debug'] = debug

        var window = new BrowserWindow({
          'width':              params['width'],
          'height':             params['height'],
          'title':              params['title'] || 'Egg',
          'fullscreen':         params['fullscreen'] || false,
          'autoHideMenuBar':    true,
          'useContentSize':     true
        });
        window.toggleDevTools();

        window.once('close', function() {
            Process.exit(0);
        });

        window.loadURL("file://" + __dirname + "/game.html");
        window.webContents.on('did-finish-load', () => {
            window.webContents.send('start', params);
        });
    }
}

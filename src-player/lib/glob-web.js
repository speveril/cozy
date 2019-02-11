(function() {
    let manifest = null;

    window["glob"] = {
        setManifest(m) {
            manifest = m;
        },

        sync(pattern, opts) {
            // TODO do a better job here; the real node glob uses the minimax library but getting that
            //      library working with the web export is probably going to be a pain -- do a "good
            //      enough" job for now.

            console.log("glob:", pattern, opts);

            let prefix = "";
            let rePattern = "";

            if (opts.cwd) {
                prefix = opts.cwd;
                if (prefix.length > 0 && prefix[prefix.length - 1] !== '/') prefix += "/";
            }

            let index = 0;
            while (index < pattern.length) {
                if (pattern[index] === '*') {
                    if (pattern[index + 1] === '*') {
                        rePattern += ".*?";
                        index++;
                    } else {
                        rePattern += "[^/\\\\]*";
                    }
                } else if (pattern[index] === '.') {
                    rePattern += "\\.";
                } else if (pattern[index] === '{') {
                    index++;
                    let end = pattern.indexOf('}', index);
                    rePattern += "(" + pattern.slice(index, end).replace(',','|') + ")";
                    index = end;
                } else {
                    rePattern += pattern[index];
                }

                index++;
            }

            console.log("glob regexp:", '^' + prefix + rePattern);
            let found = [];
            let re = new RegExp('^' + prefix + rePattern);
            for (let f of manifest) {
                if (f.name.match(re)) {
                    found.push(f.name.slice(prefix.length));
                }
            }

            console.log("glob found:", found);

            return found;
        },
    };
})();
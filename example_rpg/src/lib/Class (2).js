var Class = {
    extend: function(name /*, ... */) {
        var parentClass = this;

        var newClass = function() {
            this.parent = {};
            for (var k in parentClass.prototype) {
                this.parent[k] = parentClass.prototype[k].bind(this);
            }
            if (this.init) {
                this.init.call(this, Array.prototype.slice.call(arguments));
            }
        };
        newClass.name = name;
        window[name] = newClass;

        for (var k in this) {
            newClass[k] = this[k];
        }
        newClass.__superclass__ = this;

        for (var k in this.prototype) {
            newClass.prototype[k] = this.prototype[k];
        }

        var i = 0;
        Array.prototype.forEach.call(arguments, function(f) {
            i++;

            // skip the name
            if (i > 1) {
                newClass.prototype[f.name] = f;
            }
        }, this);

        return newClass;
    }
};
var Class = {
    extend: function(/* ... */) {
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

        for (var k in this) {
            newClass[k] = this[k];
        }
        newClass.__superclass__ = this;

        for (var k in this.prototype) {
            newClass.prototype[k] = this.prototype[k];
        }

        Array.prototype.forEach.call(arguments, function(f) {
            newClass.prototype[f.name] = f;
        }, this);

        return newClass;
    }
};
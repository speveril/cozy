// (best 4 of 4d8)

module RPG {
    // var dbg = console.log.bind(console); // uncomment to turn ON debugging
    var dbg = function(...args) {}; // uncomment to turn OFF debugging

    var tokenRegexp = '\\(|\\)|d|\\*|\\/|\\+|\\-|\\$\\w+|\\w+|\\d+|,';
    // var tokenDefs = {
    //     LPAREN: '(',
    //     RPAREN: ')',
    //     D: /d/i,
    //     MUL: '*',
    //     DIV: '/',
    //     ADD: '+',
    //     SUB: '-',
    //     VAR: /$\w+/,
    //     NUM: /\d+/
    // };

    var rollDie = (dieSize) => Math.floor(Math.random() * dieSize) + 1;
    var rollDice = (numDice, dieSize) => {
        var rolls = [];
        _.times(numDice, () => rolls.push(rollDie(dieSize)));
        return rolls;
    };


    export class Dice {
        actor:RPG.Character;
        tokens:string[];
        parseIndex:number;
        tree:any;
        indent:number;

        static roll(actor:RPG.Character, s:string) {
            var roll = new Dice(s);
            return roll.resolve(actor);
        }

        constructor(s:string) {
            var re = new RegExp(tokenRegexp, 'g');

            this.tokens = this.tokenize(s);
            this.tree = this.parse();
        }

        tokenize(s:string) {
            var tokens = [];
            var i = 0;

            function getWord(idx, matcher) {
                var w = '';
                while (idx < s.length && s[idx].match(matcher)) {
                    w = w + s[idx++];
                }
                return w;
            }

            function next() {
                if (i >= s.length) return null;

                var ch = s[i];
                var t:any = {};
                t.value = ch;

                if (ch === '(') {
                    t.type = 'LPAREN';
                } else if (ch === ')') {
                    t.type = 'RPAREN';
                } else if (ch === ',') {
                    t.type = 'COMMA';
                } else if (ch === '*' || ch === '/') {
                    t.type = 'MUL';
                } else if (ch === '+' || ch === '-') {
                    t.type = 'ADD';
                } else if (ch === '$') {
                    t.type = 'VAR';
                    // TODO check that var name is valid?
                    t.value += getWord(i + 1, /\w/);
                } else if (ch.match(/\d/)) {
                    t.type = 'NUM';
                    t.value = getWord(i, /\d/);
                } else if (ch.match(/[a-zA-Z]/)) {
                    t.value = getWord(i, /[a-zA-Z_]+/);
                    if (t.value === 'd' || t.value === 'D') t.type = 'D';
                    else t.type = 'IDENT';
                }

                if (!t.type) {
                    throw new Error("Parse error on die roll '" + s + "' at '" + s.slice(i) + "'");
                }

                i += t.value.length;
                i += getWord(i, /\s/).length;

                return t;
            };

            var token;
            while (token = next()) {
                tokens.push(token);
            }

            return tokens;
        }

        parse() {
            dbg("parse:", this.tokens);
            this.parseIndex = 0;
            var ex = this.parseExpr();
            if (this.parseIndex < this.tokens.length) {
                throw new Error("Parse error, expected end of expression at " + this.peek().value);
            }
            dbg("expr -> ", ex);
            return ex;
        }

        parseExpr() {
            var expr = this.parseMUL();
            var t = this.peek();
            while (t.type === 'ADD') {
                this.consume();
                var rhs = this.parseMUL();
                expr = { type: t.value === '+' ? "add" : 'subtract', lhs:expr, rhs:rhs };
                t = this.peek();
                dbg("add ->",expr);
            }

            return expr;
        }

        parseMUL() {
            var expr = this.parseD();
            var t = this.peek();
            while (t.type === 'MUL') {
                this.consume();
                var rhs = this.parseD();
                expr = { type: t.value === '*' ? "multiply" : 'divide', lhs:expr, rhs:rhs };
                t = this.peek();
                dbg("mul ->",expr);
            }
            return expr;
        }

        parseD() {
            var expr = this.parsePrime();
            var t = this.peek();
            if (t.type === 'D') {
                this.consume();
                var rhs = this.parsePrime();
                expr = { type: "roll", lhs:expr, rhs:rhs };
                dbg("d ->",expr);
            }
            return expr;
        }

        parsePrime() {
            var t = this.peek();
            if (t.type === 'NUM') {
                this.consume();
                dbg("(num) ->", t.value);
                return { type:"number", value: parseInt(t.value,10) };
            } else if (t.type === 'VAR') {
                this.consume();
                dbg("(var) ->")
                return { type:"variable", value: t.value.slice(1) };
            } else if (t.type === 'LPAREN') {
                this.consume();
                var expr = this.parseExpr();
                if (this.peek().type !== 'RPAREN') {
                    throw new Error("Unbalanced parens, expected ).");
                }
                this.consume();
                dbg('subexpr ->', expr);
                return expr;
            } else if (t.type === 'IDENT') {
                this.consume();
                var params = [];
                if (this.peek().type != 'LPAREN') throw new Error("Identifier must be followed by an expression list.");
                this.consume();
                while (true) {
                    params.push(this.parseExpr());
                    if (this.peek().type === 'RPAREN') {
                        this.consume();
                        break;
                    } else if (this.peek().type === 'COMMA') {
                        this.consume();
                    } else {
                        throw new Error("Unfinished function call (next token is " + this.peek().type + ")");
                    }
                }
                dbg(t.value,'->',params);
                return { type:"func", name:t.value, value:params };
            } else {
                throw new Error("Expected identifier, number, var, or paren.");
            }
        }

        peek():any {
            return this.tokens[this.parseIndex] || {};
        }

        consume() {
            dbg(" >> CONSUME", this.tokens[this.parseIndex]);
            this.parseIndex++;
        }

        resolve(actor:RPG.Character) {
            this.indent = 0;
            return this.resolveNode(actor, this.tree);
        }

        resolveNode(actor:RPG.Character, node:any) {
            var result = 0;

            switch (node.type) {
                case 'number':
                    result = node.value;
                    break;
                case 'variable':
                    result = actor.get(node.value);
                    break;
                case 'add':
                    result = this.resolveNode(actor, node.lhs) + this.resolveNode(actor, node.rhs);
                    break;
                case 'subtract':
                    result = this.resolveNode(actor, node.lhs) - this.resolveNode(actor, node.rhs);
                    break;
                case 'multiply':
                    result = this.resolveNode(actor, node.lhs) * this.resolveNode(actor, node.rhs);
                    break;
                case 'divide':
                    result = this.resolveNode(actor, node.lhs) / this.resolveNode(actor, node.rhs);
                    break;
                case 'roll':
                    result = this.func_roll(actor, [node.lhs, node.rhs]);
                    break;
                case 'func':
                    dbg("FUNC: ", node.name, node.value);
                    var func = this['func_' + node.name];
                    if (func === undefined) throw new Error("Called unrecognized function " + node.name + "()");
                    result = func.call(this, actor, node.value);
                    break;
                default:
                    throw new Error("Unrecognized node in AST: " + node.type);
            }

            return result;
        }

        func_roll(actor:RPG.Character, args:Array<any>):number {
            var rolls = rollDice(
                <number>this.resolveNode(actor, args[0]),
                <number>this.resolveNode(actor, args[1]));
            var result = _.reduce(rolls, (accum:number, num:number) => accum + num);
            dbg(rolls,"->",result);
            return result;
        }

        func_best(actor:RPG.Character, args:Array<any>) {
            if (args[1].type !== 'roll') throw new Error("Parameter 2 to best() must be a roll.");
            var best:number = <number>this.resolveNode(actor, args[0]);
            var rolls = rollDice(this.resolveNode(actor, args[1].lhs), this.resolveNode(actor, args[1].rhs));
            rolls.sort();
            var result = _.reduce(rolls.slice(-best), (accum:number, num:number) => accum + num);
            dbg(rolls,"->",result);
            return result;
        }

        func_worst(actor:RPG.Character, args:Array<any>) {
            if (args[1].type !== 'roll') throw new Error("Parameter 2 to best() must be a roll.");
            var worst:number = <number>this.resolveNode(actor, args[0]);
            var rolls = rollDice(this.resolveNode(actor, args[1].lhs), this.resolveNode(actor, args[1].rhs));
            rolls.sort();
            var result = _.reduce(rolls.slice(0, worst), (accum:number, num:number) => accum + num);
            dbg(rolls,"->",result);
            return result;
        }
    }
}

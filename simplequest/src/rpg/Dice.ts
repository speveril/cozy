module RPG {
    var tokenRegexp = '\\(|\\)|d|\\*|\\/|\\+|\\-|\\$\\w+|\\d+';
    var tokenDefs = {
        LPAREN: '(',
        RPAREN: ')',
        D: /d/i,
        MUL: '*',
        DIV: '/',
        ADD: '+',
        SUB: '-',
        VAR: /$\w+/,
        NUM: /\d+/
    }

    export class Roll {
        actor:RPG.Character;
        tokens:string[];
        parseIndex:number;
        tree:any;
        indent:number;

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
                } else if (ch === 'd' || ch === 'D') {
                    t.type = 'D';
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
            this.parseIndex = 0;
            var ex = this.parseExpr();
            if (this.parseIndex < this.tokens.length) {
                throw new Error("Parse error, expected end of expression at " + this.peek().value);
            }
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
            }
            return expr;
        }

        parsePrime() {
            var t = this.peek();
            if (t.type === 'NUM') {
                this.consume();
                return { type:"number", value: parseInt(t.value,10) };
            } else if (t.type === 'VAR') {
                this.consume();
                return { type:"variable", value: t.value.slice(1) };
            } else if (t.type === 'LPAREN') {
                this.consume();
                var expr = this.parseExpr();
                if (this.peek().type !== 'RPAREN') {
                    throw new Error("Unbalanced parens, expected ).");
                }
                this.consume();
                return expr;
            } else {
                throw new Error("Expected number, var, or paren.");
            }
        }

        peek():any {
            return this.tokens[this.parseIndex] || {};
        }

        consume() {
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
                    var rolls = this.resolveNode(actor, node.lhs);
                    var dieSize = this.resolveNode(actor, node.rhs);
                    _.times(rolls, () => {
                        result += Math.floor(Math.random() * dieSize) + 1;
                    });
                    break;
                default:
                    throw new Error("Unrecognized node in AST: " + node.type);
            }

            return result;
        }
    }
}

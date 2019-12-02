var ls = require('lexical-scope');
var acorn = require('acorn');
var p5 = require('p5');

function checkSourceP5(source) {
    let except = ['draw', 'setup', "undefined", "null"];
    let hits = [];
    let res = ls(source)
    res.globals.implicit.forEach(ref => {
        if (p5.prototype.hasOwnProperty(ref) && !except.includes(ref)) {
            hits.push({
                'is': ref,
                'shouldBe': 'this.sketch.' + ref,
                loc: null
            })
            if (Math.hasOwnProperty(ref)) {
                hits[hits.length - 1].shouldBe = hits[hits.length - 1].shouldBe + " (or Math." + hits[hits.length - 1].is + " instead)";
            }
        }
    });

    let tokens = [...acorn.tokenizer(source, {
        'locations': true
    })]
    tokens.forEach(function (token, index) {
        let foundIndex = hits.findIndex(elm => elm.is == token.value)
        if (foundIndex != -1) {
            hits[foundIndex].loc = token.loc
        }
    })
    return hits
}

function checkSourceSeq(source) {
    let hits = [];
    let tokens = [...acorn.tokenizer(source, {
        'locations': true
    })]
    let refsToSeq = ['seq']
    tokens.forEach(function (token, index) {
        if (token.value != undefined && index - 3 >= 0) {
            let lookingAt = token.value;
            let assignIndexOffset = -1;
            if (tokens[index - 1].type.label == '.') {
                lookingAt = tokens[index - 2].value + tokens[index - 1].type.label + tokens[index].value;
                assignIndexOffset = -3;
            }
            let assignIndex = index + assignIndexOffset
            if (!refsToSeq.includes(lookingAt)) {
                return
            } else {}
            if (tokens[assignIndex].value == "=") {
                if (tokens[assignIndex - 2].type.label == '.') {
                    newRef = tokens[assignIndex - 3].value + tokens[assignIndex - 2].type.label + tokens[assignIndex - 1].value
                } else {
                    newRef = tokens[assignIndex - 1].value
                }
                refsToSeq.push(newRef);
            }
            if (tokens[index + 1].type.label == "[") {
                hits.push({
                    'is': lookingAt + '[' + tokens[index + 2].value + ']',
                    'shouldBe': lookingAt + ".getElement(" + tokens[index + 2].value + ")",
                    loc: token.loc
                })
            }
        }
    })
    return hits;
}

window.checkSourceP5 = checkSourceP5;
window.checkSourceSeq = checkSourceSeq;
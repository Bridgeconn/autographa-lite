verseStr = '\f + The best ancient copies omit v. 21. \fqa But this kind of demon does not go out except with prayer and fasting."\f*';
require('fs').writeFileSync('./temp_output.json', verseStr+'\n', {
    encoding: 'utf8',
    flag: 'w'
});

//verseStr = verseStr.replace(/\\[\S]*? \+ /g, '');
//verseStr = verseStr.replace(/\\[\S]*?$/g, '');
//verseStr = verseStr.replace(/\\[\S]*? /g, '');

//replacedStr = verseStr.replace(/[\b\f\j\k\n\r\t\z][\S]*? \+ /g, '');
//replacedStr = replacedStr.replace(/[\b\f\j\k\n\r\t\z][\S]*?$/g, '');
//replacedStr = replacedStr.replace(/[\b\f\j\k\n\r\t\z][\S]*? /g, '');

replacedStr = verseStr.replace(/\\[\S]*? \+ /g, '');
replacedStr = replacedStr.replace(/\\[\S]*?$/g, '');
replacedStr = replacedStr.replace(/\\[\S]*? /g, '');
require('fs').writeFileSync('./temp_output.json', replacedStr+'\n', {
    encoding: 'utf8',
    flag: 'a'
});

var text = 'Образец text на русском языке';
var regex = /[\u0400-\u04FF]+/g;

var match = regex.exec(text)

console.log(match[0]);

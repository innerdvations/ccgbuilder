var StringDecoder = require('string_decoder').StringDecoder;
var parse = require('csv-parse');
var fs = require('fs');
var ccgbuilder = require('../../ccgbuilder.js');

function csvParseSync(data, options) {
  var decoder, parser, records;
  if (options == null) {
    options = {};
  }
  records = [];
  if (data instanceof Buffer) {
    decoder = new StringDecoder();
    data = decoder.write(data);
  }
  parser = new parse.Parser(options);
  parser.push = function(record) {
    return records.push(record);
  };
  parser.__write(data, false);
  if (data.end) {
    parser.__write(data.end(), true);
  }
  parser._flush((function() {}));
  return records;
};

var layout = csvParseSync(fs.readFileSync(__dirname+'/layout.csv','utf8'), {columns:true});
var items = csvParseSync(fs.readFileSync(__dirname+'/items.csv','utf8'), {columns:true});
console.log("items:"+JSON.stringify(items));

ccgbuilder.merge(layout, items);

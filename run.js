var Promise = require('bluebird');
var csv = require('csv');
var fs = require('fs');
var cardgen = require('./cardgen.js');

// synchronous csv parsing to simplify things
function csvParseSync(csvData, options){
    var csvParser = new csv.parse(options);
    csvParser.write(csvData, true);

    var parsedData = [];
    var chunk;
    while(chunk = csvParser.read()){
        parsedData.push(chunk);
    }

    return parsedData;  
}

var layout = csvParseSync(fs.readFileSync(__dirname+'/layout.csv'), {columns:true});
var items = csvParseSync(fs.readFileSync(__dirname+'/items.csv'), {columns:true});

cardgen.merge(layout, items);
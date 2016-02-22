var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');

var cardgen = {
  errorMode: "delete", // "break" skips saving of images with problems, "continue" generates and saves them best as possible, "delete" skips saving and deletes any file with the given item's filename
  merge: function(layout, db) {
    // break layout into config and loopable object array
    var objects = [];
    var canvas_prop;
    var row;
    
    for(i in layout) {
      row = layout[i];
      if(row.type === "image") {
        objects.push(row);
      }
      else if(row.type  === "text") {
        objects.push(row);
      }
      else if(row.type.charAt(0)  === "_") {
        // safely ignore
      }
      else if(row.type  === "canvas") {
        // canvas properties
        canvas_prop = row;
      }
      else {
        throw "invalid layout type";
      }
    }
    
    if(!canvas_prop) throw "missing canvas properties";
    if(!objects.length) throw "no objects to generate image from";
    
    // loop through database to generate cards
    for(i in db) {
      try {
        var res = this.mergeOne(canvas_prop, objects, db[i]);
      }
      catch(e) {
        console.log("Error: "+e);
      }
    }
  },
  propNumVal: function(field, item, prop) {
    // check if it's already just a simple numerical value
    var val = Number(prop[field]);
    if(!isNaN(val) && val !== null) return val;
    
    val = Number(this.propStrVal(field, item, prop));
    if(!isNaN(val) && val !== null) return val;
    
    return null;
  },
  propStrVal: function(field, item, prop) {
    var val = prop[field];
    
    if(this.isSpecialVal(val)) return this.calcSpecialVal(val, item);
    else if(item.hasOwnProperty(val)) return item[val];
    else return val;
  },
  isSpecialVal: function(val) {
    var specials = ["center","right","left","top","bottom"];
    return specials.indexOf(val) > -1;
  },
  calcSpecialVal: function(prop, item) {
    return "111"; // TODO
  },
  exists: function(file) {
    var flag = true;
    try{
      fs.accessSync(file, fs.F_OK);
    }catch(e){
      flag = false;
    }
    return flag;
  },
  addImage: function(prop, item, ctx) {
    if(!item) throw "missing item";
    
    var graphic = new Image;
    graphic.src = this.propStrVal("val", item, prop);
    if(!this.exists(graphic.src)) throw "missing image:"+graphic.src;
    
    var x = this.propNumVal("posX", item, prop);
    var y =  this.propNumVal("posY", item, prop);
    var width = this.propNumVal("width", item, prop);
    var height = this.propNumVal("height", item, prop);
    
    if(!x) x = 0;
    if(!y) y = 0;
    if(!width) width = graphic.width;
    if(!height) height = graphic.height;
    console.log("drawing "+graphic.src+" at "+x+","+y+"::"+width+","+height);
    ctx.drawImage(graphic, x, y, width, height);
  },
  addText: function(prop, item, ctx) {
    var graphic = new Image;
    
    var x = this.propNumVal("posX", item, prop);
    var y =  this.propNumVal("posY", item, prop);
    var text = this.propStrVal("val", item, prop);
    var font = this.propStrVal("font", item, prop);
    var color = this.propStrVal("color", item, prop);
    
    if(!font) font = "12px Comic Sans MS";
    if(text === null) throw "text not found";
    if(!x) throw "missing x for text";
    if(!y) throw "missing y for text";
    
    console.log("adding text '"+text+"' at "+x+","+y); 
    ctx.strokeStyle = color;
    ctx.font = "60px Comic Sans MS";
    ctx.fillText(text, x, y);
  },
  mergeOne: function(canvas_prop, properties, item) {
    var o, prop, filename, pngstream, outstream;
    
    // create canvas
    var canvasWidth = this.propNumVal("width", item, canvas_prop);
    var canvasHeight = this.propNumVal("height", item, canvas_prop);
    var canvas = new Canvas(canvasWidth, canvasHeight);
    var ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = "source-over";

    if(!item.filename) throw "missing filename";
    filename = __dirname + "/" + item.filename;
    
    for(o in properties) {
      prop = properties[o];
      if(prop.type === "image") {
        try {
          this.addImage(prop, item, ctx);
        }
        catch(e) { // we'll catch and keep going so we can generate
          if(this.errorMode === "continue") console.log("Error: "+e);
          if(this.errorMode === "delete") {
            fs.unlinkSync(filename);
            throw e;
          }
          if(true || this.errorMode === "break") throw e;
        }
      }
    }
    
    outstream = fs.createWriteStream(filename)
    pngstream = canvas.pngStream();

    console.log("starting file op, save to "+filename);
    pngstream.on('data', function(chunk){
      outstream.write(chunk);
    });

    pngstream.on('end', function(){
      console.log('saved png ' + filename);
    });
  },
};

module.exports = cardgen;
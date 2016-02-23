var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');

var cardgen = {
  errorMode: "delete", // "break" skips saving of images with problems, "continue" generates and saves them best as possible, "delete" skips saving and deletes any file with the given item's filename
  globalCompositeOperation: "source-over",
  logging: "dev",
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
        // safely ignore comment line
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
  isBlankStr: function(str) {
    return typeof str === "string" && str.trim() === "";
  },
  propVal: function(field, item, prop, canvas, graphic) {
    var val = prop[field];
    
    // check if it's a special val
    if(this.isSpecialVal(val)) {
    //console.log("special value for "+field+" calculated at "+this.calcSpecialVal(field, item, prop, canvas, graphic));
     return this.calcSpecialVal(field, item, prop, canvas, graphic);
    }
    
    // check if it's a column header
    if(item.hasOwnProperty(val)) {
    //console.log("lookup value for "+field+" calculated at "+item[val]);
    return item[val];
    }
    
    // check if it's already just a simple numerical value and it's loosely equal
    // (ie, : "0" == 0 but "0 mana" != 0, so we'll catch that)
    var nval = Number(val);
    if(!isNaN(nval) && nval !== null && nval == val) {
    //console.log("number value for "+field+" calculated at "+val);
      return val;
    }
    
    // if all that fails, it has to be considered just a string
    //console.log("string value for "+field+" calculated at "+val);
    return val;
  },
  propNumVal: function(field, item, prop, canvas, graphic) {
    return Number(this.propVal(field, item, prop, canvas, graphic));
  },
  isSpecialVal: function(val) {
    var specials = ["","center","right","left","top","bottom"];
    if(typeof val === "string") {
      
      var res = specials.indexOf(val.trim().toLowerCase()) > -1;
      //if(res) console.log("'"+val+"' is a special field");
      return res;
    }
    return false;
  },
   // calcSpecialVal doesn't validate input, use isSpecialVal before calling
  calcSpecialVal: function(field, item, prop, canvas, graphic) {
    var val = prop[field].trim().toLowerCase();
    //console.log("calculating special val for "+val);
    if(field === "xPos" || field === "xOffset") {
      if(val === "") return 0;
      if(val === "center") return canvas.width / 2; // half of canvas width
      if(val === "left") return 0;
      if(val === "right") return canvas.width;
      if(val === "height") return this.propVal("height", item, prop, canvas, graphic);
      if(val === "width") return this.propVal("width", item, prop, canvas, graphic);
    }
    else if(field === "yPos" || field === "yOffset") {
      if(val === "") return 0;
      if(val === "center") return canvas.height / 2; // half of canvas width
      if(val === "top") return 0;
      if(val === "bottom") return canvas.height;
      if(val === "height") return this.propVal("height", item, prop, canvas, graphic);
      if(val === "width") return this.propVal("width", item, prop, canvas, graphic);
    }
    
    // xPos, yPos, xOffset, and xOffset are all relative to canvas
    else if(field === "xAnchor") {
      if(val === "") return 0;
      if(val === "center") return -1 * this.propVal("width", item, prop, canvas, graphic) / 2; // half of item width
      if(val === "left") return 0;
      if(val === "right") return -1 * this.propVal("width", item, prop, canvas, graphic); // item width
    }
    else if(field === "yAnchor") {
      if(val === "") return 0;
      if(val === "center") return -1 * this.propVal("height", item, prop, canvas, graphic) / 2; // half of item height
      if(val === "top") return 0;
      if(val === "bottom") return -1 * this.propVal("height", item, prop, canvas, graphic); // item height
    }
    
    else if(field === "width") {
      if(val === "") return graphic.width;
    }
    else if(field === "height") {
      if(val === "") return graphic.height;
    }
    else if(field === "rotate") {
      if(val === "") return 0;
    }
    
    throw "Couldn't calculate special value '"+val+"' for "+field;
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
  addImage: function(prop, item, canvas) {
    if(!item) throw "missing item";
    console.log("adding image: "+JSON.stringify(prop));
    var ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = this.globalCompositeOperation;

    var graphic = new Image;
    graphic.src = this.propVal("val", item, prop, canvas, graphic);
    if(!this.exists(graphic.src)) throw "missing image:"+graphic.src;
    
    var x = this.propNumVal("xPos", item, prop, canvas, graphic);
    var y =  this.propNumVal("yPos", item, prop, canvas, graphic);
    var xAnchor = this.propNumVal("xAnchor", item, prop, canvas, graphic);
    var yAnchor =  this.propNumVal("yAnchor", item, prop, canvas, graphic);
    var xOffset = this.propNumVal("xOffset", item, prop, canvas, graphic);
    var yOffset =  this.propNumVal("yOffset", item, prop, canvas, graphic);
    var width = this.propNumVal("width", item, prop, canvas, graphic);
    var height = this.propNumVal("height", item, prop, canvas, graphic);
    var rotate = this.propNumVal("rotate", item, prop, canvas, graphic);
    
    if(!x) x = 0;
    if(!y) y = 0;
    //if(!width) width = graphic.width;
    //if(!height) height = graphic.height;
    if(xAnchor) x = x + xAnchor;
    if(yAnchor) y = y + yAnchor;
    if(xOffset) x = x + xOffset;
    if(yOffset) y = y + yOffset;
    
    console.log("drawing "+graphic.src+" at "+x+","+y+"::"+width+","+height);
    
    if(rotate) {
        var rad = rotate * Math.PI / 180;
        console.log("radians:"+rad);
        var tmpCanvas = new Canvas(width, height);
        var tmpCtx = tmpCanvas.getContext('2d');
        tmpCtx.drawImage(graphic, 0, 0, width, height);
        tmpCtx.rotate(0.2);
        ctx.drawImage(tmpCanvas, x, y, tmpCanvas.width, tmpCanvas.height);
    }
    else {
      ctx.drawImage(graphic, x, y, width, height);
    }
  },
  addText: function(prop, item, canvas) {
    var graphic = new Image;
    var ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = this.globalCompositeOperation;

    var x = this.propNumVal("xPos", item, prop, canvas, graphic);
    var y =  this.propNumVal("yPos", item, prop, canvas, graphic);
    var xAnchor = this.propNumVal("xAnchor", item, prop, canvas, graphic);
    var yAnchor =  this.propNumVal("yAnchor", item, prop, canvas, graphic);
    var text = this.propNumVal("val", item, prop, canvas, graphic);
    var font = this.propNumVal("font", item, prop, canvas, graphic);
    var color = this.propNumVal("color", item, prop, canvas, graphic);
    
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

    if(!item.filename) throw "missing filename";
    filename = __dirname + "/" + item.filename;
    
    for(o in properties) {
      prop = properties[o];
      if(prop.type === "image") {
        try {
          this.addImage(prop, item, canvas);
        }
        catch(e) { // we'll catch and keep going so we can generate
          if(this.errorMode === "continue") console.log("Error: "+e);
          if(this.errorMode === "delete") {
            if(this.exists(filename)) fs.unlinkSync(filename);
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
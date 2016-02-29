var Canvas = require('canvas');
var fs = require('fs');

// set up node-easel, including creating a global DOM for it
//var getWindow = require('nodejs-dom');
//getWindow(null, true);
require('node-easel');
var Stage = createjs.Stage;
var Shape = createjs.Shape;
var Graphics = createjs.Graphics;

var ccgbuilder = {
   // errorMode "break" skips saving of images with problems, "continue" generates and saves them best as possible, "delete" skips saving and deletes any file with the given item's filename
  errorMode: "break",
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
      else if(row.type  === "bitmaptext") {
        objects.push(row);
      }
      else if(row.type  === "textbox") {
        objects.push(row);
      }
      else if(row.type  === "html") {
        objects.push(row);
      }
      else if(row.type  === "square") {
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
        
        return;
      }
      catch(e) {
        throw e;

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
      return this.calcSpecialVal(field, item, prop, canvas, graphic);
    }
    
    // check if it's a column header
    if(item.hasOwnProperty(val)) {
      return item[val];
    }
    
    // check if it's already just a simple numerical value and it's loosely equal
    // (ie, : "0" == 0 but "0 mana" != 0, so we'll catch that)
    var nval = Number(val);
    if(!isNaN(nval) && nval !== null && nval == val) {
      return val;
    }
    
    // if all that fails, it has to be considered just a string
    return val;
  },
  propNumVal: function(field, item, prop, canvas, graphic) {
    return Number(this.propVal(field, item, prop, canvas, graphic));
  },
  isSpecialVal: function(val) {
    var specials = ["","center","right","left","top","bottom"];
    if(typeof val === "string") {
      
      var res = specials.indexOf(val.trim().toLowerCase()) > -1;
      return res;
    }
    return false;
  },
   // calcSpecialVal doesn't validate input, use isSpecialVal before calling
  calcSpecialVal: function(field, item, prop, canvas, metrics) {
    var val = prop[field].trim().toLowerCase();
    var graphicWidth = metrics.width;
    var graphicHeight = metrics.height;

    //console.log("calculating special val for "+val);
    if(field === "x" || field === "offsetX") {
      if(val === "") return 0;
      if(val === "center") return canvas.width / 2; // half of canvas width
      if(val === "left") return 0;
      if(val === "right") return canvas.width;
      if(val === "height") return graphicHeight;
      if(val === "width") return graphicWidth;
    }
    else if(field === "y" || field === "offsetY") {
      if(val === "") return 0;
      if(val === "center") return canvas.height / 2; // half of canvas width
      if(val === "top") return 0;
      if(val === "bottom") return canvas.height;
      if(val === "height") return graphicHeight;
      if(val === "width") return graphicWidth;
    }
    
    // x, y, offsetX, and offsetX are all relative to canvas
    else if(field === "regX") {
      if(val === "") return 0;
      if(val === "center") return graphicWidth / 2; // half of item width
      if(val === "left") return 0;
      if(val === "right") return graphicWidth; // item width
    }
    else if(field === "regY") {
      if(val === "") return 0;
      if(val === "center") return graphicHeight / 2; // half of item height
      if(val === "top") return 0;
      if(val === "bottom") return graphicHeight; // item height
    }
    
    // the rest of the fields aren't calculated, but need sensible defaults for when left blank
    else if(field === "width") {
      if(val === "") return graphicWidth;
    }
    else if(field === "height") {
      if(val === "") return graphicHeight;
    }
    else if(field === "scaleX" || field === "scaleY") {
      if(val === "") return 1;
    }
    else if(field === "rotate") {
      if(val === "") return 0;
    }
    else if(field === "baseline") {
      // "top", "hanging", "middle", "alphabetic", "ideographic", or "bottom"
      if(val === "") return "bottom";
    }
    else if(field === "options" || field === "style") {
      if(val === "") return "";
    }
    else if(field === "lineHeight") {
      if(val === "") return null;
    }
    else if(field === "textAlign") {
      if(val === "") return null;
      return val;
    }
    else if(field === "font") {
      if(val === "") return "Impact";
    }
    else if(field === "size") {
      if(val === "") return "20";
    }
    else if(field === "color") {
      if(val === "") return "#000000";
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
  // TODO
  addSquare: function(prop, item, canvas, stage) {
    var graphic = new createjs.Shape();
    var x = this.propNumVal("x", item, prop, canvas, graphic);
    var y =  this.propNumVal("y", item, prop, canvas, graphic);
    var width = this.propNumVal("width", item, prop, canvas, graphic);
    var height = this.propNumVal("height", item, prop, canvas, graphic);
    graphic.graphics.beginFill("DeepSkyBlue").drawRect(0, 0, width, height);
    
    var regX = this.propNumVal("regX", item, prop, canvas, graphic);
    var regY =  this.propNumVal("regY", item, prop, canvas, graphic);
    var offsetX = this.propNumVal("offsetX", item, prop, canvas, graphic);
    var offsetY =  this.propNumVal("offsetY", item, prop, canvas, graphic);
    var scaleX = this.propNumVal("scaleX", item, prop, canvas, graphic);
    var scaleY =  this.propNumVal("scaleY", item, prop, canvas, graphic);
    var width = this.propNumVal("width", item, prop, canvas, graphic);
    var height = this.propNumVal("height", item, prop, canvas, graphic);
    var rotate = this.propNumVal("rotate", item, prop, canvas, graphic);
    
    graphic.x = x - regX;
    graphic.y = y - regY;
    console.log("---------"+x+","+y);
    console.log("---------"+regX+","+regY);
    stage.addChild(graphic);
  },
  addImage: function(prop, item, canvas, stage) {
    if(!item) throw "missing item";
    console.log("adding image: "+JSON.stringify(prop));

    var graphic = new Canvas.Image;
    graphic.src = this.propVal("val", item, prop, canvas, graphic);
    if(!this.exists(graphic.src)) throw "missing image:"+graphic.src;
    
    var x = this.propNumVal("x", item, prop, canvas, graphic);
    var y =  this.propNumVal("y", item, prop, canvas, graphic);
    var regX = this.propNumVal("regX", item, prop, canvas, graphic);
    var regY =  this.propNumVal("regY", item, prop, canvas, graphic);
    var offsetX = this.propNumVal("offsetX", item, prop, canvas, graphic);
    var offsetY =  this.propNumVal("offsetY", item, prop, canvas, graphic);
    var scaleX = this.propNumVal("scaleX", item, prop, canvas, graphic);
    var scaleY =  this.propNumVal("scaleY", item, prop, canvas, graphic);
    var width = this.propNumVal("width", item, prop, canvas, graphic);
    var height = this.propNumVal("height", item, prop, canvas, graphic);
    var rotate = this.propNumVal("rotate", item, prop, canvas, graphic);
    
    var obj = new createjs.Bitmap(graphic);
    obj.regX = regX;
    obj.regY = regY;
    obj.x = x;
    obj.y = y;
    if(offsetX) obj.x = obj.x + offsetX;
    if(offsetY) obj.y = obj.y + offsetY;
    obj.rotation = rotate;
    
    obj.scaleY = scaleY * (height / graphic.height);
    obj.scaleX = scaleX * (width / graphic.width);

    stage.addChild(obj);
  },
  addText: function(prop, item, canvas, stage) {
    var metrics = {width:0,height:0};
    var val = this.propVal("val", item, prop, canvas, metrics);
    var font = this.propVal("font", item, prop, canvas, metrics);
    var size = this.propVal("size", item, prop, canvas, metrics);
    var style = this.propVal("style", item, prop, canvas, metrics);
    var color = this.propVal("color", item, prop, canvas, metrics);
    var baseline = this.propVal("baseline", item, prop, canvas, metrics);
    
    var obj = new createjs.Text(val, [style, size+"px", font].join(" "), color);
    obj.baseline = baseline;
    metrics = {width:obj.getTransformedBounds().width, height:obj.getTransformedBounds().height};
    
    var x = this.propNumVal("x", item, prop, canvas, metrics);
    var y =  this.propNumVal("y", item, prop, canvas, metrics);
    var regX = this.propNumVal("regX", item, prop, canvas, metrics);
    var regY =  this.propNumVal("regY", item, prop, canvas, metrics);
    var offsetX = this.propNumVal("offsetX", item, prop, canvas, metrics);
    var offsetY =  this.propNumVal("offsetY", item, prop, canvas, metrics);
    var scaleX = this.propNumVal("scaleX", item, prop, canvas, metrics);
    var scaleY =  this.propNumVal("scaleY", item, prop, canvas, metrics);
    var width = this.propNumVal("width", item, prop, canvas, metrics);
    var height = this.propNumVal("height", item, prop, canvas, metrics);
    var rotate = this.propNumVal("rotate", item, prop, canvas, metrics);
    var options = this.propVal("options", item, prop, canvas, metrics).replace(/ /g, '').toLowerCase().split(",");
    
    if(val === null) throw "text not found";
    
    // if width was specified, we can recalculate values more precisely
    //var rawWidth = this.propNumVal("width", item, prop, canvas, {width:0,height:0});
    //var rawHeight = this.propNumVal("height", item, prop, canvas, {width:0,height:0});
    //var rawMetrics = {width:rawWidth,height:rawHeight};
    //if(rawWidth === width && rawWidth > 0) {
    //  regX = this.propNumVal("regX", item, prop, canvas, rawMetrics);
    //  console.log("rawWidth is equal:"+regX);
    //}
    //if(rawHeight === height && rawHeight > 0) {
    //  regY = this.propNumVal("regY", item, prop, canvas, rawMetrics);
    //  console.log("rawHeight is equal:"+regY);
    //}
    
    obj.regX = regX;
    obj.regY = regY;
    obj.x = x;
    obj.y = y;
    if(offsetX) obj.x = obj.x + offsetX;
    if(offsetY) obj.y = obj.y + offsetY;
    obj.rotation = rotate;
    
    obj.scaleY = scaleY * (height / metrics.height);
    obj.scaleX = scaleX * (width / metrics.width);

    stage.addChild(obj);
  },
  addTextbox: function(prop, item, canvas, stage) {
    var metrics = {width:0,height:0};
    var val = this.propVal("val", item, prop, canvas, metrics);
    var font = this.propVal("font", item, prop, canvas, metrics);
    var size = this.propVal("size", item, prop, canvas, metrics);
    var style = this.propVal("style", item, prop, canvas, metrics);
    var color = this.propVal("color", item, prop, canvas, metrics);
    
    // create text object
    var obj = new createjs.Text(val, [style, size+"px", font].join(" "), color);
    
    // set line height
    var lineHeight = this.propNumVal("lineHeight", item, prop, canvas, metrics);
    if(lineHeight) obj.lineHeight = lineHeight;
    else obj.lineHeight = obj.getMeasuredLineHeight() * 1.2;  // default line height is hideous, sorry
    
    // text baseline
    var baseline = this.propVal("baseline", item, prop, canvas, metrics);
    obj.textBaseline = baseline;
    
    // width is required that so we can actually make it a wrappable box
    var width = this.propNumVal("width", item, prop, canvas, metrics);
    var rawWidth = this.propNumVal("width", item, prop, canvas, {width:0,height:0});
    console.log("Textbox width: "+width+"::"+rawWidth);
    if(!rawWidth) throw "missing width for textbox";
    if(rawWidth != width) throw "invalid width for textbox";
    
    // make the text wrap at width
    obj.lineWidth = width;
    
    // get the measured height
    metrics = {width:width, height:obj.getTransformedBounds().height};
    
    // position and sizing properties
    var x = this.propNumVal("x", item, prop, canvas, metrics);
    var y =  this.propNumVal("y", item, prop, canvas, metrics);
    var regX = this.propNumVal("regX", item, prop, canvas, metrics);
    var regY =  this.propNumVal("regY", item, prop, canvas, metrics);
    var offsetX = this.propNumVal("offsetX", item, prop, canvas, metrics);
    var offsetY =  this.propNumVal("offsetY", item, prop, canvas, metrics);
    var width = this.propNumVal("width", item, prop, canvas, metrics);
    var rotate = this.propNumVal("rotate", item, prop, canvas, metrics);
    var options = this.propVal("options", item, prop, canvas, metrics).replace(/ /g, '').toLowerCase().split(",");
    
    // we need to modify regX based on text alignment
    var textAlign = this.propVal("textAlign", item, prop, canvas, metrics);
    obj.textAlign = textAlign;
    //if(textAlign === "center") {
    //  console.log("====width:"+obj.getTransformedBounds().width);
    //  obj.regX = obj.regX - obj.getTransformedBounds().width / 2;
    //}
    //if(textAlign === "right") {
    //  console.log("====width:"+obj.getTransformedBounds().width);
    //  obj.regX = obj.regX - obj.getTransformedBounds().width;
    //}
    

    obj.regX = regX;
    obj.regY = regY;
    
    // if height is empty and regY is special, we'll use our calculated height to do regY
    // if(prop["height"] === "" && this.isSpecialVal(prop["regY"])) {
    //   console.log("***** special prop");
    //   if(prop["regY"] === "top") obj.regY = 0;
    //   if(prop["regY"] === "center") obj.regY = obj.getTransformedBounds().height/2;
    //   if(prop["regY"] === "bottom") obj.regY = obj.getTransformedBounds().height;
    // }
    // else {
    //   obj.regY = regY;
    // }
    
    // TODO: if a height is specified, reduce font size and redraw until it fits
    //var height = this.propNumVal("height", item, prop, canvas, metrics);
    //var rawHeight = this.propNumVal("height", item, prop, canvas, {width:0,height:0});
    //if(height) {
    //  if(obj.getTransformedBounds().height > height) {
    //    console.log("Warning: text too big for box");
    //    console.log(obj.getTransformedBounds().height + ">" + height);
    //  }
    //}
    
    obj.x = x;
    obj.y = y;
    if(offsetX) obj.x = obj.x + offsetX;
    if(offsetY) obj.y = obj.y + offsetY;
    obj.rotation = rotate;
    
    // Scale isn't used for textbox
    //var scaleX = this.propNumVal("scaleX", item, prop, canvas, metrics);
    //var scaleY =  this.propNumVal("scaleY", item, prop, canvas, metrics);
    //obj.scaleY = scaleY * (height / graphic.height);
    //obj.scaleX = scaleX * (width / graphic.width);

    console.log("drawing text "+val+" at "+obj.x+","+obj.y);

    stage.addChild(obj);
  },
  hasOption: function(val, options) {
    if(typeof val === "string") {
      var res = options.indexOf(val.trim().toLowerCase()) > -1;
      return res;
    }
    return false;
  },
  mergeOne: function(canvas_prop, properties, item) {
    var o, prop, filename, pngstream, outstream;
    
    // create canvas
    var canvasWidth = this.propNumVal("width", item, canvas_prop);
    var canvasHeight = this.propNumVal("height", item, canvas_prop);
    var canvas = new Canvas(canvasWidth, canvasHeight);

    var stage = new createjs.Stage(canvas);

    var sh = require("shelljs");
    var path = require('path');
    var cwd = sh.pwd();
    if(!item.filename) throw "missing filename";
    filename = path.resolve(cwd, item.filename);
    
    for(o in properties) {
      prop = properties[o];
      try {
        if(prop.type === "image") {
          this.addImage(prop, item, canvas, stage);
        }
        else if(prop.type === "text") {
          this.addText(prop, item, canvas, stage);
        }
        else if(prop.type === "textbox") {
          this.addTextbox(prop, item, canvas, stage);
        }
        else if(prop.type === "bitmaptext") {
          this.addText(prop, item, canvas, stage);
        }
        else if(prop.type === "square") {
          this.addSquare(prop, item, canvas, stage);
        }
      }
      catch(e) { // we'll catch and keep going so we can generate
        if(this.errorMode === "continue") console.log("Error: "+e);
        else if(this.errorMode === "delete") {
          if(this.exists(filename)) fs.unlinkSync(filename);
          throw e;
        }
        else if(true || this.errorMode === "break") throw e; // default
      }
    }
    
    // draw everything from stage
    stage.update();
    
    outstream = fs.createWriteStream(filename)
    pngstream = canvas.pngStream();
    
    pngstream.on('data', function(chunk){
      outstream.write(chunk);
    });

    pngstream.on('end', function(){
      console.log('saved png ' + filename);
    });
  },
};

module.exports = ccgbuilder;
/*global $, JS9 */
/*jslint white: true */
/*jslint plusplus: true */
/*jslint nomen: true*/

var PlotProfile;
// create namespace, and specify some meta-information and params
PlotProfile = {};
PlotProfile.CLASS = "PlotProfile";
PlotProfile.NAME = "plpr";
PlotProfile.WIDTH =  400;
PlotProfile.HEIGHT = 200;

//Init memory used by plugin
PlotProfile.pp = [];//List of pixel values under lines regions
PlotProfile.ppid = [];//List of lines regions id
PlotProfile.ppcolors = [];//List of lines regions colors
PlotProfile.POSSIBLE_COLORS = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FF8000", "#00FF80", "#8000FF"];//List of somes colors 
PlotProfile.mainRegion = 0;//Position in the list of last region to be selected, created or modified
PlotProfile.roundShape = -1;//Id of round shape created when pointer move on plot zone
PlotProfile.initLock = false;//Lock to avoid double execution of initialisations function in specific conditions

//Initialisation function of the plugin
PlotProfile.init = function(){
    'use strict';
    PlotProfile.div = this.div;
    PlotProfile.shapeLayer = JS9.NewShapeLayer("PlotProfileShapeLayer");
    PlotProfile.addAllRegions();
    PlotProfile.initLock = true;
};

//Function to call each time plugin window is open
PlotProfile.onPluginDisplay = function (){
    'use strict';
    PlotProfile.div = this.div;
    if(!PlotProfile.initLock){
        PlotProfile.addAllRegions();
    }
    PlotProfile.initLock = false;
};

PlotProfile.onImageDisplay = function(){
    'use strict';
    PlotProfile.shapeLayer = JS9.NewShapeLayer("PlotProfileShapeLayer");
    PlotProfile.addAllRegions();
};

//Detect and memorize all lines regions
//Print plot profile if there is any, or a message otherwise
PlotProfile.addAllRegions = function(){
    'use strict';
    var noLineRegion, regions, i;
    PlotProfile.pp = [];
    PlotProfile.ppid = [];
    PlotProfile.ppcolors = [];
    PlotProfile.mainRegion = 0;
    PlotProfile.roundShape = -1;
    noLineRegion = true;
    
    regions = JS9.GetRegions("all");
    if(regions===null || regions.length===0){
        PlotProfile.printInstructionText(PlotProfile.div);
        return;
    }
    for(i=0;i<regions.length;i++){
        if(regions[i].shape==="line"){
            noLineRegion = false;
            PlotProfile.newRegion(regions[i]);
        }
    }
    if(noLineRegion){
        PlotProfile.printInstructionText(PlotProfile.div);
    }
};

//Print an instruction message
PlotProfile.printInstructionText = function(){
    'use strict';
    $(PlotProfile.div).empty();
    $(PlotProfile.div).append("<p style='padding: 20px 0px 0px 20px; margin: 0px'>create a line region to see plot profile<br>");
};

//Memorize a region given in parameter
//  Change its color to avoid conflict
//  get value of pixels under regions
PlotProfile.newRegion = function(xreg){
    'use strict';
    var cnb = 0, rnb = 0, color, regions, res;
    regions = JS9.GetRegions("all");
    while(cnb<PlotProfile.POSSIBLE_COLORS.length && color===undefined){
        color = PlotProfile.POSSIBLE_COLORS[cnb];
        for(rnb=0;rnb<regions.length;rnb++){
            if(regions[rnb].shape==="line" && regions[rnb].id!==xreg.id && regions[rnb].color===color){
                color = undefined;
            }
        }
        cnb++;
    }
    if(color===undefined){
        color = "#808080";
    }
    PlotProfile.pp.push([]);
    PlotProfile.ppid.push(xreg.id);
    res = PlotProfile.ppcolors.push(color);
    JS9.ChangeRegions(xreg.id, {color: color});
    return res-1;
};

//remove a region from lists
PlotProfile.deleteRegion = function(sn){
    'use strict';
    PlotProfile.mainRegion = PlotProfile.mainRegion-1;
    PlotProfile.pp.splice(sn, 1);
    PlotProfile.ppid.splice(sn, 1);
    PlotProfile.ppcolors.splice(sn, 1);
};

//Get value of pixels under a line region
PlotProfile.ppFromRegion = function(im, xreg){
    'use strict';
    var x1, y1, x2, y2, dx, dy, angle, pxValues, lg, nb, xa, ya, v;
    //check region is a line
    if(xreg.shape!=="line"){
        return;
    }
    x1 = xreg.pts[0].x;
    y1 = xreg.pts[0].y;
    x2 = xreg.pts[1].x;
    y2 = xreg.pts[1].y;
    dx = x2-x1;
    dy = y2-y1;
    angle = PlotProfile.calculateAngle(x1,y1,x2,y2);
    pxValues = [];
    lg = Math.sqrt(dx*dx+dy*dy);
    for(nb=0;nb<lg;nb++){
        xa = Math.floor(x1+nb*Math.cos(angle));
        ya = Math.floor(y1+nb*Math.sin(angle));
        v = im.raw.data[ya * im.raw.width + xa];
        pxValues.push([nb,v]);
    }
    return pxValues;
};

//function to call when a region is modified (created, resized, selected, deleted)
PlotProfile.regionChange = function(im, xreg){
    'use strict';
    var mode, sn, i;
    //check region is a line
    if(xreg.shape!=="line"){
        return;
    }
    //find region location in tables
    mode = xreg.mode;
    sn = -1;
    if(mode==="update" || mode==="remove" || mode==="select"){
        for(i=0;i<PlotProfile.ppid.length;i++){
            if(PlotProfile.ppid[i]===xreg.id){
                sn = i;
            }
        }
    }
    if (mode==="add" || (sn===-1 && mode!=="remove")){
        sn = PlotProfile.newRegion(xreg);
    }
    PlotProfile.mainRegion = sn;
    //change tables values
    if(mode==="select"){
        return;
    }
    if(mode==="remove" && sn!==-1){
        PlotProfile.deleteRegion(sn);
    }
    if(mode==="update"){
        PlotProfile.pp[sn] = PlotProfile.ppFromRegion(im, xreg);
        PlotProfile.ppcolors[sn] = xreg.color;
    }
    if (PlotProfile.pp.length===0){
        $(this.div).empty();
        $(this.div).append("<p style='padding: 20px 0px 0px 20px; margin: 0px'>create a line region to see plot profile<br>");
    }else{
        $.plot(this.div, PlotProfile.pp, { zoomStack: true, selection: { mode: "xy" }, colors: PlotProfile.ppcolors, hooks:{bindEvents:[PlotProfile.onMouseMoveOnCanvas]} });
    }
    
};

//functions to print pointer on canvas and circle on image when mouse move on canvas
//delete it when mouse leave canvas
PlotProfile.onMouseMoveOnCanvas = function(plot, eventHolder){
    'use strict';
    eventHolder.mousemove(function (e) {
        var mouseX, x_, y_, lineX, lineY, ctx, reg, x1, x2, y1, y2, angle, px, py;
        plot.draw();
        mouseX = e.pageX - plot.offset().left;
        x_ = Math.floor(plot.getAxes().xaxis.c2p(mouseX));
        if(PlotProfile.mainRegion<0 || x_<0 || x_>=PlotProfile.pp[PlotProfile.mainRegion].length){
            if(PlotProfile.roundShape!==-1){
                JS9.ActiveShapeLayer("regions");
                JS9.RemoveShapes("PlotProfileShapeLayer",PlotProfile.roundShape);
                PlotProfile.roundShape = -1;
            }
            return;
        }
        y_ = PlotProfile.pp[PlotProfile.mainRegion][x_][1];
        lineX = mouseX + plot.getPlotOffset().left;
        lineY = plot.getAxes().yaxis.p2c(y_) + plot.getPlotOffset().top;
        ctx = plot.getCanvas().getContext("2d");
        ctx.moveTo(lineX, plot.getPlotOffset().top);
        ctx.lineTo(lineX, plot.getCanvas().height-plot.getPlotOffset().bottom);
        ctx.stroke();
        ctx.moveTo(plot.getPlotOffset().left, lineY);
        ctx.lineTo(plot.getCanvas().width-plot.getPlotOffset().right,lineY);
        ctx.stroke();
        ctx.font = "10px Arial";
        ctx.fillText("x:"+x_+" y:"+y_, plot.getPlotOffset().left, 10+plot.getPlotOffset().top);
        reg = JS9.GetRegions(PlotProfile.ppid[PlotProfile.mainRegion])[0];
        x1 = reg.pts[0].x;
        y1 = reg.pts[0].y;
        x2 = reg.pts[1].x;
        y2 = reg.pts[1].y;
        angle = PlotProfile.calculateAngle(x1,y1,x2,y2);
        px = x1+x_*Math.cos(angle);
        py = y1+x_*Math.sin(angle);
        //console.log(JS9.GetShapes("PlotProfileShapeLayer", "all").length)
        if(PlotProfile.roundShape===-1){
            PlotProfile.roundShape = JS9.AddShapes("PlotProfileShapeLayer","circle", {shape:"circle", x:px, y:py,radius:5 , color:PlotProfile.ppcolors[PlotProfile.mainRegion]});
        }else{
            JS9.ChangeShapes("PlotProfileShapeLayer",PlotProfile.roundShape,{x:px, y:py});
        }
    });
    eventHolder.mouseout(function (){
        plot.draw();
        if(PlotProfile.roundShape!==-1){
            JS9.ActiveShapeLayer("regions");
            JS9.RemoveShapes("PlotProfileShapeLayer",PlotProfile.roundShape);
            PlotProfile.roundShape = -1;
        }
    });
};

//calculate the angle between a line defined by the two points given in parameter and the X axis
PlotProfile.calculateAngle = function(x1,y1,x2,y2){
    'use strict';
    var dx, dy, alpha;
    dx = x2-x1;
    dy = y2-y1;
    if (dx === 0){
        if(dy>0){
            return Math.PI/2;
        }else{
            return -Math.PI/2;
        }
    }
    alpha = Math.atan(dy/dx);
    if(dx>0){
        return alpha;
    }else{
        if (dy>0){
            return alpha+Math.PI;
        }else{
            return alpha-Math.PI;
        }
    }
};

//Register the plugin in JS9
JS9.RegisterPlugin(PlotProfile.CLASS, PlotProfile.NAME, PlotProfile.init,
            {menu:"analysis",
            menuItem: "Plot Profile",
            onregionschange: PlotProfile.regionChange,
            onplugindisplay: PlotProfile.onPluginDisplay,
            onimagedisplay: PlotProfile.onImageDisplay,
            winTitle: "Plot Profile",
            winResize: true,
            winDims: [PlotProfile.WIDTH, PlotProfile.HEIGHT]});
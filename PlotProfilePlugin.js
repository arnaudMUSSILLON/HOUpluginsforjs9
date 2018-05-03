/*global $, JS9 */

var PlotProfile;
// create our namespace, and specify some meta-information and params
PlotProfile = {};
PlotProfile.CLASS = "PlotProfile";
PlotProfile.NAME = "plpr";
PlotProfile.WIDTH =  400;
PlotProfile.HEIGHT = 200;

PlotProfile.pp = [];
PlotProfile.ppid = [];
PlotProfile.ppcolors = [];
PlotProfile.POSSIBLE_COLORS = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FF8000", "#00FF80", "#8000FF"];
PlotProfile.mainRegion = 0;
PlotProfile.roundRegion = -1
PlotProfile.initLock = false

PlotProfile.init = function(){
    PlotProfile.addAllRegions(this.div);
    PlotProfile.initLock = true;
};

PlotProfile.onDisplay = function (){
    if(!PlotProfile.initLock){
        PlotProfile.addAllRegions(this.div);
    }
    PlotProfile.initLock = false
};

PlotProfile.addAllRegions = function(div){
    PlotProfile.pp = [];
    PlotProfile.ppid = [];
    PlotProfile.ppcolors = [];
    PlotProfile.mainRegion = 0;
    PlotProfile.roundRegion = -1;
    var noLineRegion = true;
    
    var regions = JS9.GetRegions("all"), i;
    if(regions===null || regions.length===0){
        PlotProfile.printInstructionText(div)
        return;
    }
    for(i=0;i<regions.length;i++){
        if(regions[i].shape==="line"){
            noLineRegion = false
            PlotProfile.newRegion(regions[i]);
        }
    }
    if(noLineRegion){
        PlotProfile.printInstructionText(div);
    }
};

PlotProfile.printInstructionText = function(div){
    $(div).empty();
    $(div).append("<p style='padding: 20px 0px 0px 20px; margin: 0px'>create a line region to see plot profile<br>");
}

PlotProfile.newRegion = function(xreg){
    var cnb = 0, rnb = 0, color;
    var regions = JS9.GetRegions("all");
    while(cnb<PlotProfile.POSSIBLE_COLORS.length && color===undefined){
        color = PlotProfile.POSSIBLE_COLORS[cnb];
        for(rnb=0;rnb<regions.length;rnb++){
            if(regions[rnb].shape==="line" && regions[rnb].id!==xreg.id && regions[rnb].color===color){
                color = undefined;
            }
        }
        cnb++;
    }
    if(color==undefined){
        color = "#808080";
    }
    PlotProfile.pp.push([]);
    PlotProfile.ppid.push(xreg.id);
    var res = PlotProfile.ppcolors.push(color);
    JS9.ChangeRegions(xreg.id, {color: color});
    return res-1;
};

PlotProfile.deleteRegion = function(sn){
    PlotProfile.mainRegion = PlotProfile.mainRegion-1;
    PlotProfile.pp.splice(sn, 1);
    PlotProfile.ppid.splice(sn, 1);
    PlotProfile.ppcolors.splice(sn, 1);
};

PlotProfile.ppFromRegion = function(im, xreg){
    //check region is a line
    if(xreg.shape!=="line"){
        return;
    }
    var x1 = xreg.pts[0].x;
    var y1 = xreg.pts[0].y;
    var x2 = xreg.pts[1].x;
    var y2 = xreg.pts[1].y;
    var dx = x2-x1;
    var dy = y2-y1;
    var angle = PlotProfile.calculateAngle(x1,y1,x2,y2);
    var pxValues = [];
    var lg = Math.sqrt(dx*dx+dy*dy);
    var nb;
    for(nb=0;nb<lg;nb++){
        var xa = Math.floor(x1+nb*Math.cos(angle));
        var ya = Math.floor(y1+nb*Math.sin(angle));
        var v = im.raw.data[ya * im.raw.width + xa];
        pxValues.push([nb,v]);
    }
    return pxValues;
};

PlotProfile.regionChange = function(im, xreg){
    //check region is a line
    if(xreg.shape!=="line"){
        return;
    }
    //find region location in tables
    var mode = xreg.mode;
    var sn = -1;
    if(mode==="update" || mode==="remove" || mode==="select"){
        var i;
        for(i=0;i<PlotProfile.ppid.length;i++){
            if(PlotProfile.ppid[i]==xreg.id){
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
    if(mode==="remove" && sn!=-1){
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

PlotProfile.onMouseMoveOnCanvas = function(plot, eventHolder){
    eventHolder.mousemove(function (e) {
        plot.draw();
        var mouseX = e.pageX - plot.offset().left;
        var x_ = Math.floor(plot.getAxes().xaxis.c2p(mouseX));
        if(PlotProfile.mainRegion<0 || x_<0 || x_>=PlotProfile.pp[PlotProfile.mainRegion].length){
            if(PlotProfile.roundRegion!==-1){
                JS9.RemoveRegions(PlotProfile.roundRegion);
                PlotProfile.roundRegion = -1;
            }
            return;
        }
        var y_ = PlotProfile.pp[PlotProfile.mainRegion][x_][1];
        var lineX = mouseX + plot.getPlotOffset().left;
        var lineY = plot.getAxes().yaxis.p2c(y_) + plot.getPlotOffset().top;
        var ctx = plot.getCanvas().getContext("2d");
        ctx.moveTo(lineX, plot.getPlotOffset().top);
        ctx.lineTo(lineX, plot.getCanvas().height-plot.getPlotOffset().bottom);
        ctx.stroke();
        ctx.moveTo(plot.getPlotOffset().left, lineY);
        ctx.lineTo(plot.getCanvas().width-plot.getPlotOffset().right,lineY);
        ctx.stroke();
        ctx.font = "10px Arial";
        ctx.fillText("x:"+x_+" y:"+y_, plot.getPlotOffset().left, 10+plot.getPlotOffset().top);
        var reg = JS9.GetRegions(PlotProfile.ppid[PlotProfile.mainRegion])[0];
        var x1 = reg.pts[0].x;
        var y1 = reg.pts[0].y;
        var x2 = reg.pts[1].x;
        var y2 = reg.pts[1].y;
        var angle = PlotProfile.calculateAngle(x1,y1,x2,y2);
        var px = x1+x_*Math.cos(angle);
        var py = y1+x_*Math.sin(angle);
        if(PlotProfile.roundRegion===-1){
            PlotProfile.roundRegion = JS9.AddRegions("circle", {shape:"circle", x:px, y:py,radius:5 , color:PlotProfile.ppcolors[PlotProfile.mainRegion]});
        }else{
            JS9.ChangeRegions(PlotProfile.roundRegion,{x:px, y:py});
        }
    });
    eventHolder.mouseout(function (){
        plot.draw();
        if(PlotProfile.roundRegion!==-1){
            JS9.RemoveRegions(PlotProfile.roundRegion);
            PlotProfile.roundRegion = -1;
        }
    });
};

PlotProfile.calculateAngle = function(x1,y1,x2,y2){
    var dx = x2-x1;
    var dy = y2-y1;
    if (dx === 0){
        if(dy>0){
            return Math.PI/2;
        }else{
            return -Math.PI/2;
        }
    }
    var alpha = Math.atan(dy/dx)
    if(dx>0){
        return alpha;
    }else{
        if (dy>0){
            return alpha+Math.PI;
        }else{
            return alpha-Math.PI;
        }
    }
}

JS9.RegisterPlugin(PlotProfile.CLASS, PlotProfile.NAME, PlotProfile.init,
            {menu:"analysis",
            menuItem: "Plot Profile",
            onregionschange: PlotProfile.regionChange,
            onplugindisplay: PlotProfile.onDisplay,
            winTitle: "Plot Profile",
            winResize: true,
            winDims: [PlotProfile.WIDTH, PlotProfile.HEIGHT]});
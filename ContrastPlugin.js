/*global $, JS9, document */
/*jslint white: true */
/*jslint plusplus: true */
/*jslint nomen: true*/

var ContrastPlugin;
// create namespace, and specify some meta-information and params
ContrastPlugin = {};
ContrastPlugin.CLASS = "HandsOnUniverse";
ContrastPlugin.NAME = "Contrast";
ContrastPlugin.WIDTH =  600;
ContrastPlugin.HEIGHT = 200;

//Initialisation function of the plugin
ContrastPlugin.init = function(){
    'use strict';
    ContrastPlugin.div = this.div;
    ContrastPlugin.printDiv();
    ContrastPlugin.ContrastAndScale();
};

//Print an instruction message
ContrastPlugin.printDiv = function(message){
    'use strict';
    var im, imMin, imMax, scale, head;
    $(ContrastPlugin.div).empty();
    if(message!==undefined){
        $(ContrastPlugin.div).append("<p>"+message+"</p>");
        return;
    }
    scale = JS9.GetScale();
    im = JS9.GetImage();
    if(im===null){
        $(ContrastPlugin.div).append("<p>Open an image File</p>");
        ContrastPlugin.lastImage = undefined;
        return;
    }
    ContrastPlugin.lastImage = im;
    imMin = im.raw.dmin;
    imMax = im.raw.dmax;
    ContrastPlugin.minVal = document.createElement("DIV");
    ContrastPlugin.maxVal = document.createElement("DIV");
    $(ContrastPlugin.minVal).append(scale.scalemin);
    $(ContrastPlugin.maxVal).append(scale.scalemax);
    head = document.getElementsByTagName('head')[0];
    $(head).append("<style> .ContrastPluginSlider { width: 98%; } </style>");
    ContrastPlugin.slidermin = document.createElement("INPUT");
    ContrastPlugin.slidermin.setAttribute("type","range");
    ContrastPlugin.slidermin.setAttribute("min",imMin);
    ContrastPlugin.slidermin.setAttribute("max",imMax);
    ContrastPlugin.slidermin.setAttribute("value",scale.scalemin);
    ContrastPlugin.slidermin.setAttribute("class","ContrastPluginSlider");
    ContrastPlugin.slidermin.setAttribute("id","ContrastPluginSliderMin");
    ContrastPlugin.slidermin.oninput = ContrastPlugin.onSliderChange;
    ContrastPlugin.slidermax = document.createElement("INPUT");
    ContrastPlugin.slidermax.setAttribute("type","range");
    ContrastPlugin.slidermax.setAttribute("min",imMin);
    ContrastPlugin.slidermax.setAttribute("max",imMax);
    ContrastPlugin.slidermax.setAttribute("value",scale.scalemax);
    ContrastPlugin.slidermax.setAttribute("class","ContrastPluginSlider");
    ContrastPlugin.slidermax.setAttribute("id","ContrastPluginSliderMax");
    ContrastPlugin.slidermax.oninput = ContrastPlugin.onSliderChange;
    $(ContrastPlugin.div).append("Minimum : <br>");
    $(ContrastPlugin.div).append(ContrastPlugin.slidermin);
    $(ContrastPlugin.div).append(ContrastPlugin.minVal);
    $(ContrastPlugin.div).append("<br><br>Maximum:<br>");
    $(ContrastPlugin.div).append(ContrastPlugin.slidermax);
    $(ContrastPlugin.div).append(ContrastPlugin.maxVal);
};

ContrastPlugin.ContrastAndScale = function(){
    'use strict';
    var scale, colormap;
    if(ContrastPlugin.slidermin===undefined || ContrastPlugin.slidermax===undefined){
        return;
    }
    scale = JS9.GetScale();
    colormap = JS9.GetColormap();
    if(scale.scalemin===ContrastPlugin.slidermin.value && scale.scalemax===ContrastPlugin.slidermax.value && colormap.contrast===1 && colormap.bias===0.5){
        return;
    }
    JS9.SetScale(ContrastPlugin.slidermin.value, ContrastPlugin.slidermax.value);
    JS9.SetColormap(1,0.5);
};

ContrastPlugin.onSliderChange = function(){
    'use strict';
    if(this.id === "ContrastPluginSliderMin"){
        if(parseInt(this.value,10)>parseInt(ContrastPlugin.slidermax.value,10)){
            ContrastPlugin.slidermax.value = this.value;
            ContrastPlugin.maxVal.innerHTML = this.value;
        }
        ContrastPlugin.minVal.innerHTML = this.value;
    }else if(this.id === "ContrastPluginSliderMax"){
        if(parseInt(this.value,10)<parseInt(ContrastPlugin.slidermin.value,10)){
            ContrastPlugin.slidermin.value = this.value;
            ContrastPlugin.minVal.innerHTML = this.value;
        }
        ContrastPlugin.maxVal.innerHTML = this.value;
    }else{
        return;
    }
    ContrastPlugin.ContrastAndScale();
};

ContrastPlugin.onNewImage = function(im){
    'use strict';
    if(im!==ContrastPlugin.lastImage){
        ContrastPlugin.lastImage = im;
        ContrastPlugin.printDiv();
        ContrastPlugin.ContrastAndScale();
    }
};

ContrastPlugin.onImageClose = function(){
    'use strict';
    ContrastPlugin.lastImage = undefined;
    ContrastPlugin.printDiv("Open an image File");
};

//Register the plugin in JS9
//console.log(JS9.globalOpts.extendedPlugins)
JS9.RegisterPlugin(ContrastPlugin.CLASS, ContrastPlugin.NAME, ContrastPlugin.init,
            {//menu:"000",
            menuItem: "Contrast sliders",
            onplugindisplay: ContrastPlugin.init,
            onimagedisplay: ContrastPlugin.onNewImage,
            onimageclose: ContrastPlugin.onImageClose,
            winTitle: "Scaling",
            winResize: true,
            winDims: [ContrastPlugin.WIDTH, ContrastPlugin.HEIGHT]});
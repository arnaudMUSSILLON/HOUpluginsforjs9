/*global $, JS9, document */
/*jslint white: true */
/*jslint plusplus: true */
/*jslint nomen: true*/

var BasicImProcPlugin;
// create namespace, and specify some meta-information and params
BasicImProcPlugin = {};
BasicImProcPlugin.AddSubstract = {};
BasicImProcPlugin.SubImage = {};
BasicImProcPlugin.CLASS = "HandsOnUniverse";
BasicImProcPlugin.NAME = "BasicImProc";
BasicImProcPlugin.WIDTH =  250;
BasicImProcPlugin.HEIGHT = 105;

//Initialisation function of the plugin
BasicImProcPlugin.init = function(){
    'use strict';
    var divAddSubstract, divSubImage;
    /*$(this.div).empty();
    BasicImProcPlugin.AddSubstract.listDiv = document.createElement("DIV");
    $(this.div).append(BasicImProcPlugin.AddSubstract.listDiv);
    $(this.div).append("<button type='file' onclick='BasicImProcPlugin.AddSubstract.onClickButton(1)'>Add</button>");
    $(this.div).append("<button type='file' onclick='BasicImProcPlugin.AddSubstract.onClickButton(-1)'>Substract</button>");
    BasicImProcPlugin.AddSubstract.createLists();*/
    $(this.div).empty();
    divSubImage = document.createElement("DIV");
    divAddSubstract = document.createElement("DIV");
    $(this.div).append(divSubImage);
    $(this.div).append(divAddSubstract);
    BasicImProcPlugin.AddSubstract.init(divAddSubstract);
};

BasicImProcPlugin.AddSubstract.init = function(div){
    'use strict';
    $(div).empty();
    $(div).append("Add/Substract two images");
    BasicImProcPlugin.AddSubstract.listDiv = document.createElement("DIV");
    $(div).append(BasicImProcPlugin.AddSubstract.listDiv);
    $(div).append("<button type='file' onclick='BasicImProcPlugin.AddSubstract.onClickButton(1)'>Add</button>");
    $(div).append("<button type='file' onclick='BasicImProcPlugin.AddSubstract.onClickButton(-1)'>Substract</button>");
    BasicImProcPlugin.AddSubstract.createLists();
};

BasicImProcPlugin.AddSubstract.createLists = function(){
    'use strict';
    var images, i, str;
    images = JS9.GetDisplayData();
    BasicImProcPlugin.AddSubstract.list1 = document.createElement("SELECT");
    $(BasicImProcPlugin.AddSubstract.list1).append("<option value=''>Chose an image</option>");
    BasicImProcPlugin.AddSubstract.list2 = document.createElement("SELECT");
    $(BasicImProcPlugin.AddSubstract.list2).append("<option value=''>Chose an image</option>");
    for(i=0;i<images.length;i++){
        str = images[i].id;
        if(str.length>30){
            str = str.slice(0,30)+"...";
        }
        $(BasicImProcPlugin.AddSubstract.list1).append("<option value='"+images[i].id+"'>"+str+"</option>");
        $(BasicImProcPlugin.AddSubstract.list2).append("<option value='"+images[i].id+"'>"+str+"</option>");
    }
    $(BasicImProcPlugin.AddSubstract.listDiv).empty();
    $(BasicImProcPlugin.AddSubstract.listDiv).append("image 1:");
    $(BasicImProcPlugin.AddSubstract.listDiv).append(BasicImProcPlugin.AddSubstract.list1);
    $(BasicImProcPlugin.AddSubstract.listDiv).append("<br>");
    $(BasicImProcPlugin.AddSubstract.listDiv).append("image 2:");
    $(BasicImProcPlugin.AddSubstract.listDiv).append(BasicImProcPlugin.AddSubstract.list2);
};

BasicImProcPlugin.AddSubstract.onClickButton = function(mul){
    'use strict';
    var im1, im2, newim = {}, prov, bitpix, i, min, max;
    im1 = JS9.LookupImage(BasicImProcPlugin.AddSubstract.list1.value);
    im2 = JS9.LookupImage(BasicImProcPlugin.AddSubstract.list2.value);
    if(im1===null || im1===undefined || im2===null || im2===undefined){
        return;
    }
    if(im1.raw.height!==im2.raw.height || im1.raw.width!==im2.raw.width){
        return;
    }
    if(Math.abs(im1.raw.bitpix)>Math.abs(im2.raw.bitpix)){
        bitpix = im1.raw.bitpix;
    }else{
        bitpix = im2.raw.bitpix;
    }
    newim.naxis = 2;
    newim.naxis1 = im1.raw.width;
    newim.naxis2 = im1.raw.height;
    newim.image = [];
    for(i=0;i<im1.raw.data.length;i++){
        prov = im2.raw.data[i]*mul;
        newim.image[i] = im1.raw.data[i]+prov;
        if(min===undefined || min>newim.image[i]){
            min = newim.image[i];
        }if(max===undefined || max<newim.image[i]){
            max = newim.image[i];
        }
    }
    bitpix = BasicImProcPlugin.AddSubstract.calculateBitPix(min, max, bitpix);
    newim.bitpix = bitpix;
    JS9.Load(newim);
};

BasicImProcPlugin.AddSubstract.calculateBitPix = function(min, max, bitpix){
    'use strict';
    var lmax, lmin, next;
    if(bitpix===8){
        lmax = 255;
        lmin = 0;
        next = 16;
    }if(bitpix===16 || bitpix===32){
        lmax = Math.pow(2,bitpix-1)-1;
        lmin = -Math.pow(2,bitpix-1);
        if(bitpix===16){
            next = 32;
        }else{
            next = -32;
        }
    }if(bitpix===-32){
        max = Math.pow(2,127);
        min = -max;
        next = -64;
    }if(bitpix===-64){
        return -64;
    }
    if(min>lmin && max<lmax){
        return bitpix;
    }else{
        return BasicImProcPlugin.AddSubstract.calculateBitPix(min, max, next);
    }
};

//Register the plugin in JS9
JS9.RegisterPlugin(BasicImProcPlugin.CLASS, BasicImProcPlugin.NAME, BasicImProcPlugin.init,
            {menuItem: "Basic Image Processing",
            onplugindisplay: BasicImProcPlugin.init,
            onimageload: BasicImProcPlugin.init,
            winTitle: "Scaling",
            winResize: true,
            winDims: [BasicImProcPlugin.WIDTH, BasicImProcPlugin.HEIGHT]});
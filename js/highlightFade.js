/*
	jQuery Plugin highlightFade (jquery.offput.ca/highlightFade)
	(c) 2006 Blair Mitchelmore (offput.ca) blair@offput.ca
*/
/*
	(The inline documentation has returned until I can publish it on a page)
	Usage: 
		$(whatever).hightlightFade(color,duration,complete,iterator);
		$(whatever).highlightFade({color:whatever,duration:whatever,complete:whatever,iterator:whatever});
	Description:
		This plugin allows for simple "yellow fade" technique which was popularized
		by 37signals.com but this can highlight in any colour. It always fades to 
		the current background of the element but if the need for specifying the 
		final colour is requested I'll consider adding it (or you could do it yourself :)).
	Arguments:
		color: Defines the color at which to begin fading
			- a w3c css compatable color code (ie rgb(1,2,3), #ccc, #ed3e23)
			  or a w3c spec color name (ie blue, red, gray, et. al.)
			- Default value: rgb(250,250,200)
		duration: Defines the speed at which the color fades away
			- a jQuery speed string (ie slow, fast) or a duration in milliseconds
			- Default value: default value of jQuery's $.speed function
		complete: Defines a function to call once the colour fade has finished
			- Can be anything you want it to be. You can access the element on which
			  the fade was applied via the this variable.
			- Default value: no action
		iterator: Defines the method by which we move from the starting color to the final.
			- Can be a string representing one of the built in fading algorithms (ie 'linear',
			  'sinusoidal', or 'exponential') or a custom function of your design. The custom
			  function must take as it's arguments the start value, the final value, the total 
			  number of steps and the current step.
			- Linear is an even colour progression, Sinusoidal changes in the beginning fast but 
			  slows as it approaches disappearing, Exponential changes slowly in the beginning
			  but increases its colour change per step as time goes on.
			- Default value: linear
	Notes: 
		- Any arguments can be set to the default by setting them as null in the function call
		- Any arguments not specified in the Object notation are also taken as the default value
	Examples:
		- Do a red exponential highlightFade on all p elements on the page at a crawl speed
		  $('p').highlightFade({color'red','crawl',null,'exponential')
		- Do a bluish sinusoidal highlightFade on all div's with a class of 'new' and remove it afterwards
		  $('div.new').highlightFade('rgb(128,128,255)',null,function() { $(this).remove() },'sinusoidal');
		- Just do a plain old linear yellow fade on 'this'
		  $(this).highlightFade();
*/

$.fn.highlightFade = function(colour,settings) {
	if (typeof settings != 'object') settings = {
		color: arguments[0], 
		speed: arguments[1], 
		complete: arguments[2], 
		iterator: arguments[3]
	};
	if (typeof colour != 'object' || (colour && colour.constructor == Array)) settings['color'] = colour;
	else settings = colour;
	var o = settings;
	var ts = {
		'linear': function(s,e,t,c) { return parseInt(s+(c/t)*(e-s)); },
		'sinusoidal': function(s,e,t,c) { return parseInt(s+Math.sin(((c/t)*90)*(Math.PI/180))*(e-s)); },
		'exponential': function(s,e,t,c) { return parseInt(s+(Math.pow(c/t,2))*(e-s)); }
	};
	var t = (o['iterator'] && o['iterator'].constructor == Function) ? o['iterator'] : ts[o['iterator']] || ts['linear'];
	return this.each(function() {
		var i = 50;
		var e = (this.highlighting) ? this.highlighting.end : $.highlightFade.getBGColor(this) || [255,255,255];
		var c = $.highlightFade.getRGB(o['color'] || [255,255,128]);
		var s = $.speed(o['speed'],o['complete']);
		var r = (this.highlighting && this.highlighting.orig) ? this.highlighting.orig : $.curCSS(this,'backgroundColor');
		if (this.highlighting && this.highlighting.timer) window.clearInterval(this.highlighting.timer);
		this.highlighting = { steps: ((s.duration) / i), interval: i, currentStep: 0, start: c, end: e, orig: r };
		$.highlightFade(this,s.complete,t);
	});
};

$.highlightFade = function(e,o,t) {
	e.highlighting.timer = window.setInterval(function() { 
		var newR = t(e.highlighting.start[0],e.highlighting.end[0],e.highlighting.steps,e.highlighting.currentStep);
		var newG = t(e.highlighting.start[1],e.highlighting.end[1],e.highlighting.steps,e.highlighting.currentStep);
		var newB = t(e.highlighting.start[2],e.highlighting.end[2],e.highlighting.steps,e.highlighting.currentStep);
		$(e).css('backgroundColor',$.highlightFade.asRGBString([newR,newG,newB]));
		if (e.highlighting.currentStep++ >= e.highlighting.steps) {
			$(e).css('backgroundColor',e.highlighting.orig || '');
			if (o && o.constructor == Function) o.call(e);
			window.clearInterval(e.highlighting.timer);
			e.highlighting = null;
		}
	},e.highlighting.interval);
};

$.highlightFade.getRGB = function(c,d) {
	var result;
	if (c && c.constructor == Array && c.length == 3) return c;
	if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(c))
		return [parseInt(result[1]),parseInt(result[2]),parseInt(result[3])];
	else if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(c))
		return [parseFloat(result[1])*2.55,parseFloat(result[2])*2.55,parseFloat(result[3])*2.55];
	else if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(c))
		return [parseInt("0x"+ result[1] + result[1]),parseInt("0x" + result[2] + result[2]),parseInt("0x" + result[3] + result[3])];
	else if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(c))
		return [parseInt("0x" + result[1]),parseInt("0x" + result[2]),parseInt("0x" + result[3])];
	else
		return $.highlightFade.checkColorName(c) || d || null;
};

$.highlightFade.asRGBString = function(a) {
	return "rgb(" + a.join(",") + ")";
};

$.highlightFade.getBGColor = function(e) {
	var s;
	do if (((s = $.curCSS(e,'backgroundColor')) != '' && s != 'transparent') || (e.tagName.match(/^body$/i)) || (e.highlighting && e.highlighting.end)) break; while (e = e.parentNode);
	if (e.highlighting && e.highlighting.end) s = e.highlighting.end;
	if (s == undefined || s == '' || s == 'transparent') s = [255,255,255];
	return $.highlightFade.getRGB(s);
};

$.highlightFade.checkColorName = function(c) {
	if (!c) return null;
	switch(c.replace(/^\s*|\s*$/g,'').toLowerCase()) {
		case 'aqua': return [0,255,255];
		case 'black': return [0,0,0];
		case 'blue': return [0,0,255];
		case 'fuchsia': return [255,0,255];
		case 'gray': return [128,128,128];
		case 'green': return [0,128,0];
		case 'lime': return [0,255,0];
		case 'maroon': return [128,0,0];
		case 'navy': return [0,0,128];
		case 'olive': return [128,128,0];
		case 'purple': return [128,0,128];
		case 'red': return [255,0,0];
		case 'silver': return [192,192,192];
		case 'teal': return [0,128,128];
		case 'white': return [255,255,255];
		case 'yellow': return [255,255,0];
	}
};
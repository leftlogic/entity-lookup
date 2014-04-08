// template (in array so the page still validates)
var html = ['<div class="entity"><div class="html">@html@<',
  '/div><div class="detail"><div class="entityName">@entity@<',
  '/div><div class="entityCode">@html_replaced@<', '/div><div class="code">@code@<',
  '/div><div class="tools"><img src="img/entity_paste.png" title="Copy entity to clipboard" class="simple copybtn" /><span><img src="img/entity_add.png" title="Add keyword or character" class="simple addbtn" /></span><',
  '/div><div class="clear"><',
  '/div><div class="description">@description@<',
  '/div><',
  '/div><div class="clear"><',
  '/div><',
  '/div>'].join('');

var showRelated = false;
var compress = false;
var personalLike = {};

function savePersonalLike() {
  var x = [];
  function y(s) {
    return typeof s == 'string' ? '"' + s.replace(/"/g, '\\\"') + '"' : s;
  }
  for (var v in personalLike) {
    x.push(v + ':' + y(personalLike[v]));
  }
  localStorage.setLike('entity_like', '{' + x.join(',') + '}');
};

(function($) {
  $.fn.checkAndFire = function() {
    return this.each(function() {
      var $$ = $(this);
      if (!!(localStorage.getItem(this.name) == 'true')) {
        $$.attr('checked', 'checked').change();
      } else {
        $$.attr('checked', '');
      }
    });
  };

  // based on editable http://www.dyve.net/jquery/?editable
  $.fn.mini_editable = function(code) {
    this.click(function() {
      var $$ = $(this);
      var holder = $$.parent().parent().parent();
      if (this.editing) return;
      if (!this.editable) this.editable = function() {
        var me = this;
        me.editing = true;
        var d = document.createElement('div');
        $(d).css({opacity: 0.7}).addClass('disabled');
        var f = document.createElement('form');
        $(f).addClass('editable');
        var i = document.createElement('input');
        i.type = 'text';
        i.value = personalLike[code] || e.get(e.find(code)).like.join(' ');
        i.name = i.id = 'like' + code;

        var l = document.createElement('label');
        $(l).attr('for', 'like' + code).html('Space separate \'like\' matches &nbsp;');

        holder.append(d);
        f.appendChild(l);
        f.appendChild(i);
        holder.append(f);
        $(i).focus();

        $(i).blur(reset).keydown(function(evt) {
          if (evt.keyCode == 27) { // ESC
            evt.preventDefault;
            reset();
          }
        });

        $(f).submit(function() {
          personalLike[code] = i.value;
          savePersonalLike();
          reset();
          return false;
        });

        function reset() {
          $('div.disabled, form.editable', holder).remove();
          me.editing = false;
        }
      }
      this.editable();
    });

    return this;
  };
})(jQuery);

$(function() {
  var results = $('#results');

  //showRelated = !!(readCookie('relatedChk') == 'true');
  var pl = localStorage.getItem('entity_like');
  if (pl != null && pl.length) {
    try {
      eval('personalLike = ' + pl);

      // load in to the entity engine
     for (var v in personalLike) {
       e.setLike(v, personalLike[v].split(' '));
     }
    } catch (er) {
      // nice error
    }
  }

  $('#compress').change(function() {
    if (this.checked) {
      results.addClass('compress');
    } else {
      results.removeClass('compress');
    }
    localStorage.setItem(this.name, this.checked.toString());
  }).checkAndFire();

  var eInitLen = e.length();

  $('#extended').change(function() {
    if (this.checked) {
      $.getScript('extended.entity.data.js');
    } else {
      var i = (e.length() - eInitLen);
      while (i--) {
        e.removeLast();
      }
    }
    localStorage.setItem(this.name, this.checked.toString());
    $('#s').keyup();
  }).checkAndFire();

  if ($.browser.msie) {
    $('#compress').click(function() {
      $(this).change();
    })
  }

  // $('#related').change(function() {
  //   showRelated = !!(this.checked);
  //   createCookie(this.name, showRelated.toString(), 365);
  // });

  var copyErr = "The entity could not be copied.  Either install flash, or in Firefox do the following: ";
  copyErr += "Enter 'about:config' in your address bar, right click the list, New -> Boolean,\n\n";
  copyErr += "signed.applets.codebase_principal_support\n\n";
  copyErr += "Then when you try to copy accept the security checks.";
  $('#lookupForm').submit(function() { return false; });
  $('#s').keyup(function(ev) {
    var t = this;
    if (t.timer) clearTimeout(t.timer);
    t.timer = setTimeout(function() {
      if (t.value.length) {
        $('div', results).remove();
        var found = e.like(t.value);
        $('#lookupForm legend:first').text('Lookup - found ' + found.length() + ' matches');
        found.each(function() {
          results.append(html.replace(/@html@/, this.html).replace(/@code@/, this.code).replace(/@entity@/g, this.entity || '&nbsp;').replace(/@description@/, this.description).replace(/@html_replaced@/, this.html.replace(/&/, '&amp;')));
          var entityHTML = this.html;

          // for optimisation
          var images = results[0].getElementsByTagName('img');
          var imgLen = images.length;
          $(images[imgLen - 1]).mini_editable(this.code);
          $(images[imgLen - 2]).click(function() {
            if (!copy_clip(entityHTML)) {
              alert(copyErr);
            } else {
              $(this).parent().parent().parent().highlightFade('red',1400,null,'sinusoidal');
            }
          });
        });
      } else {
        $('div', results).remove();
        $('#lookupForm legend:first').text('Lookup');
      }
    }, 100);
  }).val('').focus();

  $('a.lookupExample').click(function() {
    $('#s').val(this.rel).keyup().focus();
    return false;
  });

  var initialSearch = document.location.search.match(/\b(q)=([^&=]*)\b/g);

  if (initialSearch && initialSearch.length) {
      $('#s').val(unescape(initialSearch[0].substr(2))).keyup().focus();
  }
});

// compressed and adapted from http://webchicanery.com/2006/11/14/clipboard-copy-javascript/
// and http://www.krikkit.net/howto_javascript_copy_clipboard.html
function copy_clip(a){if(window.clipboardData){window.clipboardData.setData("Text",a);return true}else if(flash){var b='flashcopier';if(!document.getElementById(b)){var c=document.createElement('div');c.id=b;document.body.appendChild(c)}document.getElementById(b).innerHTML='';var d='<embed src="/images/articles/_clipboard.swf" FlashVars="clipboard='+escape(a)+'" width="0" height="0" type="application/x-shockwave-flash"></'+'embed>';document.getElementById(b).innerHTML=d;return true}else if(window.netscape){try{netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect')}catch(er){return false}var f=Components.classes['@mozilla.org/widget/clipboard;1'].createInstance(Components.interfaces.nsIClipboard);if(!f)return false;var g=Components.classes['@mozilla.org/widget/transferable;1'].createInstance(Components.interfaces.nsITransferable);if(!g)return false;g.addDataFlavor('text/unicode');var h=new Object();var i=new Object();var h=Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);var j=a;h.data=j;g.setTransferData("text/unicode",h,j.length*2);var k=Components.interfaces.nsIClipboard;if(!f)return false;f.setData(g,null,k.kGlobalClipboard);return true}}

// detect flash via http://www.quirksmode.org/js/flash.html
var flash = (function(){var a=0;if(navigator.plugins&&navigator.plugins.length){x=navigator.plugins["Shockwave Flash"];if(x){a=2}else a=1;if(navigator.plugins["Shockwave Flash 2.0"]){a=2}}else if(navigator.mimeTypes&&navigator.mimeTypes.length){x=navigator.mimeTypes['application/x-shockwave-flash'];if(x&&x.enabledPlugin)a=2;else a=1}return !!(a == 2)})();

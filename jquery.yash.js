function debug(node) {
  var result = {type: node.nodeName};
  if(result.type == '#text')
    result.content = node.textContent;
  else if(node.childNodes.length) {
    result.children = [];
    for(var i = 0; i < node.childNodes.length; i++)
      result.children.push(debug(node.childNodes[i]));
  }
  return result;
}

(function($) {
  
  var text_to_html = function(text) {
    return $('<div></div>').text(text).html();
  };
  
  var html_to_text = function(html) {
    return $('<div></div>').html(html).text();
  };
  
  var Highlighter = function(syntax, line) {
    this.continue = true;
    this.syntax = syntax;
    this.highlight_from(line);
  };
  
  Highlighter.prototype.stop = function() {
    this.continue = false;
  };
  
  Highlighter.prototype.highlight_from = function(line) {
    for(var i = 0; i < 10 && line; i ++, line = line.nextSibling)
      this.highlight_line(line);
    
    if(!line || !this.continue)
      return;
    
    var _this = this;
    setTimeout(function() { _this.highlight_from(line); }, 0);
  };
  
  Highlighter.prototype.highlight_line = function(line) {
    var state, content, markup, matched, rule, match;
    
    var consume = function(string) {
      if(!rule.forget)
        state.previous_token = string;
      markup += '<span class="' + rule.css + '">' + text_to_html(string) + '</span>';
      content = content.substr(string.length);
      matched = true;
    };
    
    state = $.extend(true, {}, line.state);
    content = line.textContent.replace(/[\r\n]/g, '');
    markup = '';
    
    if(state.continuation) {
      rule = state.continuation.rule;
      
      if(typeof rule.test == 'function')
        match = rule.test(content, state);
      else {
        var test_content = state.continuation.match[0] + content;
        match = test_content.match(rule.test);
        if(match)
          match[0] = match[0].substr(state.continuation.match[0].length);
      }
      
      if(match) {
        consume(match[0]);
        state.continuation = false;
      } else
        consume(content);
    }
    
    matched = true;
    while(content && matched) {
      matched = false;
      
      if(match = content.match(this.syntax.ignore)) {
        markup += text_to_html(match[0]);
        content = content.substr(match[0].length);
      }
      
      for(var i in this.syntax.patterns) {
        rule = this.syntax.patterns[i];
        
        if(rule.previous_token && !state.previous_token.match(rule.previous_token))
          continue;
        
        if(rule.start) {
          if(match = content.match(rule.start)) {
            state.continuation = { rule: rule, match: match };
            
            if(typeof rule.test == 'function')
              match = rule.test(content, state);
            else
              match = content.match(rule.test);
            
            if(match) {
              state.continuation = false;
              consume(match[0]);
            } else
              consume(content);
            
            break;
          }
          continue;
        }
        
        if(match = content.match(rule.test)) {
          consume(match[0]);
          break;
        }
      }
      
      if(!matched) {
        markup += text_to_html(content.substr(0, 1));
        content = content.substr(1);
        matched = true;
      }
    }
    
    line.innerHTML = markup;
    if(line.nextSibling)
      line.nextSibling.state = state;
  };
  
  $.fn.yash = function(options) {
    
    var root, ruler, $ruler, container, $container, line_numbers, $line_numbers,
      editor, $editor, syntax, highlighter;
    
    var build = function() {
      var source = root.textContent.split(/\r\n|\r|\n/);
      root.innerHTML =
        '<div class="yash-container">' +
        '<div class="yash-ruler">x</div>' +
        '<ul class="yash-line-numbers"></ul>' +
        '<div class="yash-editor"></div>' +
        '<div style="clear: both"></div>' +
        '</div>';
      container = root.firstChild, ruler = container.firstChild,
        line_numbers = ruler.nextSibling, editor = line_numbers.nextSibling;
      $container = $(container), $ruler = $(ruler),
        $line_numbers = $(line_numbers), $editor = $(editor);
      
      editor.contentEditable = true;
      var line = $('<div></div>').css({height: ruler.offsetHeight});
      var default_state = {
        previous_token: null,
        continuation: false
      };
      for(var i in source) {
        editor.appendChild(line.clone().text(source[i]).get(0));
        editor.lastChild.state = default_state;
      }
      
      update_line_numbers();
      resize();
    };
    
    var update_line_numbers = function() {
      var li;
      while(line_numbers.childNodes.length < editor.childNodes.length) {
        li = document.createElement('li');
        li.innerHTML = line_numbers.childNodes.length + 1;
        line_numbers.appendChild(li);
      }
      while(line_numbers.childNodes.length > editor.childNodes.length)
        line_numbers.removeChild(line_numbers.childNodes[line_numbers.childNodes.length - 1]);
    };
    
    var resize = function() {
      var margin_padding = $editor.outerWidth(true) - $editor.width();
      editor.style.minWidth = ($container.width() - $line_numbers.outerWidth(true) - margin_padding) + 'px';
      container.style.minWidth = $line_numbers.outerWidth(true) + $editor.outerWidth(true) + 'px';
    };
    
    var bind = function() {
      var start, end, backwards, collapsed, caret, press;
      
      var get_selection = function() {
        var s = document.getSelection();
        if(!s.rangeCount) {
          start = null, end = null, caret = null;
          return;
        }
        
        var extents = {anchor: null, focus: null};
        for(var k in extents) {
          var text, token, line, offset, node;
          
          text = s[k + 'Node'];
          if(text.parentNode.nodeName == 'SPAN')
            token = text.parentNode;
          else
            token = text;
          line = token;
          while(line.nodeName != 'DIV')
            line = line.parentNode;
          
          offset = s[k + 'Offset'];
          if(text.nodeType == 3) {
            node = token;
            while(node = node.previousSibling)
              offset += node.textContent.length;
          }
          
          extents[k] = { text: text, token: token, line: line, offset: offset };
        }
        
        start = extents.anchor, end = extents.focus, backwards = false, collapsed = true;
        if(start.offset > end.offset)
          start = extents.focus, end = extents.anchor, backwards = true;
        if(start.text != end.text || start.offset != end.offset)
          collapsed = false;
        
        if(collapsed || backwards)
          caret = start;
        else
          caret = end;
      };
      
      var set_selection = function(start_line, start_offset, end_line, end_offset) {
        var s = document.getSelection(), r = document.createRange(), offset, node;
        
        if(!end_line)
          end_line = start_line;
        if(!end_offset)
          end_offset = start_offset;
        
        var o = {start_line: start_line, start_offset: start_offset, end_line: end_line, end_offset: end_offset};
        for(var k in {start: null, end: null}) {
          offset = o[k + '_offset'];
          node = o[k + '_line'].firstChild;
          while(node && offset > node.textContent.length) {
            offset -= node.textContent.length;
            node = node.nextSibling;
          }
          if(!node)
            node = end_line, offset = 0;
          else if(node.nodeType != 3)
            node = node.firstChild;
          r['set' + k.charAt(0).toUpperCase() + k.substr(1)](node, offset);
        }
        
        s.removeAllRanges();
        s.addRange(r);
      };
      
      var restart_highlighter = function() {
        highlighter.stop();
        highlighter = new Highlighter(syntax, caret.line);
        set_selection(caret.line, caret.offset);
      };
      
      var update_current_line = function() {
        $editor.children('div.yash-current-line').removeClass();
        caret.line.className = 'yash-current-line';
      };
      
      var onmouse = function(e) {
        var line = e.target;
        while(line.nodeName != 'DIV')
          line = line.parentNode;
        caret = {line: line};
        update_current_line();
      };
      editor.onmousedown = onmouse;
      editor.onmouseup = onmouse;
      
      editor.onkeypress = function(e) { press = e; };
      
      editor.onkeydown = function(e) {
        get_selection();
        
        if(e.keyCode >= 37 && e.keyCode <= 40) {
          var line = caret.line;
          if(((e.keyCode == 37 && caret.offset == 0) || e.keyCode == 38) && line.previousSibling) {
            caret = {line: line.previousSibling};
            update_current_line();
          } else if(((e.keyCode == 39 && caret.offset == line.textContent.length) || e.keyCode == 40) && line.nextSibling) {
            caret = {line: line.nextSibling};
            update_current_line();
          }
        }
      };
      
      editor.onkeyup = function(e) {
        get_selection();
        
        if(press) {
          e = press;
          press = false;
        }
        
        if(e.keyCode == 8 || e.keyCode == 13 || e.keyCode == 46) {
          update_line_numbers();
          update_current_line();
        }
        
        if(e.keyCode == 13) {
          highlighter.stop();
          highlighter = new Highlighter(syntax, caret.line.previousSibling);
          set_selection(caret.line, caret.offset);
        } else if(e.charCode || e.keyCode == 8 || e.keyCode == 46)
          restart_highlighter();
      };
    };
    
    root = this.get(0);
    options = $.extend(true, {}, $.fn.yash.default_options, options);
    syntax = $.fn.yash.syntax.php;
    
    build();
    bind();
    
    highlighter = new Highlighter(syntax, editor.firstChild);
    
  };
  $.fn.yash.default_options = {};
  $.fn.yash.syntax = {};
  
})(jQuery);
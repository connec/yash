jQuery.fn.yash.syntax.php = {
  ignore: /^\s+/,
  patterns: [
    {
      test: /^\/\/.*/,
      css: 'yash-comment'
    },
    {
      start: /^\/\*/,
      test: /^\/\*(?:.|\s)*?\*\//,
      css: 'yash-comment'
    },
    {
      start: /^['"]/,
      test: /^(['"])(\\.|(?!\\|\1).)*\1/,
      css: 'yash-string yash-literal'
    },
    {
      start: /^<<<([_a-z0-9]+)/i,
      test: function(content, state) {
        var match = state.continuation.match;
        if(content.substr(0, match[1].length) === match[1])
          return [match[1]];
        else
          return false;
      },
      css: 'yash-string yash-literal'
    },
    {
      test: /^(?:<\?(?:php)?|\?>)/,
      css: 'yash-script-control yash-keyword'
    },
    {
      test: /^(?:\d*\.\d+|\d+(?:\.\d*)?|0b[01]+|0x\d+)\b/i,
      css: 'yash-number yash-literal'
    },
    {
      test: /^(?:true|false|null)/i,
      css: 'yash-boolean yash-literal'
    },
    {
      test: /^(?:abstract|as|class|clone|const|extends|final|function|global|implements|interface|namespace|new|private|protected|public|static|use|var)\b/i,
      css: 'yash-generic yash-keyword'
    },
    {
      test: /^(?:break|case|catch|continue|declare|default|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|for|foreach|goto|if|return|switch|throw|try|while)\b/i,
      css: 'yash-control yash-keyword'
    },
    {
      test: /^(?:die|echo|empty|exit|eval|include|include_once|isset|list|require|require_once|print|unset)\b/i,
      css: 'yash-function yash-construct'
    },
    {
      test: /^\$[_a-z][_a-z0-9]*/i,
      css: 'yash-variable'
    },
    {
      test: /^(?:~=|~|\|\||\|=|\||xor\b|or\b|instanceof\b|and\b|\^=|\^|@|>>=|>>|>=|>|=>|===|==|=|<>|<=|<<=|<<|<|\/=|\/|\.=|\.|->|-=|--|-|\+=|\+\+|\+|\*=|\*|&=|&&|&|%=|%|!==|!=|!|::)/i,
      css: 'yash-operator'
    },
    {
      test: /^[:;,(){}\[\]]/,
      css: 'yash-punctuation'
    },
    {
      test: /^\\/,
      css: 'yash-punctuation',
      forget: true
    },
    {
      test: /^[_a-z][_a-z0-9]*(?=\\)/i,
      css: 'yash-namespace yash-constant',
      forget: true
    },
    {
      previous_token: /^namespace$/,
      test: /^[_a-z][_a-z0-9]*/i,
      css: 'yash-namespace yash-constant'
    },
    {
      previous_token: /^class|new|extends|implements$/,
      test: /^[_a-z][_a-z0-9]*/i,
      css: 'yash-class yash-constant'
    },
    {
      test: /^[_a-z][_a-z0-9]*(?=\s*::)/i,
      css: 'yash-class yash-constant'
    },
    {
      test: /^[_a-z][_a-z0-9]*(?=\s*\$)/i,
      css: 'yash-class yash-constant'
    },
    {
      previous_token: /^function$/,
      test: /^[_a-z][_a-z0-9]*/i,
      css: 'yash-function yash-constant'
    },
    {
      test: /^[_a-z][_a-z0-9]*(?=\s*\()/i,
      css: 'yash-function yash-constant'
    },
    {
      previous_token: /^->$/,
      test: /^[_a-z][_a-z0-9]*/i,
      css: 'yash-variable'
    },
    {
      test: /^[_a-z][_a-z0-9]*/i,
      css: 'yash-generic yash-constant'
    },
  ]
};
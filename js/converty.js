(function(){
  "use strict";

  var converty = angular.module('converty', ['ui.bootstrap']);

  converty.factory('storage', function($window) {
    var storage = {};

    if ('localStorage' in $window && null != $window.localStorage) {
      storage = $window.localStorage;
    }

    return storage;
  });

  // TODO: Properly detect where to insert spaces
  converty.directive('autoindent', function($parse) {
    return {
      require: 'ngModel',
      link: function($scope, $element, $attrs) {
        var onKeypress = function($event) {
          if ('Enter' === $event.keyIdentifier) {
            var caret = $element.prop('selectionStart');
            var model = $parse($attrs.ngModel);
            var value = model($scope);
            if (caret < value.length) return;
            var lines = value.split('\n');
            var line = lines.pop();
            var spaces = line.match(/^( *)/)[0];
            $scope.$apply(function() {
              model.assign($scope, value + '\n' + spaces);
            });
            $event.preventDefault();
          }
        };
        $element.bind('keypress', onKeypress);
      }
    };
  });

  converty.controller('MainController', function($scope, storage) {
    $scope.activeConverters = [];
    $scope.fields = { input: storage.input };

    $scope.$watch('fields.input', function(value) {
      storage.input = value;
      $scope.buildOutput();
    });

    $scope.buildOutput = function() {
      var value = $scope.fields.input;
      
      angular.forEach($scope.activeConverters, function(converter) {
        try {
          var args = [value];
          angular.forEach(converter.params, function(param) {
            args.push(param.value);
          });
          var converted = converter.converter.apply({}, args);
          converter.error = false;
          value = converted;
        } catch(e) {
          console.log('Error', e);
          converter.error = true;
        }
      });
      
      $scope.output = value;
    };

    $scope.availableConverters = [
      {
        name: 'Search',
        params: [
          {
            label: 'Search',
            value: ''
          },
          {
            type: 'boolean',
            label: 'Case-insensitive',
            value: false
          },
          {
            type: 'boolean',
            label: 'Regex',
            value: false
          }
        ],
        converter: function(value, search, caseInsensitive, isRegex) {
          if (!search.length) return value;
          var flags = ['g'];
          if (caseInsensitive) {
            flags.push('i');
          }
          if (!isRegex) {
            search = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
          }
          var regex = new RegExp(search, flags.join(''));
          var result = value.match(regex);
          return result ? result.join('\n') : '\n';
        }
      },
      {
        name: 'Replace',
        params: [
          {
            label: 'Search',
            value: ''
          },
          {
            label: 'Replace',
            value: ''
          },
          {
            type: 'boolean',
            label: 'Case-insensitive',
            value: false
          },
          {
            type: 'boolean',
            label: 'Regex',
            value: false
          }
        ],
        converter: function(value, search, replace, caseInsensitive, isRegex) {
          if (!search.length) return value;
          var flags = ['g'];
          if (caseInsensitive) {
            flags.push('i');
          }
          if (!isRegex) {
            search = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
          }
          var regex = new RegExp(search, flags.join(''));
          return value.replace(regex, replace);
        }
      },
      {
        name: 'URI Encode',
        converter: encodeURIComponent
      },
      {
        name: 'URI Decode',
        converter: decodeURIComponent
      },
      {
        name: 'HTML Encode',
        converter: function(value, encodeQuotes) {
          var encoded = angular.element('<div></div>').text(value).html();
          if (encodeQuotes) {
            encoded = encoded.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          }
          return encoded;
        },
        params: [
          {
            type: 'boolean',
            label: 'Encode quotes',
            value: false
          }
        ]
      },
      {
        name: 'HTML Decode',
        converter: function(value) {
          return angular.element('<div></div>').html(value).text();
        }
      },
      {
        name: 'Add Slashes',
        converter: function(value) {
          return value.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
        }
      },
      {
        name: 'Strip Slashes',
        converter: function(value) {
          return value.replace(/\\(.?)/g, function(s, n1) {
            switch (n1) {
              case '\\':
                return '\\';

              case '0':
                return '\u0000';

              case '':
                return '';

              default:
                  return n1;
            }
          });
        }
      },
      {
        name: 'Base64 Encode',
        converter: function(value) {
          return window.btoa(value);
        }
      },
      {
        name: 'Base64 Decode',
        converter: function(value) {
          return window.atob(value);
        }
      },
      {
        name: 'MD5',
        converter: hex_md5
      },
      {
        name: 'SHA1',
        converter: hex_sha1
      },
      {
        name: 'SHA256',
        converter: hex_sha256
      },
      {
        name: 'SHA512',
        converter: hex_sha512
      },
      {
        name: 'Coffee -> JS',
        converter: function(value) {
          return CoffeeScript.compile(value);
        }
      },
      {
        name: 'JSON Pretty Print',
        converter: function(value) {
          var obj = JSON.parse(value);
          return JSON.stringify(obj, undefined, 2);
        }
      },
      {
        name: 'Markdown',
        converter: function(value) {
          return markdown.toHTML(value);
        },
        preview: true
      }
    ];

    $scope.toggleConverter = function(converter) {
      var index = $scope.activeConverters.indexOf(converter);

      if (-1 === index) {
        $scope.activeConverters.push(converter);
      } else {
        $scope.activeConverters.splice(index, 1);
      }

      $scope.buildOutput();
    };

    $scope.disableAllConverters = function() {
      $scope.activeConverters = [];
      $scope.buildOutput();
    };

    $scope.isConverterActive = function(converter) {
      return -1 !== $scope.activeConverters.indexOf(converter);
    };

    $scope.isParamsShown = function(converter) {
      return converter.params && $scope.isConverterActive(converter);
    };

    $scope.previewable = function() {
      var previewable = false;
      angular.forEach($scope.activeConverters, function(converter) {
        if (converter.preview) previewable = true;
      });
      return previewable;
    };

    $scope.$watch('activeConverters', function(converters) {
      storage.activeConverters = JSON.stringify(converters);
      $scope.buildOutput();
    }, true);

    // Enable all stored active converters
    (function() {
      if (storage.activeConverters) {
        try {
          var activeConverters = JSON.parse(storage.activeConverters);
        } catch (e) {
          return console.log("Unable to parse active converters from local storage");
        }
        angular.forEach(activeConverters, function(activeConverter) {
          angular.forEach($scope.availableConverters, function(converter) {
            if (converter.name != activeConverter.name) return;
            if (converter.params && activeConverter.params) {
              // Reload params
              angular.extend(converter.params, activeConverter.params);
            }
            $scope.activeConverters.push(converter);
          });
        });
      }
    })();
  });
}());

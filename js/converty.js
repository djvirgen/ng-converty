(function(){
  "use strict";

  var converty = angular.module('converty', []);

  converty.controller('MainController', function($scope) {
    $scope.activeConverters = [];
    $scope.input = '';

    $scope.buildOutput = function() {
      var value = $scope.input;
      
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
  });
}());

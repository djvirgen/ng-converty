(function(){
  "use strict";

  var converty = angular.module('converty', []);

  converty.controller('MainController', function($scope) {
    $scope.activeConverters = [];
    $scope.input = '';
    $scope.output = '';

    var buildOutput = function() {
      var value = $scope.input;
      
      angular.forEach($scope.activeConverters, function(converter) {
        try {
          var converted = converter.converter(value);
          converter.error = false;
          value = converted;
        } catch(e) {
          converter.error = true;
        }
      });
      
      $scope.output = value;
    };

    $scope.availableConverters = [
      {
        name: 'URI Encode',
        converter: function(value) {
          return encodeURIComponent(value);
        }
      },
      {
        name: 'URI Decode',
        converter: function(value) {
          return decodeURIComponent(value);
        }
      },
      {
        name: 'HTML Encode',
        converter: function(value) {
          return angular.element('<div></div>').text(value).html();
        }
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

      buildOutput();
    };

    $scope.disableAllConverters = function() {
      $scope.activeConverters = [];
      buildOutput();
    };

    $scope.isConverterActive = function(converter) {
      return -1 !== $scope.activeConverters.indexOf(converter);
    };

    $scope.$watch('input', function() {
      buildOutput();
    });
  });
}());

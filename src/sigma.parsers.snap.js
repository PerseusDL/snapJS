;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize package:
  sigma.utils.pkg('sigma.parsers');
  sigma.utils.pkg('sigma.utils');

  /**
   * This function loads a JSON file and creates a new sigma instance or
   * updates the graph of a given instance. It is possible to give a callback
   * that will be executed at the end of the process.
   *
   * @param  {object|string}       jsonld    The URL of the JSON file or a javascript object
   * @param  {object|sigma}        sig       A sigma configuration object or a sigma
   *                                         instance.
   * @param  {?function}           callback  Eventually a callback to execute after
   *                                         having parsed the file. It will be called
   *                                         with the related sigma instance as
   *                                         parameter.
   */
  sigma.parsers.snap = function(jsonld, sig, callback) {
    var graph;

    if(typeof jsonld === "string") {
      var xhr = snapJS.utils.xhr();

      if (!xhr)
        throw 'XMLHttpRequest not supported, cannot load the file.';

      xhr.open('GET', jsonld, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          jsonld = JSON.parse(xhr.responseText);

          graph = snapJS.sigma.get(jsonld);
          snapJS.sigma.run(graph, sig, callback);
        }
      };
      xhr.send();

    // If the object is not a string, it's a JSON-LD preparsed object
    } else {
      // We transform JSON-LD to a network object
      graph = snapJS.sigma.get(jsonld);
      snapJS.sigma.run(graph, sig, callback);
    }
  };
}).call(this);

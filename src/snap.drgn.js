;(function(undefined) {
  'use strict';
  snap.drgn = {
    //Default node properties such as X/Y/Size
    "default_node" : { 
      "x" : 1,
      "y" : 1,
      "size" : 10
    },
    "default_styles" : {
      "default" : {
        "color" : "rgb(0,0,0)",
        "type" : "def"
      },
      "snap:SonOf" : {
        "color" : "rgb(122,5,122)",
        "type" : "def",
        "head" : "arrow"
      }
    },
    "utils" : {
      /**
       * Just an XmlHttpRequest polyfill for different IE versions. Simple reuse of sigma.parsers.json
       *
       * @return {*} The XHR like object.
       */
      "xhr" : function() {
        if (window.XMLHttpRequest)
          return new XMLHttpRequest();

        var names,
            i;

        if (window.ActiveXObject) {
          names = [
            'Msxml2.XMLHTTP.6.0',
            'Msxml2.XMLHTTP.3.0',
            'Msxml2.XMLHTTP',
            'Microsoft.XMLHTTP'
          ];

          for (i in names)
            try {
              return new ActiveXObject(names[i]);
            } catch (e) {}
        }

        return null;
      }
    },
    /**
     * This function create an edge instance if it does not exist in dict, giving a new dict
     * 
     * @param   {bool|string}     type   Type of relationship in SNAP ontology   
     * @param   {object}          dict   A dictionary (eg : tempgraph["edges"])
     * @param   {string}          id     ID of given object
     * @param   {?string}         label  Label of given nodes
     * @param   {?object}         rdf    RDF representation of the edge
     *
     * @return  {object}          Dictionary with new edge
     */
    "edge" : function(type, dict, id, rdf, label) {
      if (!(id in dict)) {
        dict[id] = {
          "id" : id,
          "label" : label || id,
          "rdf" : rdf,
          "type" : type
        }
      } else {
        if (dict[id]["label"] === id && typeof label !== "undefined") { 
          dict[id]["label"] = label;
        }
        if (dict[id]["type"] === id && typeof type !== "undefined") { 
          dict[id]["type"] = type;
        }
      }

      // Merge with types if available
      if(typeof dict[id]["type"] !== "undefined") {
        if(dict[id]["type"] in snapJS.default_styles) {
          dict[id] = sigma.utils.extend(dict[id], snapJS.default_styles[dict[id]["type"]]);
        }
      }

      return dict;
    },
    /**
     * This function create a node instance if it does not exist in dict, giving a new dict
     * 
     * @param   {object}   dict   A dictionary (eg : tempgraph["nodes"])
     * @param   {string}   id     ID of given object
     * @param   {?string}  label  Label of given nodes
     * @param   {?object}  rdf    RDF representation of the node
     *
     * @return  {object}          Dictionary with new node
     */
    "node" : function (dict, id, rdf, label) {
      if(!(id in dict)) {
        dict[id] = {
          "id" : id,
          "label" : label || id,
          "rdf" : rdf
        }
      }
      return dict;
    },
    /**
     * This function fills a node object with must-have properties for sigmaJS (X, Y, Weight)
     * if they are not available
     *
     * @param   {object}  A node object according to SigmaJS requirements
     * @return  {object}  Return the same node with necessary properties
     *
     */
    "fill_node" : function (obj) {
      //Because the default could be enhanced, we do a loop on the default_node properties
      Object.keys(snapJS.default_node).forEach(function(key) {
        if(!(key in obj)) {
          obj[key] = snapJS.default_node[key];
        }
      });

      return obj;
    },
    "sigma" : {
      /**
      * This function creates or update an instance of sigma
      *
      * @param  {object}              graph     A Graph object according to sigma models
      * @param  {object|sigma}        sig       A sigma configuration object or a sigma
      *                                         instance.
      * @param  {?function}           callback  Eventually a callback to execute after
      *                                         having parsed the file. It will be called
      *                                         with the related sigma instance as
      *                                         parameter.
      */
      "run" : function(graph, sig, callback) {
          // Update the instance's graph:
          if (sig instanceof sigma) {
            sig.graph.clear();
            sig.graph.read(graph);

          // ...or instantiate sigma if needed:
          } else if (typeof sig === 'object') {
            sig.graph = graph;
            sig = new sigma(sig);

          // ...or it's finally the callback:
          } else if (typeof sig === 'function') {
            callback = sig;
            sig = null;
          }

          // Call the callback if specified:
          if (callback)
            callback(sig || graph);
      },
      /**
       * This function gets a SNAP JSON-LD object and transforms it to a compatible graph for 
       * SigmaJS 1.0.X
       *
       * @param   {object}  JSON-LD object
       * @return  {object}  Sigma.js proprietary formatted object
       *
       */
      "get" : function(jsonld) {
        var tempgraph;

        if (!('@graph' in jsonld))
          throw "File has not a correct JSON-LD structure (Missing @graph key at the root)";

        tempgraph = {
          "nodes" : {},
          "edges" : {}
        }

        jsonld["@graph"].forEach(function(element) {
          // If the object represented by element has a "snap:hasbond", it's a node
          if ("snap:has-bond" in element || "snap:associated-place" in element) {

            //We check that this node does exist, if not, we instantiate it
            tempgraph["nodes"] = snapJS.node(
              tempgraph["nodes"], 
              element["@id"], 
              element,
              element["rdfs:label"]
            );

            // If there is a bond in there
            if("snap:has-bond" in element) {
              // If it is an array of bond
              if(typeof element["snap:has-bond"] === 'array') {
                // We have multiple bond, we loop over it
                element.forEach(function(bond) {

                  tempgraph["edges"] = snapJS.edge(
                    false,
                    tempgraph["edges"], 
                    bond["@id"], 
                    bond, 
                    bond["rdfs:label"]
                  );

                  //Update the source
                  tempgraph["edges"][bond["@id"]]["source"] = element["@id"];

                });
              } else {
                //Create an edge
                tempgraph["edges"] = snapJS.edge(
                  false,
                  tempgraph["edges"], 
                  element["snap:has-bond"]["@id"], 
                  element["snap:has-bond"], 
                  element["snap:has-bond"]["rdfs:label"]
                );

                //Update the source
                tempgraph["edges"][element["snap:has-bond"]["@id"]]["source"] = element["@id"];
              }
              // We set up the source of the edge
            }

            // If there is an associated place in there
            // Associated place does not work as snap:has-bond
            // It contains the link in it, so we create a link-id
            if("snap:associated-place" in element) {

              // If it is an array of bond
              if(typeof element["snap:associated-place"] === 'array') {
                // We have multiple bond, we loop over it
                element.forEach(function(bond) {
                  var bond_name = bond["@id"] + element["@id"]; 
                  tempgraph["edges"] = snapJS.edge(
                    "associated-place",
                    tempgraph["edges"], // Graph dict
                    bond_name, // Name
                    bond,  // RDF Representation
                    bond["rdfs:label"]  // Label (Mostly undefined)
                  );
                  tempgraph["edges"][bond_name]["source"] = element["@id"];
                  tempgraph["edges"][bond_name]["target"] = bond["@id"];
                });
              } else {                
                var bond_name = element["snap:associated-place"]["@id"] + element["@id"];

                tempgraph["edges"] = snapJS.edge(
                  "associated-place",
                  tempgraph["edges"], 
                  bond_name,
                  element["snap:associated-place"], 
                  element["snap:associated-place"]["rdfs:label"]
                );

                tempgraph["edges"][bond_name]["source"] = element["@id"];
                tempgraph["edges"][bond_name]["target"] = element["snap:associated-place"]["@id"];
              }
              // We set up the source of the edge
            }

          // If it is a relationship
          } else if ("snap:bond-with" in element) {
            // We update or create the edge
            tempgraph["edges"] = snapJS.edge(
              element["@type"],
              tempgraph["edges"],
              element["@id"],
              element,
              element["@rdfs:label"]
            )

            // We set up the target of the edge
            tempgraph["edges"][element["@id"]]["target"] = element["snap:bond-with"]["@id"];

            // We check for snap properties and thing like that

            //We check that this node does exist, if not, we instantiate it
            tempgraph["nodes"] = snapJS.node(
              tempgraph["nodes"],
              element["snap:bond-with"]["@id"],
              element["snap:bond-with"],
              element["snap:bond-with"]["@label"]
            )

          //If, instead of a straigth bond, we have an open annotation
          } else {
            //We instantiate the node through our helper
            tempgraph["nodes"] = snapJS.node(
              tempgraph["nodes"], 
              element["@id"], 
              element, 
              element["rdfs:label"]
            );
          }
        });

        return {
          "nodes" : Object.keys(tempgraph["nodes"]).map(function(key){return snapJS.fill_node(tempgraph["nodes"][key])}),
          "edges" : Object.keys(tempgraph["edges"]).map(function(key){return tempgraph["edges"][key]})
        }
      }
    }
  }
});
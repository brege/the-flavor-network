// Define the color palettes
// https://material.io/design/color/the-color-system.html#tools-for-picking-colors

// this is a poor way to do this, but it works for now
const greyColorPalette = [
  '#fafafa',  // Grey 100
  '#f5f5f5',  // Grey 200
  '#eeeeee',  // Grey 300
  '#e0e0e0',  // Grey 400
  '#bdbdbd',  // Grey 500
  '#9e9e9e',  // Grey 600
  '#757575',  // Grey 700
  '#616161',  // Grey 800
  '#424242',  // Grey 900
  '#212121',  // Grey 1000
];
const blueColorPalette = [
  '#E3F2FD',  // Light Blue 100
  '#BBDEFB',  // Light Blue 200
  '#90CAF9',  // Light Blue 300
  '#64B5F6',  // Light Blue 400
  '#42A5F5',  // Light Blue 500
  '#2196F3',  // Light Blue 600
  '#1E88E5',  // Light Blue 700
  '#1976D2',  // Light Blue 800
  '#1565C0',  // Light Blue 900
  '#0D47A1',  // Light Blue 1000
];
const greenColorPalette = [
  '#E8F5E9',  // Light Green 100
  '#C8E6C9',  // Light Green 200
  '#A5D6A7',  // Light Green 300
  '#81C784',  // Light Green 400
  '#66BB6A',  // Light Green 500
  '#4CAF50',  // Light Green 600
  '#43A047',  // Light Green 700
  '#388E3C',  // Light Green 800
  '#2E7D32',  // Light Green 900
  '#1B5E20',  // Light Green 1000
];

// Define the node styles
function generateNodeStyles(colorPalette) {
  return {
    nodes: {
      color: {
        background: colorPalette[3],  // Pallete 400
        border: colorPalette[5],  // Pallete 600  
        highlight: {
          background: colorPalette[3],  // Pallete 400 
          border: colorPalette[5],  // Pallete 600
        },
        hover: {
          background: colorPalette[5],  // Pallete 600
          border: colorPalette[7],  // Pallete 800
        },
      },
      font: {
        color: colorPalette[9],  // Pallete 1000
        size: 24,
        align: 'center',

      },
      shape: 'box',
      shapeProperties: {
        borderRadius: 8,
      },
    },
    edges: {
      color: {
        color: colorPalette[3],  // Pallete 600
        highlight: colorPalette[3],  // Pallete 600
        hover: colorPalette[3],  // Pallete 600
      },
      width: 1,
    },
  };
};

const nodeStylesOrigin = generateNodeStyles(blueColorPalette);
const nodeStylesPrime = generateNodeStyles(greyColorPalette);
const nodeStylesHover = generateNodeStyles(greenColorPalette);

// Define the network options
const options = {
  interaction: {
    hover: true,
    hoverConnectedEdges: true,
  },
  autoResize: true,
  height: '100%',
  width: '100%',
  clickToUse: true,
  physics: {
    enabled: true,
    barnesHut: {
      gravitationalConstant: -3000,
      centralGravity: 0.3,
      springLength: 95,
      springConstant: 0.04,
      damping: 0.09,
      avoidOverlap: 0,
    },
    stabilization: {
      enabled: true,
      iterations: 1000,
      updateInterval: 25,
      onlyDynamicEdges: false,
      fit: true,
    },
    timestep: 0.5,
    adaptiveTimestep: true,
  },

};

// To update the text emphasis of network options
function updateOptionAppearance(containerId, baseClass, enabled) {
  const classToAdd = enabled ? `${baseClass}-enabled` : `${baseClass}-disabled`;
  const classToRemove = enabled ? `${baseClass}-disabled` : `${baseClass}-enabled`;
  document.getElementById(containerId).classList.add(classToAdd);
  document.getElementById(containerId).classList.remove(classToRemove);
}
// Controls for the network (bottom right corner of network graph)
document.getElementById('click-to-use').addEventListener('change', function() {
  if (this.checked) {
    options.clickToUse = true;
  } else {
    options.clickToUse = false;
  }
  network.setOptions(options);
  updateOptionAppearance('scroll-toggle', 'click-to-use', options.clickToUse);
});

/* Goals:
  * 1. The users specifies a node or a list of nodes (selectedResults)
  * 2. The nodes are displayed on the network graph
  * 3. From those nodes, we find the nodes that are most similar to them
  * 4. The most similar nodes are displayed on the network graph
  * 
  * We do not display nodes that are not similar to the selected nodes
  * or nodes that are not selected
  * 
  * Just for reference, similarities looks like this:
  *  { node1: { node2: 0.5, node3: 0.3, ... }, 
  *    node2: { node1: 0.5, node3: 0.2, ... }, ... }
  */

// Create a new network graph
const container = document.getElementById('network');
const network = new vis.Network(container, {}, options);
const nodesPath = $("#network").data("nodes-path");
const edgesPath = $("#network").data("edges-path");
const simPath = $("#network").data("sim-path");

let nodes = [];
let edges = [];
let similarities = {};

// get the nodes and edges from the json file
async function getNodesAndEdges() {
  const nodes = await $.getJSON(nodesPath);
  const edges = await $.getJSON(edgesPath);
  return { nodes, edges };
}
// get the similarities from the json file
async function getSimilarities() {
  const similarities = await $.getJSON(simPath);
  //console.log('similarities', similarities);
  return similarities;
}
// synchronize the network graph and ranking
getNodesAndEdges().then(function (data) {
  nodes = data.nodes;
  edges = data.edges;
  //console.log('nodes', nodes);
  //console.log('edges', edges);
  // get the similarities from the server
  getSimilarities().then(function (data) {
    similarities = data;
    // Initialize with default ingredients
    handleResultClick('basil');
    handleResultClick('vanilla');
    handleResultClick('lemon');
    // Trigger recipe API with default ingredients
    if (typeof recipeApiTrigger === 'function') {
      setTimeout(() => recipeApiTrigger(['basil', 'vanilla', 'lemon']), 100);
    }
  });
});

/* update the click-to-use option
   (weird naming, but it solves the scroll wheel/finger
    grabbing the graph and zooming, instead of scrolling/
    gesture-ing down the page) */
updateOptionAppearance('click-to-use', 'click-to-use', options.clickToUse);

// When the user selects a result, update the network graph
document.addEventListener('selectedResultsChanged', function (e) {
  const selectedResults = e.detail;
  filterNodesAndEdges(selectedResults);
});

// When the user clicks a node, update the ranking
network.on('click', function (params) {
  if (params.nodes.length > 0) {
    const nodeId = params.nodes[0];
    handleResultClick(nodeId);
  }
});

// When the user picks a different algorithm, update the network graph
const algorithmSelect = document.getElementById('lenses');
algorithmSelect.addEventListener('change', function (e) {
  filterNodesAndEdges(selectedResults); 
});

// When the physics is freakin' out, turn it off 
network.on('stabilizationProgress', function(params) {
  const { iterations, total } = params;
  if (iterations > 0.9 * total) {
    network.setOptions({ physics: { enabled: false } });
    document.getElementById('physics').checked = false;
    updateOptionAppearance('physics-toggle', 'physics', false);
  }
});

/** filter the nodes and edges based on the selected results **/

function filterNodesAndEdges(selectedResults) {
  console.log('selectedResults', selectedResults);

  // to generate the recipe link:
  getRecipeLink(selectedResults);

  /** display algorithm **/ //shitty

  // rule for n, the number of similar nodes to return
  let n = 0;
  if (selectedResults.length === 1) {
    n = 13;
  } else if (selectedResults.length > 1 && selectedResults.length < 6) {
    n = 7;
  } else if (selectedResults.length >= 6) {
    n = 5;
  }  // should be made mathematical

  /** functionality **/

  // get the nodes that are similar to the selected nodes
  // from using the algorithmChoice
  const similarNodes = algorithmChoice(selectedResults, n);
  //console.log('similarNodes', similarNodes);

  // filter the nodes and edges based on the selected results
  const filteredNodes = nodes.filter(function (node) {
    return similarNodes.map(function (item) {
      return item[0];
    }).includes(node.id) || selectedResults.includes(node.id);
  });

  const filteredEdges = edges.filter(function (edge) {
    return similarNodes.map(function (item) {
      return item[0];
    }).includes(edge.from) && similarNodes.map(function (item) {
      return item[0];
    }).includes(edge.to) && similarNodes.map(function (item) {
      return item[0];
    }).includes(edge.from) || selectedResults.includes(edge.from) && selectedResults.includes(edge.to);
  });

  console.log('filteredNodes', filteredNodes);
  console.log('filteredEdges', filteredEdges);

  /** display **/  

  // set the nodes and edges on the network graph
  network.setOptions(nodeStylesPrime);
  network.setData({ nodes: filteredNodes, edges: filteredEdges });

  /** cosmetics **/

  // set the font size of the selected nodes to the origin size
  selectedResults.forEach(function (nodeId) {
    network.body.data.nodes.update({
      id: nodeId,
      font: { size: nodeStylesOrigin.nodes.font.size },
      level: 0,
    });
  });

  // get the top similarity from the similar nodes
  const topSimilarity = similarNodes.reduce(function (acc, node) {
    return node[1] > acc && node[1] < 1 ? node[1] : acc;
  }, 0);

  // set the font size of the similar nodes to a size 
  // relative to the top similarity
  similarNodes.forEach(function (node) {
    const fontSize = node[1] === 1 ? 1.*nodeStylesOrigin.nodes.font.size : 1.*nodeStylesOrigin.nodes.font.size * (node[1] / topSimilarity); 
    network.body.data.nodes.update({
      id: node[0],
      font: { size: fontSize },
      level: 1,
    });
  });

  // for any node that is not a selectedNode,
  // change the color of the node to the origin color
  selectedResults.forEach(function (nodeId) {
    network.body.data.nodes.update({
      id: nodeId,
      color: nodeStylesOrigin.nodes.color,
      font: { size: 1.1*nodeStylesOrigin.nodes.font.size },
      level: 0,
    });
  });

  // for any edge that is not connected to a selectedNode,
  // change the color of the edge to the origin color
  filteredEdges.forEach(function (edge) {
    if (selectedResults.includes(edge.from) && !selectedResults.includes(edge.to)) {
      network.body.data.edges.update({ 
        id: edge.id, 
        color: nodeStylesOrigin.edges.color, 
        width: 3*nodeStylesOrigin.edges.width,
        level: 0,
      });
    }
    if (!selectedResults.includes(edge.from) && selectedResults.includes(edge.to)) {
      network.body.data.edges.update({
        id: edge.id,
        color: nodeStylesOrigin.edges.color,
        width: 3*nodeStylesOrigin.edges.width,
        level: 0,
      });
    }
  });

  // change the physics options based on physics toggle
  document.getElementById('physics').addEventListener('change', function(e) {
    const physics = e.target.checked;
    network.setOptions({ physics: { enabled: physics } });
    updateOptionAppearance('physics-toggle', 'physics', physics);
  });

}

/** A. show the nodes with the largest edge weights **/
function getNodesByEdgeWeight(selectedNodes, n=7) {
  // get the top n nodes with the largest edge weights
  // don't use similarities, use the edge weights
  const topEdges = selectedNodes.map(function (node) {
    const nodeEdges = edges.filter(function (edge) {
      return edge.from === node || edge.to === node;
    });
    const sortedEdges = nodeEdges.sort(function (a, b) {
      return b.weight - a.weight;
    });
    return sortedEdges.slice(0, n);
  }).flat();

  // get the nodes that are connected to the top edges
  const topNodes = topEdges.map(function (edge) {
    return [edge.from, edge.to];
  }).flat();

  // get the average similarity of the similar nodes
  const uniqueNodes = [...new Set(topNodes)];
  //const similarNodes = getAverageSimilarity(selectedNodes, uniqueNodes);
  const similarNodes = uniqueNodes.map(function (node) {
    return [node, 1]; 
    // TODO: change this to the average similarity,
    // this doesn't work right now because the data is 
    // asymmetric
  });

  // sort the similar nodes by their average similarity
  const sortedSimilarNodes = similarNodes.sort(function (a, b) {
    return b[1] - a[1];
  });

  // return the top n similar nodes
  return sortedSimilarNodes

}

/** B. get the nodes that have high ingredient similarities
 *  to the selected nodes **/
function getNodesBySimilarity(selectedNodes, n=7) {
  const similarNodes = selectedNodes.map(function (node) {
    const nodeSimilarities = similarities[node];
    if (!nodeSimilarities) {
      return [];
    } else {
      const sortedSimilarities = Object.entries(nodeSimilarities).sort(function (a, b) {
        return b[1] - a[1];
      }); // computational complexity of O(nlogn)
      //console.log('sortedSimilarities', sortedSimilarities);

      /**  diversity algorithm  **/
      const topSimilarNodes = sortedSimilarities.slice(0, n); 

      return topSimilarNodes;
    }

  }); // computational complexity of O(n^2)
  //console.log('similarNodes', similarNodes);

  const flattenedSimilarNodes = similarNodes.flat();
  const uniqueSimilarNodes = [...new Set(flattenedSimilarNodes)];
  //console.log('uniqueSimilarNodes', uniqueSimilarNodes);
  return uniqueSimilarNodes;
}

/** C. hybrid model, split the difference between the two **/
// TODO: implement this

// the user can choose which of A, B, or C to use
// by checking the appropriate radio button, so we'll 
// need to implement this function
function getHybridNodes(selectedNodes, n=7) {
  const similarNodes = getNodesBySimilarity(selectedNodes, n);
  const edgeNodes = getNodesByEdgeWeight(selectedNodes, n);
  const hybridNodes = similarNodes.concat(edgeNodes);
  return hybridNodes;
}

// the function that handles the user's choice of which
// algorithm to use
function algorithmChoice(selectedNodes, n=7) {
  const algorithm = document.getElementById('lenses').value;
  console.log('algorithm:', algorithm);
  if (algorithm === 'hybrid') {
    return getHybridNodes(selectedNodes, n/Math.sqrt(2));
  } else if (algorithm === 'similarity') {
    return getNodesBySimilarity(selectedNodes, n);
  } else if (algorithm === 'affinity') {
    return getNodesByEdgeWeight(selectedNodes, n);
  }
}


// add a link to search food network, and also
// display the selected results for copy/paste
function getRecipeLink(selectedResults) {
  // recipe list: display the selected results for copy/paste
  const recipeList = document.getElementById('recipe-list');
  // recipe link: link to search food network, e.g.
  const recipeLink = document.getElementById('recipe-link');
  const fnlink = 'https://www.foodnetwork.com/search/' + selectedResults.join('-,') + '-';
  const fhtip = 'Food Network recipes for ' + selectedResults.join(', ');
  const allrecipeslink = 'https://www.allrecipes.com/search?q=' + selectedResults.join('+'); 
  const allrecipestip = 'All Recipes with ' + selectedResults.join(', ');
  const googlelink = 'https://www.google.com/search?q=' + selectedResults.join('+') + '+recipes';
  const googletip = 'Google recipes with ' + selectedResults.join(', ');
  const cocktaillink = 'https://www.thecocktailproject.com/search/?search_api_fulltext=' + selectedResults.join('+');
  const cocktailtip = 'Cocktail Project recipes for ' + selectedResults.join(', ');
  if (selectedResults.length === 0) {
    recipeLink.innerHTML = '';
  } else {
    recipeLink.innerHTML = "recipes: "
      + ' <a href="' + fnlink + '" target="_blank" title="' + fhtip + '" >food network</a>'
      + ' · <a href="' + allrecipeslink + '" target="_blank" title="' + allrecipestip + '">allrecipes</a>'
      + ' · <a href="' + googlelink + '" target="_blank" title="' + googletip + '">google</a>'
      + ' · <a href="' + cocktaillink + '" target="_blank" title="' + cocktailtip + '">cocktails</a>'
      ;//+ '<span style="float: right;">' + selectedResults.join(' + ') + '</span>' ; 
      //TODO: add a copy to clipboard button
  }
} 

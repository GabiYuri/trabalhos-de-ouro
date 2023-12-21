// ====================================================
// =============== RANDOM TRAINGULATION ===============
// ====================================================

/**
 * @brief 					Given all points of the mesh, create a random triangulation
 * @param nodes             Array of nodes [ x, y, z ], but only 2D triagulation
 * @param canvas            Selected canvas
 * @returns                 Mesh structure as doubly-connected edge list
 */
function random_triangulation(nodes) {
	var mesh = create_mesh_nodes(nodes);
	var convexVertex = findConvex(mesh);
	var points2Triagulate = create_big_triangles(mesh, convexVertex);

	for (point of points2Triagulate) {
		create_new_triangle(point, mesh);
	}

    //size_adapt(canvas, mesh.nodes, offset=0, margin=0.1);
    //draw_mesh(mesh, canvas);

	return mesh;
}


/**
 * @brief                   Create a mesh structure as doubly-connected edge list
 * @param nodeData          Array of nodes [ x, y, z ], but only 2D triagulation
 * @returns 
 */
function create_mesh_nodes(nodeData) {
	// Initialize data structure of a doubly-connected edge list
	var mesh = {
			nodes: [],
			faces: [],
			edges: []
		};

	// Mesh data from json file
	var node_data = nodeData;			// nodes - Coordinates, Indices

	// Create nodes
	for (let i = 0; i < node_data.length; i++){
		// node structure
		var node = {
				id: i,
				pos: node_data[i]
			};
		// add node to mesh.nodes array
		mesh.nodes.push(node);
	}
	return mesh;
}


/**
 * @brief 					Triangulate the convex hull with one point inside
 * @param mesh 				mesh structure as doubly-connected edge list
 * @param convexVertex 		array of vertices of the convex hull
 * @returns 				array of points to triangulate
 */
function create_big_triangles(mesh, convexVertex) {

	// get the max and min x and y values of the convex hull
	let xMin = Number.MAX_VALUE;
	let yMin = Number.MAX_VALUE;
	let xMax = Number.MIN_VALUE;
	let yMax = Number.MIN_VALUE;
	for (node of convexVertex) {
		xMin = Math.min(xMin, node.pos[0]);
		yMin = Math.min(yMin, node.pos[1]);
		xMax = Math.max(xMax, node.pos[0]);
		yMax = Math.max(yMax, node.pos[1]);
	}

	// get the middle point of the convex hull to start triangulation
	const middleConvex = [(xMin + xMax)/2, (yMin + yMax)/2];
	
	var missingNodes = mesh.nodes.filter(element => !convexVertex.includes(element));
	missingNodes.sort(function(a, b) {return distance(middleConvex, a.pos) - distance(middleConvex, b.pos)});
	var node = missingNodes[0];

	var nodePairToEdge = {};
	for (let i = 0; i < convexVertex.length; i++) {
		// create edges of convex hull
		var face = {
				id: i,
				incidentEdge: null
			};
		mesh.faces.push(face);

		var face_nodes = [convexVertex[i], convexVertex[(i+1)%convexVertex.length], node];
		var face_edges = [];
		for (let j = 0; j < face_nodes.length; j++){
			var edge = {
					orig: face_nodes[j],
					dest: face_nodes[(j+1)%3],
					incidentFace: face,
					next: null,
					oppo: null
				};
			face_edges.push(edge);

			// Determine the connectivity of the half-edges
			if ([edge.dest.id, edge.orig.id] in nodePairToEdge) {
				edge.oppo = nodePairToEdge[[edge.dest.id, edge.orig.id]];
				nodePairToEdge[[edge.dest.id, edge.orig.id]].oppo = edge;
			} else nodePairToEdge[[edge.orig.id, edge.dest.id]] = edge;
		}

		// define incidentEdge
		face.incidentEdge = face_edges[0];

		// define edge.next
		for (let j = 0; j < face_nodes.length; j++){
			face_edges[j].next = face_edges[(j+1)%3];
		}
	}

	for (edgeName in nodePairToEdge) {
		if (nodePairToEdge.hasOwnProperty(edgeName)) {
		  let edge = nodePairToEdge[edgeName];
		  mesh.edges.push(edge);
		}
	}

	missingNodes.splice(0, 1);
	return missingNodes;

}


/**
 * @brief               Find the triangle that contains the point and return 3 triangles
 * @param point         Desired new vertex
 * @param mesh          Mesh structure as doubly-connected edge list
 * @param canvas        Selected canvas
 */
function create_new_triangle(point, mesh, canvas) {
	
	var inTriangle = point_location(point, mesh);

	// create new triangles
	var new_tri1 = {
			id: mesh.faces.length,
			incidentEdge: inTriangle.incidentEdge.next
		};
	inTriangle.incidentEdge.next.incidentFace = new_tri1;

	var new_tri2 = {
			id: mesh.faces.length + 1,
			incidentEdge: inTriangle.incidentEdge.next.next
		};
	inTriangle.incidentEdge.next.next.incidentFace = new_tri2;

	mesh.faces.push(new_tri1);
	mesh.faces.push(new_tri2);

	var triangles = [inTriangle, new_tri1, new_tri2];

	var nodePairToEdge = {};
	for (tri of triangles) {
		var e0 = tri.incidentEdge;
		var e1 = {
				orig: e0.dest,
				dest: point,
				incidentFace: tri,
				next: null,
				oppo: null
			};
		var e2 = {
				orig: point,
				dest: e0.orig,
				incidentFace: tri,
				next: e0,
				oppo: null
			};

		e1.next = e2;
		e0.next = e1;

		// Determine the connectivity of the half-edges
		if ([e1.dest.id, e1.orig.id] in nodePairToEdge) {
			e1.oppo = nodePairToEdge[[e1.dest.id, e1.orig.id]];
			nodePairToEdge[[e1.dest.id, e1.orig.id]].oppo = e1;
		} else nodePairToEdge[[e1.orig.id, e1.dest.id]] = e1;

		if ([e2.dest.id, e2.orig.id] in nodePairToEdge) {
			e2.oppo = nodePairToEdge[[e2.dest.id, e2.orig.id]];
			nodePairToEdge[[e2.dest.id, e2.orig.id]].oppo = e2;
		} else nodePairToEdge[[e2.orig.id, e2.dest.id]] = e2;
	}

	for (edgeName in nodePairToEdge) {
		if (nodePairToEdge.hasOwnProperty(edgeName)) {
		  let edge = nodePairToEdge[edgeName];
		  mesh.edges.push(edge);
		}
	}	

	return mesh;
}



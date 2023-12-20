function bowyer_triangulation(nodes, canvas) {
    var mesh = create_mesh_nodes(nodes);
    var nodes2tri = mesh.nodes;
    mesh = super_triangle(mesh);

    for (node of nodes2tri) {
        add_vertex(mesh, node);
    }

    var border = remove_super_triangle(mesh);

    var convex_vertex = findConvex(mesh);
    insert_convex(mesh, convex_vertex, border);
    
    draw_mesh(mesh, canvas);

    return mesh;
}

function super_triangle(mesh) {
	// get midpoint of the mesh
	const [x, y] = midpoint(mesh);

	// get the size of the diagonal of the bounding box
	const diagonal = bounding_box(mesh);

	const new_diagonal = diagonal * 5;

	// get a point at 0, 90, 225 degrees of the circle
	const A = [x + new_diagonal, y];
	const B = [x, y + new_diagonal];
	const C = [x - new_diagonal/Math.sqrt(2), y - new_diagonal/Math.sqrt(2)];

    var face_nodes = [A, B, C];
    // create nodes for the super triangle
    for (let i = 0; i < face_nodes.length; i++) {
        var node = {
                id: mesh.nodes.length,
                pos: face_nodes[i]
            };
        mesh.nodes.push(node);
    }

    var face_nodes = [mesh.nodes[mesh.nodes.length-3], mesh.nodes[mesh.nodes.length-2], mesh.nodes[mesh.nodes.length-1]];

    // create the face for the super triangle
    var face = {
            id: mesh.faces.length,
            incidentEdge: null
        };

    mesh.faces.push(face);

    // create the edges for the super triangle
    var face_edges = [];
    for (let i = 0; i < face_nodes.length; i++) {
        var edge = {
                orig: face_nodes[(i + 1) % face_nodes.length],
                dest: face_nodes[i],
                incidentFace: face,
                next: null,
                oppo: null
            };
        face_edges.push(edge);
    }

    
    for (let i = 0; i < face_nodes.length; i++){
        face_edges[(i+1)%3].next = face_edges[i];
        mesh.edges.push(face_edges[i]);
    }

    face.incidentEdge = face_edges[0];

    return mesh;
}

// Create a function to get the bounding box of the mesh
function bounding_box(mesh) {
	// get the extreme points of the mesh
	let [xMin, yMin, xMax, yMax] = extreme_points(mesh);

	// get the size of the diagonal of the bounding box
	const diagonal = Math.sqrt((xMax - xMin)**2 + (yMax - yMin)**2);
	return diagonal;
}

// Get the coordinates of the midpoint of the bounding box 
function midpoint(mesh) {
	// get the extreme points of the mesh
	let [xMin, yMin, xMax, yMax] = extreme_points(mesh);

	// get the coordinates of the midpoint
	const x = (xMin + xMax)/2;
	const y = (yMin + yMax)/2;

	return [x, y];
}

// Create a function to get the extreme points of the mesh
function extreme_points(mesh) {
	let xMin = Number.MAX_VALUE;
	let yMin = Number.MAX_VALUE;
	let xMax = Number.MIN_VALUE;
	let yMax = Number.MIN_VALUE;

	for (node of mesh.nodes) {
		xMax = Math.max(xMax, node.pos[0]);
		xMin = Math.min(xMin, node.pos[0]);
		yMax = Math.max(yMax, node.pos[1]);
		yMin = Math.min(yMin, node.pos[1]);
	}

	return [xMin, yMin, xMax, yMax];
}

// Create a function that, for three points, returns the circumcenter and the circumradius
function circumcenter(A, B, C) {
	// check if the points are collinear
	if (get_orientation(A, B, C) == 0) return null;
	
	// get the coordinates of the circumcenter
	const x = ((A[0]**2 + A[1]**2)*(B[1] - C[1]) + (B[0]**2 + B[1]**2)*(C[1] - A[1]) + (C[0]**2 + C[1]**2)*(A[1] - B[1])) / (2*(A[0]*(B[1] - C[1]) - A[1]*(B[0] - C[0]) + B[0]*C[1] - B[1]*C[0]));
	const y = ((A[0]**2 + A[1]**2)*(C[0] - B[0]) + (B[0]**2 + B[1]**2)*(A[0] - C[0]) + (C[0]**2 + C[1]**2)*(B[0] - A[0])) / (2*(A[0]*(B[1] - C[1]) - A[1]*(B[0] - C[0]) + B[0]*C[1] - B[1]*C[0]));


	// get the circumradius
	const r = Math.sqrt((x - A[0])**2 + (y - A[1])**2);
	return [x, y, r];
}


function inCircle(triangle, vertex) {
    let nodes = [triangle.incidentEdge.orig, triangle.incidentEdge.dest, triangle.incidentEdge.next.dest];
    let circle = circumcenter(nodes[0].pos, nodes[1].pos, nodes[2].pos);

    if (circle == null) return false;
    let dx = circle[0] - vertex.pos[0];
    let dy = circle[1] - vertex.pos[1];
    return Math.sqrt(dx * dx + dy * dy) <= circle[2];
}

function add_vertex(mesh, vertex) {

    var edges = [];
    var faces = [];

    for (triangle of mesh.faces) {
        if (inCircle(triangle, vertex)) {
            edges.push(triangle.incidentEdge);
            edges.push(triangle.incidentEdge.next);
            edges.push(triangle.incidentEdge.next.next);
            faces.push(triangle);
        }
    }

    edges = find_unique_values(edges);

    // delete all triangles that contains vertex from the mesh
    for (triangle of faces) {
        triangle.incidentEdge.incidentFace = null;
        triangle.incidentEdge.next.incidentFace = null;
        triangle.incidentEdge.next.next.incidentFace = null;

        triangle.incidentEdge.next.next.next = null;
        triangle.incidentEdge.next.next = null;
        triangle.incidentEdge.next = null;

        mesh.faces = mesh.faces.filter(item => item !== triangle);
    }

    for (face of mesh.faces) {
        face.id = mesh.faces.indexOf(face);
    }

    // delete all repeated edges from the mesh
    for (edge of edges[1]) {
        mesh.edges = mesh.edges.filter(item => item !== edge);
    }

    mesh = polygon_triangles(mesh, edges[0], vertex);
    return mesh;
}

function find_unique_values(arr) {
    let uniqueValues = [];
    let repetedValues = [];

    for (value of arr) {
        if (!arr.includes(value.oppo)) {
            uniqueValues.push(value);
        }
        else {
            repetedValues.push(value);
        }
    }

    return [uniqueValues, repetedValues];
}

/**
 * @brief 					Triangulate the convex hull with one point inside
 * @param mesh 				mesh structure as doubly-connected edge list
 * @param convexVertex 		array of vertices of the convex hull
 * @returns 				array of points to triangulate
 */
function polygon_triangles(mesh, edges, vertex) {
    
	var nodePairToEdge = {};
    for (e0 of edges) {
        var face = {
                id: mesh.faces.length,
                incidentEdge: e0
            };
        mesh.faces.push(face);
        e0.incidentFace = face;

        var e2 = {
                orig: vertex,
                dest: e0.orig,
                incidentFace: face,
                next: e0,
                oppo: null
            };

        var e1 = {
                orig: e0.dest,
                dest: vertex,
                incidentFace: face,
                next: e2,
                oppo: null
            };

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

    return mesh
}

function remove_super_triangle(mesh) {
    vertex = [mesh.nodes[mesh.nodes.length-3], mesh.nodes[mesh.nodes.length-2], mesh.nodes[mesh.nodes.length-1]];

    // get edges and faces that are connected to the super triangle
    faces = [];
    edges = [];
    for (edge of mesh.edges) {
        if (edge.orig == vertex[0] || edge.orig == vertex[1] || edge.orig == vertex[2] || edge.dest == vertex[0] || edge.dest == vertex[1] || edge.dest == vertex[2]) {

            if (!faces.includes(edge.incidentFace)) faces.push(edge.incidentFace);
            if (edge.oppo != null && !faces.includes(edge.oppo.incidentFace)) {
                faces.push(edge.oppo.incidentFace);
            }

            edges.push(edge);
        }
    }

    // delete connected faces from mesh
    for (face of faces) {
        mesh.faces = mesh.faces.filter(item => item !== face);
    }

    // delete connected edges from mesh
    for (edge of edges) {
        mesh.edges = mesh.edges.filter(item => item !== edge);
    }

    // delete connected nodes from mesh
    mesh.nodes.splice(mesh.nodes.length-3, 3);

    border = [];
    for (edge of mesh.edges) {
        
        // edge na borda virada para fora        
        if (!mesh.edges.includes(edge.next) && !mesh.edges.includes(edge.next.oppo)) {
            border.push(edge);

            let orig = edge.oppo.orig;
            let dest = edge.oppo.dest;
            let face = edge.oppo.incidentFace;
            let next = edge.oppo.next;

            edge.orig = orig;
            edge.dest = dest;
            edge.incidentFace = face;
            edge.next = next;
            edge.oppo = null;
        }
        
    }
    return border;
}

function insert_convex (mesh, convex, border) {

    for (let i = 0; i < convex.length; i++) {

        // look if there is a border edge that matches the new edge
        let exist = false;
        for (let j = 0; j < border.length; j++) {
            if (convex[(i+1)%convex.length] == border[j].orig && convex[i] == border[j].dest) {
                exist = true;
            }
        }

        if (!exist) {
            var edge = {
                    orig: convex[(i+1)%convex.length],
                    dest: convex[i],
                    incidentFace: null,
                    next: null,
                    oppo: null
                };

            var face = {
                    id: mesh.faces.length,
                    incidentEdge: edge
                };

            edge.incidentFace = face;
            mesh.faces.push(face);

            // look for edge that orig equals to edge.orig
            for (let j = 0; j < border.length; j++) {
                if (border[j].orig == edge.orig) {
                    var e1 = {
                            orig: border[j].dest,
                            dest: edge.orig,
                            incidentFace: face,
                            next: edge,
                            oppo: border[j]
                        };
                    border[j].oppo = e1;
                }

                if (border[j].dest == edge.dest) {
                    var e2 = {
                            orig: edge.dest,
                            dest: border[j].orig,
                            incidentFace: face,
                            next: null,
                            oppo: border[j]
                        };
                    border[j].oppo = e2;
                }
            }

            edge.next = e2;
            e2.next = e1;

            mesh.edges.push(edge);
        }
    }
}
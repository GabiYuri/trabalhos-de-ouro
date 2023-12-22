// ====================================================
// =============== BOWYER TRIANGULATION ===============
// ====================================================

// IMPORT SECTION =====================================
import {create_mesh_nodes} from './randomTriangulation.js';
import {draw_mesh} from './drawElement.js';
import {get_orientation, findConvex, drawConvex} from './convexHull.js';
import { incircle } from '../node_modules/robust-predicates/index.js';


/**
 * @brief 			Perform Bowyer-Watson triangulation
 * @param nodes     Array of nodes
 * @param canvas    Selected canvas
 * @returns         Mesh structure as doubly-connected edge list
 */
function bowyer_triangulation(nodes,canvas) {
    var mesh = create_mesh_nodes(nodes);
    var nodes2tri = mesh.nodes;
    mesh = super_triangle(mesh);

    for (let node of nodes2tri) {
        add_vertex(mesh, node);
    }
    
    var border = remove_super_triangle(mesh);
    var convex_vertex = findConvex(mesh);
    
    insert_convex(mesh, convex_vertex, border);
    
    //draw_mesh(mesh, canvas);

    return mesh;
}


/**
 * @brief 			Create the super triangle around the nodes
 * @param mesh      Mesh structure as doubly-connected edge list
 * @returns         Mesh structure as doubly-connected edge list
 */
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

/**
 * @brief           Get the size of the diagonal of the bounding box
 * @param mesh      Mesh structure as doubly-connected edge list 
 * @returns 
 */
function bounding_box(mesh) {
	// get the extreme points of the mesh
	let [xMin, yMin, xMax, yMax] = extreme_points(mesh);

	// get the size of the diagonal of the bounding box
	const diagonal = Math.sqrt((xMax - xMin)**2 + (yMax - yMin)**2);
	return diagonal;
}


/**
 * @brief               Get the coordinates of the midpoint of the bounding box
 * @param mesh          Mesh structure as doubly-connected edge list
 * @returns             Coordinates of the midpoint
 */ 
function midpoint(mesh) {
	// get the extreme points of the mesh
	let [xMin, yMin, xMax, yMax] = extreme_points(mesh);

	// get the coordinates of the midpoint
	const x = (xMin + xMax)/2;
	const y = (yMin + yMax)/2;

	return [x, y];
}


/**
 * @brief           Get the extreme points of the mesh
 * @param mesh      Mesh structure as doubly-connected edge list
 * @returns         Extreme points of the mesh
 */
function extreme_points(mesh) {
	let xMin = Number.MAX_VALUE;
	let yMin = Number.MAX_VALUE;
	let xMax = Number.MIN_VALUE;
	let yMax = Number.MIN_VALUE;

	for (let node of mesh.nodes) {
		xMax = Math.max(xMax, node.pos[0]);
		xMin = Math.min(xMin, node.pos[0]);
		yMax = Math.max(yMax, node.pos[1]);
		yMin = Math.min(yMin, node.pos[1]);
	}

	return [xMin, yMin, xMax, yMax];
}


// Create a function that, for three points, returns the circumcenter and the circumradius
/**
 * @brief           Get the circumcenter and the circumradius of the triangle
 * @param A         Coordinates of the first point
 * @param B         Coordinates of the second point
 * @param C         Coordinates of the third point
 * @returns         Coordinates of the circumcenter and the circumradius
 */
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


/**
 * @brief           Add a vertex to the mesh
 * @param mesh      Mesh structure as doubly-connected edge list 
 * @param vertex    Vertex to be added
 * @returns         Mesh structure as doubly-connected edge list
 */
function add_vertex(mesh, vertex) {

    var edges = [];
    var faces = [];

    for (let triangle of mesh.faces) {
        let tri_nodes = [triangle.incidentEdge.orig.pos, triangle.incidentEdge.dest.pos, triangle.incidentEdge.next.dest.pos];
        if (incircle(tri_nodes[0][0], tri_nodes[0][1], tri_nodes[1][0], tri_nodes[1][1], tri_nodes[2][0], tri_nodes[2][1], vertex.pos[0], vertex.pos[1]) < 0) {
            // vertex is inside the circumcircle of the triangle
            edges.push(triangle.incidentEdge);
            edges.push(triangle.incidentEdge.next);
            edges.push(triangle.incidentEdge.next.next);
            faces.push(triangle);
        }
    }

    edges = find_unique_values(edges);

    // delete all triangles that contains vertex from the mesh
    for (let triangle of faces) {
        triangle.incidentEdge.incidentFace = null;
        triangle.incidentEdge.next.incidentFace = null;
        triangle.incidentEdge.next.next.incidentFace = null;

        triangle.incidentEdge.next.next.next = null;
        triangle.incidentEdge.next.next = null;
        triangle.incidentEdge.next = null;

        mesh.faces = mesh.faces.filter(item => item !== triangle);
    }

    for (let face of mesh.faces) {
        face.id = mesh.faces.indexOf(face);
    }

    // delete all repeated edges from the mesh
    for (let edge of edges[1]) {
        mesh.edges = mesh.edges.filter(item => item !== edge);
    }

    mesh = polygon_triangles(mesh, edges[0], vertex);
    return mesh;
}


/**
 * @brief           Find the unique values of an array
 * @param arr       Array to be analyzed 
 * @returns         Array of unique values and array of repeated values
 */
function find_unique_values(arr) {
    let uniqueValues = [];
    let repetedValues = [];

    for (let value of arr) {
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
 * @brief           Create the triangles of the polygon
 * @param mesh      Mesh structure as doubly-connected edge list 
 * @param edges     Edges of the polygon 
 * @param vertex    Vertex to be added
 * @returns 
 */
function polygon_triangles(mesh, edges, vertex) {
    
	var nodePairToEdge = {};
    for (let e0 of edges) {
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

    for (let edgeName in nodePairToEdge) {
		if (nodePairToEdge.hasOwnProperty(edgeName)) {
		  let edge = nodePairToEdge[edgeName];
		  mesh.edges.push(edge);
		}
	}

    return mesh
}


/**
 * @brief           Remove the super triangle from the mesh
 * @param mesh      Mesh structure as doubly-connected edge list
 * @returns         Array of edges that are on the border of the mesh
 */
function remove_super_triangle(mesh) {
    var vertex = [mesh.nodes[mesh.nodes.length-3], mesh.nodes[mesh.nodes.length-2], mesh.nodes[mesh.nodes.length-1]];

    // get edges and faces that are connected to the super triangle
    var faces = [];
    var edges = [];
    for (let edge of mesh.edges) {
        if (edge.orig == vertex[0] || edge.orig == vertex[1] || edge.orig == vertex[2] || edge.dest == vertex[0] || edge.dest == vertex[1] || edge.dest == vertex[2]) {

            if (!faces.includes(edge.incidentFace)) faces.push(edge.incidentFace);
            if (edge.oppo != null && !faces.includes(edge.oppo.incidentFace)) {
                faces.push(edge.oppo.incidentFace);
            }

            edges.push(edge);
        }
    }

    // delete connected faces from mesh
    for (let face of faces) {
        mesh.faces = mesh.faces.filter(item => item !== face);
        face.incidentEdge.incidentFace = null;
        face.incidentEdge.next.incidentFace = null;
        face.incidentEdge.next.next.incidentFace = null;
    }

    for (let face of mesh.faces) {
        face.id = mesh.faces.indexOf(face);
    }

    // delete connected edges from mesh
    for (let edge of edges) {
        mesh.edges = mesh.edges.filter(item => item !== edge);
        mesh.edges = mesh.edges.filter(item => item !== edge.oppo);
    }

    // delete connected nodes from mesh
    mesh.nodes.splice(mesh.nodes.length-3, 3);

    var border = [];
    for (let edge of mesh.edges) {
        
        // edge na borda virada para fora        
        if (!mesh.edges.includes(edge.next) && !mesh.edges.includes(edge.next.oppo)) {

            let origedge = edge.orig;
            let destedge = edge.dest;
            let opnext = edge.oppo.next;
            let opnextnext = edge.oppo.next.next;
            let opface = edge.oppo.incidentFace;

            edge.orig = destedge;
            edge.dest = origedge;
            edge.next = opnext;
            edge.next.next = opnextnext;
            edge.next.next.next = edge;
            edge.oppo = null;
            edge.incidentFace = opface;
            

            border.push(edge);
        }
        else if (!mesh.edges.includes(edge.oppo.next) && !mesh.edges.includes(edge.oppo.next.oppo)){
            //console.log(edge);

            let origedge = edge.orig;
            let destedge = edge.dest;
            let next = edge.next;
            let nextnext = edge.next.next;
            let face = edge.incidentFace;

            edge.orig = origedge;
            edge.dest = destedge;
            edge.next = next;
            edge.next.next = nextnext;
            edge.next.next.next = edge;
            edge.oppo = null;
            edge.incidentFace = face;
            
            border.push(edge);
        }
        
    }
    return border;
}


/**
 * @brief           Insert the convex hull into the mesh
 * @param mesh      Mesh structure as doubly-connected edge list
 * @param convex    Array of vertices of the convex hull 
 * @param border    Array of edges that are on the border of the mesh
 */
function insert_convex (mesh, convex, border) {

    for (let i = 0; i < convex.length; i++) {

        // look if there is a border edge that matches the new edge
        let exist = false;
        for (let j = 0; j < border.length; j++) {
            if (convex[i] == border[j].orig && convex[(i+1)%convex.length] == border[j].dest) {
                exist = true;
            }
        }

        if (!exist) {
            var edge = {
                    orig: convex[i],
                    dest: convex[(i+1)%convex.length],
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

export { bowyer_triangulation, super_triangle, bounding_box, midpoint, extreme_points, circumcenter, add_vertex, find_unique_values, polygon_triangles, remove_super_triangle, insert_convex}
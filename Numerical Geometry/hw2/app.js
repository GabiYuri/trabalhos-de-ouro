/**
 * face on the left of the half-edge
 * triangle: nodes(id, pos), faces(incidentEdge, id), edges(face, opposite, next, orig, dest == next.origin)
 */

// triangle - first node and target node --> use intersection algorithm
/**
 * 1. check if target node is in the triangle
 * 2. check the other 2 segments of the triangle (segment only intersect one of them)
 * 
 * orient2d
 * 
 * robust predicates
 * predicates.orient2d(Ax, Ay, Bx, By, Cx, Cy)
 */

function setup_triangle_location(mesh, canvas) {
	console.log("Hello from setup_triangle_location");
	draw_mesh(mesh, canvas);
	// TODO
}

function setup_segment_location(mesh, canvas) {
	console.log("Hello from setup_segment_location");
	draw_mesh(mesh, canvas);
	// TODO 
}

function create_mesh(mesh_data) { // mesh_data from the json file
	// Initialize data structure
	mesh = {
		nodes: [],
		faces: [],
		edges: []
	};

	node_data = mesh_data.Nodes[0]; // coordinates and indices
	elem_data = mesh_data.Elements[1]; // only type 2

	// Create nodes
	for (let i = 0; i < node_data.Indices.length; i++){
		node = {
			id: node_data.Indices[i],
			pos: node_data.Coordinates[i]
		};
		mesh.nodes.push(node);
	}

	// Create faces and half-edges
	nodePairToEdge = {};
	for (let i = 0; i < elem_data.Indices.length; i++){
		face = {
			id: elem_data.Indices[i],
			incident_edge: null		//TODO
		};
		face_nodes = elem_data.NodalConnectivity[i];
		console.log(face_nodes);

		// Create the 3 half-edges in this triangle
		// face_nodes[0], [1], [2] - nodes triangle
		face_half_edges = [];
		for (let j = 0; j < face_nodes.length; j++){
			half_edge = {
				face: face,
				oppo: null,
				next: null,
				orig: mesh.nodes[face_nodes[j]],
				dest: mesh.nodes[face_nodes[(j+1)%3]]
			};
			face_half_edges.push(half_edge);

			// Determine the connectivity of the half-edges
			if ([half_edge.dest.id, half_edge.orig.id] in nodePairToEdge) {
				half_edge.oppo = nodePairToEdge[[half_edge.dest.id, half_edge.orig.id]];
				half_edge.oppo.oppo = half_edge;
			} else nodePairToEdge[[half_edge.orig.id, half_edge.dest.id]] = half_edge;
		}



		for (let j = 0; j < face_nodes.length; j++){
			face_half_edges[j].next = face_half_edges[(j+1)%3];
		}
	}
	return mesh;
}

function draw_mesh(mesh, canvas) {
	size_adapt(canvas, mesh.nodes, offset=5);

	// Draw triangles
	context = canvas.getContext('2d');
	context.strokeStyle = "black";
	for (face of mesh.faces) {
		edge = face.incidentEdge;
		face_nodes = [edge.orig.pos, edge.dest.pos, edge.next.dest.pos];
		context.beginPath();
		context.moveTo(face_nodes[0][0], face_nodes[0][1]);
		context.lineTo(face_nodes[1][0], face_nodes[1][1]);
		context.lineTo(face_nodes[2][0], face_nodes[2][1]);
		context.stroke();
	}
}

function size_adapt(canvas, nodes, offset){
    // bounding box of the mesh
	let xMin = Number.MAX_VALUE;
	let yMin = Number.MAX_VALUE;
	let xMax = Number.MIN_VALUE;
	let yMax = Number.MIN_VALUE;
	for (node of nodes) {
		xMax = Math.max(xMax, node.pos[0]);
		xMin = Math.min(xMin, node.pos[0]);
		yMax = Math.max(yMax, node.pos[1]);
		yMin = Math.min(yMin, node.pos[1]);
	}
	const xRange = xMax - xMin;
	const yRange = yMax - yMin;
	const scale = Math.min(canvas.width/xRange, canvas.height/yRange);
    
    for (node of nodes)
        node.pos = transform(node.pos, scale, xMin, yMin, offset);

    return {scale:scale, xMin:xMin, yMin:yMin};
}

function transform(pos, scale, xMin, yMin, offset) {
    return [offset+(pos[0]-xMin)*scale, offset+(pos[1]-yMin)*scale];
}

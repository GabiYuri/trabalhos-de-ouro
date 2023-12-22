// ===========================================
// =============== ANIMATIONS ================
// ===========================================

// IMPORT SECTION =====================================
import { create_mesh_nodes, create_big_triangles, create_new_triangle } from './randomTriangulation.js';
import { isDelaunay, flipEdge, perpendicular_bisector, intersection_point, flip_algorithm} from './flipAlgorithm.js';
import {draw_mesh, clear_canvas, draw_edge} from './drawElement.js';
import {get_orientation, compare_bottomMost, findConvex, drawConvex} from './convexHull.js';
import { super_triangle, add_vertex, remove_super_triangle, insert_convex, bowyer_triangulation} from './bowyerTriangulation.js';


async function flip_delaunay_animated(nodes, canvas) {
    var mesh = create_mesh_nodes(nodes);
	clear_canvas(canvas);
	draw_mesh(mesh, canvas);

    console.log("Click to find the Convex Hull");
	await waitForClick(canvas);

    var convexVertex = findConvex(mesh);
	drawConvex(convexVertex, canvas);

    console.log("Click to triangulate the Convex Hull");
	await waitForClick(canvas);

	var points2Triagulate = create_big_triangles(mesh, convexVertex);
	clear_canvas(canvas);
	draw_mesh(mesh, canvas);
	await waitDelay(100);

	for (let point of points2Triagulate) {
		mesh = create_new_triangle(point, mesh, canvas);
        console.log("Generating Random Triangulation of the convex hull");
		clear_canvas(canvas);
		draw_mesh(mesh, canvas);
		await waitDelay(100);
	}

    console.log("Click to find the Delaunay Triangulation");
	await waitForClick(canvas);
	flip_algorithm_animated(mesh, canvas);
}

async function flip_algorithm_animated(mesh, canvas) {

	// Insert all the internal edges of the triangulation in a stack
	let stack = [];
	for (let edge of mesh.edges) {
		if (edge.oppo != null) {
			stack.push(edge);
		}
	}

	// Do while the stack is not empty
	while (stack.length > 0) {

		//console.log("There are", stack.length, "edges in the stack.")
        //await waitDelay(200);
		//console.log(stack);
	
		// Pop the top edge from the stack
		let edge = stack.pop();
        let msg = "I'm checking the edge between " + edge.orig.id + " and " + edge.dest.id + ".";
		console.log(msg)
        await waitDelay(100);
		
		// For visualiation purposes
		clear_canvas(canvas);
		draw_mesh(mesh, canvas);
		draw_edge(edge.orig.pos, edge.dest.pos, canvas, "red");
		//await waitDelay(100);

		
		// If the edge is not Delaunay, flip it and add the new edges to the stack
		if (!isDelaunay(edge, canvas, true)) {
			console.log("This edge is not Delaunay.")
            await waitDelay(100);
			const wasflipped = flipEdge(edge);
			draw_mesh(mesh, canvas);

			// if was flipped, add the new edges to the end of the stack, but check if they are not already there
			if (wasflipped) {
				if (!stack.includes(edge.next)) {stack.push(edge.next);};
				if (!stack.includes(edge.oppo.next.next)) {stack.push(edge.oppo.next.next); };
				if (!stack.includes(edge.oppo.next)) {stack.push(edge.oppo.next); };	
				if (!stack.includes(edge.next.next)) {stack.push(edge.next.next); };			
			}
		}

		// iF the edge is Delaunay, remove it from the stack
		else {
			console.log("This edge is Delaunay.");
            await waitDelay(100);
		} 
	}
	console.log("Done!");
    clear_canvas(canvas);
    draw_mesh(mesh, canvas);
}

async function voronoi_animated(nodeData, canvas) {

	var mesh = create_mesh_nodes(nodeData);
	clear_canvas(canvas);
	draw_mesh(mesh, canvas);

    console.log("Click to generate Delaunay Triangulation");
	await waitForClick(canvas);

	// flip algorithm 
	
	
	var convexVertex = findConvex(mesh);
	var points2Triagulate = create_big_triangles(mesh, convexVertex);

	for (let point of points2Triagulate) {
		create_new_triangle(point, mesh);
	}

    flip_algorithm(mesh, canvas);


	// bowyer algorithm
	/*
	mesh = bowyer_triangulation(nodeData, canvas);*/
	clear_canvas(canvas);
    draw_mesh(mesh, canvas);


	console.log("Click to generate Voronoi Diagram");
	await waitForClick(canvas);

	let vertex = [];

	// For every triangle, draw the perpendicular bisector of each edge
	for (let face of mesh.faces) {
		const [m1, b1] = perpendicular_bisector(face.incidentEdge);
		const [m2, b2] = perpendicular_bisector(face.incidentEdge.next);
		
		var [x, y] = intersection_point(m1, b1, m2, b2, canvas);
		vertex.push([x, y]);
		await waitDelay(100);
	}

	//console.log(vertex);

	for (let face of mesh.faces) {

		var face_id = face.id;

		// define n1_face_id if face.incidentEdge.oppo is not null
		if (face.incidentEdge.oppo != null) {let n1face_id = face.incidentEdge.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n1face_id], canvas, "red");}
		if (face.incidentEdge.next.oppo != null) {let n2face_id = face.incidentEdge.next.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n2face_id], canvas, "red");}
		if (face.incidentEdge.next.next.oppo != null) {let n3face_id = face.incidentEdge.next.next.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n3face_id], canvas, "red");}
		await waitDelay(100);
	}

	console.log("Done!");
}

async function bowyer_triangulation_animated(nodes, canvas) {

    var mesh = create_mesh_nodes(nodes);
	clear_canvas(canvas);
	draw_mesh(mesh, canvas);

    console.log("Click to generate Super Triangle");
	await waitForClick(canvas);

    var nodes2tri = mesh.nodes;
    mesh = super_triangle(mesh);
	clear_canvas(canvas);
	draw_mesh(mesh, canvas);

    console.log("Click to generate Delaunay Triangulation");
	await waitForClick(canvas);

    for (let node of nodes2tri) {
        add_vertex(mesh, node);
		clear_canvas(canvas);
		draw_mesh(mesh, canvas);
		await waitDelay(150);
    }

	await waitDelay(200);
    var border = remove_super_triangle(mesh);
	clear_canvas(canvas);
    draw_mesh(mesh, canvas);
	await waitDelay(200);

    var convex_vertex = findConvex(mesh);
    insert_convex(mesh, convex_vertex, border);
	
    clear_canvas(canvas);
    draw_mesh(mesh, canvas);

    return mesh;
}

async function findConvex_animated(nodeData, canvas) {

	var mesh = create_mesh_nodes(nodeData);
	clear_canvas(canvas);
	draw_mesh(mesh, canvas);

    console.log("Click to find the Convex Hull");
	await waitForClick(canvas);

	console.log("Finding the Convex Hull...");
	
	var points = mesh.nodes.map(node => node.pos);

	// sort by y-axis values
	points.sort(function(a, b) {return a[1] - b[1]});
    var bottomMost = points[0];
    points.splice(0, 1);

	// separates from bottom and top half
	points.sort(compare_bottomMost(bottomMost));
    points.unshift(bottomMost);

    // get 2 points to start comparing
    var stack = [points[0], points[1]];
    var tracker = 2;
    var count = 2;
	for (let i = 0; i < stack.length - 1; i++) {
		draw_edge(stack[i], stack[i+1], canvas, "red");
		await waitDelay(100);
	}
    while(true) {
        var check = false;
        if (tracker == (points.length)) {
            break;
        }
        if (get_orientation(stack[count - 2], stack[count - 1], points[tracker]) == -1) {
            stack.push(points[tracker]);
            count++;
        } else {
            count--;
            stack.pop();
            check = true;
        }
        var s = stack.slice();
        
        if (!check) {
            tracker++;
        }

		clear_canvas(canvas);
		draw_mesh(mesh, canvas);
		for (let i = 0; i < stack.length - 1; i++) {
			draw_edge(s[i], s[i+1], canvas, "red", 1.5);
		}
		await waitDelay(100);
    }
	draw_edge(s[s.length-1], s[0], canvas, "red", 1.5);

	await waitDelay(150);

	var convexVertex = [];
	for (let i = 0; i < stack.length; i++) {
		let id = mesh.nodes.map(node => node.pos).findIndex(element => element === stack[i]);
		convexVertex.push(mesh.nodes[id]);
	}

	console.log("Done!");

	// make it clockwise
	convexVertex.reverse();
    return convexVertex;
}

function waitForClick(canvas) {
	return new Promise(resolve => {
		canvas.addEventListener('click', resolve);
	});
}

function waitDelay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


export {flip_delaunay_animated, flip_algorithm_animated, voronoi_animated, bowyer_triangulation_animated, findConvex_animated, waitForClick, waitDelay}
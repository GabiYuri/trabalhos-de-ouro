// ===========================================
// =============== CONVEX HULL ===============
// ===========================================


import { orient2d } from '../node_modules/robust-predicates/index.js';

/**
 * @brief           Calculates the cross-product between the vector to get orientation
 * @param A        	xy-coordinate of A
 * @param B        	xy-coordinate of B   
 * @param C        	xy-coordinate of C
 * @returns         1: counterclockwise; 0: collinear; -1: clockwise;
 */
export function get_orientation(A, B, C) {
    
    const ccw = orient2d(A[0], A[1], B[0], B[1], C[0], C[1]);

    // to be consistent with the existing code
    // positive determinant
    if (ccw > 0) return 1; 
    // collinear points
    else if (ccw === 0) return 0; 
    // negative determinant
    return -1;
    /*
    // positive determinant
    if (((C[1] - A[1])*(B[0] - A[0])) > ((B[1] - A[1])*(C[0] - A[0]))) return 1; 
    // nolinear points
    else if (((C[1] - A[1])*(B[0] - A[0])) == ((B[1] - A[1])*(C[0] - A[0]))) return 0; 
    // negative determinant
    return -1;*/
}


/**
 * @brief 			Calculates the distance between two points
 * @param A        	xy-coordinate of A
 * @param B        	xy-coordinate of B   
 * @returns 		distance between A and B
 */
export function distance(A, B) {
    var res = ((B[0] - A[0]) ** 2) + ((B[1] - A[1]) ** 2);
    res = Math.sqrt(res);
    return res;
}


/**
 * @brief 			    Compare the points of the convex hull
 * @param bottomMost 	xy-coordinate of the bottom-most point
 * @returns 		    function to compare the points
 */
export function compare_bottomMost(bottomMost) {
    return function compare(A, B) { 
        var p = bottomMost;
        var o = get_orientation(p, A, B); 
        if (o == 0) 
            return (distance(p, B) >= distance(p, A))? -1 : 1; 
        return (o == -1)? -1: 1; 
    };
}


/**
 * @brief			Find the convex hull given the mesh.nodes
 * @param mesh		mesh structure as doubly-connected edge list
 * @returns 		Array of vertices of the convex hull
 */
export function findConvex(mesh) {
	
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
    }

	var convexVertex = [];
	for (let i = 0; i < stack.length; i++) {
		let id = mesh.nodes.map(node => node.pos).findIndex(element => element === stack[i]);
		convexVertex.push(mesh.nodes[id]);
	}

	// make it clockwise
	convexVertex.reverse();
    return convexVertex;
}
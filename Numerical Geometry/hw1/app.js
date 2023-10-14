/* NUMERICAL GEOMETRY - Assignement 1 
Gabriel de Morais Pires
Gabriela Ishikawa */


/**
 * @brief               Main function for intersection and mesh implementations          
 * @param canvas1       canvas for intersection implementation
 * @param canvas2       canvas for mesh implementation
 */
function main(canvas1, canvas2){


    //============================
    // INTERSECTION IMPLEMENTATION
    //============================

    
    nodes = [];
    
    // Identify user clicks: create nodes and find intersection
    canvas1.addEventListener("mousedown", function(e){
        // Clear canvas if nodes length is 0: case when a degenerative case is displayed before
        if (nodes.length == 0) {
            clear_canvas(canvas1);
        }

        // Clear canvas and reset nodes if nodes length is 4
        if (nodes.length == 4) {
            nodes.length = 0
            clear_canvas(canvas1);
        }
    
        const rect = canvas1.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        draw_point(x, y, canvas1, "black", nodes.length + 1);
    
        pos = [x, y];
        nodes.push(pos);
        find_intersection(canvas1, nodes);
    });

    // Clear canvas button
    clear1Button.addEventListener("click", function () {
        clear_canvas(canvas1);
        nodes.length = 0;
    });

    // Degenerative case implementation: colinear lines with overlap
    colinear1Button.addEventListener("click", function () {
        clear_canvas(canvas1);
        var A = [200, 300];
        var B = [600, 620];
        var C = [400, 460];
        var D = [700, 700];
        draw_point(A[0], A[1], canvas1, "black", label="A");
        draw_point(B[0], B[1], canvas1, "black",  label="B");
        draw_point(C[0], C[1], canvas1, "black",  label="C");
        draw_point(D[0], D[1], canvas1, "black",  label="D");
        draw_edge(A, B, canvas1, "black");
        draw_edge(C, D, canvas1, "black");

        find_intersection(canvas1, [A, B, C, D]);
    });

    // Degenerative case implementation: colinear lines without overlap
    colinear2Button.addEventListener("click", function () {
        clear_canvas(canvas1);
        var A = [200, 300];
        var C = [600, 620];
        var B = [400, 460];
        var D = [700, 700];
        draw_point(A[0], A[1], canvas1, "black", label="A");
        draw_point(B[0], B[1], canvas1, "black",  label="B");
        draw_point(C[0], C[1], canvas1, "black",  label="C");
        draw_point(D[0], D[1], canvas1, "black",  label="D");
        draw_edge(A, B, canvas1, "black");
        draw_edge(C, D, canvas1, "black");

        find_intersection(canvas1, [A, B, C, D]);
    });


    //=====================
    // MESH IMPLEMENTATION
    //=====================


    // Getting info from json file
    var data_el = mesh["Elements"];
    var data_no = mesh["Nodes"];
    
    // Coordinates of the nodes
    var vertex = []; 
    for(let i=0; i<data_no.length; i++){
        vertex = data_no[i]["Coordinates"];
    }
    
    // Edges type 1
    var border = [];
    for(let i=0; i<data_el.length; i++){
        if (data_el[i]["Type"]==1){
            border = data_el[i]["NodalConnectivity"];
            break;
        }  
    }
    
    // Edges type 2
    var connections = []; 
    for(let i=0; i<data_el.length; i++){
        if (data_el[i]["Type"]==2){
            connections = data_el[i]["NodalConnectivity"];
            break;
        }  
    }
    
    // Draw mesh from json file
    draw_mesh(vertex, border, connections, canvas2);    

    // Configure mode of click on the canvas
    canvas2.addEventListener("mousedown", function(e){
        if (mode == 0) {
            // Mode 0: identify the triangle based on user click;
            find_tri_in_mesh(canvas2, e, connections, vertex);
        }
        else if (mode == 1){
            //  Mode 1: create new node on user click;
            create_node(canvas2, e, connections, vertex);
            mode = 0;
            newNode.style.display = "none";
        }
    });  

    // Alternate mode
    var mode = 0; 
    nodeButton.addEventListener("click", function (e) {
        newNode.style.display = "block";
        mode = 1;
    });    

    // Reset to initial mesh
    clear2Button.addEventListener("click", function (e) {
        clear_canvas(canvas2);
        draw_mesh(vertex, border, connections, canvas2);
    });
}


//=====================
// FUNCTIONS DEFINITION
//=====================


/**
 * @brief           Clear all elements in the desired canvas
 * @param canvas    selected canvas
 * @returns {void} 
 */
function clear_canvas(canvas){
    context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * @brief           Draw a point given its coordinates
 * @param x         x-coordinate of the point
 * @param y         y-coordinate of the point
 * @param canvas    selected canvas
 * @param color     point and text color
 * @param label     label of the point 
 * @returns {void} 
 */
function draw_point(x, y, canvas, color="black", label=""){
    // draw a point in the coordinates (x, y)
    context = canvas.getContext('2d');
    context.beginPath();
    context.arc(x, y, 5, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();

    // label, if required
    x_text = x + 8;
    y_text = y - 6;
    if (x + 5 >= canvas.width) x_text = x - 18;
    if (y - 5 <= 0) y_text = y + 18;
    context.font = "bold 14px sans-serif";
    context.fillText(label, x_text, y_text);
}

/**
 * @brief           Draw an edge given coordinates of two points
 * @param A         coordinates (x, y) of A
 * @param B         coordinates (x, y) of B
 * @param canvas    selected canvas
 * @param color     edge color
 */
function draw_edge(A, B, canvas, color="black"){
    // draw a segment AB
    context = canvas.getContext('2d');
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(A[0], A[1]);
    context.lineTo(B[0], B[1]);
    context.stroke();
}

/**
 * @brief               Draw mesh given its vertex and connections
 * @param vertex        nodes of the mesh
 * @param border        nodes in the border of the mesh (type 1)
 * @param triangles     triangles connections in the mesh (type 2)
 * @param canvas2       selected canvas
 */
function draw_mesh(vertex, border, triangles, canvas2){
    // draw segments in the border of the mesh
    for(let i=0; i<border.length; i++) {
        var idxA = border[i][0];
        var idxB = border[i][1];
        var A = [canvas2.width*vertex[idxA][0], canvas2.height*vertex[idxA][1]];
        var B = [canvas2.width*vertex[idxB][0], canvas2.height*vertex[idxB][1]];
        draw_edge(A, B, canvas2, "lightskyblue");
    }
    
    // draw segments of each triangle in mesh
    for(let i=0; i<triangles.length; i++) {
        var idxA = triangles[i][0];
        var idxB = triangles[i][1];
        var idxC = triangles[i][2];
        var A = [canvas2.width*vertex[idxA][0], canvas2.height*vertex[idxA][1]];
        var B = [canvas2.width*vertex[idxB][0], canvas2.height*vertex[idxB][1]];
        var C = [canvas2.width*vertex[idxC][0], canvas2.height*vertex[idxC][1]];
        draw_edge(A, B, canvas2, "lightskyblue");
        draw_edge(B, C, canvas2, "lightskyblue");
        draw_edge(C, A, canvas2, "lightskyblue");
        label_triangle(A, B, C, i, canvas2, "lightskyblue");
    }
    
    // draw the nodes of the mesh
    for(let i=0; i<vertex.length; ++i){
        draw_point(canvas2.width*vertex[i][0], canvas2.height*vertex[i][1], canvas2, "black", i);
    }
}

/**
 * @brief           Write down the label of the triangle ABC
 * @param A         coordinates (x, y) of A
 * @param B         coordinates (x, y) of B
 * @param C         coordinates (x, y) of C
 * @param number    number/label of the triangle
 * @param canvas    selected canvas
 * @param color     text color
 */
function label_triangle(A, B, C, number, canvas, color="black"){
    // identify the number of the triangle ABC
    context = canvas.getContext('2d');
    x_label = (A[0] + B[0] + C[0])/3;
    y_label = (A[1] + B[1] + C[1])/3;
    context.fillStyle = color;
    context.font = "bold 12px sans-serif";
    context.fillText(number, x_label, y_label);
}

/**
 * @brief           Fill in the triangle with the desired colour
 * @param A         coordinates (x, y) of A
 * @param B         coordinates (x, y) of B
 * @param C         coordinates (x, y) of C
 * @param canvas    selected canvas
 * @param color     fill color
 */
function fill_triangle(A, B, C, canvas, color="lightblue") {
    // fill the background of the triangle ABC
    context = canvas.getContext('2d');
    context.fillStyle = color;
    context.globalAlpha = 0.5;
    context.beginPath();
    context.moveTo(A[0], A[1]);
    context.lineTo(B[0], B[1]);
    context.lineTo(C[0], C[1]);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;
}

/**
 * @brief           Verify if two line segments intersect (AB and CD)
 * @param x1        x-coordinate of A
 * @param y1        y-coordinate of A
 * @param x2        x-coordinate of B       
 * @param y2        y-coordinate of B
 * @param x3        x-coordinate of C
 * @param y3        y-coordinate of C
 * @param x4        x-coordinate of D
 * @param y4        y-coordinate of D
 * @returns         0: if there is not an overlap 1: if there is an overlap
 */
function check_overlap(x1, y1, x2, y2, x3, y3, x4, y4) {
    const xstart_max = Math.max(Math.min(x1, x2), Math.min(x3, x4));
    const xend_min = Math.min(Math.max(x1, x2), Math.max(x3, x4));
  
    const ystart_max = Math.max(Math.min(y1, y2), Math.min(y3, y4));
    const yend_min = Math.min(Math.max(y1, y2), Math.max(y3, y4));
  
    // check for no overlap
    if (xstart_max > xend_min || ystart_max > yend_min) return 0; 
    return 1; // overlap
}

/**
 * @brief           Calculate the intersection line segment
 * @param x1        x-coordinate of A
 * @param y1        y-coordinate of A
 * @param x2        x-coordinate of B       
 * @param y2        y-coordinate of B
 * @param x3        x-coordinate of C
 * @param y3        y-coordinate of C
 * @param x4        x-coordinate of D
 * @param y4        y-coordinate of D
 * @returns         coordinates [(Ox,Oy), (Px,Py)] of OP - the intersection line segment
 */
function get_overlap(x1, y1, x2, y2, x3, y3, x4, y4) {
    let start_max, end_min, y_max, y_min;

    if (x1 === x2 && x3 === x4) {
        // both segments are vertical (aligned along the y-axis)
        start_max = Math.max(Math.min(y1, y2), Math.min(y3, y4));
        end_min = Math.min(Math.max(y1, y2), Math.max(y3, y4));

        return [[x1, start_max], [x1, end_min]];  // vertical line overlap
    } 
    else {
        // at least one segment is not vertical (aligned along the x-axis)
        start_max = Math.max(Math.min(x1, x2), Math.min(x3, x4));
        end_min = Math.min(Math.max(x1, x2), Math.max(x3, x4));
    
        y_max = ((y1 - y2) / (x1 - x2)) * (start_max - x1) + y1;
        y_min = ((y1 - y2) / (x1 - x2)) * (end_min - x1) + y1;
    }

    const overlap = [[start_max, y_max], [end_min, y_min]];
    return overlap;
}

/**
 * @brief           Calculates the cross-product between the vector to get orientation
 * @param x1        x-coordinate of A
 * @param y1        y-coordinate of A
 * @param x2        x-coordinate of B       
 * @param y2        y-coordinate of B
 * @param x3        x-coordinate of C
 * @param y3        y-coordinate of C
 * @returns         1: counterclockwise; 0: collinear; -1: clockwise;
 */
function get_orientation(x1, y1, x2, y2, x3, y3){
    // positive determinant
    if (((y3 - y1)*(x2 - x1)) > ((y2 - y1)*(x3 - x1))) return 1; 
    // nolinear points
    else if (((y3 - y1)*(x2 - x1)) == ((y2 - y1)*(x3 - x1))) return 0; 
    // negative determinant
    return -1;
}

/**
 * @brief           Verify it there is intersection between two segments
 * @param x1        x-coordinate of A
 * @param y1        y-coordinate of A
 * @param x2        x-coordinate of B       
 * @param y2        y-coordinate of B
 * @param x3        x-coordinate of C
 * @param y3        y-coordinate of C
 * @param x4        x-coordinate of D
 * @param y4        y-coordinate of D
 * @returns         1: concurrent lines with intersection; 0: collinear lines without overlap or
 *                  concurrent lines without intersection -1: conllinear lines with intersection;
 */
function check_intersection(x1, y1, x2, y2, x3, y3, x4, y4){
    var d1 = get_orientation(x1, y1, x2, y2, x3, y3);
    var d2 = get_orientation(x1, y1, x2, y2, x4, y4);
    var d3 = get_orientation(x1, y1, x3, y3, x4, y4);
    var d4 = get_orientation(x2, y2, x3, y3, x4, y4);

    overlap = check_overlap(x1, y1, x2, y2, x3, y3, x4, y4);

    // colinear lines without overlap
    if ((d1 == d2) && (d3 == d4) && (d4 == 0)){
        if (overlap == 0) return 0;
        // colinear lines without overlap
        return -1;
    } 
    // concurrent lines
    return ((d1 != d2) && (d3 != d4));
}


/**
 * @brief               Verify and draw the intersection of the segments AB and CD, if it exists
 * @param canvas        selected canvas
 * @param nodes         [A(x,y), B(x,y), C(x,y), D(x,y)]
 */
function find_intersection(canvas, nodes){
    // draws a line segment between the selected point and the previous one
    if (nodes.length % 2 == 0) {
        draw_edge(nodes[nodes.length-2], nodes[nodes.length-1], canvas);
    }

    // if there is the two segments - 4 points coordinates, verify intersection
    if (nodes.length == 4) {
        var x1 = nodes[0][0],
            y1 = nodes[0][1],
            x2 = nodes[1][0],
            y2 = nodes[1][1],
            x3 = nodes[2][0],
            y3 = nodes[2][1],
            x4 = nodes[3][0],
            y4 = nodes[3][1]; 

        let m1 = (y2 - y1) / (x2 - x1);
        let m2 = (y4 - y3) / (x4 - x3);
        let b1 = y1 - m1*x1;
        let b2 = y3 - m2*x3;

        let x = (b2-b1)/(m1-m2);
        let y = m1*x + b1;

        var intersect = check_intersection(x1, y1, x2, y2, x3, y3, x4, y4);

        // draw the intersection - point or line segment
        if (intersect == 1){
            draw_point(x, y, canvas, "red", "Intersection");
        }
        else if (intersect == -1){
            var overlap_segment = get_overlap(x1, y1, x2, y2, x3, y3, x4, y4);
            draw_edge(overlap_segment[0], overlap_segment[1], canvas1, "white")
            draw_edge(overlap_segment[0], overlap_segment[1], canvas1, "red")
        }
        else {
            console.log("No intersection");
        }
    }
}

/**
 * @brief               Find the triangle that contais the selected point
 * @param canvas        selected canvas
 * @param event         event of selecting a point on canvas (mouseclick)
 * @param triangles     array with all triangles in the mesh
 * @param vertex        nodes of the mesh
 */
function find_tri_in_mesh(canvas, event, triangles, vertex){
    // get click position
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pos = [x, y];
    
    // verify each triangle to localize it 
    var inside = 0;
    for(let i=0; i<triangles.length; i++){
        
        var idxA = triangles[i][0];
        var idxB = triangles[i][1];
        var idxC = triangles[i][2];
        var A = [canvas.width*vertex[idxA][0], canvas.height*vertex[idxA][1]];
        var B = [canvas.width*vertex[idxB][0], canvas.height*vertex[idxB][1]];
        var C = [canvas.width*vertex[idxC][0], canvas.height*vertex[idxC][1]];

        inside = triangle_interior(pos, A, B, C);
        
        if (inside == 1) {
            // if the point is inside the triangle, fill it in
            fill_triangle(A, B, C, canvas);
        }
    }

    // draw the desired point on canvas
    draw_point(x, y, canvas, "darkcyan", "");
}

/**
 * @brief               Create a node in the mesh and connects it to the vertex of the triangle
 * @param canvas        selected canvas
 * @param event         event of selecting a point on canvas (mouseclick)
 * @param triangles     array with all triangles in the mesh
 * @param vertex        nodes of the mesh
 */
function create_node(canvas, event, triangles, vertex) {
    // get click position
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pos = [x, y];
    
    // verify each triangle to localize it 
    var inside = 0;
    for(let i=0; i<triangles.length; i++){
        
        var idxA = triangles[i][0];
        var idxB = triangles[i][1];
        var idxC = triangles[i][2];
        var A = [canvas.width*vertex[idxA][0], canvas.height*vertex[idxA][1]];
        var B = [canvas.width*vertex[idxB][0], canvas.height*vertex[idxB][1]];
        var C = [canvas.width*vertex[idxC][0], canvas.height*vertex[idxC][1]];

        inside = triangle_interior(pos, A, B, C);
        
        if (inside == 1) {
            // if the point is inside the triangle, fill it in
            vertex.push(pos);
            draw_point(x, y, canvas, "darkgray", vertex.length-1);
            draw_edge(A, pos, canvas, "lightskyblue");
            draw_edge(B, pos, canvas, "lightskyblue");
            draw_edge(C, pos, canvas, "lightskyblue");
        }
    }    
}


/**
 * @brief           Check if the point p is inside the triangle defined by the 3 vertices v1, v2 and v3
 * @param p         coordinates (x,y) of p
 * @param v1        vertice v1 of the triangle
 * @param v2        vertice v2 of the triangle
 * @param v3        vertice v3 of the triangle
 * @returns         0: it is not inside the triangle; 1: it is inside the triangle
 */
function triangle_interior(p, v1, v2, v3){
    var d1 = get_orientation(p[0], p[1], v1[0], v1[1], v2[0], v2[1]);
    var d2 = get_orientation(p[0], p[1], v2[0], v2[1], v3[0], v3[1]);
    var d3 = get_orientation(p[0], p[1], v3[0], v3[1], v1[0], v1[1]);

    if ((d1 == d2) && (d2 == d3)) return 1; // inside triangle
    return 0;
}
# LMECA2170 Numerical Geometry - Project
### Authors: Gabriel de Morais Pires and Gabriela Ishikawa

This document provides an overview of what we have implemented and what has been submitted for evaluation. 

**WARNING:** The only way we found to use the "robust-predicates" module was by opening a local host. Therefore, for the code to run in the browser, it is necessary to download the "Live Share" extension (assuming the use of VSCode) and then right-click on one of the .html files in the "pages" folder and click on "Open with Live Server" (or use the shortcut Alt+L Alt+O). If you don't use VSCode, simply use any other method to open the HTML with a local host (we haven't tested, but we assume it should work).

**NOTE:** To import new points, include a file named "input_file.json" in the "data" folder. The variable name should be "inputData" (var inputData = [...]).

## Concerning the report:

* In terms of the report submission, we opted to include it on the website instead of creating a separate file. We followed the guidelines and created an educational presentation that offers an informal introduction to Delaunay triangulation and Voronoi diagrams topics (Home Page).

* We conducted research on practical applications of the developed algorithms, and the results of this investigation are also included on the website (Home Page).

* The implementation of the algorithms was done pedagogically, meaning it was geared towards understanding the concepts presented in class. Our intention was not to create algorithms that are exceptionally fast and competitive with state-of-the-art methods. Nevertheless, we conducted a quick performance evaluation of the two implemented algorithms for Delaunay triangulation—flipping edges and Bowyer-Watson. The results are also presented on the site (Performance Page).

* We chose to implement zoom functionality to enhance the visualization on the canvas displaying the Voronoi diagram. This feature had not been implemented in previous homework assignments.

## Regarding the code:

*	We implemented the Graham scan algorithm to determine the convex hull.

*	We implemented the flipping edges algorithm for obtaining Delaunay triangulation.

*	We implemented the Bowyer-Watson algorithm for obtaining Delaunay triangulation.

*	We constructed the Voronoi diagram from the Delaunay triangulation. To represent this diagram, we used a list indicating the position of seed points and the triangulation data structure to determine the neighbor relationships between the faces of the triangulation.

*	We used the robust-predicates library in an attempt to make the code more robust.

*	The implementation of the Bowyer-Watson algorithm, which has better complexity compared to flipping edges, was done in an attempt to achieve optimal complexity.

*	We put significant effort into developing an aesthetically pleasing website. We created different pages and canvases to present the content, developed animations, used different colors to facilitate visualization, and more.

*	Pathological cases: We endeavored to make the Bowyer-Watson implementation more robust to handle these cases. For collinear points. For concyclic points Not knowing the convex hull: We implemented the Graham scan algorithm to find the convex hull for both flipping edges and Bowyer-Watson algorithms.

import React, { useLayoutEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-balham.css"; // Optional Theme applied to the Data Grid

// container
import BookmarkContainer from "./container/BookmarkContainer";

export default function App() {
	useLayoutEffect(() => {
		document.title = "andold #bookmark #favorite";
	}, []);

	  return (
		<div className="App">
			<DndProvider backend={HTML5Backend}>
				<BookmarkContainer />
			</DndProvider>
		</div>
	);
}

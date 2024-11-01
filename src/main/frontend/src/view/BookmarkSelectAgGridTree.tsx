import React, { useRef, useMemo, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { AgGridReact, AgGridReactProps } from "ag-grid-react";

// model, domain

// store
import store from "../store/BookmarkStore";

// view

// BookmarkSelectAgGridTree.tsx
export default forwardRef((props: any, ref: any) => {
	const { mapBookmark, value } = props;
	const [rowData, setRowData] = useState<any[]>([]);
	const [selected, setSelected] = useState<any>();
	const gridRef = useRef<AgGridReact>(null);
	const columndefs: any = useMemo<AgGridReactProps[]>(() => store.columnDefs(mapBookmark, ["sid", "url", "description", "pid", "count", "created", "updated"]), [props]);
	useImperativeHandle(ref, () => {
		return {
			getValue() {
				return selected.id;
			},
		};
	});
	function handleOnRowSelected(params: any) {
		store.update({id: props.data.id, pid: params.data.id}
			, (a: any, b: any) => {
				console.log(a, b);
				props.stopEditing();
			}
		);
	}
	useEffect(() => {
		const root = store.root(mapBookmark.values());
		const aligned = store.traverseAndPush([], root, []);
		setRowData(aligned);
	}, [mapBookmark]);
	function handleOnGridReady() {
		if (!gridRef.current) {
			return;
		}

		gridRef.current.api.sizeColumnsToFit();
		gridRef.current.api.setGridOption("domLayout", "autoHeight");
	}

	return (<>
		<div style={{
			width: 480,
			height: 640,
			minHeight: 640,
		}}>
			<AgGridReact
				className="ag-theme-balham-dark"
				rowData={rowData}
				columnDefs={columndefs}
				defaultColDef={{
					editable: false,
					resizable: true,
					sortable: false,
					suppressMenu: true,
				}}
				isExternalFilterPresent={() => true}
				doesExternalFilterPass={doesExternalFilterPass}
				ref={gridRef}
				onGridReady={handleOnGridReady}
				onRowSelected={handleOnRowSelected}
			/>
		</div>
	</>);
});

function doesExternalFilterPass(node: any): boolean {
	if (!node || !node.data || !node.data.parent) {
		return true;
	}

	const collapsed = store.findCollapsedParent(node.data.parent);
	if (collapsed) {
		return false;
	}

	return doesExternalFilterPass(node.data.parent);
}

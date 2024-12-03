import React, { useRef, useMemo, useEffect, useState } from "react";
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import { AgGridReact, AgGridReactProps } from "ag-grid-react";

// model, domain
import Bookmark from "../model/Bookmark";

// store
import store from "../store/BookmarkStore";

// view

export function BookmarkViewAgGridTree(props: any) {
	const { bookmarks, onRemove, onCopy, onUpdate } = props;

	const [mapBookmark, setMapBookmark] = useState<Map<number, Bookmark>>(new Map());
	const [rowData, setRowData] = useState<any[]>([]);
	const gridRef = useRef<AgGridReact>(null);
	const columndefs: any = useMemo<AgGridReactProps[]>(() => calculateColumnDefs(mapBookmark, onRemove, onCopy), [mapBookmark, onRemove, onCopy]);

	function handleOnCellValueChanged(params: any) {
		if (!params.value) {
			return;
		}

		onUpdate({
			id: params.data.id,
			[params.colDef.field]: params.value,
		});
	}
	function handleOnGridReady() {
		if (!gridRef.current) {
			return;
		}

		gridRef.current.api.sizeColumnsToFit();
		gridRef.current.api.setGridOption("domLayout", "autoHeight");
	}

	useEffect(() => {
		const map: Map<number, Bookmark> = store.makeMap(bookmarks);
		const root = store.root(Array.from(map.values()));
		setMapBookmark(map);
		const aligned = store.traverseAndPush([], root, []);
		setRowData(aligned);
	}, [bookmarks]);

	return (<>
		<AgGridReact
			className="ag-theme-balham-dark"
			rowData={rowData}
			columnDefs={columndefs}
			defaultColDef={{
				sortable: true,
				resizable: true,
				suppressMenu: true,
			}}
			isExternalFilterPresent={() => true}
			doesExternalFilterPass={doesExternalFilterPass}
			ref={gridRef}
			onGridReady={handleOnGridReady}
			onCellValueChanged={handleOnCellValueChanged}
		/>
	</>);
}

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
function calculateColumnDefs(mapBookmark: Map<number, Bookmark>, onRemove: any, onCopy: any): any {
	const defaultColumnDefs = store.columnDefs(mapBookmark);
	return [
		...defaultColumnDefs,
		{
			field: "▒",
			editable: false,
			sortable: false,
			width: 32 + 16,
			valueFormatter: (_: any) => "∷",
			cellRenderer: (params: any) => (
				<OperateField params={params} onRemove={onRemove} onCopy={onCopy} />
			),
		},
	];
}

function OperateField(props: any) {
	const { params, onRemove, onCopy } = props;

	return (
		<OverlayTrigger
			trigger="click"
			rootClose={true}
			placement="left"
			overlay={<Popover>
				<Popover.Header as="h3">{params.data.title}</Popover.Header>
				<Popover.Body>
					<Button className="m-1" size="sm" onClick={() => { onRemove(params.data) }}>remove</Button>
					<Button className="m-1" size="sm" onClick={() => { onCopy(params.data) }}>copy</Button>
				</Popover.Body>
			</Popover>}
		>
			<span>▦</span>
		</OverlayTrigger>
	);
}

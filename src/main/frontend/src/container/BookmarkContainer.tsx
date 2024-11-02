import React, { useEffect, useMemo, useRef, useState } from "react";
import { Row, Col, Button, Modal, CloseButton, Accordion } from "react-bootstrap";
import { Form } from "react-bootstrap";
import moment from "moment";
import { AgGridReact } from "ag-grid-react";

import { BookmarkViewCard } from "../view/BookmarkViewCard";
import { BookmarkViewAgGridTree } from "../view/BookmarkViewAgGridTree";

// model, domain
import Bookmark from "../model/Bookmark";

// store
import store from "../store/BookmarkStore";

// view
import DragAndDropFile from "../view/DragAndDropFile";
import { ColDef } from "ag-grid-community";

// BookmarkContainer.tsx
export default ((props: any) => {
	const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
	const modeComponent = [
		<BookmarkViewCard
			bookmarks={bookmarks}
			onClick={(bookmark: Bookmark) => store.increaseCount(bookmark, () => setForm({ ...form }))}
		/>,
		<BookmarkViewAgGridTree
			bookmarks={bookmarks}
			onRemove={(bookmark: Bookmark) => store.remove(bookmark, () => setForm({ ...form }))}
			onCopy={(bookmark: Bookmark) => store.copy(bookmark, () => setForm({ ...form }))}
			onUpdate={(bookmark: Bookmark) => store.update(bookmark, () => setForm({ ...form }))}
		/>,
		<BookmarkViewAgGrid
			bookmarks={bookmarks}
			onRemove={(bookmark: Bookmark) => store.remove(bookmark, () => setForm({ ...form }))}
			onCopy={(bookmark: Bookmark) => store.copy(bookmark, () => setForm({ ...form }))}
			onUpdate={(bookmark: Bookmark) => store.update(bookmark, () => setForm({ ...form }))}
		/>,
	];
	const [form, setForm] = useState({
		viewMode: 0,
	});
	useEffect(() => {
		store.search({}, (_: any, response: Bookmark[]) => setBookmarks(response));
	}, [form]);

	return (<>
		{form.viewMode % modeComponent.length != 0 && (
			<SearchSection
				form={form}
				onChange={(params: any) => setForm(params)}
			/>
		)}
		{modeComponent[form.viewMode % modeComponent.length]}
		<SearchSection
			form={form}
			onChange={(params: any) => setForm(params)}
		/>
	</>);
});

function BookmarkViewAgGrid(props: any) {
	const { bookmarks, onUpdate } = props;

	const [mapBookmark, setMapBookmark] = useState<Map<number, Bookmark>>(new Map());
	const [clones, setClones] = useState<Bookmark[]>([]);
	const gridRef = useRef<AgGridReact>(null);
	const columndefs = useMemo<ColDef[]>(() => store.columnDefs(mapBookmark), [mapBookmark]);

	function handleOnCellValueChanged(params: any) {
		if (!params.value) {
			return;
		}

		onUpdate({
			sid: params.data.sid,
			id: params.data.id,
			[params.colDef.field]: params.value,
		});
	}
	function handleOnGridReady() {
		gridRef.current!.api.sizeColumnsToFit();
		gridRef.current!.api.setGridOption("domLayout", "autoHeight");
	}

	useEffect(() => {
		const map: Map<number, Bookmark> = store.makeMap(bookmarks);
		setMapBookmark(map);
	}, [bookmarks]);
	useEffect(() => {
		setClones(Array.from(mapBookmark.values()));
	}, [mapBookmark]);

	return (<>
		<AgGridReact
			className="ag-theme-balham-dark"
			rowData={clones}
			columnDefs={columndefs}
			defaultColDef={{
				sortable: true,
				resizable: true,
				suppressMenu: true,
			}}
			ref={gridRef}
			onGridReady={handleOnGridReady}
			onCellValueChanged={handleOnCellValueChanged}
		/>
	</>);
}
function SearchSection(props: any) {
	const { form, onChange } = props;
	const [showUploadModal, setShowUploadModal] = useState(false);

	return (<>
		<Form>
			<Row className="mx-0 py-1 bg-dark border-top border-secondary">
				<Col xs="1" className="px-1 me-auto"></Col>
				<Col xs="auto" className="mx-1">
					<Button size="sm" variant="secondary" className="mx-1" onClick={_ => store.countHalf()}>Count ½</Button>
					<Button size="sm" variant="secondary" className="mx-1" onClick={_ => store.aggreagateCount()}>Aggreagate Count</Button>
					<Button size="sm" variant="secondary" className="mx-1" onClick={_ => store.download(`bookmark-${moment().format("YYYYMMDD")}.json`)}>Download</Button>
					<Button size="sm" variant="secondary" className="mx-1" onClick={_ => setShowUploadModal(true)}>Upload</Button>
					<Button variant="secondary" size="sm" title={form.viewMode} onClick={_ => onChange({ ...form, viewMode: form.viewMode + 1 })}>MODE</Button>
				</Col>
			</Row>
		</Form>
		<UploadModal
			show={showUploadModal}
			onClose={() => setShowUploadModal(false)}
			onChange={(_: any) => onChange && onChange({ ...form, reload: true, })}
		/>
	</>);
}
function UploadModal(props: any) {
	const { onClose, onChange } = props;

	const [map, setMap] = useState(new Map());

	function handleOnSubmit(file: any) {
		const formData = new FormData();
		formData.append("file", file);
		store.upload(formData, (_: any, data: any) => setMap(data), () => setMap(new Map()));
	}
	function handleOnClickDeduplicate() {
		onChange && onChange({ showLogView: true });
		store.deduplicate((result: any) => {
			setMap(result);
			onChange && onChange({
				showLogView: false,
			});
		});
	}

	return (<>
		<Modal {...props} size="lg" fullscreen={"xxl-down"} centered>
			<Modal.Header>
				<Modal.Title>
					Upload Bookmark
					<Button variant="secondary" size="sm" className="mx-4" name="deduplicate" onClick={handleOnClickDeduplicate}>중복제거</Button>
				</Modal.Title>
				<CloseButton onClick={onClose} />
			</Modal.Header>
			<Modal.Body>
				<DragAndDropFile
					onSubmit={handleOnSubmit}
					types={["application/json"]}
				/>
				<ParseResultSection
					map={map}
					onChange={onChange}
				/>
			</Modal.Body>
			<Modal.Footer className="bg-black text-white overflow-auto" style={{ maxHeight: 256 }}>
				<Button variant="primary" onClick={onClose}>Close</Button>
			</Modal.Footer>
		</Modal>
	</>);
}
function ParseResultSection(props: any) {
	const { map, onChange } = props;
	const [creates, setCreates] = useState([]);
	const [updates, setUpdates] = useState([]);
	const [removes, setRemoves] = useState([]);
	const [reads, setReads] = useState([]);
	useEffect(() => {
		if (!map) {
			return;
		}
		map.creates && setCreates(map.creates);
		map.updates && setUpdates(map.updates);
		map.removes && setRemoves(map.removes);
		map.duplicates && setReads(map.duplicates);
	}, [map]);

	return (<>
		<Accordion defaultActiveKey="create" className="p-0">
			{
				(!creates || !creates.length) ? (
					<Row className="mx-1 p-2 bg-dark text-white">No Create Data!</Row>
				) : (
					<Accordion.Item eventKey={"create"}>
						<Accordion.Header>Create #{creates.length}</Accordion.Header>
						<Accordion.Body className="p-0 bg-dark text-white">
							<ParseResultCreateSection
								creates={creates}
								onChange={onChange}
							/>
						</Accordion.Body>
					</Accordion.Item>
				)
			}
			{
				(!removes || !removes.length) ? (
					<Row className="mx-1 p-2 bg-dark text-white">No Remove Data!</Row>
				) : (
					<Accordion.Item eventKey={"remove"}>
						<Accordion.Header>Remove #{removes.length}</Accordion.Header>
						<Accordion.Body className="p-0 bg-dark text-white">
							<ParseResultRemoveSection
								removes={removes}
								onChange={onChange}
							/>
						</Accordion.Body>
					</Accordion.Item>
				)
			}
			{
				(!updates || !updates.length) ? (
					<Row className="mx-1 p-2 bg-dark text-white">No Update Data!</Row>
				) : (
					<Accordion.Item eventKey={"update"}>
						<Accordion.Header>Update #{updates.length}</Accordion.Header>
						<Accordion.Body className="p-0 bg-dark text-white">
							<ParseResultUpdateSection
								updates={updates}
								onChange={onChange}
							/>
						</Accordion.Body>
					</Accordion.Item>
				)
			}
			{
				(!reads || !reads.length) ? (
					<Row className="mx-1 p-2 bg-dark text-white">No Identical Data!</Row>
				) : (
					<Accordion.Item eventKey={"read"}>
						<Accordion.Header>Just Read #{reads.length}</Accordion.Header>
						<Accordion.Body className="p-0 bg-dark text-white">
							<ParseResultReadSection
								reads={reads}
							/>
						</Accordion.Body>
					</Accordion.Item>
				)
			}
		</Accordion>
	</>);
}
function ParseResultCommonSection(props: any) {
	const { bookmarks, onClickDo, onClickDoBatch } = props;
	const gridRef = useRef<AgGridReact>(null);
	const [rowData, setRowData] = useState([]);
	const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

	useEffect(() => {
		const comlumDefs: ColDef[] = store.columnDefs(bookmarks);
		setColumnDefs(comlumDefs);
		setRowData(bookmarks.map((cx: any) => ({ ...cx, scaned: true })));
	}, [bookmarks]);
	useEffect(() => {
		gridRef && gridRef.current && gridRef.current.api && gridRef.current.api.sizeColumnsToFit();
	}, [rowData]);

	function handleOnClickDo() {
		const nodes = gridRef.current!.api.getSelectedNodes();
		onClickDo(nodes);
	}
	function handleOnClickToggleSelectAll() {
		const nodes = gridRef.current!.api.getSelectedNodes();
		nodes.length ? gridRef.current!.api.deselectAll() : gridRef.current!.api.selectAll();
	}
	function handleOnClickSelectAllAndDoBatch() {
		gridRef.current!.api.selectAll();
		const nodes = gridRef.current!.api.getSelectedNodes();
		onClickDoBatch(nodes);
	}
	function handleOnGridReady() {
		gridRef && gridRef.current && gridRef.current.api && gridRef.current.api.sizeColumnsToFit();
		gridRef.current!.api.setGridOption("domLayout", "autoHeight");
	}

	return (<>
		<Row className="mx-1 my-1">
			<Col className="me-auto">
				{onClickDo && (<Button variant="primary" size="sm" className="mx-2" onClick={handleOnClickDo}>Do</Button>)}
				{onClickDoBatch && (<>
					<Button variant="outline-warning" size="sm" className="mx-4" onClick={handleOnClickSelectAllAndDoBatch}>Select All And Do Batch</Button>
				</>)}
			</Col>
			<Col xs="auto">
				<Button variant="primary" size="sm" onClick={handleOnClickToggleSelectAll}>Toggle Select All</Button>
			</Col>
		</Row>
		<AgGridReact
			className="ag-theme-balham-dark"
			ref={gridRef}
			rowData={rowData}
			columnDefs={columnDefs}
			defaultColDef={{
				editable: true,
				sortable: true,
				resizable: true,
				suppressMenu: true,
			}}
			rowDragManaged={true}
			rowSelection="multiple"
			onGridReady={handleOnGridReady}
		/>
	</>);
}
function ParseResultCreateSection(props: any) {
	const { creates, onChange } = props;

	function handleOnClickDoBatch(nodes: any) {
		const creates = nodes.map((node: any) => node.data);
		store.batch({ creates: creates }, () => {
			nodes.forEach((node: any) => {
				node.setSelected(false);
				node.selectable = false;
				onChange && onChange(node.data);
			});
		});
	}
	return (
		<ParseResultCommonSection
			bookmarks={creates}
			onClickDoBatch={handleOnClickDoBatch}
		/>
	);
}
function ParseResultRemoveSection(props: any) {
	const { removes, onChange } = props;

	function handleOnClickDoBatch(nodes: any) {
		const removes = nodes.map((node: any) => node.data);
		store.batch({ removes: removes }, () => {
			nodes.forEach((node: any) => {
				node.setSelected(false);
				node.selectable = false;
				onChange && onChange(node.data);
			});
		});
	}

	return (
		<ParseResultCommonSection
			bookmarks={removes}
			onClickDoBatch={handleOnClickDoBatch}
		/>
	);
}
function ParseResultUpdateSection(props: any) {
	const { updates, onChange } = props;
	function handleOnClickDo(nodes: any) {
		nodes.forEach((node: any) => {
			store.update(node.data, () => {
				node.setSelected(false);
				onChange && onChange(node.data);
			});
		});
	}
	return (
		<ParseResultCommonSection
			bookmarks={updates}
			onClickDo={handleOnClickDo}
		/>
	);
}
function ParseResultReadSection(props: any) {
	const { reads } = props;
	return (
		<ParseResultCommonSection
			bookmarks={reads}
		/>
	);
}

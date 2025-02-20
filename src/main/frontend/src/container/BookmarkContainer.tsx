import React, { useEffect, useMemo, useRef, useState } from "react";
import { Form, Row, Col, Button, Dropdown, InputGroup, Modal, CloseButton, Accordion } from "react-bootstrap";
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
function BookmarkContainer(props: any) {
	const [refresh, setRefresh] = useState<boolean>(false);
	const [mode, setMode] = useState<number>(1);
	const [keyword, setKeyword] = useState<string>("한겨레");
	const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

	useEffect(() => {
		store.search({}, (_: any, response: Bookmark[]) => setBookmarks(response));
	}, [refresh]);

	function handleOnRemove(bookmark: Bookmark) {
		store.remove(bookmark, () => setRefresh(!refresh));
	}
	function handleOnCopy(bookmark: Bookmark) {
		store.copy(bookmark, () => setRefresh(!refresh));
	}
	function handleOnUpdate(bookmark: Bookmark) {
		store.update(bookmark, () => setRefresh(!refresh));
	}
	function handleOnClickMode() {
		setMode(mode + 1);
	}
	function handleOnChangeKeyword(_keyword: string) {
		setKeyword(_keyword);
	}

	return (<>
		<SearchSection
			show={mode % 3 !== 0}
			keyword={keyword}
			onClickMode={handleOnClickMode}
			onChangeKeyword={handleOnChangeKeyword}
			onChange={() => setRefresh(!refresh)}
		/>
		<BookmarkViewCard
			show={mode % 3 === 0}
			bookmarks={bookmarks}
			onClick={(bookmark: Bookmark) => store.increaseCount(bookmark, () => setRefresh(!refresh))}
		/>
		<BookmarkViewAgGridTree
			show={mode % 3 === 1}
			keyword={keyword}
			bookmarks={bookmarks}
			onRemove={handleOnRemove}
			onCopy={handleOnCopy}
			onUpdate={handleOnUpdate}
		/>
		<BookmarkViewAgGrid
			show={mode % 3 === 2}
			bookmarks={bookmarks}
			onRemove={handleOnRemove}
			onCopy={handleOnCopy}
			onUpdate={handleOnUpdate}
		/>
		<SearchSection
			show={true}
			keyword={keyword}
			onClickMode={handleOnClickMode}
			onChangeKeyword={handleOnChangeKeyword}
			onChange={() => setRefresh(!refresh)}
		/>
	</>);
}
export default BookmarkContainer;

function BookmarkViewAgGrid(props: any) {
	const { show, bookmarks, onUpdate } = props;

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
		gridRef.current?.api.sizeColumnsToFit();
		gridRef.current?.api.setGridOption("domLayout", "autoHeight");
	}

	useEffect(() => {
		const map: Map<number, Bookmark> = store.makeMap(bookmarks);
		setMapBookmark(map);
	}, [bookmarks]);
	useEffect(() => {
		setClones(Array.from(mapBookmark.values()));
	}, [mapBookmark]);

	if (!show) {
		return (<></>);
	}

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
	const { show, keyword, onClickMode, onChangeKeyword, onChange } = props;

	const [showUploadModal, setShowUploadModal] = useState(false);
	const refSearhKeyword = useRef<any>(null);

	function handleOnKeyDownKeyword(event: any) {
		(event.key === "Enter") && onChangeKeyword && onChangeKeyword(event.target.value);
	}
	function handleOnClickSubmit() {
		refSearhKeyword.current && onChangeKeyword && onChangeKeyword(refSearhKeyword.current?.value);
	}

	if (!show) {
		return (<></>);
	}

	return (<>
		<Form>
			<Row className="mx-0 py-1 bg-dark border-top border-secondary">
				<Col xs="auto" className="ps-1 pe-1">
					<Form.Control size="sm" type="search" className="bg-dark text-white" defaultValue={keyword}
						ref={refSearhKeyword}
						onKeyDown={handleOnKeyDownKeyword}
					/>
				</Col>
				<Col xs="1" className="px-1 me-auto"></Col>
				<Col xs="auto" className="mx-1">
					<InputGroup size="sm">
						<Button size="sm" variant="secondary" onClick={handleOnClickSubmit}>Submit</Button>

						<Dropdown>
							<Dropdown.Toggle id="dropdown-basic" size="sm" variant="primary" className="ms-1">메뉴</Dropdown.Toggle>
							<Dropdown.Menu>
								<Dropdown.Item onClick={_ => store.countHalf()}>Count ½</Dropdown.Item>
								<Dropdown.Item onClick={_ => store.aggreagateCount()}>Aggreagate Count</Dropdown.Item>
								<Dropdown.Item onClick={_ => store.download(`bookmark-${moment().format("YYYYMMDD")}.json`)}>Download</Dropdown.Item>
								<Dropdown.Item onClick={_ => setShowUploadModal(true)}>Upload</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown>
						<Button size="sm" variant="secondary" className="ms-1" onClick={onClickMode}>MODE</Button>
					</InputGroup>
				</Col>
			</Row>
		</Form>
		<UploadModal
			show={showUploadModal}
			onClose={() => setShowUploadModal(false)}
			onChange={onChange}
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

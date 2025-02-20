import React, { useEffect, useState } from "react";
import { Row, Col, Button, Collapse } from "react-bootstrap";

// model, domain
import Bookmark from "../model/Bookmark";

// store
import store from "../store/BookmarkStore";

// BookmarkViewCard.tsx
export function BookmarkViewCard(props: any) {
	const { show, bookmarks, onClick } = props;
	const [major, setMajor] = useState<any[]>([]);
	useEffect(() => {
		const map: Map<number, Bookmark> = store.makeMap(bookmarks);
		const root: Bookmark | null = store.root(Array.from(map.values()));

		if (!root || !root.children) {
			console.log("no root", bookmarks, root);
			return;
		}

		setMajor(root.children.sort((a: any, b: any) => b.count - a.count));
	}, [bookmarks]);

	if (!show) {
		return (<></>);
	}

	return (<>
		<Row className="text-start mx-0" xs={1} sm={2} md={3} lg={4}>
			{
				major.map((item) =>
					<Bookmark1
						key={item.id}
						bookmark={item}
						onClickBookmark={onClick}
					/>
				)
			}
		</Row>
	</>);
}

function Bookmark1(props: any) {
	const { bookmark, onClickBookmark } = props;
	const [open, setOpen] = useState(bookmark!.count > 0 && bookmark!.children!.length > 0);
	const [title, setTitle] = useState("loading");
	const [children, setChildren] = useState([]);
	function handleOnClickBookmark(event: any) {
		if (event.ctrlKey && event.shiftKey) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		setOpen(!open);
	}
	useEffect(() => {
		setTitle(bookmark!.url + " " + bookmark!.description + " #" + bookmark!.count);
		setChildren(bookmark!.children!.sort((a: any, b: any) => b.count - a.count));
	}, [bookmark]);

	return (
		<Col sm="12" md="6" className="p-1">
			<Row className="shadow mx-0">
				<Button variant="secondary" size="sm" className="text-start px-3"
					aria-controls={"aria-controls-" + bookmark.sid}
					aria-expanded={open}
					title={title}
					onClick={handleOnClickBookmark}
				>{bookmark.title}</Button>
				<Collapse in={open}>
					<Row className="m-0 p-1" id={"aria-controls-" + bookmark.sid}>
						{
							children.map((child: any) =>
								<div key={child.id} className="p-0 d-flex align-content-start flex-wrap">
									<Bookmark2
										bookmark={child}
										onClickBookmark={onClickBookmark}
									/>
								</div>
							)
						}
					</Row>
				</Collapse>
			</Row>
		</Col>
	);

}
function Bookmark2(props: any) {
	const { bookmark, onClickBookmark } = props;
	const [children, setChildren] = useState([]);
	useEffect(() => {
		setChildren(bookmark!.children!.sort((a: any, b: any) => b.count - a.count));
	}, [bookmark]);

	return (
		<>
			<Bookmark0 bookmark={bookmark} onClickBookmark={onClickBookmark} />
			{
				children.map((child: any) =>
					<Bookmark4
						key={child.id}
						bookmark={child}
						onClickBookmark={onClickBookmark}
					/>
				)
			}
		</>
	);

}
function Bookmark4(props: any) {
	const { bookmark, onClickBookmark } = props;
	const [children, setChildren] = useState([]);
	useEffect(() => {
		if (store.checkCircleLoop(bookmark, [])) {
			console.log("circle loop detected", bookmark);
			return;
		}
		/*
		*/
		setChildren(bookmark!.children!.sort((a: any, b: any) => b.count - a.count));
	}, [bookmark]);

	return (
		<>
			<Bookmark0 bookmark={bookmark} onClickBookmark={onClickBookmark} />
			{
				children.map((child: any) =>
					<Bookmark4
						key={child.id}
						bookmark={child}
						onClickBookmark={onClickBookmark}
					/>
				)
			}
		</>
	);

}
function Bookmark0(props: any) {
	const { bookmark, onClickBookmark } = props;

	const title = (bookmark!.url || "-") + " " + (bookmark!.description || "-") + " #" + bookmark!.count;
	if (!bookmark!.url) {
		return (
			<div className="d-inline me-1">
				<span
					className={"me-1 text-nowrap " + (bookmark!.children!.length ? "text-primary fw-bold" : "text-black")}
					title={title}
				>
					{bookmark!.title}
				</span>
			</div>
		);
	}

	return (
		<div className="d-inline shadow bg-dark bg-opacity-10 me-1">
			<a href={bookmark!.url}
				className={"text-decoration-none me-1 text-nowrap " + (bookmark!.children!.length ? "text-primary fw-bold" : "text-black")}
				title={title}
				target="_blank"
				rel="noopener noreferrer"
				onClick={(event) => onClickBookmark(bookmark, event)}
			>
				{bookmark!.title}
			</a>
		</div>
	);
}

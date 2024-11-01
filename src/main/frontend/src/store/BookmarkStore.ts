import { ColDef } from "ag-grid-community";
import { makeAutoObservable } from "mobx";
import moment from "moment";
import Bookmark from "../model/Bookmark";
import repository from "../repository/BookmarkRespository";
import BookmarkSelectAgGridTree from "../view/BookmarkSelectAgGridTree";
import TitleCollapseCellRenderer from "../view/CategoryTitleCollapseCellRenderer";

// BookmarkStore.ts
const ROOT_ID = 123456789;
const cellStyleLeft = { textAlign: 'left', paddingLeft: 2, };
const cellStyleRight = { textAlign: 'right', paddingRight: 4, };
const cellStyleCenter = { textAlign: 'center', padding: 0, };
const ROOT_DEFAULT: Bookmark = {
	sid: null,
	id: ROOT_ID,
	title: "잡다한 인연들",
	url: null,
	description: null,
	pid: ROOT_ID,
	count: null,
	created: null,
	updated: null,
	parent: null,
	children: [],
	depth: 0,
	collapsed: false,
};
class BookmarkStore {
	constructor() {
		makeAutoObservable(this);
	}

	create(request: any, onSuccess?: any, onError?: any, element?: any) {
		repository.create(request, onSuccess, onError, element);
	}
	copy(request: Bookmark, onSuccess?: any, onError?: any, element?: any) {
		const creating = {
			...request,
			sid: null,
			id: null,
			count: 0,
			updated: null,
			created: null,

			parent: null,
			children: null,
			depth: null,
			collapsed: null,
		};
		repository.create(creating, onSuccess, onError, element);
	}
	search(request: any, onSuccess?: any, onError?: any, element?: any) {
		repository.search(request, onSuccess, onError, element);
	}
	sample(request: any, onSuccess?: any, onError?: any, element?: any) {
		repository.sample(request, onSuccess, onError, element);
	}
	update(request: any, onSuccess?: any, onError?: any, element?: any) {
		repository.update(request, onSuccess, onError, element);
	}
	remove(request: any, onSuccess?: any, onError?: any, element?: any) {
		repository.remove(request, onSuccess, onError, element);
	}
	batch(request: any, onSuccess?: any, onError?: any, element?: any) {
		repository.batch(request, onSuccess, onError, element);
	}
	increaseCount(request: any, onSuccess?: any, onError?: any, element?: any) {
		repository.increaseCount(request, onSuccess, onError, element);
	}
	countHalf(request?: any, onSuccess?: any, onError?: any, element?: any) {
		repository.countHalf(request, onSuccess, onError, element);
	}
	aggreagateCount(request?: any, onSuccess?: any, onError?: any, element?: any) {
		repository.aggreagateCount(request, onSuccess, onError, element);
	}
	download(request: any, onSuccess?: any, onError?: any, element?: any) {
		repository.download(request, onSuccess, onError, element);
	}
	upload(request: any, onSuccess?: any, onError?: any, element?: any) {
		repository.upload(request, onSuccess, onError, element);
	}
	deduplicate(onSuccess?: any, onError?: any, element?: any) {
		repository.deduplicate(onSuccess, onError, element);
	}

	//	utils
	root(bookmarks: Bookmark[]): Bookmark | null {
		for (let bookmark of bookmarks) {
			if (bookmark.id == 0 || bookmark.pid == 0 || bookmark.id == bookmark.pid) {
				return bookmark;
			}
		}

		return null;
	}
	rootDefault(): any {
		return ROOT_DEFAULT;
	}
	makeMap(bookmarks: Bookmark[]): Map<number, Bookmark> {
		const map: Map<number, Bookmark> = new Map();
		let root: Bookmark = this.root(bookmarks) || this.rootDefault();
		map.set(root!.id, root);
		bookmarks.forEach((bookmark: Bookmark) => {
			Object.assign(bookmark, {
				children: [],
				depth: 0,
				collapsed: false,
			});

			map.set(bookmark.id, bookmark);
		});
		// make children
		map.forEach((bookmark: Bookmark | null) => {
			if (!bookmark) {
				return;
			}
			if (bookmark == root) {
				return;
			}

			const parent = map.get(bookmark!.pid);
			if (!parent) {
				//console.log("dangling node", bookmark);
				bookmark!.parent = root;
				root!.children!.push(bookmark || ROOT_DEFAULT);
				return;
			}

			if (this.checkCircleLoop(bookmark, [])) {
				//console.log("circle loop detected", bookmark);
				return;
			}
			bookmark.parent = parent;
			parent.children!.push(bookmark);
		});

		this.traverseAndSetDepth(root, 0);
		//console.log(map, bookmarks);
		return map;
	}
	checkCircleLoop(bookmark: Bookmark | null, parents: Bookmark[]): boolean {
		if (!bookmark) {
			return false;
		}

		if (parents.includes(bookmark)) {
			return true;
		}

		parents.push(bookmark)
		return this.checkCircleLoop(bookmark.parent, parents);
	}
	traverseAndSetDepth(bookmark: Bookmark | null, depth: number, parents?: Bookmark[]): boolean {
		if (!bookmark) {
			return false;
		}

		bookmark.depth = depth;
		bookmark.collapsed = depth > 0;
		bookmark.children!.sort((a, b) => (b.count || 0) - (a.count || 0));
		let loopDetect = false;
		bookmark.children!.forEach(child => {
			if (!parents) {
				this.traverseAndSetDepth(child, depth + 1, [child]);
				return;
			}

			if (parents.includes(child)) {
				loopDetect = true;
				return;
			}

			this.traverseAndSetDepth(child, depth + 1, [...parents, child]);
		});
		return loopDetect;
	}
	traverseAndPush(bookmarks: Bookmark[], bookmark: Bookmark | null, parents: Bookmark[]): Bookmark[] {
		if (!bookmark) {
			return bookmarks;
		}

		bookmarks.push(bookmark);
		bookmark.children!.forEach(child => {
			if (parents.includes(child)) {
				//console.log("circle loop detected", child, parents);
				return;
			}

			this.traverseAndPush(bookmarks, child, [...parents, child]);
		});
		return bookmarks;
	}
	findCollapsedParent(bookmark: Bookmark | null, parents?: Bookmark[]): boolean {
		if (!bookmark) {
			return false;
		}

		if (bookmark.id == 0 || bookmark == bookmark.parent) {
			return false;
		}
		if (bookmark.collapsed) {
			return true;
		}

		if (!parents) {
			return this.findCollapsedParent(bookmark.parent, [bookmark]);
		}

		if (parents.includes(bookmark)) {
			//console.log("circle loop detected", bookmark);
			return false;
		}

		return this.findCollapsedParent(bookmark.parent, [...parents, bookmark]);
	}
	columnDefs(mapBookmark: Map<number, Bookmark>, hides?: string[]): ColDef[] {
		return [{
			field: "id",
			hide: hides && hides.includes("id"),
			editable: false,
			checkboxSelection: true,
			cellStyle: cellStyleRight,
			width: 64 + 32,
		}, {
			field: "title",
			hide: hides && hides.includes("title"),
			valueFormatter: (params: any) => params.data.depth === 0 ? params.value : "",
			cellRenderer: TitleCollapseCellRenderer,
			editable: true,
			cellStyle: cellStyleLeft,
			width: 128,
			flex: 1,
		}, {
			field: "url",
			editable: true,
			hide: hides && hides.includes("url"),
			cellStyle: cellStyleLeft,
			width: 64 + 32,
			flex: 1,
		}, {
			field: "description",
			editable: true,
			hide: hides && hides.includes("description"),
			cellStyle: cellStyleLeft,
			width: 128,
		},
		{
			field: "pid",
			hide: hides && hides.includes("pid"),
			editable: true,
			cellEditor: BookmarkSelectAgGridTree,
			cellEditorPopup: true,
			cellEditorParams: {
				mapBookmark: mapBookmark,
			},
			cellStyle: cellStyleLeft,
			width: 128,
			valueFormatter: (params: any) => `${params.data.parent && params.data.parent.title} (${params.data.pid})`,
			flex: 1,
		}, {
			field: "count",
			editable: false,
			hide: hides && hides.includes("count"),
			valueFormatter: (params: any) => params.value?.toLocaleString(),
			cellStyle: cellStyleRight,
			width: 64,
		}, {
			field: "created",
			editable: false,
			hide: hides && hides.includes("created"),
			width: 80,
			valueFormatter: (params: any) => moment(params.value).format("YYYY-MM-DD"),
			cellStyle: cellStyleCenter,
		}, {
			field: "updated",
			editable: false,
			hide: hides && hides.includes("updated"),
			width: 80,
			valueFormatter: (params: any) => moment(params.value).format("YYYY-MM-DD"),
			cellStyle: cellStyleCenter,
		}, {
			field: "depth",
			editable: false,
			hide: hides && hides.includes("depth"),
			cellStyle: cellStyleRight,
			width: 32,
		}];
	}
}
export default new BookmarkStore();

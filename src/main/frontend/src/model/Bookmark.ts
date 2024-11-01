export default interface Bookmark {
	sid: number | null;
	id: number;
	title: string;
	url: string | null;
	description: string | null;
	pid: number;
	count: number | null;
	created: string | null;
	updated: string | null;
	
	parent: Bookmark | null;
	children: Bookmark[] | null;
	depth: number;
	collapsed: boolean;
}

import React, { useState } from "react";
import { Button } from "react-bootstrap";

// CategoryTitleCollapseCellRenderer.tsx
export default (props: any) => {
	const { api, data, value } = props;

	const [collapsed, setCollapsed] = useState(data!.collapsed);

	function handleOnClick() {
		data.collapsed = !data.collapsed;
		api.onFilterChanged();
		setCollapsed(data!.collapsed);
	}

	if (!data || !data.children || !data.children.length) {
		return (<>
			<span className="mx-2" style={{ paddingLeft: (data!.depth) * 32 }}>{value}</span>
		</>);
	}

	return (<>
		<Button variant="secondary-outline" size="sm" className="text-white" style={{ paddingLeft: (data.depth) * 32 }} onClick={handleOnClick}>
			{
				collapsed ? (<span className="mx-2">⯈</span>) : (<span className="mx-2">⯆</span>)
			}
		</Button>
		<span className="mx-2">{value}</span>
	</>);
};

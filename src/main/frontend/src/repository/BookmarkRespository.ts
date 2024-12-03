import axios from "axios";

class BookmarkRepository {
	async sample(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios.get("./api/sample", request)
			.then(response => onSuccess && onSuccess(request, response.data, element))
			.catch(error => onError && onError(request, error, element));
	}

	async create(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios.post("./api", request)
			.then(response => onSuccess && onSuccess(request, response.data, element))
			.catch(error => onError && onError(request, error, element));
	}
	async search(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios.post("./api/search", request)
			.then(response => onSuccess && onSuccess(request, response.data, element))
			.catch(error => onError && onError(request, error, element));
	}
	async major(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios.post("./api/search", { pid: 0, expand: true })
			.then(response => {
				axios.post("./api/search", { pid: response.data[0].pid, expand: true })
					.then(response => {
						onSuccess && onSuccess(request, response.data[0].children.sort((a: any, b: any) => b.count - a.count), element);
					})
					.catch(error => onError && onError(request, error, element));
			})
			.catch(error => onError(request, error, element));
	}
	async batch(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios.post("./api/batch", request)
			.then(response => onSuccess && onSuccess(request, response.data.content, element))
			.catch(error => onError && onError(request, error, element));
	}
	async update(request: any, onSuccess?: any, onError?: any, element?: any) {
		const updating = { ...request };
		updating.children = null;
		return axios.put("./api/" + request.id, updating)
			.then(response => onSuccess && onSuccess(request, response.data, element))
			.catch(error => onError && onError(request, error, element));
	}
	async increaseCount(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios.put(`./api/${request.id}/count`)
			.then(response => {
				onSuccess && onSuccess(request, response.data, element);
			})
			.catch(error => {
				onError && onError(request, error, element);
			});
	}
	async remove(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios.delete("./api/" + request.id)
			.then(response => onSuccess && onSuccess(request, response.data, element))
			.catch(error => onError && onError(request, error, element));
	}
	async download(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios({
			url: "./api/download",
			method: "GET",
			responseType: "blob",
		}).then(response => {
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", request);
			document.body.appendChild(link);
			link.click();
			link.parentNode!.removeChild(link);
			onSuccess && onSuccess(request, response.data, element);
		})
		.catch(error => onError && onError(request, error, element));
	}
	async upload(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios.post("./api/upload", request)
			.then(response => onSuccess && onSuccess(request, response.data, element))
			.catch(error => onError && onError(request, error, element));
	}
	async aggreagateCount(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios.get("./api/control/aggregate-count", request)
			.then(response => onSuccess && onSuccess(request, response.data, element))
			.catch(error => onError && onError(request, error, element));
	}
	async countHalf(request: any, onSuccess?: any, onError?: any, element?: any) {
		return axios.get("./api/control/decrease-count-half")
			.then(response => onSuccess && onSuccess(request, response.data, element))
			.catch(error => onError && onError(request, error, element));
	}
	async deduplicate(onSuccess?: any, onError?: any, element?: any) {
		return axios.post("./api/control/deduplicate")
			.then(response => onSuccess && onSuccess(response.data, element))
			.catch(error => onError && onError(error, element));
	}

}
const repository = new BookmarkRepository();
export default repository;

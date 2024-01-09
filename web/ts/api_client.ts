interface Package {
    arrival: string
    type: string
    description: string
    accepted_by: string
    released_by: string // may be null for packages which are pending
}

async function fetch_packages(): Promise<Package[]> {
    return await fetch_api<Package[]>('/api/packages')
}

interface MessageListing {
    id: string
    folder: string
    last_activity: string
    username: string
    subject: string
    preview: string
}

async function fetch_inbox(): Promise<MessageListing[]> {
    return await fetch_api<MessageListing[]>('/api/inbox')
}

interface MessageBody {
    body_html: string
    body_text: string
}

async function fetch_message(id: string, folder: string): Promise<MessageBody> {
    const escaped_id = encodeURIComponent(id);
    const escaped_folder = encodeURIComponent(folder);
    return await fetch_api<MessageBody>(`/api/message?id=${escaped_id}&folder=${escaped_folder}`);
}

interface WallPost {
    poster_name: string
    relative_time: string
    marketplace_name: string
    contents_text: string
    contents_html: string
}

async function fetch_wall(): Promise<WallPost[]> {
    return await fetch_api<WallPost[]>('/api/wall')
}

interface APIResponse<T> extends Object {
    error?: string
    data?: T
}

class APIError extends Error {
    constructor(message: string) {
        super(`error from API backend: ${message}`)
    }
}

async function fetch_api<T>(url: string): Promise<T> {
    const result = (await (await fetch(url)).json()) as APIResponse<T>
    if (result.hasOwnProperty('error')) {
        throw new APIError(result.error)
    }
    return result.data
}

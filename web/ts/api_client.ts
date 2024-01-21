interface Package {
    arrival: string
    type: string
    description: string
    accepted_by: string
    released_by: string // may be null for packages which are pending
}

async function fetchPackages(): Promise<Package[]> {
    return await fetchAPI<Package[]>('/api/packages')
}

interface MessageListing {
    id: string
    folder: string
    last_activity: string
    username: string
    subject: string
    preview: string
}

async function fetchInbox(): Promise<MessageListing[]> {
    return await fetchAPI<MessageListing[]>('/api/inbox')
}

interface MessageBody {
    body_html: string
    body_text: string
}

async function fetchMessage(id: string, folder: string): Promise<MessageBody> {
    const escaped_id = encodeURIComponent(id);
    const escaped_folder = encodeURIComponent(folder);
    return await fetchAPI<MessageBody>(`/api/message?id=${escaped_id}&folder=${escaped_folder}`);
}

interface WallPost {
    poster_name: string
    relative_time: string
    marketplace_name: string
    contents_text: string
    contents_html: string
}

async function fetchWall(): Promise<WallPost[]> {
    return await fetchAPI<WallPost[]>('/api/wall')
}

interface CalendarEvent {
    name: string
    allDay: boolean
    startTime: number
    endTime: number
}

async function fetchCalendar(): Promise<CalendarEvent[]> {
    return fetchScriptKey('calendar');
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

async function fetchAPI<T>(url: string): Promise<T> {
    const result = (await (await fetch(url)).json()) as APIResponse<T>
    if (result.hasOwnProperty('error')) {
        throw new APIError(result.error)
    }
    return result.data
}

async function fetchScriptKey<T>(key: string): Promise<T> {
    const data = await fetchAPI<string>('/api/kv?key=' + encodeURIComponent(key));
    return JSON.parse(data) as T;
}

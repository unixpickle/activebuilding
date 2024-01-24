interface Package {
    arrival: string
    type: string
    description: string
    accepted_by: string
    released_by: string // may be null for packages which are pending
}

async function fetchPackages(): Promise<Package[]> {
    const packages = await fetchAPI<Package[]>('/api/packages')
    const external = await fetchExternalPackages();
    external.forEach((x) => {
        packages.push(x);
    });
    packages.sort((x, y) => {
        return dateStringSortKey(y.arrival) - dateStringSortKey(x.arrival);
    });
    return packages;
}

function dateStringSortKey(x: string): number {
    const match = x.match(/([0-9]*)\/([0-9]*)\/([0-9]*),? ([0-9]*):([0-9]*)(:[0-9]*)? (AM|PM)/);
    if (!match) {
        return 0;
    }
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const year = match[3].length == 4 ? parseInt(match[3]) : parseInt('20' + match[3]);
    const hour = parseInt(match[4]);
    const minute = parseInt(match[5]);
    const ampm = match[7];
    console.log('hi', x, month, day, year, hour, minute, ampm, ((((year - 2000) * 12 + month) * 31 + day) * 24 + (ampm == 'PM' ? 12 : 0) + hour) * 60 + minute);
    return ((((year - 2000) * 12 + month) * 31 + day) * 24 + (ampm == 'PM' ? 12 : 0) + hour) * 60 + minute;
}

async function fetchExternalPackages(): Promise<Package[]> {
    return fetchScriptKey("mail");
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

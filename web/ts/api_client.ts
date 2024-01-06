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

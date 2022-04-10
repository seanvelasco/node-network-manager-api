import invokeDBUS from "../dbus"

export const getHostname = async (): Promise<string | null> => {
    try {
        const hostname: string = await invokeDBUS({
            destination: 'org.freedesktop.Avahi',
            path: '/',
            interface: 'org.freedesktop.Avahi.Server',
            member: 'GetHostName',
        })
        return hostname
    }
    catch (error) {
        console.log(error)
        return null
        
    }
}

export const setHostname = async (hostname: string | undefined) => {
    try {
        await invokeDBUS({
            destination: 'org.freedesktop.Avahi',
            path: '/',
            interface: 'org.freedesktop.Avahi.Server',
            member: 'SetHostName',
            body: [hostname],
            signature: 's',
        })
        console.log(`Hostname set to ${hostname}.`)
    }
    catch (error) {
        new Error (`Unable to change hostname: ${error}`)
        throw error
    }
}
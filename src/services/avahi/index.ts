import invokeDBUS from "../dbus"

export const getHostname = async (): Promise<string> => {
    const hostname: string = await invokeDBUS({
        destination: 'org.freedesktop.Avahi',
        path: '/',
        interface: 'org.freedesktop.Avahi.Server',
        member: 'GetHostName',
    })  
    return hostname
}

export const setHostname = async (hostname: string) => {
    await invokeDBUS({
        destination: 'org.freedesktop.Avahi',
        path: '/',
        interface: 'org.freedesktop.Avahi.Server',
        member: 'SetHostName',
        body: [hostname],
        signature: 's',
    })
}
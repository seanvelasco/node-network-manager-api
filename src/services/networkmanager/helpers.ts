import invokeDBUS from "../dbus"

export const getNetworkDevicesByPath = async (): Promise<string[]> => {
	return await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager",
		interface: "org.freedesktop.NetworkManager",
		member: "GetDevices"
	})
}

export const getConnectionSettings = async (networkPath: string): Promise<any[]> => {
	return await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: networkPath,
		interface: "org.freedesktop.NetworkManager.Settings.Connection",
		member: "GetSettings"
	})
}

export const getIpv4Settings = async (networkPath: string): Promise<{ [key: string]: string }> => {
	try {
		const [, [settingsPath]]: string = await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: networkPath,
			interface: "org.freedesktop.DBus.Properties",
			member: "Get",
			signature: "ss",
			body: [
				"org.freedesktop.NetworkManager.Device",
				"Ip4Config"
			]
		})

		const [, [[ipv4AddressData]]]: [string, string][][][] = await invokeDBUS(
			{
				destination: "org.freedesktop.NetworkManager",
				path: settingsPath,
				interface: "org.freedesktop.DBus.Properties",
				member: "Get",
				signature: "ss",
				body: [
					"org.freedesktop.NetworkManager.IP4Config",
					"AddressData"
				]
			}
		)

		const [, [gateway]]: string = await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: settingsPath,
			interface: "org.freedesktop.DBus.Properties",
			member: "Get",
			signature: "ss",
			body: [
				"org.freedesktop.NetworkManager.IP4Config",
				"Gateway"
			]
		})

		const [[, [, [address]]], [, [, [prefix]]]]: [string, string] = ipv4AddressData

		return ({ "address": address, "prefix": prefix, "gateway": gateway })
	}
	catch (error) {
		return { "address": "", "prefix": "", "gateway": "" }
	}
}
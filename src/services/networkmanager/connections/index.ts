import invokeDBUS from "../../../services/dbus"
import { connectivityStates } from "../../../config"
import { getConnectionSettings } from "../helpers"

export const activateConnection = async (
	connection,
	path: string
): Promise<void> => {
	return await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager",
		interface: "org.freedesktop.NetworkManager",
		member: "ActivateConnection",
		signature: "ooo",
		body: [connection, path, "/"]
	})
}

export const getActiveConnections = async (): Promise<object[]> => {
	const [, [activeConnections]] = await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager",
		interface: "org.freedesktop.DBus.Properties",
		member: "Get",
		signature: "ss",
		body: ["org.freedesktop.NetworkManager", "ActiveConnections"]
	})

	const activeConnectionsProperties = await Promise.all(
		activeConnections.map(async (network) => {
			const [, [value]] = await invokeDBUS({
				destination: "org.freedesktop.NetworkManager",
				path: network,
				interface: "org.freedesktop.DBus.Properties",
				member: "Get",
				signature: "ss",
				body: [
					"org.freedesktop.NetworkManager.Connection.Active",
					"Type"
				]
			})

			const [, [path]] = await invokeDBUS({
				destination: "org.freedesktop.NetworkManager",
				path: network,
				interface: "org.freedesktop.DBus.Properties",
				member: "Get",
				signature: "ss",
				body: [
					"org.freedesktop.NetworkManager.Connection.Active",
					"Connection"
				]
			})

			if (
				value === "802-11-wireless" ||
				value === "802-3-ethernet" ||
				value === "bridge"
			) {
				const connectionProperties = await getConnectionSettings(path)

				const [, connection] = connectionProperties.find(
					([setting]) => setting === "connection"
				)
				const [, [, [id]]] = connection.find(
					([setting]) => setting === "id"
				)

				// Get IP address and prefix

				// const [, [ipv4]] = await invokeDBUS({
				// 	destination: "org.freedesktop.NetworkManager",
				// 	path: network,
				// 	interface: "org.freedesktop.DBus.Properties",
				// 	member: "Get",
				// 	signature: "ss",
				// 	body: [
				// 		"org.freedesktop.NetworkManager.Connection.Active",
				// 		"Ip4Config"
				// 	]
				// })

				// const [, [address]] = ipv4.find(([setting]) => setting === "address")
				// const [, [prefix]] = ipv4.find(([setting]) => setting === "prefix")
				// const [, [gateway]] = ipv4.find(([setting]) => setting === "gateway")

				// console.log(`${id} ${value} ${address}/${prefix} ${gateway}`)

				// const iface1 = (wirelessNetworkSettings[1].find((setting) => setting[0] === "interface-name")[1][1]).toString()

				return { name: id, type: value, path: path }
			}
		})
	)
	return activeConnectionsProperties
}

export const checkConnectivity = async (): Promise<{
	[key: string]: string | number
}> => {
	const code: number = await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager",
		interface: "org.freedesktop.NetworkManager",
		member: "CheckConnectivity"
	})

	return { status: connectivityStates[code], code }
}
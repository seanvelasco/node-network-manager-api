import invokeDBUS from "../../dbus"
import { deviceTypes } from '../../../config'
import { NetworkManagerTypes } from '../../../types';

import { getIpv4Settings } from '../helpers';

export const disableDevice = async (devicePath: string): Promise<void> => {
	return await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: devicePath,
		interface: "org.freedesktop.NetworkManager.Device",
		member: "Disconnect"
	})
}

export const enableDevice = async (devicePath: string): Promise<void> => {
	return await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager",
		interface: "org.freedesktop.NetworkManager",
		member: "ActivateConnection",
		signature: "ooo",
		body: ["/", devicePath, "/"]
	})
}

export const getWirelessDevices = async (): Promise<any[]> => {
	const devices: any[] = await getNetworkDevicesByType(2)

	const wirelessDevices = await Promise.all(
		devices.map(async (device) => {
			const [, [value]] = await invokeDBUS({
				destination: "org.freedesktop.NetworkManager",
				path: device["path"],
				interface: "org.freedesktop.DBus.Properties",
				member: "Get",
				signature: "ss",
				body: [
					"org.freedesktop.NetworkManager.Device.Wireless",
					"WirelessCapabilities"
				]
			})
			const apCapable = !!(
				value & NetworkManagerTypes.WIFI_DEVICE_CAP.AP
			)
			return { ...device, apCapable }
		})
	)

	return wirelessDevices
}

export const getWiredDevices = async () => {
	return await getNetworkDevicesByType(1)
}

export const getAccessPointDevices = async () => {
	return await getNetworkDevicesByType(3)
}

export const getNetworkDevicesByPath = async (): Promise<string[]> => {
	return await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager",
		interface: "org.freedesktop.NetworkManager",
		member: "GetDevices"
	})
}

export const getNetworkDevicesByType = async (
	type: number
): Promise<string[]> => {
	try {
		const networkDevicePaths: string[] = await getNetworkDevicesByPath()
		const devices: any = []

		await Promise.all(
			networkDevicePaths.map(async (path) => {
				const [, [deviceType]] = await invokeDBUS({
					destination: "org.freedesktop.NetworkManager",
					path: path,
					interface: "org.freedesktop.DBus.Properties",
					member: "Get",
					signature: "ss",
					body: [
						"org.freedesktop.NetworkManager.Device",
						"DeviceType"
					]
				}) // Returns Device Type 0: Unknown, 1: Ethernet, 2: WiFi, 14: Generic (Virtual)

				if (deviceType == type) {
					// const [, [ip4ConfigDns]] = await invokeDBUS({
					// 	destination: "org.freedesktop.NetworkManager",
					// 	path: ipv4Path,
					// 	interface: "org.freedesktop.DBus.Properties",
					// 	member: "Get",
					// 	signature: "ss",
					// 	body: ["org.freedesktop.NetworkManager.IP4Config", "Nameservers"]
					// })

					// const [, [ip4ConfigDnsDomains]] = await invokeDBUS({
					// 	destination: "org.freedesktop.NetworkManager",
					// 	path: ipv4Path,
					// 	interface: "org.freedesktop.DBus.Properties",
					// 	member: "Get",
					// 	signature: "ss",
					// 	body: ["org.freedesktop.NetworkManager.IP4Config", "Domains"]
					// })

					// const [, [ip4ConfigDnsSearches]] = await invokeDBUS({
					// 	destination: "org.freedesktop.NetworkManager",
					// 	path: ipv4Path,
					// 	interface: "org.freedesktop.DBus.Properties",
					// 	member: "Get",
					// 	signature: "ss",
					// 	body: ["org.freedesktop.NetworkManager.IP4Config", "Searches"]
					// })

					// const [, [ip4ConfigRoutes]] = await invokeDBUS({
					// 	destination: "org.freedesktop.NetworkManager",
					// 	path: ipv4Path,
					// 	interface: "org.freedesktop.DBus.Properties",
					// 	member: "Get",
					// 	signature: "ss",
					// 	body: ["org.freedesktop.NetworkManager.IP4Config", "Routes"]
					// })

					// const [, [ip4ConfigRoutesGateway]] = await invokeDBUS({
					// 	destination: "org.freedesktop.NetworkManager",
					// 	path: ipv4Path,
					// 	interface: "org.freedesktop.DBus.Properties",
					// 	member: "Get",
					// 	signature: "ss",
					// 	body: ["org.freedesktop.NetworkManager.IP4Config", "Routes"]
					// })

					//console.log([ip4ConfigAddress])
					// console.log('IP Address', ip_addr)
					// console.log('IP Address Simplified', ipp)

					// console.log(ip4ConfigDns)
					// console.log(ip4ConfigDnsDomains)
					// console.log(ip4ConfigDnsSearches)
					// console.log(ip4ConfigRoutes)
					// console.log(ip4ConfigRoutesGateway)

					// const attributes = ['Ip4Connectivity', 'Interface', 'Driver']

					// const devices2 = attributes.map(async (attribute) => {
					// 	const [, [value]] = await invokeDBUS({
					// 		destination: "org.freedesktop.NetworkManager",
					// 		path: path,
					// 		interface: "org.freedesktop.DBus.Properties",
					// 		member: "Get",
					// 		signature: "ss",
					// 		body: ["org.freedesktop.NetworkManager.Device", attribute]
					// 	})
					// 	return {attribute: value}
					// })
					// devices3.push(devices2, {path})

					const [, [connectivity]] = await invokeDBUS({
						destination: "org.freedesktop.NetworkManager",
						path: path,
						interface: "org.freedesktop.DBus.Properties",
						member: "Get",
						signature: "ss",
						body: [
							"org.freedesktop.NetworkManager.Device",
							"Ip4Connectivity"
						]
					})

					const connected: boolean =
						connectivity === NetworkManagerTypes.CONNECTIVITY.FULL

					const [, [iface]]: string = await invokeDBUS({
						destination: "org.freedesktop.NetworkManager",
						path: path,
						interface: "org.freedesktop.DBus.Properties",
						member: "Get",
						signature: "ss",
						body: [
							"org.freedesktop.NetworkManager.Device",
							"Interface"
						]
					})

					const [, [driver]]: string = await invokeDBUS({
						destination: "org.freedesktop.NetworkManager",
						path: path,
						interface: "org.freedesktop.DBus.Properties",
						member: "Get",
						signature: "ss",
						body: [
							"org.freedesktop.NetworkManager.Device",
							"Driver"
						]
					})

					const typeName: string =
						Object.keys(NetworkManagerTypes.DEVICE_TYPE).find(
							(key) =>
								NetworkManagerTypes.DEVICE_TYPE[key] === type
						) || "UNKNOWN"

					const device = deviceTypes[type]

					const ipv4 = await getIpv4Settings(path)

					devices.push({
						connectivity: connected,
						path: path,
						interface: iface,
						driver: driver,
						type: typeName,
						type_literal: device,
						address: ipv4.address || null,
						prefix: ipv4.prefix || null,
						gateway: ipv4.gateway || null
					})
				}
			})
		)
		return devices
	} catch (error) {
		console.log(error)
		return []
	}
}
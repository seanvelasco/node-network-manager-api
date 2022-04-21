import invokeDBUS from "../dbus"
import { v4 as uuidv4 } from "uuid"
import { stringToArrayOfBytes, stringToArrayOfNumbers } from "../../utils"


//////////////////// DEVICE-RELATED ////////////////////

// import everything from './devices/device'
import { disableDevice, enableDevice, getWiredDevices, getWirelessDevices, getAccessPointDevices } from "./devices"



//////////////////// CONNECTION-RELATED ////////////////////
import { activateConnection, getActiveConnections, checkConnectivity } from "./connections"



//////////////////// NETWORK-RELATED ////////////////////
import { replaceNetwork, scanWirelessNetworks, addNetwork, createAccessPoint, listSavedNetworks, forgetNetwork  } from "./network"

import { internetSharingOverEthernet } from "./options"

export {
	disableDevice, enableDevice, getWiredDevices, getWirelessDevices, getAccessPointDevices,
	activateConnection, getActiveConnections, checkConnectivity,
	replaceNetwork, scanWirelessNetworks, addNetwork, createAccessPoint, listSavedNetworks, forgetNetwork,
	internetSharingOverEthernet
}

// NetworkManager over DBUS equivalent of ifup eth0 <ipv4 address> <netmask> <gateway>

export const setStaticIpv4 = async () => {
	const settings = [
		[
			"connection",
			[
				["id", ["s", "Static IPv4"]],
				["type", ["s", "802-3-ethernet"]]
			]
		],
		[
			"802-3-ethernet",
			[
				["auto-negotiate", ["b", false]]
				// ["mode", ["s", "infrastructure"]]
			]
		],

		[
			"ipv4",
			[
				["method", ["s", "manual"]],
				[
					"address-data",
					[
						"aa{sv}",
						[
							[
								["address", ["s", "192.168.8.100"]],
								["prefix", ["u", 24]]
							]
						]
					]
				],
				["gateway", ["s", "0.0.0.0"]],

				// Set DNS to Google, signature "au"
				["dns", ["au", stringToArrayOfNumbers("8.8.8.8")]], // ["dns", ["au", [8, 8, 8, 8]]],

				// ["dns", ["as", [dns]]],
				// routes aau
				["routes", ["aau", []]]
			]
		],
		["ipv6", [["method", ["s", "ignore"]]]]
	]

	const settingsPath = await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager/Settings",
		interface: "org.freedesktop.NetworkManager.Settings",
		member: "AddConnection",
		signature: "a{sa{sv}}",
		body: [settings]
	})

	return settingsPath
}

export const ipv4 = async (): Promise<any> => {
	try {
		const wiredDevices = getWiredDevices()
		const wirelessDevices = getWirelessDevices()

		// const [, ap] = await invokeDBUS({
		// 	destination: "org.freedesktop.NetworkManager",
		// 	path: wirelessDevices[0]['path'],
		// 	interface: "org.freedesktop.NetworkManager.IP4Config",
		// 	member: "Ip4Config",
		// })

		// const [, ethernet] = await invokeDBUS({
		// 	destination: "org.freedesktop.NetworkManager",
		// 	path: wiredDevices[0],
		// 	interface: "org.freedesktop.NetworkManager.IP4Config",
		// 	member: "Ip4Config",

		// })

		const [, [wireless]] = await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: "/org/freedesktop/NetworkManager/Settings/23",
			interface: "org.freedesktop.DBus.Properties",
			member: "Get",
			signature: "ss",
			body: ["org.freedesktop.NetworkManager.Device", "Ip4Config"]
		})
		console.dir(wireless)

		return null
	} catch (error) {
		console.error(`Unable to get IPv4 address: ${error}.`)
		return null
	}
}


const setStaticIP = async (
	device: string,
	ip: string,
	netmask: string,
	gateway: string
) => {
	const settings = [
		[
			"connection",
			[
				["id", "Static IP"],
				["uuid", uuidv4()],
				["type", "802-3-ethernet"],
				["autoconnect", false],
				["interface-name", device],
				[
					"ipv4",
					[
						["method", "manual"],
						[
							"address-data",
							[
								["address", ip],
								["netmask", netmask],
								["gateway", gateway]
							]
						]
					]
				]
			]
		]
	]

	try {
		const [, [connectionPath]] = await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: "/org/freedesktop/NetworkManager/Settings",
			interface: "org.freedesktop.NetworkManager.Settings",
			member: "AddConnection",
			signature: "a{sa{sv}}",
			body: settings
		})

		await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: "/org/freedesktop/NetworkManager/Settings",
			interface: "org.freedesktop.NetworkManager.Settings",
			member: "ActivateConnection",
			signature: "ooa{sv}",
			body: [connectionPath, device, {}]
		})
	} catch (error) {
		console.error(`Unable to set Static IP: ${error}.`)
	}
}



// export const getSettings = async (ssid: string): Promise<any> => {
// 	try {
// 		const settings = await invokeDBUS({
// 			destination: "org.freedesktop.NetworkManager",
// 			path: "/org/freedesktop/NetworkManager/Settings",
// 			interface: "org.freedesktop.NetworkManager.Settings",
// 			member: "ListConnections",
// 			signature: "",
// 			body: []
// 		})

// 		const connection = settings.find(
// 			(setting) => setting.connection.id === ssid
// 		)

// 		if (connection) {
// 			return connection
// 		} else {
// 			throw new Error(`Unable to find connection: ${ssid}`)
// 		}
// 	} catch (error) {
// 		new Error(`Unable to get settings: ${error}`)
// 		throw error
// 	}
// }


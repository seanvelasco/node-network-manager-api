import invokeDBUS from "../dbus";
import { v4 as uuidv4 } from "uuid";
import { NetworkManagerTypes } from "../../types";
import { stringToArrayOfBytes, stringToArrayOfNumbers } from "../../utils";
import { deviceTypes, connectivityStates } from "../../constants";
import {
	getNetworkDevicesByPath,
	getConnectionSettings,
	getIpv4Settings
} from "./helpers";

export const networkValidator = async (
	ssid?: string
): Promise<string | null> => {
	if (!ssid || ssid == "") {
		throw "Wireless network credentials not given.";
	}
	const savedNetworks: any = await listSavedConnections();
	const duplicateNetwork = savedNetworks.find(
		(network) => network["ssid"] === ssid
	);

	if (duplicateNetwork) {
		return duplicateNetwork["path"];
	} else {
		return null;
	}
};

export const getNetworkDevicesByType = async (
	type: number
): Promise<string[]> => {
	try {
		const networkDevicePaths: string[] = await getNetworkDevicesByPath();
		const devices: any = [];

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
				}); // Returns Device Type 0: Unknown, 1: Ethernet, 2: WiFi, 14: Generic (Virtual)

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
					});

					const connected: boolean =
						connectivity === NetworkManagerTypes.CONNECTIVITY.FULL;

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
					});

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
					});

					const typeName: string =
						Object.keys(NetworkManagerTypes.DEVICE_TYPE).find(
							(key) =>
								NetworkManagerTypes.DEVICE_TYPE[key] === type
						) || "UNKNOWN";

					const device = deviceTypes[type];

					const ipv4 = await getIpv4Settings(path);

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
					});
				}
			})
		);
		return devices;
	} catch (error) {
		console.log(error);
		return [];
	}
};

export const disableDevice = async (devicePath: string): Promise<void> => {
	return await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: devicePath,
		interface: "org.freedesktop.NetworkManager.Device",
		member: "Disconnect"
	});
};

export const enableDevice = async (devicePath: string): Promise<void> => {
	return await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager",
		interface: "org.freedesktop.NetworkManager",
		member: "ActivateConnection",
		signature: "ooo",
		body: ["/", devicePath, "/"]
	});
};

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
	});
};

const replaceConnection = async (ssid?: string): Promise<string> => {
	await forgetNetwork(ssid);
	return await addNetwork(ssid);
};

export const getActiveConnections = async (): Promise<object[]> => {
	const [, [activeConnections]] = await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager",
		interface: "org.freedesktop.DBus.Properties",
		member: "Get",
		signature: "ss",
		body: ["org.freedesktop.NetworkManager", "ActiveConnections"]
	});

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
			});

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
			});

			if (
				value === "802-11-wireless" ||
				value === "802-3-ethernet" ||
				value === "bridge"
			) {
				const connectionProperties = await getConnectionSettings(path);

				const [, connection] = connectionProperties.find(
					([setting]) => setting === "connection"
				);
				const [, [, [id]]] = connection.find(
					([setting]) => setting === "id"
				);

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

				return { name: id, type: value, path: path };
			}
		})
	);
	return activeConnectionsProperties;
};

export const scanWirelessNetworks = async (
	devicePath: string
): Promise<object[]> => {
	const [, [networkPaths]] = await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: devicePath,
		interface: "org.freedesktop.DBus.Properties",
		member: "Get",
		signature: "ss",
		body: ["org.freedesktop.NetworkManager.Device.Wireless", "AccessPoints"]
	});

	const properties = [
		"Ssid",
		"Frequency",
		"Strength",
		"Mode",
		"HwAddress",
		"MaxBitrate",
		"Flags",
		"WpaFlags",
		"RsnFlags",
		"LastSeen"
	];

	const availableNetworks: object[] = [];

	await Promise.all(
		networkPaths.map(async (networkPath) => {
			const property: { [key: string]: string } = {};
			await Promise.all(
				properties.map(async (attr) => {
					const [, [value]] = await invokeDBUS({
						destination: "org.freedesktop.NetworkManager",
						path: networkPath,
						interface: "org.freedesktop.DBus.Properties",
						member: "Get",
						signature: "ss",
						body: [
							"org.freedesktop.NetworkManager.AccessPoint",
							attr
						]
					});

					property[attr] = value.toString();
				})
			);
			availableNetworks.push(property);
		})
	);
	return availableNetworks;
};

export const checkConnectivity = async (): Promise<{
	[key: string]: string | number;
}> => {
	const code: number = await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager",
		interface: "org.freedesktop.NetworkManager",
		member: "CheckConnectivity"
	});

	return { status: connectivityStates[code], code };
};

export const getWirelessDevices = async (): Promise<any[]> => {
	const devices: any[] = await getNetworkDevicesByType(2);

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
			});
			const apCapable = !!(
				value & NetworkManagerTypes.WIFI_DEVICE_CAP.AP
			);
			return { ...device, apCapable };
		})
	);

	return wirelessDevices;
};

export const getWiredDevices = async () => {
	return await getNetworkDevicesByType(1);
};

export const getAccessPointDevices = async () => {
	return await getNetworkDevicesByType(3);
};

export const addNetwork = async (
	ssid?: string,
	password?: string,
	force?: boolean,
	manual?: { [key: string]: string }
): Promise<string> => {
	// Skip saving a wireless network if the given SSID matches an existing network and the force flag is not set
	// If the force flag is set, the existing network will be forgotten first and then the new network will be saved

	try {
		if (
			(await networkValidator(ssid)) &&
			(force === null || force === false)
		) {
			throw `Network configuration for ${ssid} already exists.\nNetwork Manager may connect to this network if found unless overriden in later steps in Setup Mode.\nTo override, use the force flag (force=true).`;
		} else if ((await networkValidator(ssid)) && force === true) {
			console.log(
				`Network configuration for ${ssid} already exists.\nAttempting to replace existing network.`
			);
			return await replaceConnection();
		}

		const settings = [
			[
				"connection",
				[
					["id", ["s", ssid]],
					["type", ["s", "802-11-wireless"]]
				]
			],
			[
				"802-11-wireless",
				[
					["ssid", ["ay", stringToArrayOfBytes(ssid)]],
					["mode", ["s", "infrastructure"]]
				]
			],
			[
				"802-11-wireless-security",
				[
					["key-mgmt", ["s", "wpa-psk"]],
					["psk", ["s", password]]
				]
			],

			["ipv6", [["method", ["s", "auto"]]]]
		];

		if (manual) {
			// const ipAddress = "192.168.1.100"
			// const netmask = "255.255.255.0"
			// const gateway = "192.168.1.1"
			// const dns = "8.8.8.8"

			const method = [
				"ipv4",
				[
					["method", ["s", "manual"]],
					[
						"address-data",
						[
							"aa{sv}",
							[
								[
									["address", ["s", manual.address]],
									["prefix", ["u", 24]]
								]
							]
						]
					],

					["gateway", ["s", manual.gateway]],

					// Set DNS to Google, signature "au"
					["dns", ["au", stringToArrayOfNumbers(manual.dns)]], // ["dns", ["au", [8, 8, 8, 8]]],

					// ["dns", ["as", [dns]]],
					// routes aau
					["routes", ["aau", []]]
					// ["netmask", ["s", netmask]]
				]
			];
			settings.push(method);
		} else {
			// ["ipv4", [["method", ["s", "auto"]]]], // 'auto' = dhcp, 'manual' = static
			const method = ["ipv4", [["method", ["s", "auto"]]]];
			settings.push(method);
		}

		return await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: "/org/freedesktop/NetworkManager/Settings",
			interface: "org.freedesktop.NetworkManager.Settings",
			member: "AddConnection",
			signature: "a{sa{sv}}",
			body: [settings]
		});
	} catch (error) {
		new Error(`Unable to add network: ${error}`);
		throw error;
	}
};

export const forgetNetwork = async (
	networkPath?: string,
	ssid?: string
): Promise<void> => {
	// networkValidator() returns a network settings path if an SSID matches an existing network

	const derivedNetworkPath: string | null = await networkValidator(ssid);

	// Use network settings path if provided, otherwise use SSID to derive network settings path

	return await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: networkPath || derivedNetworkPath,
		interface: "org.freedesktop.NetworkManager.Settings.Connection",
		member: "Delete"
	});
};

export const listSavedConnections = async (): Promise<
	(object | undefined)[] | undefined
> => {
	try {
		// Among list of saved settings, if a wireless network setting is found, locate SSID
		// The pattern of structuring/de-structuring the return value of getConnectionSettings() into an object or dictionary ...
		// ... owes to the fact its return value is an array of arrays, where each array is a flattened dictionary of key-value pairs

		// Get all network-related settings

		const networkSettingList: string[] = await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: "/org/freedesktop/NetworkManager/Settings",
			interface: "org.freedesktop.NetworkManager.Settings",
			member: "ListConnections"
		});

		const savedConnections = await Promise.all(
			networkSettingList.map(async (network) => {
				const networkSettings = await getConnectionSettings(network); // Get properties of an instance of a network settng
				const wirelessNetworkSettings = networkSettings.find(
					(setting) => setting[0] === "802-11-wireless"
				);
				if (wirelessNetworkSettings) {
					// Filter for wireless network settings
					const [, settings] = wirelessNetworkSettings;
					const wirelessNetworkSSID = settings.find(
						(setting) => setting[0] === "ssid"
					);
					if (wirelessNetworkSSID) {
						const [, [, [SSID]]] = wirelessNetworkSSID;
						return { ssid: SSID.toString(), path: network };
					}
				}
			})
		);

		return savedConnections.filter((element) => element); // Returns array of saved wireless connections with removed undefined or nullified elements

		// Network validation for avoiding duplicates is unable to perform its function if there is an undefined or nullified element in the array
	} catch (error) {
		throw "No saved networks found.";
	}
};

export const createAccessPoint = async (
	ssid: string | undefined,
	password: string | undefined,
	device: { [key: string]: string }
) => {
	try {
		// Returns a network settings path if the SSID of the Access Point matches an existing network
		const networkInstance = await networkValidator(ssid);

		if (networkInstance) {
			console.log(
				`Using existing configuration for creating ${ssid} Access Point using ${device["driver"]} (${device["iface"]}).`
			);

			// Use existing network settings path & network device path to create Access Point
			await activateConnection(networkInstance, device["path"]);

			console.log(
				`Access Point credentials\nSSID: ${ssid}\nPassword: ${password}\n`
			);

			return;
		}

		const settings = [
			[
				"connection",
				[
					["id", ["s", ssid]],
					["type", ["s", "802-11-wireless"]]
				]
			],
			[
				"802-11-wireless",
				[
					["ssid", ["ay", stringToArrayOfBytes(ssid)]],
					["mode", ["s", "ap"]]
				]
			],
			[
				"802-11-wireless-security",
				[
					["key-mgmt", ["s", "wpa-psk"]],
					["psk", ["s", password]],
					["group", ["as", ["ccmp"]]], // Enables WPA2-PSK
					["pairwise", ["as", ["ccmp"]]], // Enables WPA2-PSK
					["proto", ["as", ["rsn"]]] // Enables WPA2-PSK
				]
			],
			["ipv4", [["method", ["s", "shared"]]]], // Launches a dnsmasq process & creates the appropriate NAT rules for internet sharing
			["ipv6", [["method", ["s", "ignore"]]]] // Disables IPv6
		];

		const connection = await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: "/org/freedesktop/NetworkManager/Settings",
			interface: "org.freedesktop.NetworkManager.Settings",
			member: "AddConnection",
			signature: "a{sa{sv}}",
			body: [settings]
		});

		console.log(
			`Creating an Access Point using ${device["driver"]} (${device["iface"]}) for the first time.`
		);

		await activateConnection(connection, device["path"]);

		console.log(
			`Access Point credentials\nSSID: ${ssid}\nPassword: ${password}\n`
		);

		return;
	} catch (error) {
		console.error(`Unable to create an Access Point: ${error}.`);
	}
};

export const internetSharingOverEthernet = async () => {
	try {
		const settings = [
			[
				"connection",
				[
					["id", ["s", "Internet Sharing over Ethernet"]],
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

			["ipv4", [["method", ["s", "shared"]]]],
			["ipv6", [["method", ["s", "ignore"]]]]
		];

		const settingsPath = await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: "/org/freedesktop/NetworkManager/Settings",
			interface: "org.freedesktop.NetworkManager.Settings",
			member: "AddConnection",
			signature: "a{sa{sv}}",
			body: [settings]
		});

		return settingsPath;
	} catch (error) {
		console.log(error);
	}
};

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
	];

	const settingsPath = await invokeDBUS({
		destination: "org.freedesktop.NetworkManager",
		path: "/org/freedesktop/NetworkManager/Settings",
		interface: "org.freedesktop.NetworkManager.Settings",
		member: "AddConnection",
		signature: "a{sa{sv}}",
		body: [settings]
	});

	return settingsPath;
};
































































































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



export const getSettings = async (ssid: string): Promise<any> => {
	try {
		const settings = await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: "/org/freedesktop/NetworkManager/Settings",
			interface: "org.freedesktop.NetworkManager.Settings",
			member: "ListConnections",
			signature: "",
			body: []
		})

		const connection = settings.find(
			(setting) => setting.connection.id === ssid
		)

		if (connection) {
			return connection
		} else {
			throw new Error(`Unable to find connection: ${ssid}`)
		}
	} catch (error) {
		new Error(`Unable to get settings: ${error}`)
		throw error
	}
}


const createEthernetConnection = async (
	iface: string,
	ipv4Method: string,
	ipv4Address: string,
	ipv4Netmask: string,
	ipv4Gateway: string,
	ipv4DNS: string
) => {
	try {
		const settings = [
			[
				"connection",
				[
					["id", ["s", "Router mode"]],
					["type", ["s", "ethernet"]]
				]
			],
			[
				"ipv4",
				[
					["method", ["s", "shared"]],
				]
			]
		]

		const connection = await invokeDBUS({
			destination: "org.freedesktop.NetworkManager",
			path: "/org/freedesktop/NetworkManager/Settings",
			interface: "org.freedesktop.NetworkManager.Settings",
			member: "AddConnection",
			signature: "a{sa{sv}}",
			body: [settings]
		})

		await activateConnection(connection, iface)

		return
	} catch (error) {
		console.error(`Unable to create an Ethernet Connection: ${error}.`)
	}
}





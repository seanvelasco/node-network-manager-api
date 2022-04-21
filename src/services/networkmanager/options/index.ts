import invokeDBUS from "../../../services/dbus"

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
	} catch (error) {
		console.log(error)
	}
}
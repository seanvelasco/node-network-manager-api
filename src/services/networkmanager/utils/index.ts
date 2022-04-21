import { listSavedNetworks } from '../network'

export const networkValidator = async (ssid: string): Promise<any> => {
	if (!ssid || ssid == "") {
		throw "Wireless network credentials not given."
	}
	const savedNetworks = await listSavedNetworks()
	const duplicateNetwork = savedNetworks.find((network) => network["ssid"] === ssid)

	if (duplicateNetwork) {
		return duplicateNetwork["path"]
	} else {
		return null
	}
}
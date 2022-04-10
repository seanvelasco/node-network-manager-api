import {
    HOSTNAME, IPV4_ADDRESS, AP_SSID, AP_PASSWORD, WIFI_SSID, WIFI_PASSWORD, PORT
} from "./constants"

import express from "express"
import cors from "cors"

import api from "./functions/server"

import { getHostname, setHostname } from "./services/avahi"

import {
    addNetwork,
    disableDevice,
    scanWirelessNetworks,
    checkConnectivity,
    getWiredDevices,
    getWirelessDevices,
    createAccessPoint,
    listSavedConnections,
    getActiveConnections,
    activateConnection,
    forgetNetwork,
    internetSharingOverEthernet,
    setStaticIpv4,
    getAccessPointDevices
} from "./services/networkmanager"

// import changeHostname from "./services/avahi"

const initializeNetwork = async () => {

    // Configure hostname device discoverability using Avahi

    try {
        const hostname = await getHostname()
        if (hostname !== HOSTNAME) {
            await setHostname(HOSTNAME)
            console.log(`Hostname set to ${HOSTNAME}`)
        }
        console.log(`DashBox services can be accessed at http://${HOSTNAME}.local.`)
    }
    catch (error) {
        console.log(error)
    }

    // Add a wireless netwrok
    // Network Manager will automatically connect to saved networks if available
    // Overridden by activateConnection(wiressNetwork['path'])
    // Has built-in validation to avoid saving duplicate wireless networks

    try {
        await addNetwork(WIFI_SSID, WIFI_PASSWORD)
        console.log(`Added wireless network ${WIFI_SSID}.`)
    } catch (error) {
        console.warn(error)
    }

    // Get list of wireless devices (RPi onboard WiFi, TP-Link donlge, etc)
    

    // if (wirelessDevices) {
    // 	console.log("Wireless devices")
    // 	console.log(wirelessDevices)
    // }

    // Get list of wired devices (Ethernet, USB-tethered network, etc)
    // const wiredDevices = await getWiredDevices()
    // if (wiredDevices) {
    // 	console.log("Wired Devices")
    // 	console.log(wiredDevices)
    //     try {
    //         await activateConnection('/', wiredDevices[0]['path'])
    //         console.log(await getWiredDevices())
    //     }
    //     catch (error) {
    //         console.log(`Unable to start ethernet service: ${error}`)
    //     }
    // }

    // Get first wireless device that has an Access Point capability
    

    // Scan for wireless networks using the primary network device if using wireless device

    try {
        const wirelessDevices = await getWirelessDevices()
        console.log(wirelessDevices)

    if (wirelessDevices) {
        const scanNetworkResult = await scanWirelessNetworks(wirelessDevices[0]["path"])
        console.log(scanNetworkResult)
    }

    const accessPoint = wirelessDevices.find((device) => device.apCapable)

    // Create an access point using the secondary network device
    if (accessPoint) {
        await createAccessPoint(AP_SSID, AP_PASSWORD, accessPoint)
    }
    }
    catch (error) {
        console.log(error)
    }

    // Report which network device is connected to which network
    try {
        const activeConnections = await getActiveConnections()
        console.log(activeConnections)
    } catch (error) {
        console.log(error)
    }

    try {
        await internetSharingOverEthernet()
        // const staticIpv4 = await setStaticIpv4()
        console.log('Internet sharing over ethernet enabled.')
    }
    catch (error) {
        console.log(error)
    }

}


initializeNetwork()
api()
import {
    HOSTNAME, IPV4_ADDRESS, AP_SSID, AP_PASSWORD, WIFI_SSID, WIFI_PASSWORD, PORT
} from "../constants"

import express from "express"
import cors from "cors"

import { getHostname, setHostname } from "../services/avahi"

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
} from "../services/networkmanager"


const api = () => {

    const server = express()

    server.use(express.urlencoded({ extended: true }))
    server.use(express.json())
    server.use(cors())

    server.listen(PORT, () => [
        console.log(`Network Manager API listening on  port ${PORT}`)
    ])

    server.get("/", async (request, response) => {
        try {

            const hostname = await getHostname()

            const connectivity = await checkConnectivity()

            try {
                const wirelessDevices = await getWirelessDevices()

                const wiredDevices = await getWiredDevices()

                const accessPoints = await getAccessPointDevices()

                console.log(wirelessDevices)
                console.log(wiredDevices)
                console.log(accessPoints)
            }

            catch (error) {
                console.log(error)
            }

            const manifest: { [key: string]: any | string | string[] | undefined } = {
                "hostname": hostname,
                //"state": state
                // "ipv4": [
                //     IPV4_ADDRESS
                // ],
                // "Ipv6": [
                //     IPV4_ADDRESS
                // ],
                "connectivity": {
                    "status": connectivity.status,
                    "code": connectivity.code
                },
                // "wirelessDevices": wirelessDevices,
                // "wiredDevices": wiredDevices,
                // "accessPoints": accessPoints
                // "wireless": {
                //     ssid: WIFI_SSID,
                //     password: WIFI_PASSWORD,
                //     connectivity: true
                // },
                // "access-point": {
                //     ssid: AP_SSID,
                //     password: AP_PASSWORD,
                // },
                // "ethernet": {
                //     connectivity: true
                // }
            }
            response.status(200).json(manifest)
        } catch (error) {
            console.log(error)
            response.status(400).json(error)
        }
    })
    /*
    server.post('/connect', async (request, response) => {
        try {
            await activateConnection(request.body.network, request.body.device)
            response.status(200).json(`Successfully connected to ${request.body.ssid} `)
        } catch(error) {
            response.status(400).json(`${error}`)
        }
    })
    
    server.post('/disconnect', async (request, response) => {
        try {
            await disableDevice(request.body.path)
            response.status(200).json(`Disconnected to ${request.body.ssid} `)
        } catch(error) {
            response.status(400).json(`${error}`)
        }
    })
    */

    server.post("/add", async (request, response) => {
        try {
            await addNetwork(
                request.body.ssid,
                request.body.password,
                request.body.force
            )
            response.status(200).json(`Successfully added ${request.body.ssid}`)
        } catch (error) {
            response.status(400).json(error)
        }
    })

    server.post("/forget", async (request, response) => {
        try {
            await forgetNetwork(request.body.path, request.body.ssid)
            if (request.body.ssid) {
                response.status(200).json(`Successfully forgotten ${request.body.ssid}`)
            }
            else {
                response.status(200).json(`Successfully forgotten network`)
            }
        }
        catch (error) {
            response.status(400).json(error)
        }
    })

    server.get("/current", async (request, response) => {
        const wirelessDevices = await getWirelessDevices()
        const connectedNetwork = wirelessDevices.find((device) => device.connected)
        response.sendStatus(200)
    })

    server.get("/active", async (request, response) => {
        response.status(200).json(await getActiveConnections())
    })

    server.get("/saved", async (request, response) => {
        response.status(200).json(await listSavedConnections())
    })

    server.get("/scan", async (request, response) => {
        try {
            const wirelessDevices = await getWirelessDevices()
            const accessPoint = wirelessDevices.find((device) => device.apCapable)
            const wirelessDevice = wirelessDevices.find(
                (device) => device != accessPoint
            )
            if (!wirelessDevice) {
                throw "No wireless device found."
            }
            const nearbyNetworks = await scanWirelessNetworks(
                wirelessDevice["path"]
            )
            response.status(200).json(nearbyNetworks)
        } catch (error) {
            new Error(`Unable to scan for wireless networks: ${error}`)
            response.status(400).json(error)
        }
    })

    server.get("/connectivity", async (request, response) => {
        response.status(200).json(await checkConnectivity())
    })

    server.get("/toggle", async (request, response) => {
        const wirelessDevices = await getWirelessDevices()
        const currentWirelessDevice = wirelessDevices.find(
            (device) => device.connected
        )
        if (currentWirelessDevice) {
            disableDevice(currentWirelessDevice["path"])
        }
        response.sendStatus(200)
    })
}

export default api
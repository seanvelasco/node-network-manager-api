const PORT = process.env.PORT || 3000

// Network-specific configuration

const HOSTNAME = process.env.HOSTNAME; // Hostname for device, determines how it is accessed (e.g., "http://dashlabs.local")
const AP_SSID = process.env.AP_SSID; // Access Point SSID
const AP_PASSWORD = process.env.AP_PASSWORD; // Access Point Password
const WIFI_SSID = process.env.WIFI_SSID; // Default wireless network that DashBox will connect in setup mode
const WIFI_PASSWORD = process.env.WIFI_PASSWORD; // Default wireless network password

// Static IP configuration
const IPV4_ADDRESS = "10.42.0.10"; // Desired IPV4 address of the device
const IPV4_PREFIX = "24"; // Desired IPV4 address prefix of the device
const IPV4_GATEWAY = "192.168.0.1" // Desired IPV4 gateway of the device
const IPV4_DNS = "8.8.8.8" // Public Google DNS
const IPV4_NETMASK = "255.255.255.0" // Desired netmask


const deviceTypes = {
    0: "Unknown",
    1: "Ethernet",
    2: "WiFi",
    3: "Unused",
    4: "Unused",
    5: "Bluetooth",
    6: "OLPC",
    7: "WiMAX",
    8: "Modem",
    9: "InfiniBand",
    10: "Bond",
    11: "VLAN",
    12: "ADSL",
    13: "Bridge",
    14: "Generic",
    15: "Team",
    16: "TUN or TAP",
    17: "IP Tunnel",
    18: "MACVLAN",
    19: "VXLAN",
    20: "VETH",
    21: "MACsec",
    22: "Dummy",
    23: "PPP",
    24: "Open vSwitch interface",
    25: "Open vSwitch port",
    26: "Open vSwitch bridge",
    27: "IEEE 802.15.4 (WPAN) MAC Layer Device",
    28: "6LoWPAN",
    29: "WireGuard",
    30: "802.11 Wi-Fi P2P device",
    31: "Virtual Routing and Forwarding interface",
}

export {
    deviceTypes, HOSTNAME, IPV4_ADDRESS, AP_SSID, AP_PASSWORD, WIFI_SSID, WIFI_PASSWORD, PORT
}

export const connectivityStates = {
    0: "UNKNOWN", // Network connectivity is unknown or connectivity checks are disabled
    1: "NONE", // Not connected to a network
    2: "PORTAL", // Connected to a network but is behind a captive portal
    3: "LIMITED", // Conntected to a network but no internet connectivity
    4: "FULL" // Connected to a network and internet connectivity is available
}
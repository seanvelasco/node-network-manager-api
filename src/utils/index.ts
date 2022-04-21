export const stringToArrayOfBytes = (str): any  => {
	try {
		const bytes: any[] = [];
		for (let index = 0; index < str.length; ++index) {
			bytes.push(str.charCodeAt(index));
		}
		return bytes;
	}
	catch(error) {
		console.log(`Unable to convert ${str} to array of bytes: ${error}.`)
	}
}

// "8.8.8.8" => [8, 8, 8, 8]

export const stringToArrayOfNumbers = (dnsAddress: string): number[] | undefined => {
	try {
    dnsAddress = dnsAddress.split('.').join("");
    console.log(dnsAddress)
		const numbers: number[] = [];
		for (let index = 0; index < dnsAddress.length; ++index) {
			numbers.push(parseInt(dnsAddress[index]));
		}
		return numbers;
	}
	catch(error) {
		console.log(`Unable to convert ${dnsAddress} to array of numbers: ${error}.`)
	}
}
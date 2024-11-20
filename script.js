function calculateSubnet() {
    const ipAddress = document.getElementById("ipAddress").value;
    const subnetMask = document.getElementById("subnetMask").value;

    if (!validateIP(ipAddress)) {
        alert("Please enter a valid IP address.");
        return;
    }

    const ipParts = ipAddress.split('.').map(part => parseInt(part));
    const maskParts = subnetMask.split('.').map(part => parseInt(part));

    const networkAddressParts = ipParts.map((part, index) => part & maskParts[index]);
    const broadcastAddressParts = ipParts.map((part, index) => part | (~maskParts[index] & 255));

    const networkAddress = networkAddressParts.join('.');
    const broadcastAddress = broadcastAddressParts.join('.');

    const cidr = subnetMaskToCIDR(subnetMask);
    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = totalHosts > 2 ? totalHosts - 2 : 0; // No hay hosts útiles si totalHosts <= 2

    // Calcular el rango de IPs útiles
    const usableIPRange = calculateUsableIPRange(networkAddressParts, broadcastAddressParts);

    document.getElementById("cidr").textContent = `CIDR Notation: /${cidr}`;
    document.getElementById("networkAddress").textContent = `IP de Red: ${networkAddress}`;
    document.getElementById("broadcastAddress").textContent = `IP de Broadcast: ${broadcastAddress}`;
    document.getElementById("usableIPRange").textContent = `Rango de IPs Útiles: ${usableIPRange}`;
    document.getElementById("totalHosts").textContent = `Total Hosts: ${totalHosts}`;
    document.getElementById("usableHosts").textContent = `Usable Hosts: ${usableHosts}`;

    // Calculate additional features
    const subnetMaskBinary = subnetMaskToBinary(subnetMask);
    const ipClass = calculateIPClass(ipParts[0]);
    const wildcardMask = calculateWildcardMask(subnetMask);
    const ipType = calculateIPType(ipParts);

    document.getElementById("subnetMaskBinary").textContent = `Máscara de Subred Binaria: ${subnetMaskBinary}`;
    document.getElementById("ipClass").textContent = `Clase IP: ${ipClass}`;
    document.getElementById("wildcardMask").textContent = `Wildcard Mask: ${wildcardMask}`;
    document.getElementById("ipType").textContent = `Tipo IP: ${ipType}`;

    // Mostrar la IP en binario con porciones coloreadas
    mostrarIpColoreada(ipAddress, subnetMask, ipClass);
}

// Función para calcular el rango de IPs útiles
function calculateUsableIPRange(networkParts, broadcastParts) {
    // Incrementar la IP de red para obtener la primera IP útil
    const firstUsableIP = [...networkParts];
    firstUsableIP[3] += 1;

    // Decrementar la IP de broadcast para obtener la última IP útil
    const lastUsableIP = [...broadcastParts];
    lastUsableIP[3] -= 1;

    // Si la IP de red y la de broadcast son iguales, no hay IPs útiles
    if (firstUsableIP.join('.') === lastUsableIP.join('.')) {
        return 'Ninguna (subred muy pequeña)';
    }

    return `${firstUsableIP.join('.')} - ${lastUsableIP.join('.')}`;
}

// Función auxiliar para validar IP
function validateIP(ip) {
    const parts = ip.split('.');
    return parts.length === 4 && parts.every(part => !isNaN(part) && part >= 0 && part <= 255);
}

// Función auxiliar para calcular CIDR a partir de la máscara de subred
function subnetMaskToCIDR(mask) {
    return mask.split('.').reduce((cidr, octet) => cidr + (parseInt(octet).toString(2).match(/1/g) || []).length, 0);
}

// Función auxiliar para convertir la máscara de subred a binario
function subnetMaskToBinary(mask) {
    return mask.split('.').map(part => parseInt(part).toString(2).padStart(8, '0')).join('.');
}

// Función para calcular la clase de IP
function calculateIPClass(firstOctet) {
    if (firstOctet >= 1 && firstOctet <= 126) {
        return 'A';
    } else if (firstOctet >= 128 && firstOctet <= 191) {
        return 'B';
    } else if (firstOctet >= 192 && firstOctet <= 223) {
        return 'C';
    } else if (firstOctet >= 224 && firstOctet <= 239) {
        return 'D';
    } else {
        return 'E';
    }
}

// Función para calcular la máscara wildcard
function calculateWildcardMask(subnetMask) {
    const maskParts = subnetMask.split('.').map(part => parseInt(part));
    const wildcardParts = maskParts.map(part => 255 - part);
    return wildcardParts.join('.');
}

// Función para calcular el tipo de IP (pública o privada)
function calculateIPType(ipParts) {
    const privateRanges = [
        ['10.0.0.0', '10.255.255.255'],
        ['172.16.0.0', '172.31.255.255'],
        ['192.168.0.0', '192.168.255.255']
    ];

    const ip = ipParts.join('.');
    for (const [start, end] of privateRanges) {
        const startIP = start.split('.').map(part => parseInt(part));
        const endIP = end.split('.').map(part => parseInt(part));
        const inRange = ipParts.every((part, index) => part >= startIP[index] && part <= endIP[index]);
        if (inRange) {
            return 'Private';
        }
    }
    return 'Public';
}

function mostrarIpColoreada(ipAddress, subnetMask, ipClass) {
    // Convertir IP y máscara a binario en bloques de 8 bits
    const ipBinario = ipToBinary(ipAddress).replace(/\./g, '');
    const maskBinario = subnetMaskToBinary(subnetMask).replace(/\./g, '');
    
    // Determinar la cantidad de bits de red según la clase
    let bitsRed;
    switch(ipClass) {
        case 'A': bitsRed = 8; break;
        case 'B': bitsRed = 16; break;
        case 'C': bitsRed = 24; break;
        default: bitsRed = 0; // Para clases D y E
    }

    // Determinar la cantidad de bits de subred
    const bitsSubred = maskBinario.split('1').length - 1 - bitsRed;

    // Generar HTML coloreado
    const porcionRed = ipBinario.substring(0, bitsRed);
    const porcionSubred = ipBinario.substring(bitsRed, bitsRed + bitsSubred);
    const porcionHost = ipBinario.substring(bitsRed + bitsSubred);

    // Crear contenido HTML con etiquetas span y clases para cada porción
    let ipColoreada = `<span class="red-portion">${formatearEnBloques(porcionRed, 8)}</span>`;
    ipColoreada += `<span class="subnet-portion">${formatearEnBloques(porcionSubred, 8)}</span>`;
    ipColoreada += `<span class="host-portion">${formatearEnBloques(porcionHost, 8)}</span>`;

    // Mostrar en el HTML
    document.getElementById("ipBinaryColored").innerHTML = ipColoreada;
}

// Función auxiliar para convertir IP a binario con 8 bits por octeto
function ipToBinary(ip) {
    return ip
        .split('.')
        .map(part => parseInt(part).toString(2).padStart(8, '0'))
        .join('.');
}

// Función auxiliar para convertir máscara a binario con 8 bits por octeto
function subnetMaskToBinary(mask) {
    return mask
        .split('.')
        .map(part => parseInt(part).toString(2).padStart(8, '0'))
        .join('.');
}

// Función para formatear la cadena en bloques de 8 bits
function formatearEnBloques(cadena, tamanoBloque) {
    let resultado = '';
    for (let i = 0; i < cadena.length; i += tamanoBloque) {
        resultado += cadena.substring(i, i + tamanoBloque) + ' ';
    }
    return resultado.trim();
}



function validateIP(ip) {
    const parts = ip.split('.');
    return parts.length === 4 && parts.every(part => !isNaN(part) && part >= 0 && part <= 255);
}

function subnetMaskToCIDR(mask) {
    return mask.split('.').reduce((cidr, octet) => cidr + (parseInt(octet).toString(2).match(/1/g) || []).length, 0);
}

function subnetMaskToBinary(mask) {
    return mask.split('.').map(part => parseInt(part).toString(2).padStart(8, '0')).join('.');
}

function calculateIPClass(firstOctet) {
    if (firstOctet >= 1 && firstOctet <= 126) {
        return 'A';
    } else if (firstOctet >= 128 && firstOctet <= 191) {
        return 'B';
    } else if (firstOctet >= 192 && firstOctet <= 223) {
        return 'C';
    } else if (firstOctet >= 224 && firstOctet <= 239) {
        return 'D';
    } else {
        return 'E';
    }
}

function calculateWildcardMask(subnetMask) {
    const maskParts = subnetMask.split('.').map(part => parseInt(part));
    const wildcardParts = maskParts.map(part => 255 - part);
    return wildcardParts.join('.');
}

function calculateIPType(ipParts) {
    const privateRanges = [
        ['10.0.0.0', '10.255.255.255'],
        ['172.16.0.0', '172.31.255.255'],
        ['192.168.0.0', '192.168.255.255']
    ];

    const ip = ipParts.join('.');
    for (const [start, end] of privateRanges) {
        const startIP = start.split('.').map(part => parseInt(part));
        const endIP = end.split('.').map(part => parseInt(part));
        const inRange = ipParts.every((part, index) => part >= startIP[index] && part <= endIP[index]);
        if (inRange) {
            return 'Private';
        }
    }
    return 'Public';
}




